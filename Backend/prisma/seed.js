// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const ACCESS_CONFIG_KEY = 'access_control_v1';
const FULL_MODULES = [
  'employees',
  'clients',
  'orders',
  'performers',
  'magazine',
  'objectives',
  'reports',
  'archive',
  'settings',
  'assets',
  'finance',
  'analytics',
];
const FULL_ACTIONS = ['create', 'view', 'edit', 'delete'];

function isEnabled(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());
}

function buildFullPermissions() {
  const permissions = {};
  for (const moduleKey of FULL_MODULES) {
    permissions[moduleKey] = {};
    for (const actionKey of FULL_ACTIONS) {
      permissions[moduleKey][actionKey] = 'allowed';
    }
  }
  return permissions;
}

async function ensureOwnerAccessForEmployee(employeeId) {
  const row = await prisma.appConfig.findUnique({
    where: { key: ACCESS_CONFIG_KEY },
    select: { value: true },
  });

  const raw = row?.value && typeof row.value === 'object' ? row.value : {};
  const roles = Array.isArray(raw.roles) ? raw.roles : [];
  const assignments = Array.isArray(raw.assignments) ? raw.assignments : [];

  const ownerRole = {
    id: 'owner',
    name: 'Владелец',
    isBase: true,
    isProtected: true,
    permissions: buildFullPermissions(),
  };

  const nextRoles = [
    ownerRole,
    ...roles.filter((r) => String(r?.id || '') !== 'owner'),
  ];

  const nextAssignments = [
    ...assignments.filter((a) => String(a?.employeeId || '') !== String(employeeId)),
    { employeeId: String(employeeId), roleId: 'owner', isProtected: true },
  ];

  const nextValue = {
    version: 1,
    roles: nextRoles,
    assignments: nextAssignments,
    updatedAt: new Date().toISOString(),
  };

  await prisma.appConfig.upsert({
    where: { key: ACCESS_CONFIG_KEY },
    create: {
      key: ACCESS_CONFIG_KEY,
      value: nextValue,
    },
    update: {
      value: nextValue,
    },
  });
}

async function main() {
  const enabled = isEnabled(process.env.TEST_DEFAULT_ADMIN_ENABLED);
  if (!enabled) {
    console.log('ℹ Seed skipped: TEST_DEFAULT_ADMIN_ENABLED is not enabled');
    return;
  }

  const ADMIN_LOGIN = process.env.ADMIN_LOGIN || 'admin';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '123456';
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@gsse.work';
  const ADMIN_NAME = process.env.ADMIN_NAME || 'Test Admin';

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  
  const admin = await prisma.employee.upsert({
    where: { login: ADMIN_LOGIN },
    update: {
      password: passwordHash,
      status: 'active',
      full_name: ADMIN_NAME,
      email: ADMIN_EMAIL,
    },
    create: {
      login: ADMIN_LOGIN,
      password: passwordHash,
      status: 'active',
      full_name: ADMIN_NAME,
      email: ADMIN_EMAIL,
    },
  });

  console.log('✔ Admin ensured:', admin.login);

  await ensureOwnerAccessForEmployee(admin.id);
  console.log('✔ Access ensured: admin has owner role');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
