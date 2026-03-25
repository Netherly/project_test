const fs = require('fs');
const path = require('path');

const UPLOADS_ROOT = path.join(__dirname, '..', '..', 'uploads');
const COMPANY_PHOTO_DIR = path.join(UPLOADS_ROOT, 'company-photos');
const COMPANY_PHOTO_UPLOADS_PREFIX = '/uploads/company-photos/';
const MAX_COMPANY_PHOTO_BYTES = 5 * 1024 * 1024;

const ensureCompanyPhotoDir = () => {
  if (!fs.existsSync(COMPANY_PHOTO_DIR)) {
    fs.mkdirSync(COMPANY_PHOTO_DIR, { recursive: true });
  }
};

const formatCompanyUrlId = (value, size = 8) => {
  const num = Number(value);
  if (!Number.isSafeInteger(num) || num <= 0) return '';
  return String(num).padStart(size, '0');
};

const normalizeDisplayPart = (value) => {
  const text = String(value || '')
    .replace(/[\\/:*?"<>|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text || 'company';
};

const normalizeStoragePart = (value) => {
  const text = normalizeDisplayPart(value)
    .replace(/\s+/g, '_')
    .replace(/[^\p{L}\p{N}._-]+/gu, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return text || 'company';
};

const buildCompanyPhotoNames = ({ companyName, urlId }) => {
  const formattedUrlId = formatCompanyUrlId(urlId) || '00000000';
  const displayBase = `${normalizeDisplayPart(companyName)}_${formattedUrlId}`;
  const storageBase = normalizeStoragePart(displayBase);
  return { displayBase, storageBase };
};

const isCompanyPhotoLink = (value) =>
  String(value || '').trim().startsWith(COMPANY_PHOTO_UPLOADS_PREFIX);

const companyPhotoUrlToAbsPath = (value) => {
  const text = String(value || '').trim();
  if (!isCompanyPhotoLink(text)) return null;
  return path.join(UPLOADS_ROOT, text.replace('/uploads/', ''));
};

const safeUnlink = async (absPath) => {
  if (!absPath) return;
  try {
    await fs.promises.unlink(absPath);
  } catch (_) {}
};

module.exports = {
  COMPANY_PHOTO_DIR,
  COMPANY_PHOTO_UPLOADS_PREFIX,
  MAX_COMPANY_PHOTO_BYTES,
  buildCompanyPhotoNames,
  companyPhotoUrlToAbsPath,
  ensureCompanyPhotoDir,
  formatCompanyUrlId,
  isCompanyPhotoLink,
  safeUnlink,
};
