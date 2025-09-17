// src/services/transaction.service.js
const { OperationType } = require('@prisma/client');
const prisma = require('../client');

/** ================= helpers ================= */

const uiToEnumOperation = (v) => {
  if (!v) return undefined;
  const s = String(v).trim().toLowerCase();
  if (s === 'зачисление' || s === 'deposit' || s === 'in') return OperationType.DEPOSIT;
  if (s === 'списание' || s === 'withdraw' || s === 'out') return OperationType.WITHDRAW;
  // если уже enum — пропускаем
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
    const str = x.includes(' ') ? x.replace(' ', 'T') : x;
    const d = new Date(str);
    return isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
}

const toNumberOrNull = (v) =>
  v === null || v === undefined || v === '' ? null : Number(v);

/** Приводим вход под Prisma (create/update) */
function normalizeForCreateUpdate(input) {
  if (!input) return input;
  const copy = { ...input };

  // дата
  const parsedDate = parseDateMaybe(copy.date);
  if (parsedDate) copy.date = parsedDate;

  // операция
  if ('operation' in copy) {
    const mapped = uiToEnumOperation(copy.operation);
    if (mapped) copy.operation = mapped;
  }

  // числовые
  [
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
  ].forEach((k) => {
    if (k in copy) copy[k] = toNumberOrNull(copy[k]);
  });

  // запрещаем перетирать денормализованные поля
  delete copy.accountName;
  delete copy.accountCurrency;

  return copy;
}

/** Какие связи подтягиваем всегда */
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
  categoryDict: { select: { id: true, name: true } },
  subcategoryDict: { select: { id: true, name: true } },
};

/** Трансформируем запись БД -> формат для фронта */
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

/** ================= service ================= */

class TransactionService {
  /**
   * Список с пагинацией.
   * @param {object} where — Prisma where (уже собранный контроллером) ИЛИ пустой {}
   * @param {number} page
   * @param {number} pageSize
   */
  async list(where = {}, page = 1, pageSize = 50) {
    const take = Math.min(Number(pageSize) || 50, 200);
    const skip = Math.max(0, (Number(page) - 1) * take);

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

    return {
      page: Number(page),
      pageSize: take,
      total,
      items: items.map(viewModel),
    };
  }

  async getById(id) {
    const trx = await prisma.transaction.findUnique({
      where: { id },
      include: trxInclude,
    });
    return viewModel(trx);
  }

  /**
   * Создание одной или массива транзакций.
   * На вход допускает UI-значения: date в строке, operation "Зачисление"/"Списание" и т.д.
   */
  async create(data) {
    if (Array.isArray(data)) {
      const list = data.map(normalizeForCreateUpdate);
      // базовые проверки
      list.forEach((d) => {
        if (!d.accountId) throw new Error('accountId is required');
        if (!d.date) throw new Error('date is required');
        if (d.amount === undefined || d.amount === null || d.amount === '')
          throw new Error('amount is required');
      });

      const created = await prisma.$transaction(
        list.map((d) =>
          prisma.transaction.create({
            data: d,
            include: trxInclude,
          })
        )
      );
      return created.map(viewModel);
    }

    const payload = normalizeForCreateUpdate(data);
    if (!payload.accountId) throw new Error('accountId is required');
    if (!payload.date) throw new Error('date is required');
    if (payload.amount === undefined || payload.amount === null || payload.amount === '')
      throw new Error('amount is required');

    const created = await prisma.transaction.create({
      data: payload,
      include: trxInclude,
    });
    return viewModel(created);
  }

  /**
   * Обновление.
   */
  async update(id, data) {
    const payload = normalizeForCreateUpdate(data);
    const updated = await prisma.transaction.update({
      where: { id },
      data: payload,
      include: trxInclude,
    });
    return viewModel(updated);
  }

  /**
   * Удаление.
   */
  async remove(id) {
    await prisma.transaction.delete({ where: { id } });
    return { ok: true };
  }

  /**
   * Дублирование.
   */
  async duplicate(id) {
    const trx = await prisma.transaction.findUnique({ where: { id } });
    if (!trx) return null;

    const { id: _omit, createdAt, updatedAt, ...rest } = trx;

    const copy = await prisma.transaction.create({
      data: {
        ...rest,
        description: `(Копия) ${rest.description || ''}`.trim(),
        date: new Date(),
      },
      include: trxInclude,
    });

    return viewModel(copy);
  }
}

module.exports = new TransactionService();
