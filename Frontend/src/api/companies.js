import { httpGet, httpPost, httpPut, httpDelete } from "./http";

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
  urlId: c.urlId ?? null,
  name: c.name ?? "",
  phone: c.phone ?? "",
  email: c.email ?? "",
  photo_link: c.photo_link ?? c.photoLink ?? "",
  dateAdded: c.dateAdded ?? c.createdAt ?? "",
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

export async function updateCompany(id, payload) {
  const r = await httpPut(`${BASE}/${id}`, payload);
  return normalizeCompany(unwrap(r));
}


export async function deleteCompany(id) {
  const r = await httpDelete(`${BASE}/${id}`);
  return unwrap(r);
}

export const CompaniesAPI = {
  fetch: fetchCompanies,
  create: createCompany,
  update: updateCompany,
  delete: deleteCompany,
};

export default CompaniesAPI;
