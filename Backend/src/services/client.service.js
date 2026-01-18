// src/services/client.service.js (пример пути; оставь свой)
const prisma = require('../../prisma/client');

const isUuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || '')
  );

/** ===== UTILS ===== */

const pickStr = (value) => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'object') return String(value.name ?? value.value ?? value.code ?? '').trim();
  return String(value).trim();
};

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

const getProvided = (payload, keys) => {
  for (const key of keys) {
    if (hasOwn(payload, key)) return payload[key];
  }
  return undefined;
};

const setIfProvided = (data, payload, keys, field, mapValue) => {
  const value = getProvided(payload, keys);
  if (value === undefined) return;
  data[field] = mapValue ? mapValue(value) : value;
};

const normalizeShareInfo = (value) => {
  if (value === undefined || value === null) return null;
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
};

/** ===== ACCESS / CREDENTIALS ===== */

const ACCESS_DESCRIPTION_PREFIX = '__access__:';

const parseAccessDescription = (value) => {
  const text = pickStr(value);
  if (!text) return { name: '', description: '' };
  if (!text.startsWith(ACCESS_DESCRIPTION_PREFIX)) {
    return { name: '', description: text };
  }
  const jsonText = text.slice(ACCESS_DESCRIPTION_PREFIX.length).trim();
  if (!jsonText) return { name: '', description: '' };
  try {
    const parsed = JSON.parse(jsonText);
    return {
      name: pickStr(parsed?.name),
      description: pickStr(parsed?.description),
    };
  } catch (_) {
    return { name: '', description: text };
  }
};

const encodeAccessDescription = (access = {}) => {
  const name = pickStr(access?.name ?? access?.label);
  const description = pickStr(access?.description);
  if (!name && !description) return null;
  if (!name) return description;
  const payload = description ? { name, description } : { name };
  return `${ACCESS_DESCRIPTION_PREFIX}${JSON.stringify(payload)}`;
};

const normalizeAccessInput = (items) => {
  const list = Array.isArray(items) ? items : [];
  return list
    .map((item) => ({
      name: pickStr(item?.name ?? item?.label),
      login: pickStr(item?.login),
      password: pickStr(item?.password),
      description: pickStr(item?.description),
    }))
    .filter((item) => item.name || item.login || item.password || item.description);
};

const extractAccessPayload = (payload) => {
  if (!payload || typeof payload !== 'object') return { hasAccesses: false, accesses: [] };
  if (payload.accesses !== undefined) return { hasAccesses: true, accesses: payload.accesses };
  if (payload.credentials !== undefined) return { hasAccesses: true, accesses: payload.credentials };
  return { hasAccesses: false, accesses: [] };
};

async function syncCredentials(clientId, items) {
  const normalized = normalizeAccessInput(items);
  await prisma.credential.deleteMany({ where: { clientId } });
  if (!normalized.length) return;

  await prisma.credential.createMany({
    data: normalized.map((item) => ({
      clientId,
      login: item.login || '',
      password: item.password || '',
      description: encodeAccessDescription(item),
    })),
  });
}

/** ===== PRISMA INCLUDE + VIEWMODEL ===== */

const includeClient = {
  group: { select: { id: true, name: true, order: true } },
  category: { select: { id: true, name: true } },
  source: { select: { id: true, name: true } },
  country: { select: { id: true, name: true } },
  currency: { select: { id: true, code: true, name: true } },
  company: { select: { id: true, name: true } },
  manager: { select: { id: true, full_name: true } },
  tags: { include: { tag: true } },
  credentials: { select: { id: true, login: true, password: true, description: true } },
};

const normalizeClient = (client) => {
  if (!client) return client;

  const credentials = Array.isArray(client.credentials) ? client.credentials : [];
  const normalizedCredentials = credentials.map((cred) => {
    const parsed = parseAccessDescription(cred.description);
    return {
      id: cred.id,
      login: cred.login ?? '',
      password: cred.password ?? '',
      name: parsed.name || '',
      description: parsed.description || '',
    };
  });

  const accesses = normalizedCredentials.map((cred) => ({
    id: cred.id,
    name: cred.name,
    login: cred.login,
    password: cred.password,
    description: cred.description,
  }));

  const categoryName = client.category?.name ?? null;
  const sourceName = client.source?.name ?? null;
  const countryName = client.country?.name ?? null;
  const currencyValue = client.currency?.code ?? client.currency?.name ?? null;
  const groupOrder = client.group?.order ?? null;
  const groupName = client.group?.name ?? null;

  const tags = Array.isArray(client.tags)
    ? client.tags
        .map((ct) => ct?.tag)
        .filter(Boolean)
        .map((t) => ({ id: t.id, name: t.name, color: t.color }))
    : [];

  return {
    ...client,
    category: categoryName,
    source: sourceName,
    country: countryName,
    currency: currencyValue,
    group: groupOrder,
    group_id: client.groupId ?? null,
    group_name: groupName,
    company_id: client.companyId ?? null,
    company_name: client.company?.name ?? null,
    manager_id: client.managerId ?? null,
    manager_name: client.manager?.full_name ?? null,
    tags,
    credentials: normalizedCredentials,
    accesses,
  };
};

