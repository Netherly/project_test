const prisma = require('../../prisma/client');

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

const toJsonSafe = (value) => {
  if (value === undefined) return null;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (err) {
    return typeof value === 'object' ? String(value) : value;
  }
};

const normalizeText = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const text = String(value).trim();
  return text ? text : null;
};

const normalizeBool = (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value === 'boolean') return value;
  const text = String(value).trim().toLowerCase();
  if (text === 'true' || text === '1') return true;
  if (text === 'false' || text === '0') return false;
  return Boolean(value);
};

const normalizeNumber = (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const normalizeInt = (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? Math.trunc(num) : null;
};

const normalizeDate = (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeJson = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return toJsonSafe(value);
};

const setField = (data, payload, key, normalize) => {
  if (!hasOwn(payload, key)) return;
  data[key] = normalize ? normalize(payload[key]) : payload[key];
};

const baseInclude = {
  client: { select: { id: true, name: true } },
  currency: { select: { id: true, code: true, name: true } },
  employee: { select: { id: true, full_name: true } },
  tags: { include: { tag: true } },
  changes: {
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: { employee: { select: { id: true, full_name: true } } },
  },
};

const allowedOrderFields = new Set([
  'createdAt',
  'updatedAt',
  'stageIndex',
  'date',
  'plannedFinishDate',
  'price',
  'orderSequence',
]);

function stripUndefined(obj = {}) {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined));
}

function normalizeMeta(meta) {
  if (meta === null) return null;
  if (!meta || typeof meta !== 'object') return undefined;
  const cleaned = stripUndefined(meta);
  return Object.keys(cleaned).length ? cleaned : undefined;
}

const META_EXCLUDE_FIELDS = new Set([
  'tagIds',
  'stage',
  'stageIndex',
  'date',
  'plannedFinishDate',
  'price',
  'amount',
  'numberOrder',
  'orderSequence',
  'name',
  'clientName',
  'clientId',
  'title',
  'currencyId',
  'employeeId',
  'urgency',
  'isOldOrder',
  'appealDate',
  'proposalDate',
  'orderDate',
  'interval',
  'orderType',
  'orderStatus',
  'closeReason',
  'plannedStartDate',
  'project',
  'orderDescription',
  'techTags',
  'taskTags',
  'workList',
  'techSpecifications',
  'additionalConditions',
  'notes',
  'orderMainClient',
  'clientCompany',
  'partnerName',
  'thirdParties',
  'partnerDisableShare',
  'partnerPayment',
  'partnerPlan',
  'partnerPlanPercent',
  'partnerPlanSum',
  'partnerUnderpayment',
  'performers',
  'sharePercent',
  'budget',
  'currencyType',
  'currencyRate',
  'hourlyRate',
  'roundHour',
  'discount',
  'upsell',
  'expenses',
  'tips',
  'paymentDetails',
  'paymentLog',
  'executionTime',
  'startDate',
  'endDate',
  'countDays',
  'completedDate',
  'completingTime',
  'completingLink',
  'orderImpressions',
  'workLog',
  'order_client',
  'order_main_client',
  'client_company',
  'partner_name',
  'third_parties',
  'partner_disable_share',
  'partner_payment',
  'partner_plan',
  'partner_percent_plan',
  'partner_sum_plan',
  'partner_underpayment',
  'share_percent',
  'currency_type',
  'currency_rate',
  'hourly_rate',
  'round_hour',
  'payment_details',
  'payment_log',
  'work_log',
]);

function filterMeta(meta) {
  if (!meta || typeof meta !== 'object') return undefined;
  const cleaned = {};
  Object.entries(meta).forEach(([key, value]) => {
    if (META_EXCLUDE_FIELDS.has(key)) return;
    if (value !== undefined) cleaned[key] = value;
  });
  return normalizeMeta(cleaned);
}

