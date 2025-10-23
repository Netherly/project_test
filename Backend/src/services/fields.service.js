// src/services/fields.service.js
const prisma = require('../../prisma/client');
const fs = require('fs');
const path = require('path');

/* ==============================
   FS utils
================================ */
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};
const UPLOADS_ROOT = path.join(__dirname, '..', '..', 'uploads');
const CARD_DIR = path.join(UPLOADS_ROOT, 'card-designs');
ensureDir(CARD_DIR);

const rid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

async function saveDataUrlToFile(dataUrl, fileBaseName) {
  const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl || '');
  if (!m) return null;
  const mime = m[1];
  const buf = Buffer.from(m[2], 'base64');
  const ext = (mime.split('/')[1] || 'png').toLowerCase();
  const fileName = `${fileBaseName}.${ext}`;
  const abs = path.join(CARD_DIR, fileName);
  await fs.promises.writeFile(abs, buf);
  return `/uploads/card-designs/${fileName}`;
}

async function safeUnlink(absPath) {
  try { await fs.promises.unlink(absPath); } catch (_) {}
}

function urlToAbsPath(url) {
  if (!url || !url.startsWith('/uploads/')) return null;
  return path.join(UPLOADS_ROOT, url.replace('/uploads/', ''));
}

/* ==============================
   Helpers (строки/словарики)
================================ */
const pickStr = (v) => {
  if (typeof v === 'string') return v.trim();
  if (v && typeof v === 'object') return String(v.value ?? v.name ?? v.code ?? '').trim();
  return '';
};
const arrToUniqueStrings = (list, key = 'name') => {
  const out = new Set();
  (Array.isArray(list) ? list : []).forEach((x) => {
    const s = pickStr(x?.[key] ?? x);
    if (s) out.add(s);
  });
  return Array.from(out);
};

const normalizeSimpleValues = (list) => {
  const out = new Set();
  (Array.isArray(list) ? list : []).forEach((value) => {
    let v = value;
    if (v && typeof v === 'object') {
      v = v.value ?? v.name ?? v.code ?? v.label ?? '';
    }
    if (v !== undefined && v !== null) {
      const s = String(v).trim();
      if (s) out.add(s);
    }
  });
  return Array.from(out);
};

async function upsertSimpleDict(db, model, values, opts = {}) {
  const field = opts.field || 'name';
  const unique = Array.from(new Set((values || []).map((s) => String(s ?? '').trim()).filter(Boolean)));
  if (!unique.length) return db[model].findMany({ orderBy: { [field]: 'asc' } });

  const existing = await db[model].findMany({ select: { id: true, [field]: true } });
  const existingBy = new Map(existing.map((e) => [String(e[field]).toLowerCase(), e]));
  const toCreate = unique.filter((v) => !existingBy.has(v.toLowerCase()));
  if (toCreate.length) {
    await db[model].createMany({ data: toCreate.map((v) => ({ [field]: v })), skipDuplicates: true });
  }
  return db[model].findMany({ orderBy: { [field]: 'asc' } });
}

const syncSimpleDict = async (tx, model, list, opts = {}) => {
  const field = opts.field || 'name';
  const hasIsActive = opts.hasIsActive !== false; // default true
  const values = normalizeSimpleValues(list);
  const dbModel = tx[model];
  if (!dbModel) throw new Error(`Model ${model} not found in transaction`);

  if (!values.length) {
    if (hasIsActive) {
      await dbModel.updateMany({ data: { isActive: false } });
    } else {
      await dbModel.deleteMany({});
    }
    return;
  }

  await Promise.all(
    values.map((value) =>
      dbModel.upsert({
        where: { [field]: value },
        update: { isActive: hasIsActive ? true : undefined },
        create: { id: rid(), [field]: value, ...(hasIsActive ? { isActive: true } : {}) },
      })
    )
  );

  if (hasIsActive) {
    await dbModel.updateMany({
      where: { [field]: { notIn: values } },
      data: { isActive: false },
    });
  } else {
    await dbModel.deleteMany({
      where: { [field]: { notIn: values } },
    });
  }
};

