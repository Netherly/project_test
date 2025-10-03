// универсальный fetch без внешних зависимостей
async function api(path, opts = {}) {
  const base = process.env.REACT_APP_API_URL || ""; // напр. http://localhost:4000
  const res = await fetch(base + path, {
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    credentials: "include", // если у вас cookie/JWT в cookie
    ...opts,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${txt}`);
  }
  return res.json();
}

/**
 * Бэкенд (Prisma) хранит поля в lower_snake_case: uah_usd, usd_uah и т.п.
 * Фронт ожидает ключи формата "UAH_USD" и умеет сам инвертировать при отсутствии пары.
 * Преобразуем DTO -> front-формат.
 */
function mapRatesDtoToFront(dto) {
  const out = {};
  const pairs = [
    ["UAH","USD","uah_usd"], ["UAH","RUB","uah_rub"], ["UAH","USDT","uah_usdt"],
    ["USD","UAH","usd_uah"], ["USD","RUB","usd_rub"], ["USD","USDT","usd_usdt"],
    ["USDT","UAH","usdt_uah"], ["USDT","USD","usdt_usd"], ["USDT","RUB","usdt_rub"],
    ["RUB","UAH","rub_uah"], ["RUB","USD","rub_usd"], ["RUB","USDT","rub_usdt"],
  ];
  pairs.forEach(([from, to, key]) => {
    if (dto[key] != null) out[`${from}_${to}`] = Number(dto[key]);
  });
  // можно сохранить и дату:
  if (dto.date) out.__date = dto.date;
  return out;
}

/**
 * Забираем последний снэпшот с /api/rates/latest и кладём в localStorage
 * под тем же ключом, что вы уже используете: "currencyRates" (массив с одним объектом).
 * Возвращаем объект курсов (уже в фронтовом формате ключей).
 */
export async function fetchAndCacheLatestRates() {
  const data = await api("/api/rates/latest");
  // ожидаем { data: {...} } либо просто объект
  const dto = data?.data || data;
  const mapped = mapRatesDtoToFront(dto);
  localStorage.setItem("currencyRates", JSON.stringify([mapped]));
  return mapped;
}

/**
 * Гарантируем наличие курсов:
 * 1) читаем из localStorage
 * 2) если пусто — идём на бэкенд, кешируем и возвращаем
 */
export async function ensureRates() {
  try {
    const raw = localStorage.getItem("currencyRates");
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length > 0) {
        return arr[0];
      }
    }
  } catch (_) {}
  // нет в localStorage — берём с API
  return fetchAndCacheLatestRates();
}
