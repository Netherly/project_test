const cron = require('node-cron');
const { OperationType } = require('@prisma/client');
const prisma = require('../../prisma/client');

const schedule = process.env.REGULAR_PAYMENTS_CRON || '* * * * *';
const timezone = process.env.REGULAR_PAYMENTS_TZ || 'Europe/Kyiv';

const uiToEnumOperation = (v) => {
  if (!v) return undefined;
  if (Object.values(OperationType).includes(v)) return v;
  const s = String(v).trim().toLowerCase();
  if (s === 'зачисление' || s === 'deposit' || s === 'in') return OperationType.DEPOSIT;
  if (s === 'списание' || s === 'withdraw' || s === 'out') return OperationType.WITHDRAW;
  return undefined;
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

const normalizeOperation = (value) => {
  if (!value) return undefined;
  if (Object.values(OperationType).includes(value)) return value;
  return uiToEnumOperation(value);
};

const buildAssetEffect = (trx) => {
  const op = normalizeOperation(trx?.operation);
  const amount = safeNum(trx?.amount);
  const commission = safeNum(trx?.commission);
  if (!op || (!amount && !commission)) {
    return { balanceDelta: 0, incomingDelta: 0, outgoingDelta: 0 };
  }
  if (op === OperationType.DEPOSIT) {
    const net = amount - commission;
    return { balanceDelta: net, incomingDelta: net, outgoingDelta: 0 };
  }
  if (op === OperationType.WITHDRAW) {
    const net = amount + commission;
    return { balanceDelta: -net, incomingDelta: 0, outgoingDelta: net };
  }
  return { balanceDelta: 0, incomingDelta: 0, outgoingDelta: 0 };
};

const isZeroEffect = (effect) =>
  !effect ||
  (!effect.balanceDelta && !effect.incomingDelta && !effect.outgoingDelta);

const applyAssetEffect = async (db, accountId, effect) => {
  if (!accountId || isZeroEffect(effect)) return;
  const data = {};
  if (effect.balanceDelta) {
    data.balance = { increment: effect.balanceDelta };
    data.turnoverEndBalance = { increment: effect.balanceDelta };
  }
  if (effect.incomingDelta) data.turnoverIncoming = { increment: effect.incomingDelta };
  if (effect.outgoingDelta) data.turnoverOutgoing = { increment: effect.outgoingDelta };
  await db.asset.update({ where: { id: accountId }, data });
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

async function prepareTransactionData(input, db) {
  const {
    date,
    amount,
    description,
    category,
    subcategory,
    accountId,
    operation,
    commission,
    counterparty,
    counterpartyRequisites,
    orderId,
    accountCurrency,
    orderNumber,
    orderCurrency,
  } = input || {};

  const data = {};
  const parsedDate = parseDateMaybe(date);
  if (parsedDate) data.date = parsedDate;
  if (amount !== undefined) data.amount = safeNum(amount);
  if (description !== undefined) data.description = description;

  const opEnum = uiToEnumOperation(operation);
  if (opEnum) data.operation = opEnum;
  if (commission !== undefined) data.commission = safeNum(commission);

  if (category !== undefined) data.category = category;
  if (subcategory !== undefined) data.subcategory = subcategory;
  if (counterparty !== undefined) data.counterparty = counterparty;
  if (counterpartyRequisites !== undefined) data.counterpartyRequisites = counterpartyRequisites;
  if (accountCurrency !== undefined) data.accountCurrency = accountCurrency;
  if (orderNumber !== undefined) data.orderNumber = String(orderNumber);
  if (orderCurrency !== undefined) data.orderCurrency = orderCurrency;

  if (accountId) data.accountId = accountId;

  if (data.accountId && !data.accountCurrency) {
    const account = await db.asset.findUnique({
      where: { id: data.accountId },
      select: { currency: { select: { code: true } } },
    });
    if (account?.currency?.code) data.accountCurrency = account.currency.code;
  }

  if (category) {
    const catObj = await db.financeArticleDict.findFirst({ where: { name: category } });
    data.categoryId = catObj ? catObj.id : null;
  }

  if (subcategory) {
    const subCatObj = await db.financeSubarticleDict.findFirst({ where: { name: subcategory } });
    data.subcategoryId = subCatObj ? subCatObj.id : null;
  }

  if (orderId && typeof orderId === 'string' && orderId.trim() !== '') {
    const orderExists = await db.order.findUnique({ where: { id: orderId } });
    data.orderId = orderExists ? orderId : null;
  } else {
    data.orderId = null;
  }

  return data;
}

async function processDuePayments() {
  const now = new Date();
  const due = await prisma.regularPayment.findMany({
    where: {
      status: 'Активен',
      nextPaymentDate: { lte: now },
    },
    orderBy: { nextPaymentDate: 'asc' },
  });

  if (!due.length) return;

  for (const payment of due) {
    await prisma.$transaction(async (tx) => {
      const fresh = await tx.regularPayment.findUnique({ where: { id: payment.id } });
      if (!fresh || fresh.status !== 'Активен' || !fresh.nextPaymentDate) return;
      if (fresh.nextPaymentDate > now) return;

      if (!fresh.accountId) {
        console.warn('[regular-payments] skip: missing accountId', fresh.id);
        return;
      }

      const trxPayload = {
        date: fresh.nextPaymentDate || now,
        category: fresh.category,
        subcategory: fresh.subcategory,
        description: `Регулярный платеж: ${fresh.description || fresh.category || ''}`.trim(),
        accountId: fresh.accountId,
        accountCurrency: fresh.accountCurrency,
        operation: fresh.operation,
        amount: fresh.amount,
        commission: fresh.commission,
        counterparty: fresh.counterparty,
        counterpartyRequisites: fresh.counterpartyRequisites,
        orderId: fresh.orderId,
        orderNumber: fresh.orderNumber,
        orderCurrency: fresh.orderCurrency,
      };

      const data = await prepareTransactionData(trxPayload, tx);
      if (!data.accountId) throw new Error('accountId is required');

      const created = await tx.transaction.create({ data });
      const effect = buildAssetEffect(created);
      await applyAssetEffect(tx, created.accountId, effect);

      const nextDate = calculateNextPaymentDate(fresh, fresh.nextPaymentDate || now);
      await tx.regularPayment.update({
        where: { id: fresh.id },
        data: {
          lastPaymentDate: fresh.nextPaymentDate || now,
          nextPaymentDate: nextDate,
        },
      });
    });
  }
}

const task = cron.schedule(
  schedule,
  async () => {
    try {
      await processDuePayments();
    } catch (e) {
      console.error('[regular-payments] failed:', e?.message || e);
    }
  },
  { timezone, scheduled: false }
);

function initRegularPaymentsJob() {
  task.start();
  console.log(`[regular-payments] cron scheduled: "${schedule}" (${timezone})`);
}

module.exports = { initRegularPaymentsJob };
