const bcrypt = require('bcrypt');
const prisma = require('../../prisma/client');
const { createLinkTokenForEmployee } = require('./link-token.service');
const { logActivity, diffObjects } = require('./activity-log.service');

const SALT_ROUNDS = 10;

const EMPLOYEE_LOG_EXCLUDE_FIELDS = ['createdAt', 'updatedAt', 'password'];

const normalizeActorMeta = (actor = {}) => ({
  actorId: actor?.actorId || actor?.id || null,
  actorName: actor?.actorName || null,
  source: actor?.source || 'manual',
  ip: actor?.ip,
  userAgent: actor?.userAgent,
});

const safeLog = async (payload) => {
  try {
    return await logActivity(payload);
  } catch (e) {
    console.warn('[log] employee activity failed:', e?.message || e);
    return null;
  }
};

const getEmployeeLabel = (employee) =>
  employee?.full_name || employee?.login || employee?.email || employee?.id || 'сотрудник';

const fetchEmployeeTagNames = async (employeeId) => {
  const tags = await prisma.employeeTag.findMany({
    where: { employeeId },
    include: { tag: true },
  });
  return tags
    .map((t) => t?.tag?.name)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, 'ru'));
};

const arraysEqual = (a = [], b = []) => {
  if (a.length !== b.length) return false;
  return a.every((value, idx) => value === b[idx]);
};

const isEmpty = (value) => value === null || value === undefined || String(value).trim() === '';
const toText = (value) => (value === null || value === undefined ? '' : String(value).trim());

const genUserId8 = () => {
  const n = Math.floor(Math.random() * 100_000_000);
  return String(n).padStart(8, '0');
};

const generateUniqueUserId = async (maxAttempts = 20) => {
  for (let i = 0; i < maxAttempts; i += 1) {
    const candidate = genUserId8();
    const exists = await prisma.employee.findUnique({
      where: { userid: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
  }
  const err = new Error('Не удалось сгенерировать уникальный userid');
  err.status = 500;
  throw err;
};

const formatRequisite = (req = {}) => {
  const label = String(req?.label || '').trim();
  const bank = String(req?.bank || '').trim();
  const currency = String(req?.currency || '').trim();
  const card = String(req?.card || '').trim();
  const owner = String(req?.owner || '').trim();
  const value = String(req?.value || '').trim();
  const parts = [];

  if (label) {
    parts.push(label);
  } else {
    if (bank) parts.push(bank);
    if (currency) parts.push(currency);
  }

  if (card) parts.push(card);
  if (value && value !== card) parts.push(value);
  if (owner) parts.push(owner);

  const text = parts.filter(Boolean).join(' / ');
  return text;
};

const fetchEmployeeRequisiteLabels = async (employeeId) => {
  const requisites = await prisma.employeeRequisite.findMany({
    where: { employeeId },
    select: {
      bank: true,
      currency: true,
      card: true,
      owner: true,
      label: true,
      value: true,
    },
  });

  return requisites
    .map(formatRequisite)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, 'ru'));
};

const diffStringList = (before = [], after = []) => {
  const beforeCount = new Map();
  const afterCount = new Map();

  before.forEach((item) => {
    const key = String(item);
    beforeCount.set(key, (beforeCount.get(key) || 0) + 1);
  });
  after.forEach((item) => {
    const key = String(item);
    afterCount.set(key, (afterCount.get(key) || 0) + 1);
  });

  const added = [];
  const removed = [];

  for (const [key, count] of afterCount.entries()) {
    const prev = beforeCount.get(key) || 0;
    if (count > prev) {
      added.push(...Array.from({ length: count - prev }, () => key));
    }
  }

  for (const [key, count] of beforeCount.entries()) {
    const next = afterCount.get(key) || 0;
    if (count > next) {
      removed.push(...Array.from({ length: count - next }, () => key));
    }
  }

  added.sort((a, b) => a.localeCompare(b, 'ru'));
  removed.sort((a, b) => a.localeCompare(b, 'ru'));

  return { added, removed };
};

const hashPassword = async (raw) => {
  const text = String(raw ?? '').trim();
  if (!text) return undefined;
  return bcrypt.hash(text, SALT_ROUNDS);
};

const isUuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || '')
  );

const resolveCountryId = async (payload) => {
  const candidate = payload?.countryId ?? payload?.country;
  if (!candidate) return undefined;
  if (isUuid(candidate)) return candidate;

  const byName = await prisma.country.findFirst({
    where: { name: String(candidate).trim() },
    select: { id: true },
  });
  if (byName?.id) return byName.id;

  const byIso = await prisma.country.findFirst({
    where: {
      OR: [
        { iso2: String(candidate).trim().toUpperCase() },
        { iso3: String(candidate).trim().toUpperCase() },
      ],
    },
    select: { id: true },
  });
  return byIso?.id ?? null;
};