/* ==============================
   READ bundle (GET /fields)
================================ */
async function getAll(db) {
  const _db = db || prisma;

  // Orders
  const [intervals, orderCats, orderCurrencies] = await Promise.all([
    _db.orderIntervalDict.findMany({ orderBy: { value: 'asc' } }),
    _db.orderCategoryDict.findMany({
      select: {
        id: true,
        value: true,
        interval: { select: { id: true, value: true } },
      },
      orderBy: [{ interval: { value: 'asc' } }, { value: 'asc' }],
    }),
    _db.currencyDict.findMany({ orderBy: { code: 'asc' } }),
  ]);

  // Executor
  const [executorCurrencies, roles] = await Promise.all([
    _db.currencyDict.findMany({ orderBy: { code: 'asc' } }),
    _db.executorRoleDict.findMany({ orderBy: { name: 'asc' } }),
  ]);

  // Client
  const [sources, categories, countries, clientCurrencies, tags] = await Promise.all([
    _db.clientSourceDict.findMany({ orderBy: { name: 'asc' } }),
    _db.clientCategoryDict.findMany({ orderBy: { name: 'asc' } }),
    _db.country.findMany({ orderBy: { name: 'asc' } }),
    _db.currencyDict.findMany({ orderBy: { code: 'asc' } }),
    _db.tag.findMany({ orderBy: { name: 'asc' } }),
  ]);
  const employeeCountries = countries;

  // Assets
  const [assetCurrencies, assetTypes, paymentSystems, cardDesigns] = await Promise.all([
    _db.currencyDict.findMany({ orderBy: { code: 'asc' } }),
    _db.assetTypeDict.findMany({ orderBy: { name: 'asc' } }),
    _db.paymentSystemDict.findMany({ orderBy: { name: 'asc' } }),
    _db.cardDesign.findMany({ orderBy: { name: 'asc' } }),
  ]);

  // Finance
  const [articles, subarticles, subcategories] = await Promise.all([
    _db.financeArticleDict.findMany({ orderBy: { name: 'asc' } }),
    _db.financeSubarticleDict.findMany({
      select: {
        id: true,
        name: true,
        article: { select: { id: true, name: true } },
        subcategory: { select: { id: true, name: true } },
      },
      orderBy: [{ article: { name: 'asc' } }, { name: 'asc' }],
    }),
    _db.financeSubcategoryDict.findMany({ orderBy: { name: 'asc' } }),
  ]);

  return {
    orderFields: {
      intervals: intervals.map((x) => ({ id: x.id, value: x.value })),
      categories: orderCats.map((x) => ({
        id: x.id,
        value: x.value,
        intervalId: x.interval?.id || null,
        intervalValue: x.interval?.value || null,
      })),
      currency: orderCurrencies.map((c) => ({ id: c.id, code: c.code, name: c.name || c.code })),
    },

    executorFields: {
      currency: executorCurrencies.map((c) => ({ id: c.id, code: c.code, name: c.name || c.code })),
      role: roles.map((r) => ({ id: r.id, name: r.name })),
    },

    clientFields: {
      source: sources.map((s) => ({ id: s.id, name: s.name })),
      category: categories.map((c) => ({ id: c.id, name: c.name })),
      country: countries.map((c) => ({ id: c.id, name: c.name })),
      currency: clientCurrencies.map((c) => ({ id: c.id, code: c.code, name: c.name || c.code })),
      tag: tags.map((t) => ({ id: t.id, name: t.name, color: t.color })),
    },

    employeeFields: {
      country: employeeCountries.map((c) => ({ id: c.id, name: c.name })),
    },

    assetsFields: {
      currency: assetCurrencies.map((c) => ({ id: c.id, code: c.code, name: c.name || c.code })),
      type: assetTypes.map((t) => ({ id: t.id, name: t.name })),
      paymentSystem: paymentSystems.map((p) => ({ id: p.id, name: p.name })),
      cardDesigns: cardDesigns.map((d) => ({ id: d.id, name: d.name, url: d.imageUrl || '' })),
    },

    financeFields: {
      articles: articles.map((a) => ({ id: a.id, name: a.name })),
      subarticles: subarticles.map((s) => ({
        id: s.id,
        name: s.name,
        articleId: s.article?.id || null,
        articleName: s.article?.name || null,
        subcategoryId: s.subcategory?.id || null,
        subcategoryName: s.subcategory?.name || null,
      })),
      subcategory: subcategories.map((s) => ({ id: s.id, name: s.name })),
    },
  };
}

