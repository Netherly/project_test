// prisma/seed.js
const bcrypt = require('bcrypt');
const prisma = require('./client');
const { ensureTestFields } = require('../src/seeds/test-fields.seed');
const { ensureDefaultCurrencies } = require('../src/seeds/currencies.seed');
const { ensureDemoData, DEMO_PASSWORD } = require('../src/seeds/test-demo-data.seed');
const { ensureLatestToDate, getTodayYMDFromEnv } = require('../src/services/rates.autofill.service');

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
  const adminEnabled = isEnabled(process.env.TEST_DEFAULT_ADMIN_ENABLED);
  const fieldsEnabled = isEnabled(process.env.TEST_FIELDS_ENABLED);
  const demoDataEnabled = isEnabled(process.env.TEST_DEMO_DATA_ENABLED);

  await ensureDefaultCurrencies();
  console.log('✔ Default currencies ensured');

  const todayRates = await ensureLatestToDate(getTodayYMDFromEnv());
  console.log(`✔ Today rates ensured${todayRates?.created ? ' (created)' : ''}`);

  if (!adminEnabled && !fieldsEnabled && !demoDataEnabled) {
    console.log('ℹ Seed skipped: test seed flags are not enabled');
    return;
  }

  if (adminEnabled) {
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
  } else {
    console.log('ℹ Admin seed skipped: TEST_DEFAULT_ADMIN_ENABLED is not enabled');
  }

  if (fieldsEnabled) {
    await ensureTestFields();
    console.log('✔ Test fields ensured: every visible field has at least 4 values');
  } else {
    console.log('ℹ Test fields seed skipped: TEST_FIELDS_ENABLED is not enabled');
  }

  if (demoDataEnabled) {
    await ensureDemoData();
    console.log(`✔ Demo data ensured: core entities filled for test review (password ${DEMO_PASSWORD})`);
  } else {
    console.log('ℹ Demo data seed skipped: TEST_DEMO_DATA_ENABLED is not enabled');
  }
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
