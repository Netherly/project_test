// CommonJS service
const prisma = require('../../prisma/client');
const dayjs = require('dayjs');

// ---- helpers ----
async function resolveCurrencyId(payload) {
  const { currencyId, currencyCode, currency } = payload || {};
  if (currencyId) {
    const byId = await prisma.currencyDict.findUnique({ where: { id: currencyId } });
    if (byId) return byId.id;
  }
  const code = (currencyCode || currency || '').toString().trim().toUpperCase();
  if (code) {
    const byCode = await prisma.currencyDict.findUnique({ where: { code } });
    if (byCode) return byCode.id;
  }
  const e = new Error('currencyId not found');
  e.status = 400;
  throw e;
}

async function resolveOptionalByIdOrName(model, { id, name }) {
  if (!id && !name) return null;
  if (id) {
    const byId = await model.findUnique({ where: { id } });
    if (byId) return byId.id;
  }
  if (name) {
    const nm = String(name).trim();
    if (nm) {
      const byName = await model.findFirst({ where: { name: nm } });
      if (byName) return byName.id;
    }
  }
  return null;
}

const AssetsService = {
  async list() {
    return prisma.asset.findMany({
      include: {
        requisites: true,
        currency: true,
        type: true,
        paymentSystem: true,
        cardDesign: true, // Already includes cardDesign
        employee: { select: { id: true, full_name: true } },
        company:  { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  },

  async byId(id) {
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        requisites: true,
        currency: true,
        type: true,
        paymentSystem: true,
        cardDesign: true, // Already includes cardDesign
        employee: { select: { id: true, full_name: true } },
        company:  { select: { id: true, name: true } },
      },
    });
    if (!asset) {
      const e = new Error('Asset not found');
      e.status = 404;
      throw e;
    }
    return asset;
  },

  async create(payload) {
    const currencyId = await resolveCurrencyId(payload);

    const typeId = await resolveOptionalByIdOrName(prisma.assetTypeDict, {
      id: payload.typeId,
      name: payload.typeName || payload.type,
    });
    const paymentSystemId = await resolveOptionalByIdOrName(prisma.paymentSystemDict, {
      id: payload.paymentSystemId,
      name: payload.paymentSystemName || payload.paymentSystem,
    });
    const cardDesignId = await resolveOptionalByIdOrName(prisma.cardDesign, {
      id: payload.cardDesignId,
      name: payload.cardDesignName || payload.designName,
    });

    const balance  = Number(payload.balance ?? 0);
    const startBal = Number(payload.turnoverStartBalance ?? balance);

    return prisma.asset.create({
      data: {
        accountName: payload.accountName,
        currencyId,
        typeId,
        paymentSystemId,
        cardDesignId,
        employeeId: payload.employeeId ?? null,
        companyId:  payload.companyId  ?? null,
        design:     payload.design     ?? null,

        balance,
        turnoverStartBalance: startBal,
        turnoverIncoming: 0,
        turnoverOutgoing: 0,
        turnoverEndBalance: balance,

        requisites:
          Array.isArray(payload.requisites) && payload.requisites.length
            ? { create: payload.requisites.map(r => ({ label: r.label, value: r.value })) }
            : undefined,
      },
      include: { 
        requisites: true, 
        currency: true, 
        type: true,
        paymentSystem: true,
        cardDesign: true,
        employee: { select: { id: true, full_name: true } },
        company: { select: { id: true, name: true } },
      },
    });
  },

  async update(id, payload) {
    await this.byId(id);

    let nextCurrencyId;
    if (payload.currencyId || payload.currencyCode || payload.currency) {
      nextCurrencyId = await resolveCurrencyId(payload);
    }

    const nextTypeId = (payload.typeId !== undefined || payload.typeName || payload.type)
      ? await resolveOptionalByIdOrName(prisma.assetTypeDict, {
          id: payload.typeId,
          name: payload.typeName || payload.type,
        })
      : undefined;

    const nextPaymentSystemId = (payload.paymentSystemId !== undefined || payload.paymentSystemName || payload.paymentSystem)
      ? await resolveOptionalByIdOrName(prisma.paymentSystemDict, {
          id: payload.paymentSystemId,
          name: payload.paymentSystemName || payload.paymentSystem,
        })
      : undefined;

    const nextCardDesignId = (payload.cardDesignId !== undefined || payload.cardDesignName || payload.designName)
      ? await resolveOptionalByIdOrName(prisma.cardDesign, {
          id: payload.cardDesignId,
          name: payload.cardDesignName || payload.designName,
        })
      : undefined;

    const data = {
      accountName: payload.accountName,
      currencyId: nextCurrencyId,
      typeId: nextTypeId,
      paymentSystemId: nextPaymentSystemId,
      cardDesignId: nextCardDesignId,
      employeeId: payload.employeeId,
      companyId: payload.companyId,
      design: payload.design,
    };

    if (payload.balance !== undefined)
      data.balance = Number(payload.balance);
    if (payload.turnoverStartBalance !== undefined)
      data.turnoverStartBalance = Number(payload.turnoverStartBalance);

    return prisma.asset.update({
      where: { id },
      data,
      include: { 
        requisites: true, 
        currency: true, 
        type: true,
        paymentSystem: true,
        cardDesign: true,
        employee: { select: { id: true, full_name: true } },
        company: { select: { id: true, name: true } },
      },
    });
  },

  async remove(id) {
    await this.byId(id);
    await prisma.assetRequisite.deleteMany({ where: { assetId: id } });
    return prisma.asset.delete({ where: { id } });
  },

  async duplicate(id) {
    const src = await this.byId(id);
    return prisma.asset.create({
      data: {
        accountName: `${src.accountName} (Копия)`,
        currencyId: src.currencyId,
        typeId: src.typeId,
        paymentSystemId: src.paymentSystemId,
        cardDesignId: src.cardDesignId,
        employeeId: src.employeeId,
        companyId:  src.companyId,
        design:     src.design,

        balance: 0,
        turnoverStartBalance: 0,
        turnoverIncoming: 0,
        turnoverOutgoing: 0,
        turnoverEndBalance: 0,

        requisites: { create: src.requisites.map(r => ({ label: r.label, value: r.value })) },
      },
      include: { 
        requisites: true, 
        currency: true, 
        type: true,
        paymentSystem: true,
        cardDesign: true,
        employee: { select: { id: true, full_name: true } },
        company: { select: { id: true, name: true } },
      },
    });
  },

  async upsertRequisites(id, requisites) {
    await this.byId(id);
    await prisma.assetRequisite.deleteMany({ where: { assetId: id } });
    if (Array.isArray(requisites) && requisites.length) {
      await prisma.assetRequisite.createMany({
        data: requisites.map(r => ({ assetId: id, label: r.label, value: r.value })),
      });
    }
    return this.byId(id);
  },

  async recalcAllBalancesForCurrentMonth(companyId) {
    const rate = await prisma.exchangeRates.findFirst({ orderBy: { date: 'desc' } });
    if (!rate) {
      const e = new Error('No exchange rates found');
      e.status = 400;
      throw e;
    }

    const start = dayjs().startOf('month').toDate();
    const end   = dayjs().endOf('month').toDate();

    const assets = await prisma.asset.findMany({
      where: { companyId: companyId || undefined },
      include: { currency: true },
    });

    const toUAH = (code, amount) => {
      const v = Number(amount || 0);
      switch ((code || '').toUpperCase()) {
        case 'UAH': return v;
        case 'USD': return v * Number(rate.usd_uah);
        case 'USDT': return v * Number(rate.usdt_uah);
        case 'RUB': return v * Number(rate.rub_uah);
        default: return v;
      }
    };

    for (const a of assets) {
      const txs = await prisma.transaction.findMany({
        where: { accountId: a.id, date: { gte: start, lte: end } },
        orderBy: { date: 'desc' },
      });

      let incoming = 0, outgoing = 0;
      for (const t of txs) {
        const amt = Number(t.amount);
        if (t.operation === 'Зачисление') incoming += amt;
        if (t.operation === 'Списание')    outgoing += amt;
      }

      const endBal = Number(a.turnoverStartBalance) + incoming - outgoing;

      await prisma.asset.update({
        where: { id: a.id },
        data: {
          turnoverIncoming: incoming,
          turnoverOutgoing: outgoing,
          turnoverEndBalance: endBal,
          balance: endBal,
          balanceUAH: toUAH(a.currency?.code, endBal),
          lastEntryDate: txs[0]?.date || a.lastEntryDate,
        },
      });
    }

    return this.list();
  },
};

module.exports = AssetsService;
