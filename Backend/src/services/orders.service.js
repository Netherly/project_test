const prisma = require('../../prisma/client');
const { logActivity } = require('./activity-log.service');
const { findByEntityRef, resolveEntityId } = require('../utils/entity-ref');

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

function normalizeActorMeta(actor = null) {
  if (!actor) {
    return {
      actorId: null,
      actorName: null,
      source: 'manual',
      ip: undefined,
      userAgent: undefined,
    };
  }

  if (typeof actor === 'string') {
    return {
      actorId: actor || null,
      actorName: null,
      source: 'manual',
      ip: undefined,
      userAgent: undefined,
    };
  }

  return {
    actorId: actor?.actorId || actor?.id || null,
    actorName: actor?.actorName || null,
    source: actor?.source || 'manual',
    ip: actor?.ip,
    userAgent: actor?.userAgent,
  };
}

async function safeClientLog(payload) {
  try {
    return await logActivity(payload);
  } catch (error) {
    console.warn('[log] order client activity failed:', error?.message || error);
    return null;
  }
}

function stringifyMessageParts(parts = []) {
  return parts
    .map((part) => (part && typeof part.text === 'string' ? part.text : ''))
    .join('');
}

function buildOrderLinkLabel(order) {
  const number = String(order?.numberOrder || '').trim();
  if (number) return `заказ №${number}`;

  const name = String(order?.name || order?.title || '').trim();
  if (name) return `заказ "${name}"`;

  return 'заказ';
}

function buildOrderCreatedMessageParts(order) {
  const label = buildOrderLinkLabel(order);
  return [
    { type: 'text', text: 'Создан ' },
    {
      type: 'link',
      text: label,
      targetType: 'order',
      id: order?.id || null,
      urlId: order?.urlId || null,
    },
  ];
}

function buildOrderLinkPart(order) {
  return {
    type: 'link',
    text: buildOrderLinkLabel(order),
    targetType: 'order',
    id: order?.id || null,
    urlId: order?.urlId || null,
  };
}

function buildOrderMeta(order, messageParts) {
  const meta = {};
  if (order?.id) {
    meta.target = {
      type: 'order',
      id: order.id,
      urlId: order.urlId || null,
      label: buildOrderLinkLabel(order),
    };
  }
  if (Array.isArray(messageParts) && messageParts.length) {
    meta.messageParts = messageParts;
  }
  return meta;
}

function buildOrderLinkedMessageParts(order) {
  return [
    { type: 'text', text: 'К клиенту привязан ' },
    buildOrderLinkPart(order),
  ];
}

function buildOrderUnlinkedMessageParts(order) {
  return [
    { type: 'text', text: 'От клиента отвязан ' },
    buildOrderLinkPart(order),
  ];
}

function formatOrderStatusValue(value) {
  const text = String(value || '').trim();
  return text || '—';
}

function buildOrderStatusUpdatedMessageParts({ order, stageChange, orderStatusChange }) {
  const details = [];

  if (stageChange) {
    details.push(
      `этап "${formatOrderStatusValue(stageChange.from)}" -> "${formatOrderStatusValue(stageChange.to)}"`
    );
  }

  if (orderStatusChange) {
    details.push(
      `статус "${formatOrderStatusValue(orderStatusChange.from)}" -> "${formatOrderStatusValue(orderStatusChange.to)}"`
    );
  }

  return [
    { type: 'text', text: 'У ' },
    buildOrderLinkPart(order),
    {
      type: 'text',
      text:
        details.length > 1
          ? ` обновлены параметры заказа: ${details.join(', ')}`
          : ` обновлён ${details[0] || 'статус заказа'}`,
    },
  ];
}

async function emitClientOrderEvent({ clientId, action, order, messageParts, actorMeta }) {
  if (!clientId) return;

  await safeClientLog({
    entityType: 'client',
    entityId: clientId,
    action,
    message: stringifyMessageParts(messageParts),
    meta: buildOrderMeta(order, messageParts),
    ...actorMeta,
  });
}

async function emitClientOrderCreatedLog({ order, actorMeta }) {
  const clientId = order?.clientId || order?.client?.id;
  if (!clientId) return;

  const messageParts = buildOrderCreatedMessageParts(order);
  await emitClientOrderEvent({
    clientId,
    action: 'order_created',
    order,
    messageParts,
    actorMeta,
  });
}

