import { httpGet, httpPut } from "./http";

const unwrap = (resp) => {
  if (resp && typeof resp === "object" && "ok" in resp) {
    if (resp.ok) return resp.data;
    const err = new Error(resp?.error || "Request failed");
    err.payload = resp;
    throw err;
  }
  return resp;
};

export async function fetchAccessControlConfig() {
  const r = await httpGet("/access-control");
  const data = unwrap(r) || {};
  return {
    roles: Array.isArray(data.roles) ? data.roles : [],
    assignments: Array.isArray(data.assignments) ? data.assignments : [],
    version: data.version ?? 1,
  };
}

export async function fetchAccessControlEmployees() {
  const r = await httpGet("/access-control/employees");
  const data = unwrap(r);
  const list = Array.isArray(data) ? data : Array.isArray(data?.employees) ? data.employees : [];
  return list.map((e) => ({
    id: e?.id ?? null,
    fullName: e?.full_name || e?.fullName || e?.login || e?.email || "",
    full_name: e?.full_name || e?.fullName || "",
    name: e?.full_name || e?.fullName || e?.login || e?.email || "Сотрудник",
    login: e?.login || "",
    email: e?.email || "",
  }));
}

export async function saveAccessControlConfig(payload) {
  const r = await httpPut("/access-control", payload || {});
  const data = unwrap(r) || {};
  return {
    roles: Array.isArray(data.roles) ? data.roles : [],
    assignments: Array.isArray(data.assignments) ? data.assignments : [],
    version: data.version ?? 1,
  };
}

export async function fetchMyAccessControl() {
  const r = await httpGet("/access-control/me");
  const data = unwrap(r) || {};
  return {
    employeeId: data.employeeId || null,
    bootstrapOpen: Boolean(data.bootstrapOpen),
    role: data.role || null,
    permissions: data.permissions && typeof data.permissions === "object" ? data.permissions : {},
  };
}

export function readAccessRolesFromCache() {
  try {
    const raw = localStorage.getItem("access-roles");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function readEmployeesFromCache() {
  try {
    const raw = localStorage.getItem("employees");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function assignmentsFromEmployees(employees = []) {
  return (Array.isArray(employees) ? employees : [])
    .map((e) => ({
      employeeId: String(e?.id ?? "").trim(),
      roleId: e?.roleId ? String(e.roleId).trim() : null,
      isProtected: Boolean(e?.isProtected),
    }))
    .filter((a) => a.employeeId);
}

export async function persistAccessControlFromLocalCache() {
  const roles = readAccessRolesFromCache();
  const employees = readEmployeesFromCache();
  return saveAccessControlConfig({
    roles,
    assignments: assignmentsFromEmployees(employees),
  });
}

export function mergeEmployeesWithAssignments(employees = [], assignments = []) {
  const map = new Map(
    (Array.isArray(assignments) ? assignments : [])
      .filter((a) => a?.employeeId)
      .map((a) => [String(a.employeeId), a])
  );

  return (Array.isArray(employees) ? employees : []).map((e) => {
    const a = map.get(String(e.id));
    return {
      ...e,
      roleId: a?.roleId ?? null,
      roleName: e?.roleName ?? e?.role?.name ?? null,
      isProtected: Boolean(a?.isProtected || (a?.roleId === "owner")),
    };
  });
}
