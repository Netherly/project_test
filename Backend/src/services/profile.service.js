const prisma = require('../../prisma/client');
const bcrypt = require('bcrypt');
const {
  clearState: clearTelegramAvatarState,
  markSyncDisabled,
} = require('./telegram-avatar-state.service');
const { isTelegramManagedPhotoLink } = require('../utils/telegram-avatar');

const DEFAULT_LANGUAGE = 'ru';
const DEFAULT_THEME = 'dark';
const LOGIN_RE = /^[\p{L}\p{N}_.@-]+$/u;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const SUPPORTED_LANGUAGES = new Set(['ua', 'ru', 'en']);
const SUPPORTED_THEMES = new Set(['dark', 'light']);

function createError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function splitRequisiteLabel(label = '') {
  const [currency = '', bank = ''] = String(label).split(':');
  return { currency, bank };
}

function joinRequisiteLabel({ currency = '', bank = '' }) {
  return `${currency}:${bank}`;
}

function toTrimmedText(value) {
  return value === null || value === undefined ? '' : String(value).trim();
}

function normalizeOptionalText(value) {
  const text = toTrimmedText(value);
  return text || null;
}

function toComparableText(value) {
  return toTrimmedText(value).toLowerCase();
}

function ensureTime(value, label) {
  const text = toTrimmedText(value);
  if (!TIME_RE.test(text)) {
    throw createError(`${label} должно быть в формате HH:mm`);
  }
  return text;
}

function normalizeDefaults(row) {
  const settings = row?.settings || {};
  const requisitesRaw = row?.requisites || [];

  const requisites = requisitesRaw.map((r) => {
    const { currency, bank } = splitRequisiteLabel(r.label);
    return { currency, bank, account: r.value || '' };
  });
  if (requisites.length === 0) {
    requisites.push({ currency: '', bank: '', account: '' });
  }

  const workSchedule =
    Array.isArray(settings.workSchedule) && settings.workSchedule.length === 7
      ? settings.workSchedule.map((d) => [d?.[0] || '09:00', d?.[1] || '18:00'])
      : Array.from({ length: 7 }, () => ['09:00', '18:00']);

  const botReminders =
    Array.isArray(settings.botReminders) && settings.botReminders.length === 7
      ? settings.botReminders.map(Boolean)
      : Array(7).fill(false);

  return {
    nickname: row?.login || '',
    password: '',
    email: row?.email || '',
    userId: row?.userid || row?.publicId || '',
    fullName: row?.full_name || '',
    requisites,
    currency: row?.settings?.currency?.code || 'UAH',
    workSchedule,
    botReminders,
    crmLanguage: settings.crmLanguage || DEFAULT_LANGUAGE,
    crmTheme: settings.crmTheme || DEFAULT_THEME,
    crmBackground: settings.crmBackground || null,
    notifySound: settings.notifySound ?? true,
    notifyCounter: settings.notifyCounter ?? true,
    notifyTelegram: settings.notifyTelegram ?? true,
    telegramUsername: row?.telegramUsername || null,
    photoLink: row?.photoLink || null,
  };
}

async function getProfile(employeeId) {
  const row = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      settings: { include: { currency: true } },
      requisites: true,
    },
  });
  if (!row) throw createError('Сотрудник не найден', 404);
  return normalizeDefaults(row);
}

async function resolveCurrencyId(code) {
  if (code === undefined) return undefined;
  const normalized = toTrimmedText(code).toUpperCase();
  if (!normalized) return null;
  const currency = await prisma.currencyDict.findUnique({ where: { code: normalized } });
  if (!currency) {
    throw createError('Некорректная валюта учета');
  }
  return currency.id;
}

function sanitizeRequisites(items) {
  if (!Array.isArray(items)) return undefined;

  return items
    .map((item) => ({
      currency: toTrimmedText(item?.currency).toUpperCase(),
      bank: toTrimmedText(item?.bank),
      account: toTrimmedText(item?.account),
    }))
    .filter((item) => item.currency || item.bank || item.account)
    .map((item, index) => {
      if (item.currency && !/^[A-Z0-9._-]{2,10}$/.test(item.currency)) {
        throw createError(`В строке реквизитов ${index + 1} некорректная валюта`);
      }
      if (item.bank.length > 100) {
        throw createError(`В строке реквизитов ${index + 1} слишком длинное название банка`);
      }
      if (item.account.length > 1000) {
        throw createError(`В строке реквизитов ${index + 1} слишком длинный счет`);
      }
      return item;
    });
}

