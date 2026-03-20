const { httpErr } = require('../utils/http-error');

const BOT_USERNAME_CACHE_TTL_MS = 5 * 60 * 1000;

let cachedBotUsername = {
  token: '',
  username: '',
  expiresAt: 0,
};

function isBotDisabled() {
  return String(process.env.BOT_DISABLED || '').trim() === '1';
}

function getBotToken() {
  return String(process.env.TELEGRAM_BOT_TOKEN || '').trim();
}

function getConfiguredBotName() {
  return String(process.env.PUBLIC_BOT_NAME || '')
    .trim()
    .replace(/^@/, '');
}

async function fetchBotUsernameFromToken(token) {
  const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
  if (!res.ok) {
    throw new Error(`Telegram getMe failed: HTTP ${res.status}`);
  }

  const data = await res.json();
  if (!data?.ok || !data?.result?.username) {
    throw new Error(data?.description || 'Telegram bot username is unavailable');
  }

  return String(data.result.username).trim().replace(/^@/, '');
}

function ensureTelegramBotAvailable() {
  if (isBotDisabled()) {
    throw httpErr('Telegram бот отключен на сервере', 503);
  }
  if (!getBotToken()) {
    throw httpErr('На сервере не настроен Telegram бот', 503);
  }
}

async function resolveTelegramBotName() {
  ensureTelegramBotAvailable();

  const token = getBotToken();
  const now = Date.now();
  if (
    cachedBotUsername.token === token &&
    cachedBotUsername.username &&
    cachedBotUsername.expiresAt > now
  ) {
    return cachedBotUsername.username;
  }

  try {
    const username = await fetchBotUsernameFromToken(token);
    cachedBotUsername = {
      token,
      username,
      expiresAt: now + BOT_USERNAME_CACHE_TTL_MS,
    };
    return username;
  } catch (error) {
    const fallback = getConfiguredBotName();
    if (fallback) {
      console.warn('[telegram bot] getMe fallback to PUBLIC_BOT_NAME:', error?.message || error);
      return fallback;
    }
    throw httpErr('Не удалось определить Telegram-бота на сервере', 503);
  }
}

async function buildTelegramStartLink(code) {
  const cleanCode = String(code || '').trim();
  if (!cleanCode) {
    throw httpErr('Не удалось создать ссылку Telegram', 500);
  }
  const botName = await resolveTelegramBotName();
  return `https://t.me/${botName}?start=${encodeURIComponent(cleanCode)}`;
}

module.exports = {
  ensureTelegramBotAvailable,
  resolveTelegramBotName,
  buildTelegramStartLink,
};