/** ===== DICT RESOLVERS ===== */

async function resolveDictId(model, field, value, createData = {}) {
  const v = pickStr(value);
  if (!v) return null;
  const existing = await prisma[model].findFirst({ where: { [field]: v } });
  if (existing) return existing.id;
  const created = await prisma[model].create({ data: { [field]: v, ...createData } });
  return created.id;
}

async function resolveCurrencyId(value) {
  const v = pickStr(value).toUpperCase();
  if (!v) return null;
  const existing = await prisma.currencyDict.findUnique({ where: { code: v } });
  if (existing) return existing.id;
  const created = await prisma.currencyDict.create({ data: { code: v, name: v } });
  return created.id;
}

async function resolveGroupId(value) {
  if (!value) return null;
  if (isUuid(value)) return value;

  const asNumber = Number(value);
  if (Number.isFinite(asNumber)) {
    const byOrder = await prisma.clientGroup.findFirst({ where: { order: asNumber } });
    if (byOrder) return byOrder.id;
  }

  const name = pickStr(value);
  if (!name) return null;

  const byName = await prisma.clientGroup.findFirst({ where: { name } });
  if (byName) return byName.id;

  const created = await prisma.clientGroup.create({ data: { name } });
  return created.id;
}

/** ===== TAGS ===== */

async function ensureClientTagCategory() {
  return prisma.tagCategory.upsert({
    where: { code: 'client' },
    update: { name: 'Client' },
    create: { code: 'client', name: 'Client' },
  });
}

async function updateTags(clientId, tags) {
  await prisma.clientTag.deleteMany({ where: { clientId } });
  if (!Array.isArray(tags) || !tags.length) return;

  const category = await ensureClientTagCategory();

  for (const tag of tags) {
    let tagRecord;

    if (tag?.id) {
      tagRecord = await prisma.tag.findUnique({ where: { id: tag.id } });
    }

    if (!tagRecord) {
      const name = pickStr(tag?.name ?? tag);
      if (!name) continue;
      const color = tag?.color || '#cccccc';

      tagRecord = await prisma.tag.upsert({
        where: { name_categoryId: { name, categoryId: category.id } },
        update: { color },
        create: { name, color, categoryId: category.id },
      });
    }

    if (tagRecord) {
      await prisma.clientTag.create({ data: { clientId, tagId: tagRecord.id } });
    }
  }
}

/** ===== REFERRERS ===== */

async function resolveReferrerName(referrerId) {
  const id = pickStr(referrerId);
  if (!id) return null;

  const employee = await prisma.employee.findUnique({
    where: { id },
    select: { full_name: true },
  });
  if (employee?.full_name) return employee.full_name;

  const client = await prisma.client.findUnique({
    where: { id },
    select: { name: true, full_name: true },
  });

  return client?.name ?? client?.full_name ?? null;
}

/** ===== BUILD DATA ===== */