function normalizeWorkSchedule(workSchedule) {
  if (workSchedule === undefined) return undefined;
  if (!Array.isArray(workSchedule) || workSchedule.length !== 7) {
    throw createError('График работы должен содержать 7 дней');
  }

  return workSchedule.map((day, index) => {
    if (!Array.isArray(day) || day.length !== 2) {
      throw createError(`День ${index + 1} в графике работы должен содержать время начала и конца`);
    }
    return [
      ensureTime(day[0], `Время начала дня ${index + 1}`),
      ensureTime(day[1], `Время окончания дня ${index + 1}`),
    ];
  });
}

function normalizeBotReminders(botReminders) {
  if (botReminders === undefined) return undefined;
  if (!Array.isArray(botReminders) || botReminders.length !== 7) {
    throw createError('Напоминания от бота должны содержать 7 значений');
  }
  return botReminders.map(Boolean);
}

function normalizeLanguage(language) {
  if (language === undefined) return undefined;
  const normalized = toTrimmedText(language).toLowerCase() || DEFAULT_LANGUAGE;
  if (!SUPPORTED_LANGUAGES.has(normalized)) {
    throw createError('Некорректный язык CRM');
  }
  return normalized;
}

function normalizeTheme(theme) {
  if (theme === undefined) return undefined;
  const normalized = toTrimmedText(theme).toLowerCase() || DEFAULT_THEME;
  if (!SUPPORTED_THEMES.has(normalized)) {
    throw createError('Некорректная тема CRM');
  }
  return normalized;
}

async function ensureUniqueProfileFields(employeeId, currentEmployee, { nickname, email }) {
  const currentNickname = toComparableText(currentEmployee?.login);
  const currentEmail = toComparableText(currentEmployee?.email);
  const nextNickname = toComparableText(nickname);
  const nextEmail = toComparableText(email);

  if (nickname && nextNickname !== currentNickname) {
    const existingLogin = await prisma.employee.findFirst({
      where: {
        id: { not: employeeId },
        login: { equals: nickname, mode: 'insensitive' },
      },
      select: { id: true },
    });
    if (existingLogin) {
      throw createError('Логин уже используется', 409);
    }
  }

  if (email && nextEmail !== currentEmail) {
    const existingEmail = await prisma.employee.findFirst({
      where: {
        id: { not: employeeId },
        email: { equals: email, mode: 'insensitive' },
      },
      select: { id: true },
    });
    if (existingEmail) {
      throw createError('Почта уже используется', 409);
    }
  }
}

async function replaceRequisites(tx, employeeId, items) {
  await tx.employeeRequisite.deleteMany({ where: { employeeId } });
  if (!Array.isArray(items) || items.length === 0) return;

  const data = items.map((it) => ({
    employeeId,
    label: joinRequisiteLabel({ currency: it.currency || '', bank: it.bank || '' }),
    value: String(it.account || ''),
    currency: it.currency || null,
    bank: it.bank || null,
    card: null,
    owner: null,
  }));

  await tx.employeeRequisite.createMany({ data });
}

