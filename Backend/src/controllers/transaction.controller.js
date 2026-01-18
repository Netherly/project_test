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

  return {
    ...trx,
    operation: enumToUiOperation(trx.operation),
    accountName,
    accountCurrency,
  };
}

/**
 * ПОДГОТОВКА ДАННЫХ
 * Ищем ID справочников и возвращаем плоский объект для Prisma
 */
async function prepareTransactionData(input) {
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
  if (accountCurrency !== undefined) data.accountCurrency = accountCurrency;
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

  // A. СЧЕТ (Обязательно)
  if (accountId) {
    data.accountId = accountId;
  }

  // B. КАТЕГОРИЯ (Ищем ID по имени)
  if (category) {
    const catObj = await prisma.financeArticleDict.findFirst({ where: { name: category } });
    data.categoryId = catObj ? catObj.id : null;
  }

  // C. ПОДКАТЕГОРИЯ
  if (subcategory) {
    const subCatObj = await prisma.financeSubarticleDict.findFirst({ where: { name: subcategory } });
    data.subcategoryId = subCatObj ? subCatObj.id : null;
  }

  // D. ЗАКАЗ
  if (orderId && typeof orderId === 'string' && orderId.trim() !== '') {
    const orderExists = await prisma.order.findUnique({ where: { id: orderId } });
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
    const { page = 1, pageSize = 50, search = '', accountId } = req.query;
    const take = Math.min(Number(pageSize) || 50, 200);
    const skip = Math.max(0, (Number(page) - 1) * take);

    const where = {};
    if (search) {
      where.OR = [
        { category: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { counterparty: { contains: search, mode: 'insensitive' } },
        { orderNumber: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (accountId) where.accountId = accountId;

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
      const data = await prepareTransactionData(rawItem);

      if (!data.accountId) throw new Error('accountId is required');

      // Если ID пришел с фронта (TRX_...), не передаем его в Prisma (если в БД UUID по умолчанию)
      if (rawItem?.id && String(rawItem.id).startsWith('TRX_')) {
        delete data.id;
      }

      return prisma.transaction.create({ data, include: trxInclude });
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
    const data = await prepareTransactionData(req.body);
    const updated = await prisma.transaction.update({
      where: { id: req.params.id },
      data,
      include: trxInclude,
    });
    res.json(viewModel(updated));
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Transaction not found' });
    next(err);
  }
};

/** DELETE /api/transactions/:id */
exports.removeOne = async (req, res, next) => {
  try {
    await prisma.transaction.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Transaction not found' });
    next(err);
  }
};

/** POST /api/transactions/:id/duplicate */
exports.duplicate = async (req, res, next) => {
  try {
    const trx = await prisma.transaction.findUnique({ where: { id: req.params.id } });
    if (!trx) return res.status(404).json({ message: 'Transaction not found' });

    const { id, createdAt, updatedAt, ...rest } = trx;

    const copy = await prisma.transaction.create({
      data: {
        ...rest,
        description: `(Копия) ${rest.description || ''}`.trim(),
        date: new Date(),
      },
      include: trxInclude,
    });

    res.status(201).json(viewModel(copy));
  } catch (err) {
    next(err);
  }
};
