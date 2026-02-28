const prisma = require('../../prisma/client');

const CONFIG_KEY = 'access_control_v1';
const PERMISSION_VALUES = new Set(['allowed', 'responsible', 'forbidden']);

function actionFromMethod(method = 'GET') {
  const m = String(method).toUpperCase();
  if (m === 'POST') return 'create';
  if (m === 'PUT' || m === 'PATCH') return 'edit';
  if (m === 'DELETE') return 'delete';
  return 'view';
}

function httpErr(message, status = 400) {
  const e = new Error(message);
  e.status = status;
  return e;
}

function tidy(v) {
  return String(v ?? '').trim();
}

function sanitizePermissions(input) {
  const src = input && typeof input === 'object' ? input : {};
  const out = {};
  for (const [moduleKey, actions] of Object.entries(src)) {
    if (!moduleKey) continue;
    const a = actions && typeof actions === 'object' ? actions : {};
    out[moduleKey] = {};
    for (const [actionKey, value] of Object.entries(a)) {
      if (!['create', 'view', 'edit', 'delete'].includes(actionKey)) continue;
      const normalized = tidy(value).toLowerCase();
      out[moduleKey][actionKey] = PERMISSION_VALUES.has(normalized) ? normalized : 'forbidden';
    }
  }
  return out;
}

function sanitizeRole(role) {
  if (!role || typeof role !== 'object') return null;
  const id = tidy(role.id);
  const name = tidy(role.name);
  if (!id || !name) return null;
  return {
    id,
    name,
    isBase: Boolean(role.isBase),
    isProtected: Boolean(role.isProtected),
    employeeId: role.employeeId ? tidy(role.employeeId) : undefined,
    permissions: sanitizePermissions(role.permissions),
  };
}

function sanitizeAssignment(item) {
  if (!item || typeof item !== 'object') return null;
  const employeeId = tidy(item.employeeId);
  const roleId = tidy(item.roleId);
  if (!employeeId) return null;
  return {
    employeeId,
    roleId: roleId || null,
    isProtected: Boolean(item.isProtected),
  };
}

function sanitizeConfig(payload = {}) {
  const rolesInput = Array.isArray(payload.roles) ? payload.roles : [];
  const assignmentsInput = Array.isArray(payload.assignments) ? payload.assignments : [];

  const roles = [];
  const roleIds = new Set();
  for (const raw of rolesInput) {
    const role = sanitizeRole(raw);
    if (!role || roleIds.has(role.id)) continue;
    roleIds.add(role.id);
    roles.push(role);
  }

  const assignments = [];
  const employeeIds = new Set();
  for (const raw of assignmentsInput) {
    const a = sanitizeAssignment(raw);
    if (!a || employeeIds.has(a.employeeId)) continue;
    if (a.roleId && !roleIds.has(a.roleId)) {
      // keep assignment but drop dangling role id to avoid inconsistent state
      a.roleId = null;
    }
    employeeIds.add(a.employeeId);
    assignments.push(a);
  }

  return {
    version: 1,
    roles,
    assignments,
    updatedAt: new Date().toISOString(),
  };
}

async function loadRawConfig() {
  const row = await prisma.appConfig.findUnique({ where: { key: CONFIG_KEY } });
  return row?.value || null;
}

async function loadConfig() {
  const raw = await loadRawConfig();
  if (!raw || typeof raw !== 'object') {
    return { version: 1, roles: [], assignments: [] };
  }
  return sanitizeConfig(raw);
}

async function saveConfig(payload) {
  const sanitized = sanitizeConfig(payload);
  await prisma.appConfig.upsert({
    where: { key: CONFIG_KEY },
    create: {
      key: CONFIG_KEY,
      value: sanitized,
    },
    update: {
      value: sanitized,
    },
  });
  return sanitized;
}

function resolveRoleForEmployee(config, employeeId) {
  const eid = tidy(employeeId);
  if (!eid) return null;
  const assignment = (config?.assignments || []).find((a) => a.employeeId === eid);
  if (!assignment?.roleId) return null;
  return (config?.roles || []).find((r) => r.id === assignment.roleId) || null;
}

function getPermissionValue(role, moduleKey, actionKey) {
  const rolePerms = role?.permissions || {};
  const modulePerms = rolePerms?.[moduleKey] || {};
  return modulePerms?.[actionKey] || 'forbidden';
}

async function getEffectiveAccess(employeeId) {
  const config = await loadConfig();
  const hasConfiguredRoles = Array.isArray(config.roles) && config.roles.length > 0;
  const hasAssignedRoles =
    Array.isArray(config.assignments) &&
    config.assignments.some((a) => a && a.roleId);

  // Bootstrap mode: keep APIs open until there is at least one real role assignment.
  // This prevents accidental global lockout when roles are saved before assignments.
  if (!hasConfiguredRoles || !hasAssignedRoles) {
    return {
      bootstrapOpen: true,
      role: null,
      permissions: {},
      config,
    };
  }

  const role = resolveRoleForEmployee(config, employeeId);
  return {
    bootstrapOpen: false,
    role,
    permissions: role?.permissions || {},
    config,
  };
}

async function assertModuleAccess({ employeeId, moduleKey, actionKey }) {
  const effective = await getEffectiveAccess(employeeId);
  if (effective.bootstrapOpen) return effective;

  if (!effective.role) {
    throw httpErr('Access denied: no role assigned', 403);
  }

  const permission = getPermissionValue(effective.role, moduleKey, actionKey);
  // "responsible" requires entity-aware checks, which are not wired yet.
  const allowed = permission === 'allowed' || permission === 'responsible';
  if (!allowed) {
    throw httpErr(`Access denied: ${moduleKey}.${actionKey}`, 403);
  }

  return { ...effective, permission };
}

module.exports = {
  CONFIG_KEY,
  actionFromMethod,
  loadConfig,
  saveConfig,
  getEffectiveAccess,
  assertModuleAccess,
  sanitizeConfig,
};
