// CommonJS service
const prisma = require('../../prisma/client');
const dayjs = require('dayjs');
const { logActivity } = require('./activity-log.service');
const { findByEntityRef, resolveEntityId } = require('../utils/entity-ref');

// ---- helpers ----
const normalizeOptionalId = (value) => {
  if (value === undefined) return undefined;
  const text = String(value ?? '').trim();
  return text ? text : null;
};

const normalizeRequisites = (requisites) =>
  (Array.isArray(requisites) ? requisites : [])
    .map((item) => ({
      label: String(item?.label ?? '').trim(),
      value: String(item?.value ?? '').trim(),
    }))
    .filter((item) => item.label || item.value);
const normalizeActorMeta = (actor = {}) => ({
  actorId: actor?.actorId || actor?.id || null,
  actorName: actor?.actorName || null,
  source: actor?.source || 'manual',
  ip: actor?.ip,
  userAgent: actor?.userAgent,
});
const getEmployeeLabel = (employee) =>
  employee?.full_name || employee?.login || employee?.email || employee?.id || 'сотрудник';
const getAssetLabel = (asset) => asset?.accountName || asset?.externalId || asset?.id || 'актив';

async function safeEmployeeLog({ employeeId, action, message, actor, target }) {
  if (!employeeId) return null;

  try {
    return await logActivity({
      entityType: 'employee',
      entityId: employeeId,
      action,
      message,
      meta: target ? { target } : undefined,
      ...normalizeActorMeta(actor),
    });
  } catch (error) {
    console.warn('[log] asset employee activity failed:', error?.message || error);
    return null;
  }
}