/* ==============================
   WRITE bundle (PUT /fields)
================================ */
async function saveAll(payload) {
  return prisma.$transaction(async (tx) => {
    /** ---- CURRENCIES (централизованно, по code) ---- */
    const allCurrencyCodes = new Set([
      ...arrToUniqueStrings(payload?.orderFields?.currency, 'code'),
      ...arrToUniqueStrings(payload?.executorFields?.currency, 'code'),
      ...arrToUniqueStrings(payload?.clientFields?.currency, 'code'),
      ...arrToUniqueStrings(payload?.assetsFields?.currency, 'code'),
    ]);
    await syncSimpleDict(tx, 'currencyDict', Array.from(allCurrencyCodes), { field: 'code' });

    /** ---- ORDERS ---- */
    // intervals
    const intervalValues = (Array.isArray(payload?.orderFields?.intervals) ? payload.orderFields.intervals : [])
      .map((i) => pickStr(i?.value ?? i?.intervalValue ?? i))
      .filter(Boolean);
    await upsertSimpleDict(tx, 'orderIntervalDict', intervalValues, { field: 'value' });

    // remove intervals that are not present (cascade remove their categories)
    const existingIntervals = await tx.orderIntervalDict.findMany({ select: { id: true, value: true } });
    const keepSet = new Set(intervalValues);
    const intervalsToDelete = existingIntervals.filter((i) => !keepSet.has(i.value));
    if (intervalsToDelete.length) {
      const toDeleteIds = intervalsToDelete.map((i) => i.id);
      await tx.orderCategoryDict.deleteMany({ where: { intervalId: { in: toDeleteIds } } });
      await tx.orderIntervalDict.deleteMany({ where: { id: { in: toDeleteIds } } });
    }

    // categories
    const catsIncoming = (Array.isArray(payload?.orderFields?.categories) ? payload.orderFields.categories : [])
      .map((c) => ({
        intervalValue: pickStr(c?.intervalValue ?? c?.categoryInterval ?? c?.interval),
        value: pickStr(c?.value ?? c?.categoryValue),
      }))
      .filter((c) => c.intervalValue && c.value);

    const finalIntervals = await tx.orderIntervalDict.findMany({ select: { id: true, value: true } });
    const intervalByValue = new Map(finalIntervals.map((i) => [i.value, i.id]));

    for (const c of catsIncoming) {
      const intervalId = intervalByValue.get(c.intervalValue);
      if (!intervalId) continue;
      const exists = await tx.orderCategoryDict.findFirst({ where: { value: c.value, intervalId } });
      if (!exists) await tx.orderCategoryDict.create({ data: { value: c.value, intervalId } });
    }
    // remove not desired per interval
    for (const [value, intervalId] of intervalByValue.entries()) {
      const desired = new Set(catsIncoming.filter((c) => c.intervalValue === value).map((c) => c.value));
      await tx.orderCategoryDict.deleteMany({ where: { intervalId, NOT: { value: { in: Array.from(desired) } } } });
    }

    /** ---- EXECUTOR ---- */
    await syncSimpleDict(tx, 'executorRoleDict', arrToUniqueStrings(payload?.executorFields?.role, 'name'));

    /** ---- CLIENT ---- */
    await syncSimpleDict(tx, 'clientSourceDict', arrToUniqueStrings(payload?.clientFields?.source, 'name'));
    await syncSimpleDict(tx, 'clientCategoryDict', arrToUniqueStrings(payload?.clientFields?.category, 'name'));
    await syncSimpleDict(tx, 'country', arrToUniqueStrings(payload?.clientFields?.country, 'name'));
    await syncSimpleDict(tx, 'tag', arrToUniqueStrings(payload?.clientFields?.tag, 'name'), { hasIsActive: false });

    /** ---- ASSETS ---- */
    await syncSimpleDict(tx, 'assetTypeDict', arrToUniqueStrings(payload?.assetsFields?.type, 'name'));
    await syncSimpleDict(tx, 'paymentSystemDict', arrToUniqueStrings(payload?.assetsFields?.paymentSystem, 'name'));

    // card designs
    const incomingDesigns = (Array.isArray(payload?.assetsFields?.cardDesigns) ? payload.assetsFields.cardDesigns : [])
      .map((d) => ({
        id: d?.id || null,
        name: pickStr(d?.name),
        url: typeof d?.url === 'string' ? d.url : '',
      }))
      .filter((d) => d.name);

    const existingDesigns = await tx.cardDesign.findMany({ select: { id: true, name: true, imageUrl: true } });
    const existingById = new Map(existingDesigns.map((d) => [d.id, d]));

    for (const d of incomingDesigns) {
      let imageUrl = d.url;

      if (imageUrl && imageUrl.startsWith('data:image/')) {
        const baseName = `${Date.now()}_${Math.round(Math.random() * 1e9)}`;
        imageUrl = await saveDataUrlToFile(imageUrl, baseName);
      }

      if (d.id && existingById.has(d.id)) {
        const prev = existingById.get(d.id);
        const isNew = imageUrl && imageUrl !== prev.imageUrl;
        await tx.cardDesign.update({
          where: { id: d.id },
          data: { name: d.name, imageUrl: imageUrl || prev.imageUrl || null },
        });
        if (isNew && prev.imageUrl) {
          const abs = urlToAbsPath(prev.imageUrl);
          if (abs) await safeUnlink(abs);
        }
      } else {
        await tx.cardDesign.create({ data: { name: d.name, imageUrl: imageUrl || null } });
      }
    }

    const incomingIds = new Set(incomingDesigns.filter((d) => d.id).map((d) => d.id));
    const toDelete = existingDesigns.filter((d) => !incomingIds.has(d.id));
    if (toDelete.length) {
      for (const d of toDelete) {
        if (d.imageUrl) {
          const abs = urlToAbsPath(d.imageUrl);
          if (abs) await safeUnlink(abs);
        }
      }
      await tx.cardDesign.deleteMany({ where: { id: { in: toDelete.map((d) => d.id) } } });
    }

    /** ---- FINANCE ---- */
    await syncSimpleDict(tx, 'financeArticleDict', arrToUniqueStrings(payload?.financeFields?.articles, 'name'));
    await syncSimpleDict(tx, 'financeSubcategoryDict', arrToUniqueStrings(payload?.financeFields?.subcategory, 'name'));

    const desiredSubs = (Array.isArray(payload?.financeFields?.subarticles) ? payload.financeFields.subarticles : [])
      .map((s) => ({
        parentArticleName: pickStr(s?.articleName ?? s?.subarticleInterval ?? s?.parent),
        parentSubcategoryName: pickStr(s?.subcategoryName),
        name: pickStr(s?.name ?? s?.subarticleValue),
      }))
      .filter((s) => s.name && (s.parentArticleName || s.parentSubcategoryName));

    const [arts, subcats, subsExisting] = await Promise.all([
      tx.financeArticleDict.findMany({ select: { id: true, name: true } }),
      tx.financeSubcategoryDict.findMany({ select: { id: true, name: true } }),
      tx.financeSubarticleDict.findMany({ select: { id: true, name: true, articleId: true, subcategoryId: true } }),
    ]);

    const artByName = new Map(arts.map((a) => [a.name, a.id]));
    const subcatByName = new Map(subcats.map((s) => [s.name, s.id]));

    for (const s of desiredSubs) {
      const articleId = s.parentArticleName ? artByName.get(s.parentArticleName) || null : null;
      const subcategoryId = !articleId && s.parentSubcategoryName ? subcatByName.get(s.parentSubcategoryName) || null : null;
      if (!articleId && !subcategoryId) continue;

      const exists = await tx.financeSubarticleDict.findFirst({
        where: { name: s.name, articleId: articleId || undefined, subcategoryId: subcategoryId || undefined },
      });
      if (!exists) {
        await tx.financeSubarticleDict.create({ data: { name: s.name, articleId, subcategoryId } });
      }
    }

    const keyOf = (row) => `${row.name}|${row.articleId || ''}|${row.subcategoryId || ''}`;
    const desiredKeys = new Set();
    for (const s of desiredSubs) {
      const articleId = s.parentArticleName ? artByName.get(s.parentArticleName) || null : null;
      const subcategoryId = !articleId && s.parentSubcategoryName ? subcatByName.get(s.parentSubcategoryName) || null : null;
      if (!articleId && !subcategoryId) continue;
      desiredKeys.add(`${s.name}|${articleId || ''}|${subcategoryId || ''}`);
    }
    const toDeleteSubs = subsExisting.filter((r) => !desiredKeys.has(keyOf(r)));
    if (toDeleteSubs.length) {
      await tx.financeSubarticleDict.deleteMany({ where: { id: { in: toDeleteSubs.map((r) => r.id) } } });
    }

    // Вернём свежий бандл
    return getAll(tx);
  });
}

