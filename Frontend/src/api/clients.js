// src/api/clients.js
import { httpGet, httpPost, httpPut, httpDelete } from "./http";

const BASE = "/clients";

/* -------------------------- UTILS -------------------------- */

const unwrap = (resp) => {
  if (resp && typeof resp === "object" && "ok" in resp) {
    if (resp.ok) return resp.data;
    const err = new Error(resp?.error || "Request failed");
    err.payload = resp;
    throw err;
  }
  return resp;
};

const tidy = (v) => String(v ?? "").trim();
const toNumberSafe = (v) => {
  if (v === "" || v === null || v === undefined) return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
};

/* ----------------------- NORMALIZERS ----------------------- */


const normTags = (arr) =>
  (Array.isArray(arr) ? arr : []).map((t) =>
    typeof t === "string" 
      ? { name: t, color: "#777777" } 
      : { name: t?.name, color: t?.color || "#777777" }
  );


const normAccesses = (arr) => 
  (Array.isArray(arr) ? arr : []).map(a => ({
    id: a.id,
    name: a.name || "",
    login: a.login || "",
    password: a.password || "",
    description: a.description || ""
  }));

export const normalizeClient = (c = {}) => ({
  id: c.id,
  group: c.group ?? 2,
  name: c.name ?? "",
  
 
  company_id: c.companyId ?? c.company_id ?? "", 
  manager_id: c.managerId ?? c.manager_id ?? "",
  referrer_id: c.referrerId ?? c.referrer_id ?? "",
  referrer_first_id: c.referrerFirstId ?? c.referrer_first_id ?? "",
  

  intro_description: c.intro_description ?? "",
  source: c.source ?? "",
  full_name: c.full_name ?? "",
  phone: c.phone ?? "",
  email: c.email ?? "",
  country: c.country ?? "",
  city: c.city ?? "",
  address: c.address ?? "",
  
  currency: c.currency ?? "",
  hourly_rate: c.hourly_rate ?? c.hourlyRate ?? "",
  percent: c.percent ?? "",
  
  share_info: !!c.share_info, 
  
  status: c.status ?? "active",
  last_order_date: c.last_order_date ?? "—",
  photo_link: c.photoLink ?? c.photo_link ?? "",
  chat_link: c.chatLink ?? c.chat_link ?? "",
  folder_link: c.folderLink ?? c.folder_link ?? "",
  
  note: c.note ?? "",
  
  
  tags: normTags(c.tags),
  accesses: normAccesses(c.credentials || c.accesses), 
});

/* ----------------------- SERIALIZER ----------------------- */


export const serializeClient = (c = {}) => {
  const payload = {
    id: c.id,
    name: tidy(c.name),
    status: c.status || "active",
    
    
    companyId: tidy(c.company_id) || null,
    managerId: tidy(c.manager_id) || null,
    referrerId: tidy(c.referrer_id) || null,
    referrerFirstId: tidy(c.referrer_first_id) || null,

    intro_description: tidy(c.intro_description),
    source: tidy(c.source),
    
   
    full_name: tidy(c.full_name),
    phone: tidy(c.phone),
    email: tidy(c.email),
    country: tidy(c.country),
    city: tidy(c.city),
    address: tidy(c.address), 
    
    
    currency: tidy(c.currency),
    hourly_rate: toNumberSafe(c.hourly_rate),
    percent: toNumberSafe(c.percent),
    share_info: !!c.share_info,

    
    photoLink: tidy(c.photo_link),
    chatLink: tidy(c.chat_link),
    folderLink: tidy(c.folder_link),
    
    note: tidy(c.note),

   
    tags: normTags(c.tags),

    
    credentials: Array.isArray(c.accesses) ? c.accesses.map(a => ({
      id: a.id, 
      name: tidy(a.name),
      login: tidy(a.login),
      password: tidy(a.password),
      description: tidy(a.description)
    })) : []
  };

  return payload;
};

/* -------------------------- API -------------------------- */

export async function fetchClients(params = {}) {
  const r = await httpGet(BASE, params);
  const data = unwrap(r);
  const list = Array.isArray(data) ? data : [];
  return list.map(normalizeClient);
}

export async function createClient(payload) {
  const r = await httpPost(BASE, serializeClient(payload));
  return normalizeClient(unwrap(r));
}

export async function updateClient(id, payload) {
  const r = await httpPut(`${BASE}/${id}`, serializeClient(payload));
  return normalizeClient(unwrap(r));
}

export async function saveClient(payload) {
  return payload?.id ? updateClient(payload.id, payload) : createClient(payload);
}

export async function deleteClient(id) {
  const r = await httpDelete(`${BASE}/${id}`);
  return unwrap(r) ?? true;
}

export const ClientsAPI = {
  fetch: fetchClients,
  create: createClient,
  update: updateClient,
  save: saveClient,
  remove: deleteClient,
};

export default ClientsAPI;