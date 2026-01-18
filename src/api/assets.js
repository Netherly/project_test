import { httpGet, httpPost, httpPatch, httpDelete } from "./http";

const unwrap = (resp) => {
  if (resp && typeof resp === "object" && "ok" in resp) {
    if (resp.ok) return resp.data;
    const err = new Error(resp?.error || "Request failed");
    err.payload = resp;
    throw err;
  }
  return resp;
};

const qs = (obj = {}) => {
  const pairs = Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== "");
  if (!pairs.length) return "";
  const s = pairs.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
  return `?${s}`;
};

const toNum = (x, def = 0) => {
  const n = Number(x);
  return Number.isFinite(n) ? n : def;
};
const safeArr = (x) => (Array.isArray(x) ? x : []);
const safeObj = (x) => (x && typeof x === "object" ? x : {});

export function withAssetDefaults(asset) {
  const a = safeObj(asset);
  const id = a.id ?? a.accountName ?? String(Date.now());
  const curr = safeObj(a.currency);
  const typ = safeObj(a.type);
  const paySys = safeObj(a.paymentSystem);
  return {
    id,
    accountName: a.accountName ?? a.id ?? "Без названия",
    currency: curr.code || curr.name || 'UAH',
    type: typ.name || '',
    employee: a.employee ?? "",
    balance: toNum(a.balance),
    balanceUAH: toNum(a.balanceUAH),
    balanceUSD: toNum(a.balanceUSD),
    balanceRUB: toNum(a.balanceRUB),
    lastEntryDate: a.lastEntryDate ?? null,
    netMoneyUAH: toNum(a.netMoneyUAH),
    netMoneyUSD: toNum(a.netMoneyUSD),
    netMoneyRUB: toNum(a.netMoneyRUB),
    turnoverStartBalance: toNum(a.turnoverStartBalance),
    turnoverIncoming: toNum(a.turnoverIncoming),
    turnoverOutgoing: toNum(a.turnoverOutgoing),
    turnoverEndBalance: toNum(a.turnoverEndBalance),
    limitTurnover: a.limitTurnover != null ? toNum(a.limitTurnover) : undefined,
    requisites: safeArr(a.requisites).map((r) => ({
      label: r?.label ?? "",
      value: r?.value ?? "",
    })),
    design: a.design ?? "default-design",
    paymentSystem: paySys.name || '',
  };
}

export function withAssetsDefaults(list) {
  return safeArr(list).map(withAssetDefaults);
}

export async function fetchAssets(params = {}) {
  const r = await httpGet(`/assets${qs(params)}`);
  const data = unwrap(r);
  return withAssetsDefaults(data);
}

export async function fetchAssetById(id) {
  if (!id) throw new Error("Asset id is required");
  const r = await httpGet(`/assets/${encodeURIComponent(id)}`);
  const data = unwrap(r);
  return withAssetDefaults(data);
}

export async function createAsset(payload) {
  const r = await httpPost(`/assets`, payload || {});
  const data = unwrap(r);
  return withAssetDefaults(data);
}

export async function updateAsset(id, patch) {
  if (!id) throw new Error("Asset id is required");
  const r = await httpPatch(`/assets/${encodeURIComponent(id)}`, patch || {});
  const data = unwrap(r);
  return withAssetDefaults(data);
}

export async function deleteAsset(id) {
  if (!id) throw new Error("Asset id is required");
  const r = await httpDelete(`/assets/${encodeURIComponent(id)}`);
  return unwrap(r);
}

export async function duplicateAsset(id) {
  if (!id) throw new Error("Asset id is required");
  const r = await httpPost(`/assets/${encodeURIComponent(id)}/duplicate`);
  const data = unwrap(r);
  return withAssetDefaults(data);
}

export async function upsertAssetRequisites(id, body) {
  if (!id) throw new Error("Asset id is required");
  const r = await httpPatch(`/assets/${encodeURIComponent(id)}/requisites`, body || {});
  const data = unwrap(r);
  return withAssetDefaults(data);
}

export async function recalcMonth(params = {}) {
  const r = await httpPost(`/assets/recalc-month${qs(params)}`);
  return unwrap(r);
}

export default {
  withAssetDefaults,
  withAssetsDefaults,
  fetchAssets,
  fetchAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  duplicateAsset,
  upsertAssetRequisites,
  recalcMonth,
};