function buildMeta(payload = {}) {
  const rawMeta = payload?.meta && typeof payload.meta === 'object' ? payload.meta : {};
  const baseMeta = filterMeta(rawMeta) || {};
  const extra = {};
  Object.entries(payload).forEach(([key, value]) => {
    if (key === 'meta' || META_EXCLUDE_FIELDS.has(key)) return;
    if (value !== undefined) extra[key] = value;
  });
  return normalizeMeta({ ...baseMeta, ...extra });
}

function buildOrderData(payload = {}) {
  const data = {};
  setField(data, payload, 'numberOrder', normalizeText);
  setField(data, payload, 'name', normalizeText);
  setField(data, payload, 'clientName', normalizeText);
  setField(data, payload, 'clientId', normalizeText);
  setField(data, payload, 'title', normalizeText);
  setField(data, payload, 'currencyId', normalizeText);
  setField(data, payload, 'employeeId', normalizeText);
  setField(data, payload, 'urgency', normalizeText);

  setField(data, payload, 'isOldOrder', normalizeBool);
  setField(data, payload, 'appealDate', normalizeDate);
  setField(data, payload, 'proposalDate', normalizeDate);
  setField(data, payload, 'orderDate', normalizeDate);
  setField(data, payload, 'interval', normalizeText);
  setField(data, payload, 'orderType', normalizeText);
  setField(data, payload, 'orderStatus', normalizeText);
  setField(data, payload, 'closeReason', normalizeText);
  setField(data, payload, 'plannedStartDate', normalizeDate);
  setField(data, payload, 'project', normalizeText);
  setField(data, payload, 'orderDescription', normalizeText);
  setField(data, payload, 'techTags', normalizeJson);
  setField(data, payload, 'taskTags', normalizeJson);
  setField(data, payload, 'workList', normalizeJson);
  setField(data, payload, 'techSpecifications', normalizeText);
  setField(data, payload, 'additionalConditions', normalizeText);
  setField(data, payload, 'notes', normalizeText);
  setField(data, payload, 'orderMainClient', normalizeText);
  setField(data, payload, 'clientCompany', normalizeText);
  setField(data, payload, 'partnerName', normalizeText);
  setField(data, payload, 'thirdParties', normalizeJson);
  setField(data, payload, 'partnerDisableShare', normalizeBool);
  setField(data, payload, 'partnerPayment', normalizeNumber);
  setField(data, payload, 'partnerPlan', normalizeInt);
  setField(data, payload, 'partnerPlanPercent', normalizeInt);
  setField(data, payload, 'partnerPlanSum', normalizeNumber);
  setField(data, payload, 'partnerUnderpayment', normalizeNumber);
  setField(data, payload, 'performers', normalizeJson);
  setField(data, payload, 'sharePercent', normalizeNumber);
  setField(data, payload, 'budget', normalizeNumber);
  setField(data, payload, 'currencyType', normalizeText);
  setField(data, payload, 'currencyRate', normalizeNumber);
  setField(data, payload, 'hourlyRate', normalizeNumber);
  setField(data, payload, 'roundHour', normalizeBool);
  setField(data, payload, 'discount', normalizeNumber);
  setField(data, payload, 'upsell', normalizeNumber);
  setField(data, payload, 'expenses', normalizeNumber);
  setField(data, payload, 'tips', normalizeNumber);
  setField(data, payload, 'paymentDetails', normalizeText);
  setField(data, payload, 'paymentLog', normalizeJson);
  setField(data, payload, 'executionTime', normalizeText);
  setField(data, payload, 'startDate', normalizeDate);
  setField(data, payload, 'endDate', normalizeDate);
  setField(data, payload, 'countDays', normalizeInt);
  setField(data, payload, 'completedDate', normalizeDate);
  setField(data, payload, 'completingTime', normalizeText);
  setField(data, payload, 'completingLink', normalizeText);
  setField(data, payload, 'orderImpressions', normalizeText);
  setField(data, payload, 'workLog', normalizeJson);
  return data;
}

