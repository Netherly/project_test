import { httpGet, httpPost, httpPut, httpDelete } from './http';

/**
 * Последний снэпшот
 */
export function getLatestRates() {
  return httpGet('/rates/latest');
}

/**
 * Список постранично
 * @param {number} page
 * @param {number} pageSize
 */
export function getRatesList(page = 1, pageSize = 50) {
  return httpGet('/rates/list', { page, pageSize });
}

/**
 * По диапазону дат
 * @param {string} start YYYY-MM-DD
 * @param {string} end   YYYY-MM-DD
 */
export function getRatesByRange(start, end) {
  return httpGet('/rates/range', { start, end });
}

/**
 * Upsert (создать или обновить набором, можно массивом)
 * @param {Object|Object[]} data
 */
export function upsertRates(data) {
  return httpPost('/rates', data);
}

/**
 * Строгое создание
 */
export function addRates(data) {
  return httpPost('/rates/add', data);
}

/**
 * Обновление (по id или массивом)
 */
export function updateRates(id, data) {
  if (id) {
    return httpPut(`/rates/${id}`, data);
  }
  return httpPut('/rates', data);
}

/**
 * Удаление (по id, дате/диапазону или массивом)
 * Пример тела: { ids:[1,2,3] } или { start:"2025-01-01", end:"2025-01-31" }
 */
export function deleteRates(idOrParamsOrBody) {
  if (typeof idOrParamsOrBody === 'string' || typeof idOrParamsOrBody === 'number') {
    return httpDelete(`/rates/${idOrParamsOrBody}`);
  }
  return httpDelete('/rates', { body: JSON.stringify(idOrParamsOrBody) });
}
