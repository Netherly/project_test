const { OperationType } = require('@prisma/client');
const prisma = require('../../prisma/client');

const DEFAULT_STATUS = 'Активен';
const DEFAULT_PERIOD = 'Ежемесячно';
const DEFAULT_TIME = '10:00';

const uiToEnumOperation = (v) => {
  if (!v) return undefined;
  if (Object.values(OperationType).includes(v)) return v;
  const s = String(v).trim().toLowerCase();
  if (s === 'зачисление' || s === 'deposit' || s === 'in') return OperationType.DEPOSIT;
  if (s === 'списание' || s === 'withdraw' || s === 'out') return OperationType.WITHDRAW;
  return undefined;
};

const enumToUiOperation = (op) => {
  if (op === OperationType.DEPOSIT) return 'Зачисление';
  if (op === OperationType.WITHDRAW) return 'Списание';
  return op || null;
};

const safeNum = (v) => {
  if (v === undefined || v === null || v === '') return 0;
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
};

function parseDateMaybe(x) {
  if (!x) return undefined;
  if (x instanceof Date) return x;
  if (typeof x === 'string') {
    const str = x.includes(' ') ? x.replace(' ', 'T') : x;
    const d = new Date(str);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
}

const resolveSchedule = (payload = {}, existing = null) => {
  const period = payload.period ?? existing?.period ?? DEFAULT_PERIOD;
  let cycleDay = payload.cycleDay ?? existing?.cycleDay ?? null;
  const time = payload.time ?? existing?.time ?? DEFAULT_TIME;

  if (!cycleDay) {
    if (period === 'Еженедельно') cycleDay = '1';
    if (period === 'Ежемесячно') cycleDay = '1';
    if (period === 'Ежегодно') cycleDay = '01.01';
  }

  return { period, cycleDay, time };
};

const calculateNextPaymentDate = (paymentData, referenceDateInput) => {
  const { period, time, cycleDay } = paymentData || {};
  if (!period || !time) return null;

  const referenceDate = new Date(referenceDateInput || new Date());
  const [hours, minutes] = String(time).split(':');

  const nextDate = new Date(referenceDate);
  nextDate.setHours(Number(hours) || 0, Number(minutes) || 0, 0, 0);

  const refDateWithTime = new Date(referenceDate);
  refDateWithTime.setHours(Number(hours) || 0, Number(minutes) || 0, 0, 0);

  switch (period) {
    case 'Ежедневно':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'Еженедельно': {
      const targetDay = parseInt(cycleDay, 10) % 7;
      const currentDay = nextDate.getDay();
      let daysToAdd = (targetDay - currentDay + 7) % 7;
      if (daysToAdd === 0) daysToAdd = 7;
      nextDate.setDate(nextDate.getDate() + daysToAdd);
      break;
    }
    case 'Ежемесячно': {
      const targetDate = parseInt(cycleDay, 10);
      if (Number.isFinite(targetDate) && targetDate > 0) {
        nextDate.setDate(targetDate);
      }
      if (nextDate <= refDateWithTime) {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }
      break;
    }
    case 'Ежегодно': {
      const [day, month] = String(cycleDay || '').split('.').map((n) => parseInt(n, 10));
      if (Number.isFinite(month)) nextDate.setMonth(month - 1);
      if (Number.isFinite(day)) nextDate.setDate(day);
      if (nextDate <= refDateWithTime) {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      }
      break;
    }
    default:
      nextDate.setDate(nextDate.getDate() + 1);
  }

  return nextDate;
};

const includePayment = {
  account: {
    select: {
      id: true,
      accountName: true,
      currency: { select: { code: true } },
    },
  },
  categoryDict: { select: { id: true, name: true } },
  subcategoryDict: { select: { id: true, name: true } },
  order: { select: { id: true, numberOrder: true } },
};

const toViewModel = (row) => {
  if (!row) return row;
  const accountName = row.account?.accountName || row.accountName || row.accountId || null;
  const accountCurrency = row.account?.currency?.code || row.accountCurrency || null;
  const category = row.category || row.categoryDict?.name || null;
  const subcategory = row.subcategory || row.subcategoryDict?.name || null;

  return {
    ...row,
    category,
    subcategory,
    operation: enumToUiOperation(row.operation),
    accountName,
    accountCurrency,
  };
};

async function buildRegularPaymentData(payload = {}, db, options = {}) {
  const { existing = null, forceSchedule = false } = options;
  const data = {};

  const accountId = payload.accountId ?? payload.account;
  if (accountId !== undefined) data.accountId = accountId;

  if ('accountCurrency' in payload) data.accountCurrency = payload.accountCurrency ?? null;
  if (data.accountId && !data.accountCurrency) {
    const account = await db.asset.findUnique({
      where: { id: data.accountId },
      select: { currency: { select: { code: true } } },
    });
    if (account?.currency?.code) data.accountCurrency = account.currency.code;
  }

  if ('status' in payload) {
    data.status = payload.status || DEFAULT_STATUS;
  } else if (forceSchedule && !existing?.status) {
    data.status = DEFAULT_STATUS;
  }

  const schedule = resolveSchedule(payload, existing);
  if (forceSchedule || 'period' in payload) data.period = schedule.period;
  if (forceSchedule || 'cycleDay' in payload) data.cycleDay = schedule.cycleDay ?? null;
  if (forceSchedule || 'time' in payload) data.time = schedule.time;

  if ('category' in payload) data.category = payload.category ?? null;
  if ('subcategory' in payload) data.subcategory = payload.subcategory ?? null;
  if ('description' in payload) data.description = payload.description ?? null;
  if ('counterparty' in payload) data.counterparty = payload.counterparty ?? null;
  if ('counterpartyRequisites' in payload) data.counterpartyRequisites = payload.counterpartyRequisites ?? null;

  if ('operation' in payload) {
    const op = uiToEnumOperation(payload.operation);
    if (op) data.operation = op;
  } else if (forceSchedule && !existing?.operation) {
    data.operation = OperationType.WITHDRAW;
  }

  if ('amount' in payload) data.amount = safeNum(payload.amount);
  if ('commission' in payload) data.commission = safeNum(payload.commission);

  const orderId = payload.orderId ?? payload.order_id;
  if (orderId !== undefined) {
    const orderExists = await db.order.findUnique({ where: { id: orderId } });
    data.orderId = orderExists ? orderId : null;
  }
  if ('orderNumber' in payload) data.orderNumber = payload.orderNumber ? String(payload.orderNumber) : null;
  if ('orderCurrency' in payload) data.orderCurrency = payload.orderCurrency ?? null;

  if ('category' in payload) {
    if (payload.category) {
      const catObj = await db.financeArticleDict.findFirst({ where: { name: payload.category } });
      data.categoryId = catObj ? catObj.id : null;
    } else {
      data.categoryId = null;
    }
  }
  if ('subcategory' in payload) {
    if (payload.subcategory) {
      const subObj = await db.financeSubarticleDict.findFirst({ where: { name: payload.subcategory } });
      data.subcategoryId = subObj ? subObj.id : null;
    } else {
      data.subcategoryId = null;
    }
  }

  const scheduleTouched = forceSchedule || ['period', 'cycleDay', 'time'].some((k) => k in payload);
  const hasExplicitNext = Object.prototype.hasOwnProperty.call(payload, 'nextPaymentDate');
  const explicitNextIsNull = hasExplicitNext && payload.nextPaymentDate === null;
  if (hasExplicitNext && !explicitNextIsNull) {
    const parsed = parseDateMaybe(payload.nextPaymentDate);
    if (parsed) data.nextPaymentDate = parsed;
  }
  if ((!hasExplicitNext || explicitNextIsNull) && (scheduleTouched || !existing?.nextPaymentDate)) {
    const ref = scheduleTouched ? new Date() : existing?.nextPaymentDate || new Date();
    const nextDate = calculateNextPaymentDate(schedule, ref);
    if (nextDate) data.nextPaymentDate = nextDate;
  }

  return data;
}

class RegularPaymentsService {
  async list() {
    const rows = await prisma.regularPayment.findMany({
      include: includePayment,
      orderBy: { nextPaymentDate: 'asc' },
    });
    return rows.map(toViewModel);
  }

  async getById(id) {
    const row = await prisma.regularPayment.findUnique({
      where: { id },
      include: includePayment,
    });
    return toViewModel(row);
  }

  async create(payload) {
    return prisma.$transaction(async (tx) => {
      const data = await buildRegularPaymentData(payload, tx, { forceSchedule: true });

      if (!data.accountId) throw new Error('accountId is required');
      if (!Object.prototype.hasOwnProperty.call(payload, 'amount')) throw new Error('amount is required');

      const created = await tx.regularPayment.create({ data, include: includePayment });
      return toViewModel(created);
    });
  }

  async update(id, payload) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.regularPayment.findUnique({ where: { id } });
      if (!existing) {
        const err = new Error('Regular payment not found');
        err.status = 404;
        throw err;
      }

      const data = await buildRegularPaymentData(payload, tx, { existing });
      const updated = await tx.regularPayment.update({ where: { id }, data, include: includePayment });
      return toViewModel(updated);
    });
  }

  async remove(id) {
    await prisma.regularPayment.delete({ where: { id } });
    return { ok: true };
  }

  async duplicate(id) {
    return prisma.$transaction(async (tx) => {
      const original = await tx.regularPayment.findUnique({ where: { id } });
      if (!original) {
        const err = new Error('Regular payment not found');
        err.status = 404;
        throw err;
      }

      const {
        id: _omit,
        createdAt,
        updatedAt,
        nextPaymentDate,
        lastPaymentDate,
        ...rest
      } = original;

      const schedule = resolveSchedule(rest, null);
      const nextDate = calculateNextPaymentDate(schedule, new Date());

      const created = await tx.regularPayment.create({
        data: {
          ...rest,
          status: DEFAULT_STATUS,
          nextPaymentDate: nextDate || null,
          lastPaymentDate: null,
        },
        include: includePayment,
      });

      return toViewModel(created);
    });
  }
}

module.exports = new RegularPaymentsService();