async function buildClientData(payload = {}) {
  const data = {};

  const categoryValue = getProvided(payload, ['categoryId', 'category']);
  if (categoryValue !== undefined) {
    data.categoryId = payload.categoryId ?? (await resolveDictId('clientCategoryDict', 'name', payload.category));
  }

  const sourceValue = getProvided(payload, ['sourceId', 'source']);
  if (sourceValue !== undefined) {
    data.sourceId = payload.sourceId ?? (await resolveDictId('clientSourceDict', 'name', payload.source));
  }

  const countryValue = getProvided(payload, ['countryId', 'country']);
  if (countryValue !== undefined) {
    data.countryId = payload.countryId ?? (await resolveDictId('country', 'name', payload.country));
  }

  const currencyValue = getProvided(payload, ['currencyId', 'currency']);
  if (currencyValue !== undefined) {
    data.currencyId = payload.currencyId ?? (await resolveCurrencyId(payload.currency));
  }

  const groupValue = getProvided(payload, ['groupId', 'group']);
  if (groupValue !== undefined) {
    data.groupId = payload.groupId ?? (await resolveGroupId(payload.group));
  }

  setIfProvided(data, payload, ['name'], 'name', (v) => v ?? null);
  setIfProvided(data, payload, ['messenger_name', 'messengerName'], 'messenger_name', (v) => v ?? null);
  setIfProvided(data, payload, ['intro_description', 'introDescription'], 'intro_description', (v) => v ?? null);
  setIfProvided(data, payload, ['note'], 'note', (v) => v ?? null);
  setIfProvided(data, payload, ['full_name', 'fullName'], 'full_name', (v) => v ?? null);
  setIfProvided(data, payload, ['phone'], 'phone', (v) => v ?? null);
  setIfProvided(data, payload, ['email'], 'email', (v) => v ?? null);
  setIfProvided(data, payload, ['city'], 'city', (v) => v ?? null);
  setIfProvided(data, payload, ['payment_details', 'paymentDetails'], 'payment_details', (v) => v ?? null);
  setIfProvided(data, payload, ['hourly_rate', 'hourlyRate'], 'hourly_rate', (v) => v ?? null);
  setIfProvided(data, payload, ['percent'], 'percent', (v) => v ?? null);
  setIfProvided(data, payload, ['share_info', 'shareInfo'], 'share_info', (v) => normalizeShareInfo(v));
  setIfProvided(data, payload, ['status'], 'status', (v) => v ?? undefined);
  setIfProvided(data, payload, ['referrer_id', 'referrerId'], 'referrer_id', (v) => v ?? null);
  setIfProvided(data, payload, ['referrer_name', 'referrerName'], 'referrer_name', (v) => v ?? null);
  setIfProvided(data, payload, ['referrer_first_id', 'referrerFirstId'], 'referrer_first_id', (v) => v ?? null);
  setIfProvided(data, payload, ['referrer_first_name', 'referrerFirstName'], 'referrer_first_name', (v) => v ?? null);

  // Важно: в твоей схеме поля названы managerId/companyId (camelCase)
  setIfProvided(data, payload, ['manager_id', 'managerId'], 'managerId', (v) => v ?? null);
  setIfProvided(data, payload, ['company_id', 'companyId'], 'companyId', (v) => v ?? null);

  setIfProvided(data, payload, ['chat_link', 'chatLink'], 'chat_link', (v) => v ?? null);
  setIfProvided(data, payload, ['photo_link', 'photoLink'], 'photo_link', (v) => v ?? null);
  setIfProvided(data, payload, ['folder_link', 'folderLink'], 'folder_link', (v) => v ?? null);

  // Автоподстановка имени реферера, если пришел id, но имя не пришло
  const referrerId = getProvided(payload, ['referrer_id', 'referrerId']);
  const referrerName = getProvided(payload, ['referrer_name', 'referrerName']);
  if (referrerId !== undefined && referrerName === undefined) {
    data.referrer_name = await resolveReferrerName(referrerId);
  }

  const referrerFirstId = getProvided(payload, ['referrer_first_id', 'referrerFirstId']);
  const referrerFirstName = getProvided(payload, ['referrer_first_name', 'referrerFirstName']);
  if (referrerFirstId !== undefined && referrerFirstName === undefined) {
    data.referrer_first_name = await resolveReferrerName(referrerFirstId);
  }

  return data;
}

/** ===== SERVICE ===== */

const ClientService = {
  async createClient(payload) {
    const data = await buildClientData(payload);

    const client = await prisma.client.create({
      data,
      include: includeClient,
    });

    const { hasAccesses, accesses } = extractAccessPayload(payload);

    let needsRefetch = false;

    if (payload?.tags) {
      await updateTags(client.id, payload.tags);
      needsRefetch = true;
    }

    if (hasAccesses) {
      await syncCredentials(client.id, accesses);
      needsRefetch = true;
    }

    if (needsRefetch) {
      const updated = await prisma.client.findUnique({
        where: { id: client.id },
        include: includeClient,
      });
      return normalizeClient(updated);
    }

    return normalizeClient(client);
  },

  async getAllClients() {
    const clients = await prisma.client.findMany({
      include: includeClient,
      orderBy: { name: 'asc' },
    });
    return clients.map(normalizeClient);
  },

  async getClientById(id) {
    const client = await prisma.client.findUnique({
      where: { id },
      include: includeClient,
    });
    return normalizeClient(client);
  },

  async updateClient(id, payload) {
    const data = await buildClientData(payload);

    const client = await prisma.client.update({
      where: { id },
      data,
      include: includeClient,
    });

    const { hasAccesses, accesses } = extractAccessPayload(payload);

    let needsRefetch = false;

    if (payload?.tags !== undefined) {
      await updateTags(id, payload.tags);
      needsRefetch = true;
    }

    if (hasAccesses) {
      await syncCredentials(id, accesses);
      needsRefetch = true;
    }

    if (needsRefetch) {
      const updated = await prisma.client.findUnique({
        where: { id },
        include: includeClient,
      });
      return normalizeClient(updated);
    }

    return normalizeClient(client);
  },

  async deleteClient(id) {
    await prisma.clientTag.deleteMany({ where: { clientId: id } });
    await prisma.credential.deleteMany({ where: { clientId: id } });
    return prisma.client.delete({ where: { id } });
  },
};

module.exports = ClientService;
