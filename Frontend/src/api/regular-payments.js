import { httpGet, httpPost, httpPut, httpDelete } from "./http";

const unwrap = (resp) => {
  if (resp && typeof resp === "object" && "ok" in resp) {
    if (resp.ok) return resp.data;
    const err = new Error(resp?.error || "Request failed");
    err.payload = resp;
    throw err;
  }
  return resp;
};

const toText = (v) => String(v ?? "").trim();
const toNumber = (v) => {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const normalizeRegularPayment = (p = {}) => {
  const accountId = p.accountId ?? p.account ?? p.account?.id ?? "";
  return {
    id: p.id ?? null,
    status: p.status ?? "Активен",
    period: p.period ?? "Ежемесячно",
    cycleDay: p.cycleDay ?? "",
    time: p.time ?? "10:00",
    category: p.category ?? p.categoryDict?.name ?? "",
    subcategory: p.subcategory ?? p.subcategoryDict?.name ?? "",
    description: p.description ?? "",
    account: accountId,
    accountId,
    accountName: p.accountName ?? p.account?.accountName ?? "",
    accountCurrency: p.accountCurrency ?? p.account?.currency?.code ?? "",
    operation: p.operation ?? "Списание",
    amount: p.amount ?? "",
    commission: p.commission ?? "",
    counterparty: p.counterparty ?? "",
    counterpartyRequisites: p.counterpartyRequisites ?? "",
    orderId: p.orderId ?? "",
    orderNumber: p.orderNumber ?? "",
    orderCurrency: p.orderCurrency ?? "",
    nextPaymentDate: p.nextPaymentDate ?? null,
    lastPaymentDate: p.lastPaymentDate ?? null,
    createdAt: p.createdAt ?? null,
    updatedAt: p.updatedAt ?? null,
  };
};

const serializeRegularPayment = (p = {}) => {
  const accountId = toText(p.accountId ?? p.account);
  const orderId = toText(p.orderId);
  const orderNumber = toText(p.orderNumber);
  const orderCurrency = toText(p.orderCurrency);
  const accountCurrency = toText(p.accountCurrency);
  const payload = {
    status: p.status,
    period: p.period,
    cycleDay: p.cycleDay || null,
    time: p.time,
    category: toText(p.category),
    subcategory: toText(p.subcategory),
    description: toText(p.description),
    ...(accountId ? { accountId } : {}),
    ...(accountCurrency ? { accountCurrency } : {}),
    operation: p.operation,
    amount: toNumber(p.amount),
    commission: toNumber(p.commission),
    counterparty: toText(p.counterparty),
    counterpartyRequisites: toText(p.counterpartyRequisites),
    ...(orderId ? { orderId } : {}),
    ...(orderNumber ? { orderNumber } : {}),
    ...(orderCurrency ? { orderCurrency } : {}),
  };

  if (p.nextPaymentDate !== undefined) payload.nextPaymentDate = p.nextPaymentDate;

  return payload;
};

export async function fetchRegularPayments() {
  const r = await httpGet("/regular-payments");
  const data = unwrap(r);
  const list = Array.isArray(data) ? data : [];
  return list.map(normalizeRegularPayment);
}

export async function createRegularPayment(payload) {
  const r = await httpPost("/regular-payments", serializeRegularPayment(payload));
  return normalizeRegularPayment(unwrap(r));
}

export async function updateRegularPayment(id, payload) {
  const r = await httpPut(`/regular-payments/${id}`, serializeRegularPayment(payload));
  return normalizeRegularPayment(unwrap(r));
}

export async function deleteRegularPayment(id) {
  const r = await httpDelete(`/regular-payments/${id}`);
  return unwrap(r) ?? true;
}

export async function duplicateRegularPayment(id) {
  const r = await httpPost(`/regular-payments/${id}/duplicate`);
  return normalizeRegularPayment(unwrap(r));
}

export default {
  fetchRegularPayments,
  createRegularPayment,
  updateRegularPayment,
  deleteRegularPayment,
  duplicateRegularPayment,
};
