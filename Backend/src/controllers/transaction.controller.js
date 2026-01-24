// src/controllers/transaction.controller.js
const { OperationType } = require('@prisma/client');
const prisma = require('../../prisma/client');

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
    return isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
}

// Безопасное преобразование в число
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

const trxInclude = {
  account: {
    select: {
      id: true,
      accountName: true,
      currency: { select: { code: true } },
    },
  },
  categoryDict: { select: { id: true, name: true } },
  subcategoryDict: { select: { id: true, name: true } },
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

  // 1. Обязательные поля
  const parsedDate = parseDateMaybe(date);
  if (parsedDate) data.date = parsedDate;

  if (amount !== undefined) data.amount = safeNum(amount);
  if (description !== undefined) data.description = description;

  const opEnum = uiToEnumOperation(operation);
  if (opEnum) data.operation = opEnum;

  if (commission !== undefined) data.commission = safeNum(commission);

  // 2. Строковые поля
  if (category !== undefined) data.category = category;
  if (subcategory !== undefined) data.subcategory = subcategory;
  if (counterparty !== undefined) data.counterparty = counterparty;
  if (counterpartyRequisites !== undefined) data.counterpartyRequisites = counterpartyRequisites;
  const hasAccountCurrency = accountCurrency !== undefined;
  if (hasAccountCurrency) data.accountCurrency = accountCurrency;
  if (orderNumber !== undefined) data.orderNumber = String(orderNumber);
  if (orderCurrency !== undefined) data.orderCurrency = orderCurrency;

  // 3. Числовые поля
  data.sumUAH = safeNum(sumUAH);
  data.sumUSD = safeNum(sumUSD);
  data.sumRUB = safeNum(sumRUB);
  data.sumByRatesOrderAmountCurrency = safeNum(sumByRatesOrderAmountCurrency);
  data.sumByRatesUAH = safeNum(sumByRatesUAH);
  data.sumByRatesUSD = safeNum(sumByRatesUSD);
  data.sumByRatesRUB = safeNum(sumByRatesRUB);
  if (balanceBefore !== undefined) data.balanceBefore = safeNum(balanceBefore);
  if (balanceAfter !== undefined) data.balanceAfter = safeNum(balanceAfter);

  // 4. Флаги
  if (sentToCounterparty !== undefined) data.sentToCounterparty = Boolean(sentToCounterparty);
  if (sendLion !== undefined) data.sendLion = Boolean(sendLion);

  // --- СВЯЗИ (SCALARS) ---
  if (employeeId !== undefined) data.employeeId = employeeId || null;
  if (clientId !== undefined) data.clientId = clientId || null;
  if (companyId !== undefined) data.companyId = companyId || null;

  // A. СЧЕТ (Обязательно)
  if (accountId) {
    data.accountId = accountId;
  }

  if (data.accountId && !hasAccountCurrency) {
    const account = await db.asset.findUnique({
      where: { id: data.accountId },
      select: { currency: { select: { code: true } } },
    });
    if (account?.currency?.code) data.accountCurrency = account.currency.code;
  }

  // B. КАТЕГОРИЯ (Ищем ID по имени)
  if (category) {
    const catObj = await db.financeArticleDict.findFirst({ where: { name: category } });
    data.categoryId = catObj ? catObj.id : null;
  }

  // C. ПОДКАТЕГОРИЯ
  if (subcategory) {
    const subCatObj = await db.financeSubarticleDict.findFirst({ where: { name: subcategory } });
    data.subcategoryId = subCatObj ? subCatObj.id : null;
  }

  // D. ЗАКАЗ
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
exports.create = async (req, res, next) => {
  try {
    const body = req.body;

    const createOne = async (rawItem) => {
      return prisma.$transaction(async (tx) => {
        const data = await prepareTransactionData(rawItem, tx);

        if (!data.accountId) throw new Error('accountId is required');

        // Если ID пришел с фронта (TRX_...), не передаем его в Prisma (если в БД UUID по умолчанию)
        if (rawItem?.id && String(rawItem.id).startsWith('TRX_')) {
          delete data.id;
        }

        const created = await tx.transaction.create({ data, include: trxInclude });
        const effect = buildAssetEffect(created);
        await applyAssetEffect(tx, created.accountId, effect);
        return created;
      });
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
    const updated = await prisma.$transaction(async (tx) => {
      const before = await tx.transaction.findUnique({ where: { id: req.params.id } });
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

      return after;
    });

    res.json(viewModel(updated));
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
    await prisma.$transaction(async (tx) => {
      const trx = await tx.transaction.findUnique({ where: { id: req.params.id } });
      if (!trx) {
        const err = new Error('Transaction not found');
        err.status = 404;
        throw err;
      }
      await tx.transaction.delete({ where: { id: req.params.id } });
      const effect = buildAssetEffect(trx);
      await applyAssetEffect(tx, trx.accountId, invertEffect(effect));
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

    res.status(201).json(viewModel(copy));
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ message: 'Transaction not found' });
    next(err);
  }
};