/* ==============================
   Простые DAO для makeDictController
   (используются в fields.controller.js)
================================ */

function simpleDictDAO({ model, field = 'name', searchFields = [field] }) {
  return {
    async list({ q, activeOnly } = {}) {
      const where = {};
      if (q && String(q).trim()) {
        const term = String(q).trim();
        where.OR = searchFields.map((f) => ({ [f]: { contains: term, mode: 'insensitive' } }));
      }
      // activeOnly можно расширить под ваши схемы (isActive/archivedAt и т.п.)
      return prisma[model].findMany({ where, orderBy: { [field]: 'asc' } });
    },
    async create(body = {}) {
      const data = {};
      if (body[field] !== undefined) data[field] = body[field];
      if (model === 'currencyDict') {
        if (body.code) data.code = body.code;
        if (body.name) data.name = body.name;
      }
      return prisma[model].create({ data });
    },
    async update(id, body = {}) {
      const data = {};
      if (body[field] !== undefined) data[field] = body[field];
      if (model === 'currencyDict') {
        if (body.code !== undefined) data.code = body.code;
        if (body.name !== undefined) data.name = body.name;
      }
      return prisma[model].update({ where: { id }, data });
    },
    async remove(id/* , { soft } */) {
      return prisma[model].delete({ where: { id } });
    },
  };
}

