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
  const pairs = Object.entries(obj).filter(
    ([, v]) => v !== undefined && v !== null && v !== ""
  );
  if (!pairs.length) return "";
  const s = pairs
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  return `?${s}`;
};

const toNum = (x, def = 0) => {
  const n = Number(x);
  return Number.isFinite(n) ? n : def;
};
const safeArr = (x) => (Array.isArray(x) ? x : []);
const safeObj = (x) => (x && typeof x === "object" ? x : {});
const isUuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || "")
  );
const pickFieldValue = (field) => {
  if (field === undefined || field === null) return "";
  if (typeof field === "object") return field.code || field.name || field.value || "";
  return field;
};
const resolveField = (field, fallback = "") => {
  if (field === undefined || field === null || field === "")
    return { value: fallback, raw: field };
  if (typeof field === "object")
    return { value: field.code || field.name || fallback, raw: field };
  return { value: field, raw: field };
};

export function withAssetDefaults(asset) {
  const a = safeObj(asset);
  const id = a.id ?? a.accountName ?? String(Date.now());
  const currencyResolved = resolveField(a.currency, "UAH");
  const typeResolved = resolveField(a.type, "");
  const paymentSystemResolved = resolveField(a.paymentSystem, "");
  const designResolved = resolveField(a.design, "default-design");
  const employeeName =
    a.employeeName ||
    a.employeeFullName ||
    a.employee?.full_name ||
    a.employee?.fullName ||
    a.employee?.name ||
    (typeof a.employee === "string" ? a.employee : "");
  const employeeId = a.employeeId || a.employee?.id || null;
  return {
    id,
    accountName: a.accountName ?? a.id ?? "Без названия",
    currency: currencyResolved.value,
    currencyRaw: currencyResolved.raw ?? currencyResolved.value,
    type: typeResolved.value,
    typeRaw: typeResolved.raw ?? typeResolved.value,
    employee: employeeName,
    employeeName,
    employeeId,
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
    design: designResolved.value,
    designRaw: designResolved.raw ?? designResolved.value,
    paymentSystem: paymentSystemResolved.value,
    paymentSystemRaw: paymentSystemResolved.raw ?? paymentSystemResolved.value,
  };
}

function normalizeAssetPayload(payload = {}) {
  const p = safeObj(payload);

  const currencyCode = pickFieldValue(p.currencyCode ?? p.currency);
  const typeName = pickFieldValue(p.typeName ?? p.type);
  const paymentSystemName = pickFieldValue(p.paymentSystemName ?? p.paymentSystem);

  const designRaw = p.designRaw ?? p.cardDesign ?? p.design;
  let cardDesignId =
    p.cardDesignId ?? p.cardDesign?.id ?? p.designRaw?.id ?? p.designId;
  let designName =
    p.cardDesignName ??
    p.designName ??
    p.cardDesign?.name ??
    p.designRaw?.name;

  if (!cardDesignId && typeof designRaw === "string" && isUuid(designRaw)) {
    cardDesignId = designRaw;
  }
  if (!designName && typeof designRaw === "string" && !isUuid(designRaw)) {
    designName = designRaw;
  }

  const employeeId =
    p.employeeId ??
    p.employee?.id ??
    (typeof p.employee === "string" && isUuid(p.employee)
      ? p.employee
      : undefined);

  const normalized = {
    ...p,
    ...(currencyCode ? { currencyCode } : {}),
    ...(typeName ? { typeName } : {}),
    ...(paymentSystemName ? { paymentSystemName } : {}),
    ...(cardDesignId ? { cardDesignId } : {}),
    ...(designName ? { designName } : {}),
    ...(employeeId ? { employeeId } : {}),
  };

  return normalized;
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
  const r = await httpPost(`/assets`, normalizeAssetPayload(payload || {}));
  const data = unwrap(r);
  return withAssetDefaults(data);
}

export async function updateAsset(id, patch) {
  if (!id) throw new Error("Asset id is required");
  const r = await httpPatch(
    `/assets/${encodeURIComponent(id)}`,
    normalizeAssetPayload(patch || {})
  );
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