async function getNextOrderSequence() {
  const { _max } = await prisma.order.aggregate({
    where: { orderSequence: { not: null } },
    _max: { orderSequence: true },
  });
  const current = _max?.orderSequence;
  return current == null ? 0 : Number(current) + 1;
}

async function generateApplicationNumber() {
  for (let i = 0; i < 10; i += 1) {
    const candidate = String(Math.floor(10000000 + Math.random() * 90000000));
    const exists = await prisma.order.findFirst({ where: { numberOrder: candidate } });
    if (!exists) return candidate;
  }
  return String(Date.now()).slice(-8);
}

async function logChange({ orderId, employeeId, action, field, oldValue, newValue }) {
  return prisma.orderChange.create({
    data: {
      orderId,
      employeeId,
      action,
      field,
      oldValue: toJsonSafe(oldValue),
      newValue: toJsonSafe(newValue),
    },
  });
}

async function upsertTags(orderId, tagIds = []) {
  await prisma.orderTag.deleteMany({ where: { orderId } });
  if (Array.isArray(tagIds) && tagIds.length) {
    const data = tagIds.map((tagId) => ({ orderId, tagId }));
    await prisma.orderTag.createMany({ data, skipDuplicates: true });
  }
}

const OrdersService = {
  async list(params = {}) {
    const {
      page = 1,
      limit = 50,
      stage,
      clientId,
      search,
      urgency,
      orderBy = 'createdAt',
      orderDir = 'desc',
    } = params;

    const where = {};
    if (stage) where.stage = stage;
    if (clientId) where.clientId = clientId;
    if (urgency) where.urgency = urgency;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { clientName: { contains: search, mode: 'insensitive' } },
        { numberOrder: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortField = allowedOrderFields.has(orderBy) ? orderBy : 'createdAt';
    const sortDir = orderDir === 'asc' ? 'asc' : 'desc';

    const orders = await prisma.order.findMany({
      where,
      include: baseInclude,
      orderBy: [{ [sortField]: sortDir }, { stageIndex: 'asc' }, { createdAt: 'desc' }],
      skip,
      take: Number(limit),
    });

    const total = await prisma.order.count({ where });
    return { orders, total, page: Number(page), limit: Number(limit) };
  },

  async byId(id) {
    const order = await prisma.order.findUnique({ where: { id }, include: baseInclude });
    if (!order) {
      const e = new Error('Order not found');
      e.status = 404;
      throw e;
    }
    return order;
  },

  async create(payload, actorId) {
    const tagIds = Array.isArray(payload?.tagIds) ? payload.tagIds : [];
    const data = buildOrderData(payload);

    if (payload.stage !== undefined) data.stage = payload.stage;
    if (payload.stageIndex !== undefined) data.stageIndex = payload.stageIndex;

    const orderDateValue = normalizeDate(payload.orderDate);
    if (orderDateValue !== undefined) {
      data.orderDate = orderDateValue;
      data.date = orderDateValue;
    } else if (payload.date !== undefined) {
      data.date = normalizeDate(payload.date);
    }

    if (payload.plannedFinishDate !== undefined) {
      data.plannedFinishDate = normalizeDate(payload.plannedFinishDate);
    }

    if (payload.price !== undefined) data.price = normalizeNumber(payload.price);
    if (payload.amount !== undefined) data.amount = normalizeNumber(payload.amount);

    const stageValue = data.stage || 'LEAD';
    if (stageValue === 'IN_WORK') {
      const nextSeq = await getNextOrderSequence();
      data.orderSequence = nextSeq;
      data.numberOrder = String(nextSeq);
    } else if (!data.numberOrder) {
      data.numberOrder = await generateApplicationNumber();
    }

    const mergedMeta = buildMeta(payload);
    if (mergedMeta !== undefined) data.meta = mergedMeta;

    const created = await prisma.order.create({ data, include: baseInclude });
    await upsertTags(created.id, tagIds);
    await logChange({ orderId: created.id, employeeId: actorId, action: 'created', newValue: created });
    return this.byId(created.id);
  },

  async update(id, payload, actorId) {
    const existing = await prisma.order.findUnique({ where: { id }, include: { tags: true } });
    if (!existing) {
      const e = new Error('Order not found');
      e.status = 404;
      throw e;
    }

    const tagIds = hasOwn(payload, 'tagIds') ? payload.tagIds : undefined;
    const data = buildOrderData(payload);

    if (payload.stage !== undefined) data.stage = payload.stage;
    if (payload.stageIndex !== undefined) data.stageIndex = payload.stageIndex;

    const orderDateValue = normalizeDate(payload.orderDate);
    if (orderDateValue !== undefined) {
      data.orderDate = orderDateValue;
      data.date = orderDateValue;
    } else if (payload.date !== undefined) {
      data.date = normalizeDate(payload.date);
    }

    if (payload.plannedFinishDate !== undefined) {
      data.plannedFinishDate = normalizeDate(payload.plannedFinishDate);
    }

    if (payload.price !== undefined) data.price = normalizeNumber(payload.price);
    if (payload.amount !== undefined) data.amount = normalizeNumber(payload.amount);

    const stageValue = data.stage ?? existing.stage;
    const stageChanged = payload.stage !== undefined && payload.stage !== existing.stage;
    if (stageValue === 'IN_WORK' && existing.orderSequence == null) {
      const nextSeq = await getNextOrderSequence();
      data.orderSequence = nextSeq;
      data.numberOrder = String(nextSeq);
    }

    const baseMetaRaw = existing?.meta && typeof existing.meta === 'object' ? existing.meta : {};
    const baseMeta = filterMeta(baseMetaRaw) || {};
    const nextMeta = buildMeta(payload);
    if (nextMeta !== undefined) {
      data.meta = nextMeta === null ? null : { ...baseMeta, ...nextMeta };
    }

    const updated = await prisma.order.update({ where: { id }, data, include: baseInclude });

    if (tagIds !== undefined) {
      await upsertTags(id, tagIds);
    }

    if (stageChanged) {
      await logChange({
        orderId: id,
        employeeId: actorId,
        action: 'stage_changed',
        field: 'stage',
        oldValue: { stage: existing.stage, stageIndex: existing.stageIndex },
        newValue: { stage: updated.stage, stageIndex: updated.stageIndex },
      });
    } else {
      await logChange({
        orderId: id,
        employeeId: actorId,
        action: 'updated',
        field: Object.keys(data)[0] || 'general',
        oldValue: existing,
        newValue: updated,
      });
    }

    return this.byId(id);
  },

  async changeStage(id, { stage, stageIndex }, actorId) {
    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      const e = new Error('Order not found');
      e.status = 404;
      throw e;
    }

    const data = { stage, stageIndex: stageIndex ?? 0 };
    if (stage === 'IN_WORK' && existing.orderSequence == null) {
      const nextSeq = await getNextOrderSequence();
      data.orderSequence = nextSeq;
      data.numberOrder = String(nextSeq);
    }

    const updated = await prisma.order.update({
      where: { id },
      data,
      include: baseInclude,
    });

    await logChange({
      orderId: id,
      employeeId: actorId,
      action: 'stage_changed',
      field: 'stage',
      oldValue: { stage: existing.stage, stageIndex: existing.stageIndex },
      newValue: { stage: updated.stage, stageIndex: updated.stageIndex },
    });

    return updated;
  },

  async delete(id, actorId) {
    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      const e = new Error('Order not found');
      e.status = 404;
      throw e;
    }

    const deleted = await prisma.order.update({
      where: { id },
      data: { stage: 'DELETED', stageIndex: 0 },
      include: baseInclude,
    });

    await logChange({ orderId: id, employeeId: actorId, action: 'deleted', oldValue: existing, newValue: deleted });
    return deleted;
  },
};

module.exports = OrdersService;
