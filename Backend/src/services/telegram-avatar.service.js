const axios = require('axios');
const prisma = require('../../prisma/client');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

function j(x) {
  try { return JSON.stringify(x); } catch { return String(x); }
}

async function tgGet(method, params) {
  if (!BOT_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN missing');
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
  const { data } = await axios.get(url, { params, timeout: 15000 });
  return data;
}

function tgFileUrl(file_path) {
  return `https://api.telegram.org/file/bot${BOT_TOKEN}/${file_path}`;
}

async function getBestAvatarFileIdByPhotos(telegramUserId) {
  const data = await tgGet('getUserProfilePhotos', { user_id: telegramUserId, limit: 1 });
  if (!data?.ok || !data?.result?.photos?.length) return null;
  const sizes = data.result.photos[0];
  if (!Array.isArray(sizes) || !sizes.length) return null;
  const best = sizes.reduce(
    (acc, x) => {
      const area = (x.width || 0) * (x.height || 0);
      return area > acc.area ? { file_id: x.file_id, area } : acc;
    },
    { file_id: null, area: -1 }
  );
  return best.file_id;
}

async function getBestAvatarFileIdByChat(telegramUserId) {
  const data = await tgGet('getChat', { chat_id: telegramUserId });
  const photo = data?.ok && data?.result?.photo;
  const file_id = photo?.big_file_id || photo?.small_file_id || null;
  return file_id || null;
}

async function getFilePath(file_id) {
  const data = await tgGet('getFile', { file_id });
  return data?.ok ? data?.result?.file_path || null : null;
}

async function fetchAndSaveTelegramAvatar({ employeeId, telegramUserId }) {
  if (!BOT_TOKEN) return { ok: false, reason: 'BOT_TOKEN_MISSING', step: 'env' };
  if (!employeeId || !telegramUserId) return { ok: false, reason: 'ARGS_MISSING', step: 'args' };

  try {
    let file_id = await getBestAvatarFileIdByPhotos(telegramUserId);
    if (!file_id) {
      file_id = await getBestAvatarFileIdByChat(telegramUserId);
      if (!file_id) {
        return { ok: false, reason: 'NO_PROFILE_PHOTO', step: 'getUserProfilePhotos/getChat' };
      }
    }

    const file_path = await getFilePath(file_id);
    if (!file_path) return { ok: false, reason: 'FILE_PATH_NOT_FOUND', step: 'getFile', raw: { file_id } };

    const absoluteUrl = tgFileUrl(file_path);

    const updated = await prisma.employee.update({
      where: { id: employeeId },
      data: { photoLink: absoluteUrl },
      select: { id: true, photoLink: true },
    });

    return { ok: true, photoLink: updated.photoLink };
  } catch (e) {
    return { ok: false, reason: 'EXCEPTION', step: 'unknown', raw: { error: e?.message || String(e) } };
  }
}

module.exports = { fetchAndSaveTelegramAvatar };
