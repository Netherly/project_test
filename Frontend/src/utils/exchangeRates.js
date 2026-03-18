const RATE_CODES = ["UAH", "USD", "RUB", "USDT"];
const LATEST_RATES_CACHE_KEY = "latestRatesSnapshot";

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export function normalizeCurrencyCode(value) {
  if (value === undefined || value === null) return "";
  if (typeof value === "object") {
    return String(value.code ?? value.name ?? value.value ?? "")
      .trim()
      .toUpperCase();
  }
  return String(value).trim().toUpperCase();
}

function extractLatestRateRow(input) {
  if (!input || typeof input !== "object") return null;
  if (Array.isArray(input?.rows)) return input.rows[0] || null;
  if (Array.isArray(input?.data?.rows)) return input.data.rows[0] || null;
  if (Array.isArray(input)) return input[0] || null;
  return input;
}

function pickNumber(row, keys) {
  for (const key of keys) {
    const num = toNumber(row?.[key]);
    if (num !== null && num > 0) return num;
  }
  return null;
}

function getDirectBaseRate(row, code) {
  if (code === "UAH") return 1;
  return pickNumber(row, [code, code.toLowerCase()]);
}

function getPairRate(row, from, to) {
  return pickNumber(row, [
    `${from}:${to}`,
    `${from}_${to}`,
    `${from.toLowerCase()}_${to.toLowerCase()}`,
    `${from.toLowerCase()}:${to.toLowerCase()}`,
  ]);
}

function deriveBaseRate(row, code) {
  const direct = getDirectBaseRate(row, code);
  if (direct !== null) return direct;

  const directToUah = getPairRate(row, code, "UAH");
  if (directToUah !== null) return directToUah;

  const inverseFromUah = getPairRate(row, "UAH", code);
  if (inverseFromUah !== null && inverseFromUah !== 0) {
    return 1 / inverseFromUah;
  }

  return null;
}

export function normalizeRatesSnapshot(input) {
  const row = extractLatestRateRow(input);
  if (!row) return null;

  const snapshot = { UAH: 1 };
  for (const code of RATE_CODES) {
    const value = deriveBaseRate(row, code);
    if (value !== null) snapshot[code] = value;
  }

  if (!snapshot.USDT && snapshot.USD) {
    snapshot.USDT = snapshot.USD;
  }

  return snapshot;
}

export function convertAmountByRates(amount, fromCurrency, toCurrency, snapshot, fallback = null) {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) return Number(fallback ?? 0);

  const from = normalizeCurrencyCode(fromCurrency);
  const to = normalizeCurrencyCode(toCurrency);

  if (!from || !to || from === to) return numericAmount;

  const fromRate = Number(snapshot?.[from]);
  const toRate = Number(snapshot?.[to]);

  if (from !== "UAH" && (!Number.isFinite(fromRate) || fromRate <= 0)) {
    return Number(fallback ?? numericAmount);
  }
  if (to !== "UAH" && (!Number.isFinite(toRate) || toRate <= 0)) {
    return Number(fallback ?? numericAmount);
  }

  const inUah = from === "UAH" ? numericAmount : numericAmount * fromRate;
  return to === "UAH" ? inUah : inUah / toRate;
}

export function readLatestRatesSnapshot() {
  try {
    if (typeof sessionStorage === "undefined") return null;
    const raw = sessionStorage.getItem(LATEST_RATES_CACHE_KEY);
    if (!raw) return null;
    return normalizeRatesSnapshot(JSON.parse(raw));
  } catch (_) {
    return null;
  }
}

export function writeLatestRatesSnapshot(snapshot) {
  try {
    if (typeof sessionStorage === "undefined" || !snapshot) return;
    sessionStorage.setItem(LATEST_RATES_CACHE_KEY, JSON.stringify(snapshot));
  } catch (_) {}
}

