// src/services/telegram-avatar.service.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const prisma = require('../../prisma/client');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

function ensureDirSync(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function j(x) {
  try { return JSON.stringify(x); } catch { return String(x); }
}

async function tgGet(method, params) {
  if (!BOT_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN missing');
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
  const { data } = await axios.get(url, { params, timeout: 15000 });
  return data;
}

async function tgFileUrl(file_path) {
  return `https://api.telegram.org/file/bot${BOT_TOKEN}/${file_path}`;
}

async function getBestAvatarFileIdByPhotos(telegramUserId) {
  const data = await tgGet('getUserProfilePhotos', { user_id: telegramUserId, limit: 1 });
  console.log('[avatar] getUserProfilePhotos ->', j(data));
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
  // запасной путь: иногда по users getChat.photo приходит (не везде), попробуем
  const data = await tgGet('getChat', { chat_id: telegramUserId });
  console.log('[avatar] getChat ->', j(data));
  const photo = data?.ok && data?.result?.photo;
  // у chat.photo есть small_file_id/big_file_id
  const file_id = photo?.big_file_id || photo?.small_file_id || null;
  return file_id || null;
}

async function getFilePath(file_id) {
  const data = await tgGet('getFile', { file_id });
  console.log('[avatar] getFile ->', j(data));
  return data?.ok ? data?.result?.file_path || null : null;
}

async function downloadToUploads(file_path, employeeId) {
  const fileUrl = await tgFileUrl(file_path);
  const ext = path.extname(file_path) || '.jpg';
  const uploadsDir = path.join(process.cwd(), 'uploads', 'avatars');
  ensureDirSync(uploadsDir);
  const filename = `${employeeId}_${Date.now()}${ext}`;
  const abs = path.join(uploadsDir, filename);

  const res = await axios.get(fileUrl, { responseType: 'stream', timeout: 30000 });
  await new Promise((resolve, reject) => {
    const ws = fs.createWriteStream(abs);
    res.data.pipe(ws);
    res.data.on('error', reject);
    ws.on('finish', resolve);
  });
  const rel = `/uploads/avatars/${filename}`;
  console.log('[avatar] saved file ->', rel);
  return rel;
}

/**
 * Основной метод. Возвращает:
 *   { ok: true, photoLink }
 * либо
 *   { ok: false, reason, step, raw }
 */
async function fetchAndSaveTelegramAvatar({ employeeId, telegramUserId }) {
  if (!BOT_TOKEN) return { ok: false, reason: 'BOT_TOKEN_MISSING', step: 'env' };
  if (!employeeId || !telegramUserId) return { ok: false, reason: 'ARGS_MISSING', step: 'args' };

  console.log('[avatar] start for employee=%s tg=%s', employeeId, telegramUserId);

  try {
    // 1) основной путь — getUserProfilePhotos
    let file_id = await getBestAvatarFileIdByPhotos(telegramUserId);

    // 2) запасной путь — getChat
    if (!file_id) {
      console.log('[avatar] no photo via getUserProfilePhotos, try getChat...');
      file_id = await getBestAvatarFileIdByChat(telegramUserId);
      if (!file_id) {
        return { ok: false, reason: 'NO_PROFILE_PHOTO', step: 'getUserProfilePhotos/getChat' };
      }
    }

    // 3) getFile -> file_path
    const file_path = await getFilePath(file_id);
    if (!file_path) return { ok: false, reason: 'FILE_PATH_NOT_FOUND', step: 'getFile', raw: { file_id } };

    // 4) скачать
    const relativeUrl = await downloadToUploads(file_path, employeeId);

    // 5) сохранить в БД
    const updated = await prisma.employee.update({
      where: { id: employeeId },
      data: { photoLink: relativeUrl },
      select: { id: true, photoLink: true },
    });

    console.log('[avatar] DB updated ->', updated.photoLink);
    return { ok: true, photoLink: updated.photoLink };
  } catch (e) {
    console.warn('[avatar] failed:', e?.message || e);
    return { ok: false, reason: 'EXCEPTION', step: 'unknown', raw: { error: e?.message || String(e) } };
  }
}

module.exports = { fetchAndSaveTelegramAvatar };
