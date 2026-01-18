import { httpGet, httpPost } from "./http";

const BASE = "/companies";

const unwrap = (resp) => {
  if (resp && typeof resp === "object" && "ok" in resp) {
    if (resp.ok) return resp.data;
    const err = new Error(resp?.error || "Request failed");
    err.payload = resp;
    throw err;
  }
  return resp;
};

const normalizeCompany = (c = {}) => ({
  id: c.id ?? null,
  name: c.name ?? "",
});

export async function fetchCompanies() {
  const r = await httpGet(BASE);
  const data = unwrap(r);
  const list = Array.isArray(data) ? data : [];
  return list.map(normalizeCompany);
}

export async function createCompany(payload) {
  const r = await httpPost(BASE, payload);
  return normalizeCompany(unwrap(r));
}

export const CompaniesAPI = {
  fetch: fetchCompanies,
  create: createCompany,
};

export default CompaniesAPI;