async function updateProfile(employeeId, payload) {
  const currentEmployee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: {
      id: true,
      login: true,
      full_name: true,
      email: true,
      photoLink: true,
      telegramUserId: true,
      telegramChatId: true,
      telegramUsername: true,
      telegramLinkedAt: true,
      telegramVerified: true,
      chatLink: true,
    },
  });
  if (!currentEmployee) {
    throw createError('Сотрудник не найден', 404);
  }

  const nickname = payload.nickname === undefined ? undefined : toTrimmedText(payload.nickname);
  const fullName = payload.fullName === undefined ? undefined : toTrimmedText(payload.fullName);
  const email = payload.email === undefined ? undefined : normalizeOptionalText(payload.email);
  const photoLink = payload.photoLink === undefined ? undefined : normalizeOptionalText(payload.photoLink);
  const crmLanguage = normalizeLanguage(payload.crmLanguage);
  const crmTheme = normalizeTheme(payload.crmTheme);
  const crmBackground = payload.crmBackground === undefined ? undefined : normalizeOptionalText(payload.crmBackground);
  const workSchedule = normalizeWorkSchedule(payload.workSchedule);
  const botReminders = normalizeBotReminders(payload.botReminders);
  const requisites = sanitizeRequisites(payload.requisites);
  const currencyId = await resolveCurrencyId(payload.currency);

  if (nickname !== undefined) {
    if (!nickname) {
      throw createError('Никнейм не может быть пустым');
    }
    if (nickname.length > 50) {
      throw createError('Никнейм слишком длинный');
    }
    if (!LOGIN_RE.test(nickname)) {
      throw createError('Никнейм содержит недопустимые символы');
    }
  }

  if (fullName !== undefined) {
    if (!fullName) {
      throw createError('ФИО не может быть пустым');
    }
    if (fullName.length > 120) {
      throw createError('ФИО слишком длинное');
    }
  }

  if (email && !EMAIL_RE.test(email)) {
    throw createError('Некорректный email');
  }

  await ensureUniqueProfileFields(employeeId, currentEmployee, { nickname, email });

  const employeeData = {};
  if (nickname !== undefined && toComparableText(nickname) !== toComparableText(currentEmployee.login)) {
    employeeData.login = nickname;
  }
  if (fullName !== undefined && fullName !== toTrimmedText(currentEmployee.full_name)) {
    employeeData.full_name = fullName;
  }
  if (email !== undefined && toComparableText(email) !== toComparableText(currentEmployee.email)) {
    employeeData.email = email;
  }
  if (photoLink !== undefined && photoLink !== normalizeOptionalText(currentEmployee.photoLink)) {
    employeeData.photoLink = photoLink;
  }
  const photoLinkChangedManually =
    photoLink !== undefined && photoLink !== normalizeOptionalText(currentEmployee.photoLink);
  const isTelegramLinked = Boolean(
    currentEmployee.telegramUserId ||
      currentEmployee.telegramChatId ||
      currentEmployee.telegramUsername ||
      currentEmployee.telegramVerified ||
      currentEmployee.chatLink
  );

  await prisma.$transaction(async (tx) => {
    if (Object.keys(employeeData).length > 0) {
      await tx.employee.update({ where: { id: employeeId }, data: employeeData });
    }

    await tx.employeeSettings.upsert({
      where: { employeeId },
      create: {
        employeeId,
        crmLanguage: crmLanguage || DEFAULT_LANGUAGE,
        crmTheme: crmTheme || DEFAULT_THEME,
        crmBackground: crmBackground !== undefined ? crmBackground : null,
        notifySound: payload.notifySound ?? true,
        notifyCounter: payload.notifyCounter ?? true,
        notifyTelegram: payload.notifyTelegram ?? true,
        workSchedule,
        botReminders,
        currencyId: currencyId ?? undefined,
      },
      update: {
        crmLanguage: crmLanguage || DEFAULT_LANGUAGE,
        crmTheme: crmTheme || DEFAULT_THEME,
        crmBackground,
        notifySound: payload.notifySound ?? true,
        notifyCounter: payload.notifyCounter ?? true,
        notifyTelegram: payload.notifyTelegram ?? true,
        workSchedule,
        botReminders,
        currencyId,
      },
    });

    if (requisites !== undefined) {
      await replaceRequisites(tx, employeeId, requisites);
    }
  });

  if (isTelegramLinked && photoLinkChangedManually && !isTelegramManagedPhotoLink(photoLink)) {
    await markSyncDisabled(employeeId, {
      linkedAt: currentEmployee.telegramLinkedAt,
    });
  }

  return getProfile(employeeId);
}

async function setBackground(employeeId, url) {
  await prisma.employeeSettings.upsert({
    where: { employeeId },
    create: { employeeId, crmBackground: url },
    update: { crmBackground: url },
  });
  return { url };
}

async function changePassword(employeeId, { currentPassword, newPassword, confirmPassword }) {
  const current = String(currentPassword || '');
  const next = String(newPassword || '');
  const confirm = String(confirmPassword || '');

  if (!current || !next || !confirm) {
    throw createError('Заполните текущий пароль, новый пароль и подтверждение');
  }
  if (next.trim().length < 6) {
    throw createError('Новый пароль слишком короткий (мин. 6)');
  }
  if (next !== confirm) {
    throw createError('Новый пароль и подтверждение не совпадают');
  }
  if (current === next) {
    throw createError('Новый пароль должен отличаться от текущего');
  }

  const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!emp) throw createError('Сотрудник не найден', 404);

  const stored = emp.password || '';
  const isBcrypt = typeof stored === 'string' && stored.startsWith('$2');
  let ok = false;

  if (isBcrypt) {
    ok = await bcrypt.compare(current, stored);
  } else {
    ok = current === stored;
  }
  if (!ok) throw createError('Текущий пароль указан неверно');

  const hashed = await bcrypt.hash(next, 10);
  await prisma.employee.update({
    where: { id: employeeId },
    data: { password: hashed },
  });
  return { ok: true };
}

async function unlinkTelegram(employeeId) {
  await prisma.employee.update({
    where: { id: employeeId },
    data: {
      telegramUserId: null,
      telegramChatId: null,
      telegramUsername: null,
      telegramLinkedAt: null,
      telegramVerified: false,
      chatLink: null,
      telegramDateTime: null,
      telegramId: null,
      telegramName: null,
      telegramNickname: null,
      telegramBindingLink: null,
    },
  });
  await clearTelegramAvatarState(employeeId);
  return { ok: true };
}

module.exports = {
  getProfile,
  updateProfile,
  setBackground,
  changePassword,
  unlinkTelegram,
};
