import { fileUrl } from "../api/http";

const tidy = (value) => String(value ?? "").trim();

export const normalizeCardDesignName = (value) =>
  tidy(value)
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/["'`]+/g, "")
    .replace(/\s+/g, "");

const FALLBACKS = [
  { key: "monobank-black", label: "Монобанк", names: ["монобанк", "monobank", "monobank-black"] },
  { key: "privatbank-green", label: "ПриватБанк", names: ["приватбанк", "privatbank", "privatbank-green"] },
  { key: "sberbank-light-green", label: "СберБанк", names: ["сбербанк", "sberbank", "sberbank-light-green"] },
  { key: "binance-dark", label: "Binance", names: ["binance", "бинанс", "binance-dark"] },
  { key: "bybit-white", label: "Bybit", names: ["bybit", "bybit-white"] },
  { key: "trustwallet-blue", label: "TrustWallet", names: ["trustwallet", "trust wallet", "trustwallet-blue"] },
  { key: "metamask-amber", label: "MetaMask", names: ["metamask", "meta mask", "metamask-amber"] },
  { key: "banks-rf-dark", label: "Банки РФ", names: ["банкирф", "банки рф", "banksrf", "banks-rf-dark"] },
  { key: "ruby", label: "Рубин", names: ["рубин", "ruby"] },
  { key: "saphire", label: "Сапфир", names: ["сапфир", "saphire", "sapphire"] },
  { key: "atlas", label: "Атлас", names: ["атлас", "atlas"] },
  { key: "3d", label: "3Д", names: ["3д", "3d"] },
  { key: "red", label: "Красный", names: ["красный", "red"] },
];

const FALLBACK_BY_NAME = new Map();
for (const fallback of FALLBACKS) {
  for (const name of fallback.names) {
    FALLBACK_BY_NAME.set(normalizeCardDesignName(name), fallback);
  }
}

export const getCardDesignFallback = (value) =>
  FALLBACK_BY_NAME.get(normalizeCardDesignName(value)) || null;

export const resolveCardDesignUrl = (value) => {
  const source = tidy(value);
  if (!source) return "";
  if (source.startsWith("data:")) return source;
  if (/^https?:\/\//i.test(source)) return source;
  try {
    return fileUrl(source);
  } catch {
    return source;
  }
};