async function resolveCurrencyId(payload) {
  const { currencyId, currencyCode, currency } = payload || {};
  if (currencyId) {
    const byId = await prisma.currencyDict.findUnique({ where: { id: currencyId } });
    if (byId) return byId.id;
  }

  let raw = currencyCode;
  let nameCandidate = null;
  if (!raw && currency) {
    if (typeof currency === 'object') {
      raw = currency.code || currency.name || '';
      nameCandidate = currency.name || null;
    } else {
      raw = currency;
      nameCandidate = currency;
    }
  }

  const code = String(raw || '').trim();
  if (code) {
    const normalized = code.toUpperCase();
    const byCode = await prisma.currencyDict.findUnique({ where: { code: normalized } });
    if (byCode) return byCode.id;

    if (/^[A-Z]{2,5}$/.test(normalized)) {
      const created = await prisma.currencyDict.create({
        data: { code: normalized, name: normalized },
      });
      return created.id;
    }
  }

  const name = String(nameCandidate || '').trim();
  if (name) {
    const byName = await prisma.currencyDict.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });
    if (byName) return byName.id;
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
    const asset = await findByEntityRef(prisma.asset, id, {
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

  async create(payload, actor = {}) {
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
    const limitTurnover =
      payload.limitTurnover === undefined || payload.limitTurnover === null || payload.limitTurnover === ''
        ? null
        : Number(payload.limitTurnover);
    const requisites = normalizeRequisites(payload.requisites);

    const created = await prisma.asset.create({
      data: {
        accountName: payload.accountName,
        currencyId,
        typeId,
        paymentSystemId,
        cardDesignId,
        employeeId: normalizeOptionalId(payload.employeeId),
        companyId: normalizeOptionalId(payload.companyId),
        design:     payload.design     ?? null,

        balance,
        limitTurnover,
        turnoverStartBalance: startBal,
        turnoverIncoming: 0,
        turnoverOutgoing: 0,
        turnoverEndBalance: balance,

        requisites:
          requisites.length
            ? { create: requisites.map((r) => ({ label: r.label, value: r.value })) }
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

    if (created.employeeId) {
      await safeEmployeeLog({
        employeeId: created.employeeId,
        action: 'asset_attached',
        message: `К сотруднику "${getEmployeeLabel(created.employee)}" привязан актив "${getAssetLabel(created)}"`,
        target: {
          type: 'asset',
          id: created.id,
          urlId: created.urlId || null,
          label: getAssetLabel(created),
        },
        actor,
      });
    }

    return created;
  },

  async update(id, payload, actor = {}) {
    const actualId = await resolveEntityId(prisma.asset, id, { notFoundMessage: 'Asset not found' });
    const before = await this.byId(actualId);

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
      employeeId: normalizeOptionalId(payload.employeeId),
      companyId: normalizeOptionalId(payload.companyId),
      design: payload.design,
    };

    if (payload.balance !== undefined)
      data.balance = Number(payload.balance);
    if (payload.limitTurnover !== undefined)
      data.limitTurnover =
        payload.limitTurnover === null || payload.limitTurnover === ''
          ? null
          : Number(payload.limitTurnover);
    if (payload.turnoverStartBalance !== undefined)
      data.turnoverStartBalance = Number(payload.turnoverStartBalance);
    const hasRequisitesPayload = payload.requisites !== undefined;
    const requisites = hasRequisitesPayload ? normalizeRequisites(payload.requisites) : null;

    const updated = await prisma.$transaction(async (tx) => {
      await tx.asset.update({
        where: { id: actualId },
        data,
      });

      if (hasRequisitesPayload) {
        await tx.assetRequisite.deleteMany({ where: { assetId: actualId } });
        if (requisites.length) {
          await tx.assetRequisite.createMany({
            data: requisites.map((r) => ({ assetId: actualId, label: r.label, value: r.value })),
          });
        }
      }

      return tx.asset.findUnique({
        where: { id: actualId },
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
    });

    if (before.employeeId !== updated.employeeId) {
      if (before.employeeId) {
        await safeEmployeeLog({
          employeeId: before.employeeId,
          action: 'asset_detached',
          message: `От сотрудника "${getEmployeeLabel(before.employee)}" отвязан актив "${getAssetLabel(before)}"`,
          target: {
            type: 'asset',
            id: before.id,
            urlId: before.urlId || null,
            label: getAssetLabel(before),
          },
          actor,
        });
      }

      if (updated.employeeId) {
        await safeEmployeeLog({
          employeeId: updated.employeeId,
          action: 'asset_attached',
          message: `К сотруднику "${getEmployeeLabel(updated.employee)}" привязан актив "${getAssetLabel(updated)}"`,
          target: {
            type: 'asset',
            id: updated.id,
            urlId: updated.urlId || null,
            label: getAssetLabel(updated),
          },
          actor,
        });
      }
    }

    return updated;
  },

  async remove(id, actor = {}) {
    const actualId = await resolveEntityId(prisma.asset, id, { notFoundMessage: 'Asset not found' });
    const asset = await this.byId(actualId);

    const [transactionsCount, regularPaymentsCount] = await Promise.all([
      prisma.transaction.count({ where: { accountId: actualId } }),
      prisma.regularPayment.count({ where: { accountId: actualId } }),
    ]);

    if (transactionsCount > 0 || regularPaymentsCount > 0) {
      const e = new Error('Нельзя удалить актив, пока он используется в транзакциях или регулярных платежах');
      e.status = 400;
      throw e;
    }

    await prisma.assetRequisite.deleteMany({ where: { assetId: actualId } });
    await prisma.asset.delete({
      where: { id: actualId },
    });

    if (asset.employeeId) {
      await safeEmployeeLog({
        employeeId: asset.employeeId,
        action: 'asset_removed',
        message: `Удалён актив "${getAssetLabel(asset)}" сотрудника "${getEmployeeLabel(asset.employee)}"`,
        target: {
          type: 'asset',
          id: asset.id,
          urlId: asset.urlId || null,
          label: getAssetLabel(asset),
        },
        actor,
      });
    }

    return asset;
  },

  async duplicate(id) {
    const actualId = await resolveEntityId(prisma.asset, id, { notFoundMessage: 'Asset not found' });
    const src = await this.byId(actualId);
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
        limitTurnover: src.limitTurnover,
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
    const actualId = await resolveEntityId(prisma.asset, id, { notFoundMessage: 'Asset not found' });
    await this.byId(actualId);
    await prisma.assetRequisite.deleteMany({ where: { assetId: actualId } });
    const normalized = normalizeRequisites(requisites);
    if (normalized.length) {
      await prisma.assetRequisite.createMany({
        data: normalized.map((r) => ({ assetId: actualId, label: r.label, value: r.value })),
      });
    }
    return this.byId(actualId);
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
