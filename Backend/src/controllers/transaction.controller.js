const { OperationType } = require('@prisma/client');
const prisma = require('../../prisma/client');
const { logActivity } = require('../services/activity-log.service');

/** ===== HELPERS ===== */

const uiToEnumOperation = (v) => {
  if (!v) return undefined;
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

const safeNum = (v) => {
  if (v === undefined || v === null || v === '') return 0;
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
};

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

const invertEffect = (effect) => ({
  balanceDelta: -safeNum(effect?.balanceDelta),
  incomingDelta: -safeNum(effect?.incomingDelta),
  outgoingDelta: -safeNum(effect?.outgoingDelta),
});

const diffEffects = (next, prev) => ({
  balanceDelta: safeNum(next?.balanceDelta) - safeNum(prev?.balanceDelta),
  incomingDelta: safeNum(next?.incomingDelta) - safeNum(prev?.incomingDelta),
  outgoingDelta: safeNum(next?.outgoingDelta) - safeNum(prev?.outgoingDelta),
});

const isZeroEffect = (effect) =>
  !effect || (!effect.balanceDelta && !effect.incomingDelta && !effect.outgoingDelta);

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

const trxInclude = {
  account: {
    select: {
      id: true,
      accountName: true,
      employeeId: true,
      employee: { select: { id: true, full_name: true } },
      currency: { select: { code: true } },
    },
  },
  categoryDict: { select: { id: true, name: true } },
  subcategoryDict: { select: { id: true, name: true } },
  employee: { select: { id: true, full_name: true } },
};

function viewModel(trx) {
  if (!trx) return trx;

  const accountName = trx.account?.accountName || trx.accountName || null;
  const accountCurrency = trx.account?.currency?.code || trx.accountCurrency || null;
  const category = trx.category ?? trx.categoryDict?.name ?? null;
  const subcategory = trx.subcategory ?? trx.subcategoryDict?.name ?? null;

  return {
    ...trx,
    category,
    subcategory,
    operation: enumToUiOperation(trx.operation),
    accountName,
    accountCurrency,
  };
}

const buildActorMeta = (req) => ({
  actorId: req.user?.employeeId || null,
  source: 'manual',
  ip: req.ip,
  userAgent: req.headers['user-agent'],
});

const safeActivityLog = async (payload) => {
  try {
    return await logActivity(payload);
  } catch (error) {
    console.warn('[log] transaction employee activity failed:', error?.message || error);
    return null;
  }
};

const getTargetLabel = (target) => target?.employeeName || target?.employeeId || 'сотрудник';

const formatTransactionAmount = (trx) => {
  const amount = Number(trx?.amount);
  if (!Number.isFinite(amount)) return '';
  const currency = trx?.account?.currency?.code || trx?.accountCurrency || '';
  return `${amount}${currency ? ` ${currency}` : ''}`;
};

const buildTransactionMessageParts = ({ trx, target, verb }) => {
  const verbLabel = verb === 'created' ? 'создана' : verb === 'deleted' ? 'удалена' : 'обновлена';
  const employeeLabel = getTargetLabel(target);
  const amountLabel = formatTransactionAmount(trx);
  const assetLabel = target?.accountName || trx?.account?.accountName || null;

  const parts = [
    { type: 'text', text: `Для сотрудника "${employeeLabel}" ${verbLabel} ` },
  ];

  if (trx?.id) {
    parts.push({
      type: 'link',
      text: 'транзакция',
      targetType: 'transaction',
      id: trx.id,
    });
  } else {
    parts.push({ type: 'text', text: 'транзакция' });
  }

  if (amountLabel) {
    parts.push({ type: 'text', text: ` на сумму ${amountLabel}` });
  }

  if (assetLabel && trx?.accountId) {
    parts.push({ type: 'text', text: ' по активу ' });
    parts.push({
      type: 'link',
      text: `"${assetLabel}"`,
      targetType: 'asset',
      id: trx.accountId,
    });
  }

  return parts;
};

const stringifyMessageParts = (parts = []) =>
  parts
    .map((part) => (part && typeof part.text === 'string' ? part.text : ''))
    .join('');

const buildTransactionMeta = ({ trx, target, verb }) => {
  const messageParts = buildTransactionMessageParts({ trx, target, verb });
  const meta = {};

  if (trx?.id) {
    meta.target = {
      type: 'transaction',
      id: trx.id,
      label: 'транзакция',
    };
  }

  if (messageParts.length) {
    meta.messageParts = messageParts;
  }

  return meta;
};

function collectEmployeeTargets(trx) {
  const targets = new Map();

  if (trx?.employeeId) {
    targets.set(trx.employeeId, {
      employeeId: trx.employeeId,
      employeeName: trx.employee?.full_name || null,
      kind: 'transaction',
      accountName: trx.account?.accountName || null,
    });
  }

  if (trx?.account?.employeeId) {
    targets.set(trx.account.employeeId, {
      employeeId: trx.account.employeeId,
      employeeName: trx.account.employee?.full_name || targets.get(trx.account.employeeId)?.employeeName || null,
      kind: 'asset_transaction',
      accountName: trx.account?.accountName || null,
    });
  }

  return targets;
}

function buildTransactionAction(kind, verb) {
  const suffix = verb === 'created' ? 'created' : verb === 'deleted' ? 'deleted' : 'updated';
  return kind === 'asset_transaction' ? `asset_transaction_${suffix}` : `transaction_${suffix}`;
}

function buildTransactionMessage({ trx, target, verb }) {
  return stringifyMessageParts(buildTransactionMessageParts({ trx, target, verb }));
}

async function emitEmployeeTransactionLogs({ before, after, verb, actorMeta }) {
  const beforeTargets = before ? collectEmployeeTargets(before) : new Map();
  const afterTargets = after ? collectEmployeeTargets(after) : new Map();
  const targetIds = new Set();

  if (verb === 'deleted') {
    beforeTargets.forEach((_value, key) => targetIds.add(key));
  } else if (verb === 'created') {
    afterTargets.forEach((_value, key) => targetIds.add(key));
  } else {
    beforeTargets.forEach((_value, key) => targetIds.add(key));
    afterTargets.forEach((_value, key) => targetIds.add(key));
  }

  for (const employeeId of targetIds) {
    if (!employeeId) continue;

    let currentVerb = verb;
    let target = afterTargets.get(employeeId) || beforeTargets.get(employeeId);
    let trx = after || before;

    if (verb === 'updated') {
      const hadBefore = beforeTargets.has(employeeId);
      const hasAfter = afterTargets.has(employeeId);
      if (hadBefore && hasAfter) {
        currentVerb = 'updated';
        target = afterTargets.get(employeeId);
        trx = after;
      } else if (hadBefore) {
        currentVerb = 'deleted';
        target = beforeTargets.get(employeeId);
        trx = before;
      } else {
        currentVerb = 'created';
        target = afterTargets.get(employeeId);
        trx = after;
      }
    }

    const meta = buildTransactionMeta({ trx, target, verb: currentVerb });

    await safeActivityLog({
      entityType: 'employee',
      entityId: employeeId,
      action: buildTransactionAction(target?.kind, currentVerb),
      message: buildTransactionMessage({ trx, target, verb: currentVerb }),
      meta,
      ...actorMeta,
    });
  }
}

/**
 * ПОДГОТОВКА ДАННЫХ
 * Ищем ID справочников и возвращаем плоский объект для Prisma
 */
async function prepareTransactionData(input, db = prisma) {
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
    sumUAH,
    sumUSD,
    sumRUB,
    sumByRatesOrderAmountCurrency,
    sumByRatesUAH,
    sumByRatesUSD,
    sumByRatesRUB,
    sentToCounterparty,
    sendLion,
    accountCurrency,
    orderNumber,
    orderCurrency,
    balanceBefore,
    balanceAfter,
    employeeId,
    clientId,
    companyId,
  } = input;

  const data = {};

  const parsedDate = parseDateMaybe(date);
  if (parsedDate) data.date = parsedDate;

  if (amount !== undefined) data.amount = safeNum(amount);
  if (description !== undefined) data.description = description;

  // ✅ поддержка и enum (DEPOSIT/WITHDRAW), и UI-строк (Зачисление/Списание)
  const opEnum = normalizeOperation(operation);
  if (opEnum) data.operation = opEnum;

  if (commission !== undefined) data.commission = safeNum(commission);

  if (category !== undefined) data.category = category;
  if (subcategory !== undefined) data.subcategory = subcategory;
  if (counterparty !== undefined) data.counterparty = counterparty;
  if (counterpartyRequisites !== undefined) data.counterpartyRequisites = counterpartyRequisites;

  const hasAccountCurrency = accountCurrency !== undefined;
  if (hasAccountCurrency) data.accountCurrency = accountCurrency;

  if (orderNumber !== undefined) data.orderNumber = String(orderNumber);
  if (orderCurrency !== undefined) data.orderCurrency = orderCurrency;

  data.sumUAH = safeNum(sumUAH);
  data.sumUSD = safeNum(sumUSD);
  data.sumRUB = safeNum(sumRUB);
  data.sumByRatesOrderAmountCurrency = safeNum(sumByRatesOrderAmountCurrency);
  data.sumByRatesUAH = safeNum(sumByRatesUAH);
  data.sumByRatesUSD = safeNum(sumByRatesUSD);
  data.sumByRatesRUB = safeNum(sumByRatesRUB);

  if (balanceBefore !== undefined) data.balanceBefore = safeNum(balanceBefore);
  if (balanceAfter !== undefined) data.balanceAfter = safeNum(balanceAfter);

  if (sentToCounterparty !== undefined) data.sentToCounterparty = Boolean(sentToCounterparty);
  if (sendLion !== undefined) data.sendLion = Boolean(sendLion);

  // --- СВЯЗИ (SCALARS) --- ✅ (версия из main)
  if (employeeId !== undefined) data.employeeId = employeeId || null;
  if (clientId !== undefined) data.clientId = clientId || null;
  if (companyId !== undefined) data.companyId = companyId || null;

  // A. СЧЕТ (Обязательно) ✅ (вторая версия логики)
  if (accountId) {
    data.accountId = accountId;
  }

  // Автоподстановка валюты счета, если не пришла с фронта
  if (data.accountId && !hasAccountCurrency) {
    const account = await db.asset.findUnique({
      where: { id: data.accountId },
      select: { currency: { select: { code: true } } },
    });
    if (account?.currency?.code) data.accountCurrency = account.currency.code;
  }

  // Привязка справочников по названию (если используете dict)
  if (category) {
    const catObj = await db.financeArticleDict.findFirst({ where: { name: category } });
    data.categoryId = catObj ? catObj.id : null;
  }

  if (subcategory) {
    const subCatObj = await db.financeSubarticleDict.findFirst({ where: { name: subcategory } });
    data.subcategoryId = subCatObj ? subCatObj.id : null;
  }

  // Связь с заказом (проверяем существование)
  if (orderId && typeof orderId === 'string' && orderId.trim() !== '') {
    const orderExists = await db.order.findUnique({ where: { id: orderId } });
    if (orderExists) {
      data.orderId = orderId;
    } else {
      console.warn(`Заказ ${orderId} не найден, связь игнорируется.`);
      data.orderId = null;
    }
  } else {
    data.orderId = null;
  }

  return data;
}