const Countries         = simpleDictDAO({ model: 'country' });
const Currencies        = simpleDictDAO({ model: 'currencyDict', field: 'name', searchFields: ['code', 'name'] });
const ClientSources     = simpleDictDAO({ model: 'clientSourceDict' });
const ClientCategories  = simpleDictDAO({ model: 'clientCategoryDict' });
const ExecutorRoles     = simpleDictDAO({ model: 'executorRoleDict' });
const AssetTypes        = simpleDictDAO({ model: 'assetTypeDict' });
const PaymentSystems    = simpleDictDAO({ model: 'paymentSystemDict' });
const CardDesigns       = {
  async list() { return prisma.cardDesign.findMany({ orderBy: { name: 'asc' } }); },
  async create(body = {}) {
    let imageUrl = body.imageUrl || body.url || '';
    if (imageUrl && imageUrl.startsWith('data:image/')) {
      imageUrl = await saveDataUrlToFile(imageUrl, `${Date.now()}_${Math.round(Math.random()*1e9)}`);
    }
    return prisma.cardDesign.create({ data: { name: body.name || '', imageUrl: imageUrl || null } });
  },
  async update(id, body = {}) {
    const prev = await prisma.cardDesign.findUnique({ where: { id } });
    let imageUrl = body.imageUrl ?? body.url ?? prev?.imageUrl ?? null;

    if (typeof imageUrl === 'string' && imageUrl.startsWith('data:image/')) {
      const newUrl = await saveDataUrlToFile(imageUrl, `${Date.now()}_${Math.round(Math.random()*1e9)}`);
      if (prev?.imageUrl && newUrl && newUrl !== prev.imageUrl) {
        const abs = urlToAbsPath(prev.imageUrl);
        if (abs) await safeUnlink(abs);
      }
      imageUrl = newUrl;
    }
    return prisma.cardDesign.update({ where: { id }, data: { name: body.name ?? prev?.name ?? '', imageUrl } });
  },
  async remove(id) {
    const prev = await prisma.cardDesign.findUnique({ where: { id } });
    if (prev?.imageUrl) {
      const abs = urlToAbsPath(prev.imageUrl);
      if (abs) await safeUnlink(abs);
    }
    return prisma.cardDesign.delete({ where: { id } });
  },
};

