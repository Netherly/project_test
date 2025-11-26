// src/controllers/transaction.controller.js
const { PrismaClient, OperationType } = require('@prisma/client');
const prisma = new PrismaClient();

/** ===== helpers ===== */

const uiToEnumOperation = (v) => {
  if (!v) return undefined;
  const s = String(v).trim().toLowerCase();
  if (s === 'зачисление' || s === 'deposit' || s === 'in') return OperationType.DEPOSIT;
  if (s === 'списание' || s === 'withdraw' || s === 'out') return OperationType.WITHDRAW;
  // если приходит уже enum
  if (v === OperationType.DEPOSIT || v === OperationType.WITHDRAW) return v;
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
    // поддержим "YYYY-MM-DD HH:mm" и ISO
    const str = x.includes(' ') ? x.replace(' ', 'T') : x;
    const d = new Date(str);
    return isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
}

const toNumberOrNull = (v) =>
  v === null || v === undefined || v === '' ? null : Number(v);

/**
 * Нормализация входа для create/update с приведением типов под Prisma.
 * Приводим:
 * - date -> Date
 * - amount/commission и суммы -> Number|null
 * - operation -> enum OperationType
 */
function normalizeForCreateUpdate(input) {
  if (!input) return input;
  const copy = { ...input };

  // дата
  const parsedDate = parseDateMaybe(copy.date);
  if (parsedDate) copy.date = parsedDate;

  // enum operation
  if ('operation' in copy) {
    const mapped = uiToEnumOperation(copy.operation);
    if (mapped) copy.operation = mapped;
  }

  // числовые
  const decKeys = [
    'amount',
    'commission',
    'sumUAH',
    'sumUSD',
    'sumRUB',
    'sumByRatesOrderAmountCurrency',
    'sumByRatesUAH',
    'sumByRatesUSD',
    'sumByRatesRUB',
    'balanceBefore',
    'balanceAfter',
  ];
  decKeys.forEach((k) => {
    if (k in copy) copy[k] = toNumberOrNull(copy[k]);
  });

  // безопасность: запрещаем прямую запись в денормализованные поля вывода
  delete copy.accountName;

  return copy;
}

/** Преобразуем запись БД -> к формату удобному для фронта */
function viewModel(trx) {
  if (!trx) return trx;
  const accountName = trx.account?.accountName || trx.accountName || null;
  const accountCurrency =
    trx.account?.currency?.code || trx.accountCurrency || null;

  return {
    ...trx,
    operation: enumToUiOperation(trx.operation),
    accountName,
    accountCurrency,
  };
}

/** include-блок под findMany/findUnique */
const trxInclude = {
  account: {
    select: {
      id: true,
      accountName: true,
      currency: { select: { code: true } },
    },
  },
  client: { select: { id: true, name: true } },
  company: { select: { id: true, name: true } },
  order: { select: { id: true, title: true } },
  // словари подкатегорий/категорий если используешь
  categoryDict: { select: { id: true, name: true } },
  subcategoryDict: { select: { id: true, name: true } },
};

/**
 * GET /api/transactions
 * ?page=1&pageSize=50&search=&accountId=&clientId=&companyId=&dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD&operation=deposit|withdraw
 * ?categoryId=&subcategoryId=
 */
exports.list = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 50,
      search = '',
      accountId,
      clientId,
      companyId,
      categoryId,
      subcategoryId,
      operation,
      dateFrom,
      dateTo,
    } = req.query;

    const take = Math.min(Number(pageSize) || 50, 200);
    const skip = Math.max(0, (Number(page) - 1) * take);

    const where = {};

    // Поиск по текстам + связанным полям
    if (search) {
      where.OR = [
        { category: { contains: search, mode: 'insensitive' } },
        { subcategory: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { counterparty: { contains: search, mode: 'insensitive' } },
        { orderNumber: { contains: search, mode: 'insensitive' } },
        // связанные поля
        { account: { accountName: { contains: search, mode: 'insensitive' } } },
        { account: { currency: { code: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    if (accountId) where.accountId = String(accountId);
    if (clientId) where.clientId = String(clientId);
    if (companyId) where.companyId = String(companyId);
    if (categoryId) where.categoryId = String(categoryId);
    if (subcategoryId) where.subcategoryId = String(subcategoryId);

    // фильтр по типу операции
    if (operation) {
      const op = uiToEnumOperation(operation);
      if (op) where.operation = op;
    }

    // даты
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) {
        const from = parseDateMaybe(dateFrom);
        if (from) where.date.gte = from;
      }
      if (dateTo) {
        const end = parseDateMaybe(dateTo);
        if (end) {
          end.setHours(23, 59, 59, 999);
          where.date.lte = end;
        }
      }
    }

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

/** POST /api/transactions  (одна транзакция или массив) */
exports.create = async (req, res, next) => {
  try {
    const body = req.body;

    const ensureRequired = (d) => {
      if (!d.accountId) throw new Error('accountId is required');
      if (!d.date) throw new Error('date is required');
      if (d.amount === undefined || d.amount === null || d.amount === '')
        throw new Error('amount is required');
    };

    if (Array.isArray(body)) {
      const data = body.map(normalizeForCreateUpdate);
      data.forEach(ensureRequired);

      const created = await prisma.$transaction(
        data.map((d) => prisma.transaction.create({ data: d, include: trxInclude }))
      );

      return res.status(201).json(created.map(viewModel));
    } else {
      const data = normalizeForCreateUpdate(body);
      ensureRequired(data);

      const created = await prisma.transaction.create({
        data,
        include: trxInclude,
      });
      return res.status(201).json(viewModel(created));
    }
  } catch (err) {
    next(err);
  }
};

/** PUT /api/transactions/:id */
exports.update = async (req, res, next) => {
  try {
    const data = normalizeForCreateUpdate(req.body);

    const updated = await prisma.transaction.update({
      where: { id: req.params.id },
      data,
      include: trxInclude,
    });
    res.json(viewModel(updated));
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    next(err);
  }
};

/** DELETE /api/transactions/:id */
exports.removeOne = async (req, res, next) => {
  try {
    await prisma.transaction.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    next(err);
  }
};

/** POST /api/transactions/:id/duplicate */
exports.duplicate = async (req, res, next) => {
  try {
    const trx = await prisma.transaction.findUnique({
      where: { id: req.params.id },
    });
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