/** GET /api/transactions */
exports.list = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 50,
      search = '',
      accountId,
      employeeId,
      counterparty,
    } = req.query;

    const take = Math.min(Number(pageSize) || 50, 200);
    const skip = Math.max(0, (Number(page) - 1) * take);

    const where = {};
    const and = [];

    if (search) {
      and.push({
        OR: [
          { category: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { counterparty: { contains: search, mode: 'insensitive' } },
          { orderNumber: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (accountId) and.push({ accountId });

    if (employeeId || counterparty) {
      const or = [];
      if (employeeId) or.push({ employeeId });
      if (counterparty) {
        or.push({ counterparty: { equals: counterparty, mode: 'insensitive' } });
      }
      if (or.length === 1) and.push(or[0]);
      if (or.length > 1) and.push({ OR: or });
    }

    if (and.length) where.AND = and;

    const [items, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: trxInclude,
        orderBy: { date: 'desc' },
        skip,
        take,
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json({
      page: Number(page),
      pageSize: take,
      total,
      items: items.map(viewModel),
    });
  } catch (err) {
    next(err);
  }
};

/** GET /api/transactions/:id */
exports.getById = async (req, res, next) => {
  try {
    const trx = await prisma.transaction.findUnique({
      where: { id: req.params.id },
      include: trxInclude,
    });
    if (!trx) return res.status(404).json({ message: 'Transaction not found' });
    res.json(viewModel(trx));
  } catch (err) {
    next(err);
  }
};

/** POST /api/transactions */
exports.create = async (req, res) => {
  try {
    const body = req.body;
    const actorMeta = buildActorMeta(req);

    const createOne = async (rawItem) => {
      const created = await prisma.$transaction(async (tx) => {
        const data = await prepareTransactionData(rawItem, tx);

        if (!data.accountId) throw new Error('accountId is required');

        if (rawItem?.id && String(rawItem.id).startsWith('TRX_')) {
          delete data.id;
        }

        const created = await tx.transaction.create({ data, include: trxInclude });

        const effect = buildAssetEffect(created);
        await applyAssetEffect(tx, created.accountId, effect);

        return created;
      });

      await emitEmployeeTransactionLogs({ after: created, verb: 'created', actorMeta });
      return created;
    };

    if (Array.isArray(body)) {
      const results = [];
      for (const item of body) {
        results.push(await createOne(item));
      }
      return res.status(201).json(results.map(viewModel));
    }

    const created = await createOne(body);
    return res.status(201).json(viewModel(created));
  } catch (err) {
    console.error('Create TRX Error:', err);
    return res.status(400).json({
      ok: false,
      error: err.message || 'Ошибка при создании транзакции',
    });
  }
};

/** PUT /api/transactions/:id */
exports.update = async (req, res, next) => {
  try {
    const actorMeta = buildActorMeta(req);
    const result = await prisma.$transaction(async (tx) => {
      const before = await tx.transaction.findUnique({
        where: { id: req.params.id },
        include: trxInclude,
      });
      if (!before) {
        const err = new Error('Transaction not found');
        err.status = 404;
        throw err;
      }

      const data = await prepareTransactionData(req.body, tx);
      const after = await tx.transaction.update({
        where: { id: req.params.id },
        data,
        include: trxInclude,
      });

      const beforeEffect = buildAssetEffect(before);
      const afterEffect = buildAssetEffect(after);

      if (before.accountId && after.accountId && before.accountId === after.accountId) {
        const diff = diffEffects(afterEffect, beforeEffect);
        await applyAssetEffect(tx, after.accountId, diff);
      } else {
        await applyAssetEffect(tx, before.accountId, invertEffect(beforeEffect));
        await applyAssetEffect(tx, after.accountId, afterEffect);
      }

      return { before, after };
    });

    await emitEmployeeTransactionLogs({
      before: result.before,
      after: result.after,
      verb: 'updated',
      actorMeta,
    });

    res.json(viewModel(result.after));
  } catch (err) {
    if (err.status === 404 || err.code === 'P2025') {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    next(err);
  }
};

/** DELETE /api/transactions/:id */
exports.removeOne = async (req, res, next) => {
  try {
    const actorMeta = buildActorMeta(req);
    const removed = await prisma.$transaction(async (tx) => {
      const trx = await tx.transaction.findUnique({
        where: { id: req.params.id },
        include: trxInclude,
      });
      if (!trx) {
        const err = new Error('Transaction not found');
        err.status = 404;
        throw err;
      }

      await tx.transaction.delete({ where: { id: req.params.id } });

      const effect = buildAssetEffect(trx);
      await applyAssetEffect(tx, trx.accountId, invertEffect(effect));
      return trx;
    });

    await emitEmployeeTransactionLogs({
      before: removed,
      verb: 'deleted',
      actorMeta,
    });

    res.json({ ok: true });
  } catch (err) {
    if (err.status === 404 || err.code === 'P2025') {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    next(err);
  }
};

/** POST /api/transactions/:id/duplicate */
exports.duplicate = async (req, res, next) => {
  try {
    const actorMeta = buildActorMeta(req);
    const copy = await prisma.$transaction(async (tx) => {
      const trx = await tx.transaction.findUnique({ where: { id: req.params.id } });
      if (!trx) {
        const err = new Error('Transaction not found');
        err.status = 404;
        throw err;
      }

      const { id, createdAt, updatedAt, ...rest } = trx;

      const created = await tx.transaction.create({
        data: {
          ...rest,
          description: `(Копия) ${rest.description || ''}`.trim(),
          date: new Date(),
        },
        include: trxInclude,
      });

      const effect = buildAssetEffect(created);
      await applyAssetEffect(tx, created.accountId, effect);

      return created;
    });

    await emitEmployeeTransactionLogs({
      after: copy,
      verb: 'created',
      actorMeta,
    });

    res.status(201).json(viewModel(copy));
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ message: 'Transaction not found' });
    next(err);
  }
};