const OrderIntervals    = simpleDictDAO({ model: 'orderIntervalDict', field: 'value' });
const OrderCategories   = {
  async list({ q } = {}) {
    const where = {};
    if (q && String(q).trim()) {
      const term = String(q).trim();
      where.OR = [{ value: { contains: term, mode: 'insensitive' } }];
    }
    return prisma.orderCategoryDict.findMany({
      where,
      select: { id: true, value: true, intervalId: true },
      orderBy: [{ interval: { value: 'asc' } }, { value: 'asc' }],
    });
  },
  async listByInterval(intervalId, { activeOnly } = {}) {
    return prisma.orderCategoryDict.findMany({
      where: { intervalId },
      select: { id: true, value: true, intervalId: true },
      orderBy: { value: 'asc' },
    });
  },
  async create(body = {}) {
    const value = pickStr(body?.value ?? body?.name);
    const intervalId = body?.intervalId;
    if (!value || !intervalId) throw Object.assign(new Error('value and intervalId required'), { status: 400 });
    return prisma.orderCategoryDict.create({ data: { value, intervalId } });
  },
  async update(id, body = {}) {
    const data = {};
    if (body?.value !== undefined) data.value = pickStr(body.value);
    if (body?.intervalId !== undefined) data.intervalId = body.intervalId;
    return prisma.orderCategoryDict.update({ where: { id }, data });
  },
  async remove(id) {
    return prisma.orderCategoryDict.delete({ where: { id } });
  },
};

const FinanceArticles       = simpleDictDAO({ model: 'financeArticleDict' });
const FinanceSubcategories  = simpleDictDAO({ model: 'financeSubcategoryDict' });
const FinanceSubarticles    = {
  async list({ q } = {}) {
    const where = {};
    if (q && String(q).trim()) {
      const term = String(q).trim();
      where.OR = [{ name: { contains: term, mode: 'insensitive' } }];
    }
    return prisma.financeSubarticleDict.findMany({
      where,
      select: {
        id: true,
        name: true,
        articleId: true,
        subcategoryId: true,
        article: { select: { id: true, name: true } },
        subcategory: { select: { id: true, name: true } },
      },
      orderBy: [{ article: { name: 'asc' } }, { name: 'asc' }],
    });
  },
  async listByArticle(articleId, { activeOnly } = {}) {
    return prisma.financeSubarticleDict.findMany({
      where: { articleId },
      select: { id: true, name: true, articleId: true, subcategoryId: true },
      orderBy: { name: 'asc' },
    });
  },
  async listBySubcategory(subcategoryId, { activeOnly } = {}) {
    return prisma.financeSubarticleDict.findMany({
      where: { subcategoryId },
      select: { id: true, name: true, articleId: true, subcategoryId: true },
      orderBy: { name: 'asc' },
    });
  },
  async create(body = {}) {
    const name = pickStr(body?.name);
    const articleId = body?.articleId || null;
    const subcategoryId = body?.subcategoryId || null;
    if (!name || (!articleId && !subcategoryId)) {
      throw Object.assign(new Error('name and (articleId OR subcategoryId) required'), { status: 400 });
    }
    return prisma.financeSubarticleDict.create({ data: { name, articleId, subcategoryId } });
  },
  async update(id, body = {}) {
    const data = {};
    if (body?.name !== undefined) data.name = pickStr(body.name);
    if (body?.articleId !== undefined) data.articleId = body.articleId || null;
    if (body?.subcategoryId !== undefined) data.subcategoryId = body.subcategoryId || null;
    return prisma.financeSubarticleDict.update({ where: { id }, data });
  },
  async remove(id) {
    return prisma.financeSubarticleDict.delete({ where: { id } });
  },
};

/* ==============================
   Exports
================================ */
module.exports = {
  // bundle
  loadBundle: () => getAll(),
  saveBundle: (payload) => saveAll(payload),

  // expose for internal use / tests as well
  getAll,
  saveAll,

  // DAOs for makeDictController
  Countries,
  Currencies,
  ClientSources,
  ClientCategories,
  ExecutorRoles,
  AssetTypes,
  PaymentSystems,
  CardDesigns,
  OrderIntervals,
  OrderCategories,
  FinanceArticles,
  FinanceSubcategories,
  FinanceSubarticles,
};