async function emitClientOrderUpdateLogs({ before, after, actorMeta }) {
  const beforeClientId = before?.clientId || null;
  const afterClientId = after?.clientId || after?.client?.id || null;
  const clientChanged = beforeClientId !== afterClientId;

  if (clientChanged && beforeClientId) {
    await emitClientOrderEvent({
      clientId: beforeClientId,
      action: 'order_unlinked',
      order: before,
      messageParts: buildOrderUnlinkedMessageParts(before),
      actorMeta,
    });
  }

  if (clientChanged && afterClientId) {
    await emitClientOrderEvent({
      clientId: afterClientId,
      action: 'order_linked',
      order: after,
      messageParts: buildOrderLinkedMessageParts(after),
      actorMeta,
    });
  }

  const stageChanged = before?.stage !== after?.stage;
  const orderStatusChanged = before?.orderStatus !== after?.orderStatus;

  if (afterClientId && (stageChanged || orderStatusChanged)) {
    await emitClientOrderEvent({
      clientId: afterClientId,
      action: 'order_status_updated',
      order: after,
      messageParts: buildOrderStatusUpdatedMessageParts({
        order: after,
        stageChange: stageChanged ? { from: before?.stage, to: after?.stage } : null,
        orderStatusChange: orderStatusChanged
          ? { from: before?.orderStatus, to: after?.orderStatus }
          : null,
      }),
      actorMeta,
    });
  }
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
    const order = await findByEntityRef(prisma.order, id, { include: baseInclude });
    if (!order) {
      const e = new Error('Order not found');
      e.status = 404;
      throw e;
    }
    return order;
  },

  async create(payload, actor) {
    const actorMeta = normalizeActorMeta(actor);
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
    await logChange({
      orderId: created.id,
      employeeId: actorMeta.actorId,
      action: 'created',
      newValue: created,
    });
    await emitClientOrderCreatedLog({ order: created, actorMeta });
    return this.byId(created.id);
  },

  async update(id, payload, actor) {
    const actorMeta = normalizeActorMeta(actor);
    const actualId = await resolveEntityId(prisma.order, id, { notFoundMessage: 'Order not found' });
    const existing = await prisma.order.findUnique({ where: { id: actualId }, include: { tags: true } });
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

    const updated = await prisma.order.update({ where: { id: actualId }, data, include: baseInclude });

    if (tagIds !== undefined) {
      await upsertTags(actualId, tagIds);
    }

    if (stageChanged) {
      await logChange({
        orderId: actualId,
        employeeId: actorMeta.actorId,
        action: 'stage_changed',
        field: 'stage',
        oldValue: { stage: existing.stage, stageIndex: existing.stageIndex },
        newValue: { stage: updated.stage, stageIndex: updated.stageIndex },
      });
    } else {
      await logChange({
        orderId: actualId,
        employeeId: actorMeta.actorId,
        action: 'updated',
        field: Object.keys(data)[0] || 'general',
        oldValue: existing,
        newValue: updated,
      });
    }

    await emitClientOrderUpdateLogs({
      before: existing,
      after: updated,
      actorMeta,
    });

    return this.byId(actualId);
  },

  async changeStage(id, { stage, stageIndex }, actor) {
    const actorMeta = normalizeActorMeta(actor);
    const actualId = await resolveEntityId(prisma.order, id, { notFoundMessage: 'Order not found' });
    const existing = await prisma.order.findUnique({ where: { id: actualId } });
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
      where: { id: actualId },
      data,
      include: baseInclude,
    });

    await logChange({
      orderId: actualId,
      employeeId: actorMeta.actorId,
      action: 'stage_changed',
      field: 'stage',
      oldValue: { stage: existing.stage, stageIndex: existing.stageIndex },
      newValue: { stage: updated.stage, stageIndex: updated.stageIndex },
    });

    await emitClientOrderUpdateLogs({
      before: existing,
      after: updated,
      actorMeta,
    });

    return updated;
  },

  async delete(id, actor) {
    const actorMeta = normalizeActorMeta(actor);
    const actualId = await resolveEntityId(prisma.order, id, { notFoundMessage: 'Order not found' });
    const existing = await prisma.order.findUnique({ where: { id: actualId } });
    if (!existing) {
      const e = new Error('Order not found');
      e.status = 404;
      throw e;
    }

    const deleted = await prisma.order.update({
      where: { id: actualId },
      data: { stage: 'DELETED', stageIndex: 0 },
      include: baseInclude,
    });

    await logChange({
      orderId: actualId,
      employeeId: actorMeta.actorId,
      action: 'deleted',
      oldValue: existing,
      newValue: deleted,
    });

    await emitClientOrderUpdateLogs({
      before: existing,
      after: deleted,
      actorMeta,
    });
    return deleted;
  },
};

module.exports = OrdersService;
