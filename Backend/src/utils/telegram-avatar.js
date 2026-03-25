const path = require('path');

const TELEGRAM_FILE_URL_RE = /^https:\/\/api\.telegram\.org\/file\/bot/i;
const TELEGRAM_AVATAR_UPLOADS_PREFIX = '/uploads/telegram-avatars/';
const UPLOADS_ROOT = path.join(__dirname, '..', '..', 'uploads');

function toText(value) {
  return String(value ?? '').trim();
}

function isTelegramFileUrl(value) {
  return TELEGRAM_FILE_URL_RE.test(toText(value));
}

function isTelegramLocalPhotoUrl(value) {
  return toText(value).startsWith(TELEGRAM_AVATAR_UPLOADS_PREFIX);
}

function isTelegramManagedPhotoLink(value) {
  return isTelegramFileUrl(value) || isTelegramLocalPhotoUrl(value);
}

function telegramPhotoUrlToAbsPath(url) {
  const text = toText(url);
  if (!isTelegramLocalPhotoUrl(text)) return null;
  return path.join(UPLOADS_ROOT, text.replace('/uploads/', ''));
}

module.exports = {
  TELEGRAM_AVATAR_UPLOADS_PREFIX,
  isTelegramFileUrl,
  isTelegramLocalPhotoUrl,
  isTelegramManagedPhotoLink,
  telegramPhotoUrlToAbsPath,
};
