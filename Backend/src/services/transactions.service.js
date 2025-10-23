// Backend/src/services/transactions.service.js
const prisma = require('../../prisma/client');

// В transactions.service.js добавить helpers
async function resolveCategoryId(payload) {
  const { categoryId, category } = payload || {};
  if (categoryId) return categoryId;
  if (category) {
    const cat = await prisma.financeArticleDict.findFirst({
      where: { name: category, isActive: true },
    });
    return cat?.id || null;
  }
  return null;
}

async function resolveSubcategoryId(payload) {
  const { subcategoryId, subcategory } = payload || {};
  if (subcategoryId) return subcategoryId;
  if (subcategory) {
    const sub = await prisma.financeSubarticleDict.findFirst({
      where: { name: subcategory, isActive: true },
    });
    return sub?.id || null;
  }
  return null;
}

const TransactionsService = {
  async list(params = {}) {
    const { page = 1, limit = 50, accountId, dateFrom, dateTo, category, operation } = params;
    const skip = (page - 1) * limit;

    const where = {};
    if (accountId) where.accountId = accountId;
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }
    if (category) where.category = category;
    if (operation) where.operation = operation;

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        account: { select: { id: true, accountName: true, currency: true } },
        categoryDict: true,
        subcategoryDict: true,
        order: { select: { id: true, title: true } },
        client: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    });

    const total = await prisma.transaction.count({ where });

    return { transactions, total, page, limit };
  },

  async byId(id) {
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        account: { select: { id: true, accountName: true, currency: true } },
        categoryDict: true,
        subcategoryDict: true,
        order: { select: { id: true, title: true } },
        client: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
      },
    });
    if (!transaction) {
      const e = new Error('Transaction not found');
      e.status = 404;
      throw e;
    }
    return transaction;
  },

  async create(payload) {
    const categoryId = await resolveCategoryId(payload);
    const subcategoryId = await resolveSubcategoryId(payload);

    const data = {
      date: new Date(payload.date),
      category: payload.category, // сохранить name для отображения
      subcategory: payload.subcategory,
      categoryId,
      subcategoryId,
      description: payload.description,
      accountId: payload.accountId,
      accountCurrency: payload.accountCurrency,
      operation: payload.operation,
      amount: payload.amount,
      commission: payload.commission || 0,
      counterparty: payload.counterparty,
      counterpartyRequisites: payload.counterpartyRequisites,
      orderId: payload.orderId,
      orderNumber: payload.orderNumber,
      orderCurrency: payload.orderCurrency,
      sumUAH: payload.sumUAH,
      sumUSD: payload.sumUSD,
      sumRUB: payload.sumRUB,
      sumByRatesOrderAmountCurrency: payload.sumByRatesOrderAmountCurrency,
      sumByRatesUAH: payload.sumByRatesUAH,
      sumByRatesUSD: payload.sumByRatesUSD,
      sumByRatesRUB: payload.sumByRatesRUB,
      sentToCounterparty: payload.sentToCounterparty || false,
      sendLion: payload.sendLion || false,
      balanceBefore: payload.balanceBefore,
      balanceAfter: payload.balanceAfter,
      clientId: payload.clientId,
      companyId: payload.companyId,
    };

    return prisma.transaction.create({
      data,
      include: {
        account: { select: { id: true, accountName: true, currency: true } },
        categoryDict: true,
        subcategoryDict: true,
        order: { select: { id: true, title: true } },
        client: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
      },
    });
  },

  async update(id, payload) {
    const categoryId = await resolveCategoryId(payload);
    const subcategoryId = await resolveSubcategoryId(payload);

    const data = {};
    if (payload.date) data.date = new Date(payload.date);
    if (payload.category !== undefined) data.category = payload.category;
    if (payload.subcategory !== undefined) data.subcategory = payload.subcategory;
    if (categoryId !== undefined) data.categoryId = categoryId;
    if (subcategoryId !== undefined) data.subcategoryId = subcategoryId;
    if (payload.accountId) data.accountId = payload.accountId;
    if (payload.accountCurrency) data.accountCurrency = payload.accountCurrency;
    if (payload.operation) data.operation = payload.operation;
    if (payload.amount !== undefined) data.amount = payload.amount;
    if (payload.commission !== undefined) data.commission = payload.commission;
    if (payload.counterparty !== undefined) data.counterparty = payload.counterparty;
    if (payload.counterpartyRequisites !== undefined) data.counterpartyRequisites = payload.counterpartyRequisites;
    if (payload.orderId !== undefined) data.orderId = payload.orderId;
    if (payload.orderNumber !== undefined) data.orderNumber = payload.orderNumber;
    if (payload.orderCurrency !== undefined) data.orderCurrency = payload.orderCurrency;
    if (payload.sumUAH !== undefined) data.sumUAH = payload.sumUAH;
    if (payload.sumUSD !== undefined) data.sumUSD = payload.sumUSD;
    if (payload.sumRUB !== undefined) data.sumRUB = payload.sumRUB;
    if (payload.sumByRatesOrderAmountCurrency !== undefined) data.sumByRatesOrderAmountCurrency = payload.sumByRatesOrderAmountCurrency;
    if (payload.sumByRatesUAH !== undefined) data.sumByRatesUAH = payload.sumByRatesUAH;
    if (payload.sumByRatesUSD !== undefined) data.sumByRatesUSD = payload.sumByRatesUSD;
    if (payload.sumByRatesRUB !== undefined) data.sumByRatesRUB = payload.sumByRatesRUB;
    if (payload.sentToCounterparty !== undefined) data.sentToCounterparty = payload.sentToCounterparty;
    if (payload.sendLion !== undefined) data.sendLion = payload.sendLion;
    if (payload.balanceBefore !== undefined) data.balanceBefore = payload.balanceBefore;
    if (payload.balanceAfter !== undefined) data.balanceAfter = payload.balanceAfter;
    if (payload.clientId !== undefined) data.clientId = payload.clientId;
    if (payload.companyId !== undefined) data.companyId = payload.companyId;

    return prisma.transaction.update({
      where: { id },
      data,
      include: {
        account: { select: { id: true, accountName: true, currency: true } },
        categoryDict: true,
        subcategoryDict: true,
        order: { select: { id: true, title: true } },
        client: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
      },
    });
  },

  async delete(id) {
    return prisma.transaction.delete({
      where: { id },
    });
  },
};

module.exports = TransactionsService;