const EmployeesService = {
  async list(params = {}) {
    const { page = 1, limit = 50, search, status, roleId, countryId } = params;
    const skip = (page - 1) * limit;

    const where = {};
    if (search) {
      where.OR = [
        { full_name: { contains: search, mode: 'insensitive' } },
        { login: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;
    if (roleId) where.roleId = roleId;
    if (countryId) where.countryId = countryId;

    const employees = await prisma.employee.findMany({
      where,
      include: {
        country: true,
        role: true,
        company: true,
        settings: true,
        tags: { include: { tag: true } },
        requisites: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    const total = await prisma.employee.count({ where });

    return { employees, total, page, limit };
  },

  async byId(id) {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        country: true,
        role: true,
        company: true,
        settings: true,
        tags: { include: { tag: true } },
        requisites: true,
        assets: true,
        clients: true,
        tasks: true,
      },
    });
    if (!employee) {
      const e = new Error('Employee not found');
      e.status = 404;
      throw e;
    }
    return employee;
  },

  async create(payload, actor = {}) {
    const actorMeta = normalizeActorMeta(actor);
    const loginValue = toText(payload.login);
    const emailValue = toText(payload.email);

    if (loginValue) {
      const exists = await prisma.employee.findFirst({
        where: { login: { equals: loginValue, mode: 'insensitive' } },
        select: { id: true },
      });
      if (exists) {
        const err = new Error('Логин уже используется');
        err.status = 409;
        throw err;
      }
    }

    if (emailValue) {
      const exists = await prisma.employee.findFirst({
        where: { email: { equals: emailValue, mode: 'insensitive' } },
        select: { id: true },
      });
      if (exists) {
        const err = new Error('Почта уже используется');
        err.status = 409;
        throw err;
      }
    }

    const userIdValue = isEmpty(payload.userid) ? null : String(payload.userid).trim();
    const data = {
      status: payload.status,
      full_name: payload.full_name,
      phone: payload.phone,
      email: emailValue || null,
      login: loginValue || null,
      folder: payload.folder,
      userid: userIdValue,
      companyId: payload.companyId,
      publicId: payload.publicId,
      roleId: payload.roleId,
      countryId: await resolveCountryId(payload),
      telegramUserId: payload.telegramUserId,
      telegramChatId: payload.telegramChatId,
      telegramUsername: payload.telegramUsername,
      telegramLinkedAt: payload.telegramLinkedAt,
      telegramVerified: payload.telegramVerified,
      balance: payload.balance,
      currencyId: payload.currencyId,
      birthDate: payload.birthDate ? new Date(payload.birthDate) : null,
      passport: payload.passport,
      address: payload.address,
      chatLink: payload.chatLink,
      telegramDateTime: payload.telegram?.dateTime ? new Date(payload.telegram.dateTime) : null,
      telegramId: payload.telegram?.id ? BigInt(payload.telegram.id) : null,
      telegramName: payload.telegram?.name,
      telegramNickname: payload.telegram?.nickname,
      telegramBindingLink: payload.telegram?.bindingLink,
      photoLink: payload.photoLink,
      rates: payload.rates,
      mainCurrency: payload.mainCurrency,
    };
    if (!data.userid) {
      data.userid = await generateUniqueUserId();
    }
    const hashedPassword = await hashPassword(payload.password);
    if (hashedPassword) data.password = hashedPassword;

    const employee = await prisma.employee.create({
      data,
      include: {
        country: true,
        role: true,
        company: true,
        currency: true,
        settings: true,
        tags: { include: { tag: true } },
        requisites: true,
      },
    });

    let needsRefetch = false;

    // Handle tags if provided
    if (payload.tags && Array.isArray(payload.tags)) {
      await this.updateTags(employee.id, payload.tags);
      needsRefetch = true;
    }

    // Handle requisites if provided
    if (payload.requisites && Array.isArray(payload.requisites)) {
      await this.updateRequisites(employee.id, payload.requisites);
      needsRefetch = true;
    }

    if (isEmpty(data.telegramBindingLink)) {
      try {
        const ttlMinutes = Number(payload?.telegramLinkTtlMinutes) || 60;
        const token = await createLinkTokenForEmployee(employee.id, ttlMinutes);
        const botName = String(process.env.PUBLIC_BOT_NAME || 'gsse_assistant_bot')
          .trim()
          .replace(/^@/, '');
        const link = `https://t.me/${botName}?start=${token.code}`;
        await prisma.employee.update({
          where: { id: employee.id },
          data: { telegramBindingLink: link },
        });
        needsRefetch = true;
      } catch (e) {
        console.warn('[telegram link] create failed:', e?.message || e);
      }
    }

    const finalEmployee = needsRefetch
      ? await prisma.employee.findUnique({
          where: { id: employee.id },
          include: {
            country: true,
            role: true,
            company: true,
            currency: true,
            settings: true,
            tags: { include: { tag: true } },
            requisites: true,
          },
        })
      : employee;

    await safeLog({
      entityType: 'employee',
      entityId: employee.id,
      action: 'created',
      message: `Создан сотрудник "${getEmployeeLabel(finalEmployee)}"`,
      ...actorMeta,
    });

    return finalEmployee;
  },

  async update(id, payload, actor = {}) {
    const actorMeta = normalizeActorMeta(actor);
    const before = await prisma.employee.findUnique({ where: { id } });
    const beforeLinked = Boolean(
      before?.telegramUserId ||
        before?.telegramChatId ||
        before?.telegramUsername ||
        before?.telegramVerified ||
        before?.chatLink
    );
    const shouldTrackTags = payload.tags !== undefined;
    const shouldTrackRequisites = payload.requisites !== undefined;
    const beforeTagNames = shouldTrackTags ? await fetchEmployeeTagNames(id) : null;
    const beforeReqs = shouldTrackRequisites ? await fetchEmployeeRequisiteLabels(id) : null;

    const data = {};
    if (payload.status !== undefined) data.status = payload.status;
    if (payload.full_name !== undefined) data.full_name = payload.full_name;
    if (payload.phone !== undefined) data.phone = payload.phone;
    if (payload.email !== undefined) data.email = payload.email;
    if (payload.login !== undefined) data.login = payload.login;
    if (payload.password !== undefined) {
      const hashedPassword = await hashPassword(payload.password);
      if (hashedPassword) data.password = hashedPassword;
    }
    if (payload.folder !== undefined) data.folder = payload.folder;
    if (payload.userid !== undefined) data.userid = payload.userid;
    if (payload.companyId !== undefined) data.companyId = payload.companyId;
    if (payload.publicId !== undefined) data.publicId = payload.publicId;
    if (payload.roleId !== undefined) data.roleId = payload.roleId;
    if (payload.countryId !== undefined || payload.country !== undefined) {
      data.countryId = await resolveCountryId(payload);
    }
    if (payload.telegramUserId !== undefined) data.telegramUserId = payload.telegramUserId;
    if (payload.telegramChatId !== undefined) data.telegramChatId = payload.telegramChatId;
    if (payload.telegramUsername !== undefined) data.telegramUsername = payload.telegramUsername;
    if (payload.telegramLinkedAt !== undefined) data.telegramLinkedAt = payload.telegramLinkedAt;
    if (payload.telegramVerified !== undefined) data.telegramVerified = payload.telegramVerified;
    if (payload.balance !== undefined) data.balance = payload.balance;
    if (payload.currencyId !== undefined) data.currencyId = payload.currencyId;
    if (payload.birthDate !== undefined) data.birthDate = payload.birthDate ? new Date(payload.birthDate) : null;
    if (payload.passport !== undefined) data.passport = payload.passport;
    if (payload.address !== undefined) data.address = payload.address;
    if (payload.chatLink !== undefined) data.chatLink = payload.chatLink;
    if (payload.telegram?.dateTime !== undefined) data.telegramDateTime = payload.telegram.dateTime ? new Date(payload.telegram.dateTime) : null;
    if (payload.telegram?.id !== undefined) data.telegramId = payload.telegram.id ? BigInt(payload.telegram.id) : null;
    if (payload.telegram?.name !== undefined) data.telegramName = payload.telegram.name;
    if (payload.telegram?.nickname !== undefined) data.telegramNickname = payload.telegram.nickname;
    if (payload.telegram?.bindingLink !== undefined) data.telegramBindingLink = payload.telegram.bindingLink;
    if (payload.photoLink !== undefined) data.photoLink = payload.photoLink;
    if (payload.rates !== undefined) data.rates = payload.rates;
    if (payload.mainCurrency !== undefined) data.mainCurrency = payload.mainCurrency;

    const employee = await prisma.employee.update({
      where: { id },
      data,
      include: {
        country: true,
        role: true,
        company: true,
        currency: true,
        settings: true,
        tags: { include: { tag: true } },
        requisites: true,
      },
    });

    let needsRefetch = false;

    // Handle tags if provided
    if (payload.tags !== undefined) {
      await this.updateTags(employee.id, payload.tags);
      needsRefetch = true;
    }

    // Handle requisites if provided
    if (payload.requisites !== undefined) {
      await this.updateRequisites(employee.id, payload.requisites);
      needsRefetch = true;
    }

    const after = await prisma.employee.findUnique({ where: { id } });
    const afterLinked = Boolean(
      after?.telegramUserId ||
        after?.telegramChatId ||
        after?.telegramUsername ||
        after?.telegramVerified ||
        after?.chatLink
    );
    const changes = diffObjects(before, after, { exclude: EMPLOYEE_LOG_EXCLUDE_FIELDS });

    if (shouldTrackTags) {
      const afterTags = await fetchEmployeeTagNames(id);
      if (!arraysEqual(beforeTagNames || [], afterTags || [])) {
        changes.tags = { from: beforeTagNames || [], to: afterTags || [] };
      }
    }

    if (shouldTrackRequisites) {
      const afterReqs = await fetchEmployeeRequisiteLabels(id);
      const { added, removed } = diffStringList(beforeReqs || [], afterReqs || []);
      if (beforeReqs && afterReqs && beforeReqs.length !== afterReqs.length) {
        changes.requisitesCount = { from: beforeReqs.length, to: afterReqs.length };
      }
      if (added.length || removed.length) {
        changes.requisites = { added, removed };
      }
    }

    if (Object.keys(changes).length) {
      await safeLog({
        entityType: 'employee',
        entityId: id,
        action: 'updated',
        changes,
        ...actorMeta,
      });
    }

    if (beforeLinked && !afterLinked) {
      await safeLog({
        entityType: 'employee',
        entityId: id,
        action: 'telegram_unlinked',
        message: 'Telegram отвязан',
        ...actorMeta,
      });
    }

    if (!needsRefetch) return employee;

    return prisma.employee.findUnique({
      where: { id },
      include: {
        country: true,
        role: true,
        company: true,
        currency: true,
        settings: true,
        tags: { include: { tag: true } },
        requisites: true,
      },
    });
  },

  async delete(id, actor = {}) {
    const actorMeta = normalizeActorMeta(actor);
    const before = await prisma.employee.findUnique({ where: { id } });
    // Delete related tags and requisites first
    await prisma.employeeTag.deleteMany({ where: { employeeId: id } });
    await prisma.employeeRequisite.deleteMany({ where: { employeeId: id } });

    const removed = await prisma.employee.delete({
      where: { id },
    });

    await safeLog({
      entityType: 'employee',
      entityId: id,
      action: 'deleted',
      message: `Удалён сотрудник "${getEmployeeLabel(before)}"`,
      ...actorMeta,
    });

    return removed;
  },

  async updateTags(employeeId, tags) {
    const category = await prisma.tagCategory.upsert({
      where: { code: 'employee' },
      update: { name: 'Employee' },
      create: { code: 'employee', name: 'Employee' },
    });

    // Delete existing tags
    await prisma.employeeTag.deleteMany({ where: { employeeId } });

    // Add new tags, upserting Tag by name if no id
    for (const tag of tags) {
      let tagRecord;
      if (tag?.id) {
        tagRecord = await prisma.tag.findUnique({ where: { id: tag.id } });
      }

      if (!tagRecord) {
        const name = String(tag?.name ?? tag?.value ?? '').trim();
        if (!name) continue;
        tagRecord = await prisma.tag.upsert({
          where: { name_categoryId: { name, categoryId: category.id } },
          update: { color: tag?.color || '#777' },
          create: { name, color: tag?.color || '#777', categoryId: category.id },
        });
      }

      if (tagRecord) {
        await prisma.employeeTag.create({ data: { employeeId, tagId: tagRecord.id } });
      }
    }
  },

 async updateRequisites(employeeId, requisites) {
    
    await prisma.employeeRequisite.deleteMany({ where: { employeeId } });

    
    if (requisites.length > 0) {
      const reqData = requisites.map(req => ({
        employeeId,
        bank: req.bank || '',
        currency: req.currency || 'UAH',
        card: req.card || '',
        owner: req.owner || '',
        label: req.label || `${req.bank || ''} ${req.currency || ''}`.trim(),
        value: req.value || req.card || '', 
      }));
      
      await prisma.employeeRequisite.createMany({ data: reqData });
    }
  },
};

module.exports = EmployeesService;
