import { httpGet, httpPost, httpPut, httpPatch, httpDelete } from './http';

function unwrap(resp) {
  if (!resp) return resp;
  if (resp.ok !== undefined && resp.data !== undefined) return resp.data;
  return resp;
}

export async function fetchOrders(params = {}) {
  return unwrap(await httpGet('/orders', params));
}

export async function fetchOrder(id) {
  return unwrap(await httpGet(`/orders/${id}`));
}

export async function createOrder(body) {
  return unwrap(await httpPost('/orders', body));
}

export async function updateOrder(id, body) {
  return unwrap(await httpPut(`/orders/${id}`, body));
}

export async function changeOrderStage(id, body) {
  return unwrap(await httpPatch(`/orders/${id}/stage`, body));
}

export async function deleteOrder(id) {
  return unwrap(await httpDelete(`/orders/${id}`));
}
