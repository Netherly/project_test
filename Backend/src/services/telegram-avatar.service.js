const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const prisma = require('../../prisma/client');
const {
  getState,
  markSyncEnabled,
  shouldSkipAutoSync,
} = require('./telegram-avatar-state.service');
const { getTelegramBotToken } = require('../utils/telegram-token');
const {
  TELEGRAM_AVATAR_UPLOADS_PREFIX,
  isTelegramLocalPhotoUrl,
  telegramPhotoUrlToAbsPath,
} = require('../utils/telegram-avatar');

const TELEGRAM_AVATAR_ROOT = path.join(__dirname, '..', '..', 'uploads', 'telegram-avatars');
const MAX_TELEGRAM_AVATAR_BYTES = 10 * 1024 * 1024;
const IMAGE_EXT_BY_MIME = {
  'image/gif': 'gif',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function toText(value) {
  return String(value ?? '').trim();
}

async function tgGet(method, params) {
  const BOT_TOKEN = getTelegramBotToken();
  if (!BOT_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN missing');
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
  const { data } = await axios.get(url, { params, timeout: 15000 });
  return data;
}

function tgFileUrl(filePath) {
  const BOT_TOKEN = getTelegramBotToken();
  return `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;
}

async function getBestAvatarFromPhotos(telegramUserId) {
  const data = await tgGet('getUserProfilePhotos', { user_id: telegramUserId, limit: 1 });
  if (!data?.ok || !data?.result?.photos?.length) return null;
  const sizes = data.result.photos[0];
  if (!Array.isArray(sizes) || !sizes.length) return null;

  const best = sizes.reduce(
    (acc, item) => {
      const area = (item.width || 0) * (item.height || 0);
      return area > acc.area
        ? {
            fileId: item.file_id || null,
            fileUniqueId: item.file_unique_id || null,
            area,
          }
        : acc;
    },
    { fileId: null, fileUniqueId: null, area: -1 }
  );

  return best.fileId ? { fileId: best.fileId, fileUniqueId: best.fileUniqueId } : null;
}

async function getBestAvatarFromChat(telegramUserId) {
  const data = await tgGet('getChat', { chat_id: telegramUserId });
  const photo = data?.ok ? data?.result?.photo : null;
  const fileId = photo?.big_file_id || photo?.small_file_id || null;
  const fileUniqueId = photo?.big_file_unique_id || photo?.small_file_unique_id || null;
  return fileId ? { fileId, fileUniqueId } : null;
}

async function getFileMeta(fileId) {
  const data = await tgGet('getFile', { file_id: fileId });
  if (!data?.ok || !data?.result) return null;

  return {
    filePath: data.result.file_path || null,
  };
}

function resolveAvatarExtension({ filePath, contentType }) {
  const byPath = path.extname(toText(filePath)).replace('.', '').toLowerCase();
  if (/^[a-z0-9]{2,10}$/.test(byPath)) return byPath;
  return IMAGE_EXT_BY_MIME[toText(contentType).toLowerCase()] || 'jpg';
}

async function fileExists(absPath) {
  if (!absPath) return false;
  try {
    await fs.promises.access(absPath, fs.constants.F_OK);
    return true;
  } catch (_) {
    return false;
  }
}

async function safeUnlink(absPath) {
  if (!absPath) return;
  try {
    await fs.promises.unlink(absPath);
  } catch (_) {}
}

async function downloadTelegramAvatar({ employeeId, filePath, fileUniqueId }) {
  const employeeDir = path.join(TELEGRAM_AVATAR_ROOT, String(employeeId));
  await fs.promises.mkdir(employeeDir, { recursive: true });

  const response = await axios.get(tgFileUrl(filePath), {
    responseType: 'arraybuffer',
    timeout: 20000,
    maxContentLength: MAX_TELEGRAM_AVATAR_BYTES,
    maxBodyLength: MAX_TELEGRAM_AVATAR_BYTES,
  });

  const buffer = Buffer.from(response.data);
  if (buffer.length > MAX_TELEGRAM_AVATAR_BYTES) {
    throw new Error('Telegram avatar exceeds size limit');
  }

  const ext = resolveAvatarExtension({
    filePath,
    contentType: response.headers?.['content-type'],
  });
  const entropy = toText(fileUniqueId) || toText(filePath) || crypto.randomBytes(6).toString('hex');
  const fileHash = crypto.createHash('sha1').update(`${employeeId}:${entropy}:${Date.now()}`).digest('hex');
  const fileName = `${fileHash}.${ext}`;
  const absPath = path.join(employeeDir, fileName);

  await fs.promises.writeFile(absPath, buffer);

  return {
    absPath,
    storageUrl: `${TELEGRAM_AVATAR_UPLOADS_PREFIX}${employeeId}/${fileName}`,
  };
}

function hasSameRemoteAvatar(syncState, { currentPhotoLink, filePath, fileUniqueId }) {
  const trackedUniqueId = toText(syncState?.lastFileUniqueId);
  const trackedFilePath = toText(syncState?.lastFilePath);
  const currentUniqueId = toText(fileUniqueId);
  const currentFilePath = toText(filePath);

  if (currentUniqueId && trackedUniqueId && currentUniqueId === trackedUniqueId) {
    return true;
  }
  if (currentFilePath && trackedFilePath && currentFilePath === trackedFilePath) {
    return true;
  }
  if (currentFilePath && toText(currentPhotoLink) === tgFileUrl(currentFilePath)) {
    return true;
  }

  return false;
}

async function maybeDeleteOrphanedTelegramFile(url) {
  const storageUrl = toText(url);
  if (!isTelegramLocalPhotoUrl(storageUrl)) return;

  const inUse = await prisma.employee.count({
    where: { photoLink: storageUrl },
  });
  if (inUse > 0) return;

  await safeUnlink(telegramPhotoUrlToAbsPath(storageUrl));
}

async function fetchAndSaveTelegramAvatar({ employeeId, telegramUserId, telegramLinkedAt = null }) {
  const BOT_TOKEN = getTelegramBotToken();
  if (!BOT_TOKEN) return { ok: false, reason: 'BOT_TOKEN_MISSING', step: 'env' };
  if (!employeeId || !telegramUserId) return { ok: false, reason: 'ARGS_MISSING', step: 'args' };

  try {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        photoLink: true,
        telegramLinkedAt: true,
      },
    });
    if (!employee) return { ok: false, reason: 'EMPLOYEE_NOT_FOUND', step: 'employee' };

    const syncState = await getState(employeeId);
    const linkedAt = telegramLinkedAt || employee.telegramLinkedAt;
    if (shouldSkipAutoSync(syncState, { linkedAt })) {
      return { ok: false, reason: 'SYNC_DISABLED', step: 'state' };
    }

    const currentPhotoLink = toText(employee.photoLink);
    let avatarRef = await getBestAvatarFromPhotos(telegramUserId);
    if (!avatarRef) {
      avatarRef = await getBestAvatarFromChat(telegramUserId);
      if (!avatarRef) {
        await markSyncEnabled(employeeId, { linkedAt });
        return {
          ok: true,
          updated: false,
          reason: 'NO_PROFILE_PHOTO',
          step: 'getUserProfilePhotos/getChat',
          photoLink: currentPhotoLink,
        };
      }
    }

    const fileMeta = await getFileMeta(avatarRef.fileId);
    const filePath = toText(fileMeta?.filePath);
    if (!filePath) {
      return {
        ok: false,
        reason: 'FILE_PATH_NOT_FOUND',
        step: 'getFile',
        raw: { fileId: avatarRef.fileId },
      };
    }

    const currentLocalFileExists =
      isTelegramLocalPhotoUrl(currentPhotoLink) &&
      (await fileExists(telegramPhotoUrlToAbsPath(currentPhotoLink)));
    const avatarUnchanged = hasSameRemoteAvatar(syncState, {
      currentPhotoLink,
      filePath,
      fileUniqueId: avatarRef.fileUniqueId,
    });

    if (avatarUnchanged && currentLocalFileExists) {
      await markSyncEnabled(employeeId, {
        linkedAt,
        lastFilePath: filePath,
        lastFileUniqueId: avatarRef.fileUniqueId,
        storageUrl: currentPhotoLink,
      });
      return { ok: true, updated: false, photoLink: currentPhotoLink };
    }

    const downloadedAvatar = await downloadTelegramAvatar({
      employeeId,
      filePath,
      fileUniqueId: avatarRef.fileUniqueId,
    });

    let updatedEmployee;
    try {
      updatedEmployee = await prisma.employee.update({
        where: { id: employeeId },
        data: { photoLink: downloadedAvatar.storageUrl },
        select: { id: true, photoLink: true },
      });
    } catch (error) {
      await safeUnlink(downloadedAvatar.absPath);
      throw error;
    }

    if (currentPhotoLink && currentPhotoLink !== downloadedAvatar.storageUrl) {
      await maybeDeleteOrphanedTelegramFile(currentPhotoLink);
    }

    await markSyncEnabled(employeeId, {
      linkedAt,
      lastFilePath: filePath,
      lastFileUniqueId: avatarRef.fileUniqueId,
      storageUrl: downloadedAvatar.storageUrl,
    });

    return {
      ok: true,
      updated: currentPhotoLink !== downloadedAvatar.storageUrl,
      photoLink: updatedEmployee.photoLink,
    };
  } catch (e) {
    return { ok: false, reason: 'EXCEPTION', step: 'unknown', raw: { error: e?.message || String(e) } };
  }
}

module.exports = { fetchAndSaveTelegramAvatar };
