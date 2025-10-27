const prisma = require('../../prisma/client');
const bcrypt = require('bcrypt');

function splitRequisiteLabel(label = '') {
  const [currency = '', bank = ''] = String(label).split(':');
  return { currency, bank };
}

function joinRequisiteLabel({ currency = '', bank = '' }) {
  return `${currency}:${bank}`;
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
      : Array(7).fill(['09:00', '18:00']);

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
    crmLanguage: settings.crmLanguage || 'ua',
    crmTheme: settings.crmTheme || 'light',
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
  if (!row) throw new Error('Employee not found');
  return normalizeDefaults(row);
}

async function resolveCurrencyId(code) {
  if (!code) return null;
  const c = await prisma.currencyDict.findUnique({ where: { code } });
  return c?.id || null;
}

async function replaceRequisites(employeeId, items) {
  await prisma.employeeRequisite.deleteMany({ where: { employeeId } });
  if (!Array.isArray(items) || items.length === 0) return;

  const data = items.map((it) => ({
    employeeId,
    label: joinRequisiteLabel({ currency: it?.currency || '', bank: it?.bank || '' }),
    value: String(it?.account || ''),
  }));

  await prisma.employeeRequisite.createMany({ data });
}

async function updateProfile(employeeId, payload) {
  const currencyId = await resolveCurrencyId(payload?.currency);

  const employeeData = {};
  if (typeof payload.nickname === 'string') employeeData.login = payload.nickname;
  if (typeof payload.fullName === 'string') employeeData.full_name = payload.fullName;
  if (typeof payload.email === 'string') employeeData.email = payload.email;
  // пароль здесь НЕ меняем — только через changePassword

  await prisma.$transaction(async (tx) => {
    await tx.employee.update({ where: { id: employeeId }, data: employeeData });

    const workSchedule = Array.isArray(payload.workSchedule) ? payload.workSchedule : undefined;
    const botReminders = Array.isArray(payload.botReminders) ? payload.botReminders : undefined;

    await tx.employeeSettings.upsert({
      where: { employeeId },
      create: {
        employeeId,
        crmLanguage: payload.crmLanguage || 'ua',
        crmTheme: payload.crmTheme === 'dark' ? 'dark' : 'light',
        crmBackground: payload.crmBackground || null,
        notifySound: payload.notifySound ?? true,
        notifyCounter: payload.notifyCounter ?? true,
        notifyTelegram: payload.notifyTelegram ?? true,
        workSchedule: workSchedule ?? undefined,
        botReminders: botReminders ?? undefined,
        currencyId: currencyId ?? undefined,
      },
      update: {
        crmLanguage: payload.crmLanguage || 'ua',
        crmTheme: payload.crmTheme === 'dark' ? 'dark' : 'light',
        crmBackground: payload.crmBackground || null,
        notifySound: payload.notifySound ?? true,
        notifyCounter: payload.notifyCounter ?? true,
        notifyTelegram: payload.notifyTelegram ?? true,
        workSchedule: workSchedule ?? undefined,
        botReminders: botReminders ?? undefined,
        currencyId: currencyId ?? undefined,
      },
    });

    if (Array.isArray(payload.requisites)) {
      await replaceRequisites(employeeId, payload.requisites);
    }
  });

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

async function changePassword(employeeId, { currentPassword, newPassword }) {
  if (!currentPassword || !newPassword) throw new Error('Both currentPassword and newPassword are required');

  const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!emp) throw new Error('Employee not found');

  const stored = emp.password || '';
  const isBcrypt = typeof stored === 'string' && stored.startsWith('$2');
  let ok = false;

  if (isBcrypt) {
    ok = await bcrypt.compare(String(currentPassword), stored);
  } else {
    ok = String(currentPassword) === stored;
  }
  if (!ok) throw new Error('Current password is incorrect');

  const hashed = await bcrypt.hash(String(newPassword), 10);
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
      telegramVerified: false,
      photoLink: null,
    },
  });
  return { ok: true };
}

module.exports = {
  getProfile,
  updateProfile,
  setBackground,
  changePassword,
  unlinkTelegram,
};
