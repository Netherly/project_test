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
  try {
    await fs.promises.unlink(absPath);
  } catch (_) {}
}

function urlToAbsPath(url) {
  if (!url || !url.startsWith('/uploads/')) return null;
  return path.join(UPLOADS_ROOT, url.replace('/uploads/', ''));
}

/* ==============================
   Helpers
================================ */
const pickStr = (v) => {
  if (typeof v === 'string') return v.trim();
  if (v && typeof v === 'object') {
    const candidate =
      v.value ??
      v.name ??
      v.code ??
      v.articleValue ??
      v.categoryValue ??
      v.subarticleValue ??
      v.intervalValue ??
      v.categoryInterval ??
      v.subarticleInterval ??
      v.label ??
      '';
    return String(candidate).trim();
  }
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

const isHexColor = (c) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(c || ''));

const normalizeSimpleValues = (list) => {
  const out = new Set();
  (Array.isArray(list) ? list : []).forEach((value) => {
    let v = value;
    if (v && typeof v === 'object') {
      v =
        v.value ??
        v.name ??
        v.code ??
        v.articleValue ??
        v.categoryValue ??
        v.subarticleValue ??
        v.intervalValue ??
        v.categoryInterval ??
        v.subarticleInterval ??
        v.label ??
        '';
    }
    if (v !== undefined && v !== null) {
      const s = String(v).trim();
      if (s) out.add(s);
    }
  });
  return Array.from(out);
};

const syncSimpleDict = async (tx, model, list, opts = {}) => {
  const field = opts.field || 'name';
  const hasIsActive = opts.hasIsActive !== false;
  const values = normalizeSimpleValues(list);
  const dbModel = tx[model];

  if (!dbModel) return;

  if (!values || !values.length) {
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
        update: { ...(hasIsActive ? { isActive: true } : {}) },
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
   Tags (единая версия)
================================ */
async function ensureTagCategory(tx, code, name) {
  return tx.tagCategory.upsert({
    where: { code },
    update: { name },
    create: { code, name },
  });
}

async function upsertTags(
  tx,
  tagsList,
  { categoryCode = 'default', categoryName = 'General' } = {}
) {
  const tagCategory = await ensureTagCategory(tx, categoryCode, categoryName);

  const items = Array.isArray(tagsList) ? tagsList : [];
  const desiredNames = new Set();

  for (const t of items) {
    const name = pickStr(t?.name ?? t);
    if (!name) continue;
    const color = isHexColor(t?.color) ? t.color : '#ffffff';
    desiredNames.add(name);

    await tx.tag.upsert({
      where: { name_categoryId: { name, categoryId: tagCategory.id } },
      update: { color },
      create: { id: rid(), name, color, categoryId: tagCategory.id },
    });
  }

  await tx.tag.deleteMany({
    where: {
      categoryId: tagCategory.id,
      name: { notIn: Array.from(desiredNames) },
    },
  });

  return tx.tag.findMany({ where: { categoryId: tagCategory.id }, orderBy: { name: 'asc' } });
}

/* ==============================
   GET ACTIVE (Загрузка активных)
================================ */
async function getAll(db) {
  const _db = db || prisma;
  const whereActive = { where: { isActive: true } };
  const whereActiveHardDelete = {};

  const [
    orderCurrencies,
    countries,
    roles,
    sources,
    clientCategories,
    clientGroups,
    orderStatuses,
    orderCloseReasons,
    orderProjects,
    orderDiscountReasons,
    assetTypes,
    paymentSystems,
    articles,
    subcategories,
    typeWorks,
  ] = await Promise.all([
    _db.currencyDict.findMany({ ...whereActive, orderBy: { code: 'asc' } }),
    _db.country.findMany({ ...whereActive, orderBy: { name: 'asc' } }),
    _db.executorRoleDict.findMany({ ...whereActive, orderBy: { name: 'asc' } }),
    _db.clientSourceDict.findMany({ ...whereActive, orderBy: { name: 'asc' } }),
    _db.clientCategoryDict.findMany({ ...whereActive, orderBy: { name: 'asc' } }),
    _db.clientGroup.findMany({ orderBy: { order: 'asc' } }),
    _db.orderStatusDict ? _db.orderStatusDict.findMany({ ...whereActive, orderBy: { order: 'asc' } }) : [],
    _db.orderCloseReasonDict
      ? _db.orderCloseReasonDict.findMany({ ...whereActive, orderBy: { order: 'asc' } })
      : [],
    _db.orderProjectDict ? _db.orderProjectDict.findMany({ ...whereActive, orderBy: { order: 'asc' } }) : [],
    _db.orderDiscountReasonDict
      ? _db.orderDiscountReasonDict.findMany({ ...whereActive, orderBy: { order: 'asc' } })
      : [],
    _db.assetTypeDict.findMany({ ...whereActive, orderBy: { name: 'asc' } }),
    _db.paymentSystemDict.findMany({ ...whereActive, orderBy: { name: 'asc' } }),
    _db.financeArticleDict.findMany({ ...whereActive, orderBy: { name: 'asc' } }),
    _db.financeSubcategoryDict.findMany({ ...whereActive, orderBy: { name: 'asc' } }),
    _db.sundryTypeWorkDict
      ? _db.sundryTypeWorkDict.findMany({ ...whereActive, orderBy: { name: 'asc' } })
      : [],
  ]);

  const [intervals, orderCats, cardDesigns, subarticles, tagCategories] = await Promise.all([
    _db.orderIntervalDict.findMany({ ...whereActiveHardDelete, orderBy: { value: 'asc' } }),
    _db.orderCategoryDict.findMany({
      ...whereActiveHardDelete,
      select: { id: true, value: true, interval: { select: { id: true, value: true } } },
      orderBy: [{ interval: { value: 'asc' } }, { value: 'asc' }],
    }),
    _db.cardDesign.findMany({ ...whereActiveHardDelete, orderBy: { name: 'asc' } }),
    _db.financeSubarticleDict.findMany({
      ...whereActiveHardDelete,
      select: {
        id: true,
        name: true,
        article: { select: { id: true, name: true } },
        subcategory: { select: { id: true, name: true } },
      },
      orderBy: [{ article: { name: 'asc' } }, { name: 'asc' }],
    }),
    _db.tagCategory.findMany({ select: { id: true, code: true } }),
  ]);

  const tagCategoryByCode = new Map(tagCategories.map((c) => [c.code, c.id]));
  const tagsByCode = async (code) => {
    const categoryId = tagCategoryByCode.get(code);
    if (!categoryId) return [];
    return _db.tag.findMany({ where: { categoryId }, orderBy: { name: 'asc' } });
  };

  const [
    orderTags,
    orderTechTags,
    orderTaskTags,
    clientTags,
    companyTags,
    employeeTags,
    taskTags,
  ] = await Promise.all([
    tagsByCode('order'),
    tagsByCode('order-tech'),
    tagsByCode('order-task'),
    tagsByCode('client'),
    tagsByCode('company'),
    tagsByCode('employee'),
    tagsByCode('task'),
  ]);

  const mapTags = (list) => list.map((t) => ({ id: t.id, name: t.name, color: t.color }));

  return {
    generalFields: {
      currency: orderCurrencies.map((c) => ({ id: c.id, code: c.code, name: c.name || c.code })),
    },

    orderFields: {
      intervals: intervals.map((x) => ({ id: x.id, value: x.value })),
      categories: orderCats.map((x) => ({
        id: x.id,
        value: x.value,
        intervalId: x.interval?.id || null,
        intervalValue: x.interval?.value || null,
      })),
      currency: orderCurrencies.map((c) => ({ id: c.id, code: c.code, name: c.name || c.code })),
      statuses: orderStatuses.map((s) => ({ id: s.id, name: s.name })),
      closeReasons: orderCloseReasons.map((r) => ({ id: r.id, name: r.name })),
      projects: orderProjects.map((p) => ({ id: p.id, name: p.name })),
      discountReason: orderDiscountReasons.map((d) => ({ id: d.id, name: d.name })),
      tags: mapTags(orderTags),
      techTags: mapTags(orderTechTags),
      taskTags: mapTags(orderTaskTags),
    },

    executorFields: {
      currency: orderCurrencies.map((c) => ({ id: c.id, code: c.code, name: c.name || c.code })),
      role: roles.map((r) => ({ id: r.id, name: r.name })),
    },

    clientFields: {
      source: sources.map((s) => ({ id: s.id, name: s.name })),
      category: clientCategories.map((c) => ({ id: c.id, name: c.name })),
      country: countries.map((c) => ({ id: c.id, name: c.name })),
      currency: orderCurrencies.map((c) => ({ id: c.id, code: c.code, name: c.name || c.code })),
      tags: mapTags(clientTags),
      groups: clientGroups.map((g) => ({ id: g.id, name: g.name, order: g.order })),
    },

    companyFields: {
      tags: mapTags(companyTags),
    },

    employeeFields: {
      country: countries.map((c) => ({ id: c.id, name: c.name })),
      tags: mapTags(employeeTags),
    },

    assetsFields: {
      currency: orderCurrencies.map((c) => ({ id: c.id, code: c.code, name: c.name || c.code })),
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
        subarticleInterval: s.article?.name || s.subcategory?.name || null,
      })),
      subcategory: subcategories.map((s) => ({ id: s.id, name: s.name })),
    },

    taskFields: {
      tags: mapTags(taskTags),
    },

    sundryFields: {
      typeWork: typeWorks.map((t) => ({ id: t.id, name: t.name })),
    },
  };
}

/* ==============================
   GET INACTIVE (Загрузка скрытых)
================================ */
async function getInactive(db) {
  const _db = db || prisma;
  const whereInactive = { where: { isActive: false } };

  const [
    currencies,
    countries,
    roles,
    sources,
    clientCategories,
    assetTypes,
    paymentSystems,
    articles,
    subcategories,
    discountReasons,
    typeWorks,
  ] = await Promise.all([
    _db.currencyDict.findMany({ ...whereInactive, orderBy: { code: 'asc' } }),
    _db.country.findMany({ ...whereInactive, orderBy: { name: 'asc' } }),
    _db.executorRoleDict.findMany({ ...whereInactive, orderBy: { name: 'asc' } }),
    _db.clientSourceDict.findMany({ ...whereInactive, orderBy: { name: 'asc' } }),
    _db.clientCategoryDict.findMany({ ...whereInactive, orderBy: { name: 'asc' } }),
    _db.assetTypeDict.findMany({ ...whereInactive, orderBy: { name: 'asc' } }),
    _db.paymentSystemDict.findMany({ ...whereInactive, orderBy: { name: 'asc' } }),
    _db.financeArticleDict.findMany({ ...whereInactive, orderBy: { name: 'asc' } }),
    _db.financeSubcategoryDict.findMany({ ...whereInactive, orderBy: { name: 'asc' } }),
    _db.orderDiscountReasonDict
      ? _db.orderDiscountReasonDict.findMany({ ...whereInactive, orderBy: { name: 'asc' } })
      : [],
    _db.sundryTypeWorkDict
      ? _db.sundryTypeWorkDict.findMany({ ...whereInactive, orderBy: { name: 'asc' } })
      : [],
  ]);

  const emptyArr = [];

  return {
    generalFields: {
      currency: currencies.map((c) => ({ id: c.id, code: c.code, name: c.name || c.code })),
    },
    orderFields: {
      intervals: emptyArr,
      categories: emptyArr,
      currency: currencies.map((c) => ({ id: c.id, code: c.code, name: c.name || c.code })),
      discountReason: discountReasons.map((r) => ({ id: r.id, name: r.name })),
      tags: emptyArr,
      techTags: emptyArr,
      taskTags: emptyArr,
      statuses: emptyArr,
      closeReasons: emptyArr,
      projects: emptyArr,
    },
    executorFields: {
      currency: currencies.map((c) => ({ id: c.id, code: c.code, name: c.name || c.code })),
      role: roles.map((r) => ({ id: r.id, name: r.name })),
    },
    clientFields: {
      source: sources.map((s) => ({ id: s.id, name: s.name })),
      category: clientCategories.map((c) => ({ id: c.id, name: c.name })),
      country: countries.map((c) => ({ id: c.id, name: c.name })),
      currency: currencies.map((c) => ({ id: c.id, code: c.code, name: c.name || c.code })),
      tags: emptyArr,
      groups: emptyArr,
    },
    companyFields: {
      tags: emptyArr,
    },
    employeeFields: {
      country: countries.map((c) => ({ id: c.id, name: c.name })),
      tags: emptyArr,
    },
    assetsFields: {
      currency: currencies.map((c) => ({ id: c.id, code: c.code, name: c.name || c.code })),
      type: assetTypes.map((t) => ({ id: t.id, name: t.name })),
      paymentSystem: paymentSystems.map((p) => ({ id: p.id, name: p.name })),
      cardDesigns: emptyArr,
    },
    financeFields: {
      articles: articles.map((a) => ({ id: a.id, name: a.name })),
      subarticles: emptyArr,
      subcategory: subcategories.map((s) => ({ id: s.id, name: s.name })),
    },
    sundryFields: {
      typeWork: typeWorks.map((t) => ({ id: t.id, name: t.name })),
    },
    taskFields: {
      tags: emptyArr,
    },
  };
}

/* ==============================
   PUT (Сохранение)
================================ */
async function saveAll(payload) {
  return prisma.$transaction(
    async (tx) => {
      // 1. ВАЛЮТЫ
      const allCurrencyCodes = new Set([
        ...arrToUniqueStrings(payload?.generalFields?.currency, 'code'),
        ...arrToUniqueStrings(payload?.orderFields?.currency, 'code'),
        ...arrToUniqueStrings(payload?.executorFields?.currency, 'code'),
        ...arrToUniqueStrings(payload?.clientFields?.currency, 'code'),
        ...arrToUniqueStrings(payload?.assetsFields?.currency, 'code'),
      ]);
      await syncSimpleDict(tx, 'currencyDict', Array.from(allCurrencyCodes), { field: 'code' });

      // 2. ЗАКАЗЫ (Интервалы и категории)
      const intervalValues = (Array.isArray(payload?.orderFields?.intervals) ? payload.orderFields.intervals : [])
        .map((i) => pickStr(i?.value ?? i?.intervalValue ?? i))
        .filter(Boolean);

      await syncSimpleDict(tx, 'orderIntervalDict', intervalValues, { field: 'value' });

      const existingIntervals = await tx.orderIntervalDict.findMany({ select: { id: true, value: true } });
      const keepSet = new Set(intervalValues);
      const intervalsToDeactivate = existingIntervals.filter((i) => !keepSet.has(i.value));
      if (intervalsToDeactivate.length) {
        const toDeactivateIds = intervalsToDeactivate.map((i) => i.id);
        await tx.orderCategoryDict.updateMany({
          where: { intervalId: { in: toDeactivateIds } },
          data: { isActive: false },
        });
        await tx.orderIntervalDict.updateMany({
          where: { id: { in: toDeactivateIds } },
          data: { isActive: false },
        });
      }

      const catsIncoming = (Array.isArray(payload?.orderFields?.categories) ? payload.orderFields.categories : [])
        .map((c) => ({
          intervalValue: pickStr(c?.intervalValue ?? c?.categoryInterval ?? c?.interval),
          value: pickStr(c?.value ?? c?.categoryValue),
        }))
        .filter((c) => c.intervalValue && c.value);

      const finalIntervals = await tx.orderIntervalDict.findMany({ select: { id: true, value: true } });
      const intervalByValue = new Map(finalIntervals.map((i) => [i.value, i.id]));

      for (const c of catsIncoming) {
        if (!intervalByValue.has(c.intervalValue)) {
          const created = await tx.orderIntervalDict.create({ data: { value: c.intervalValue } });
          intervalByValue.set(created.value, created.id);
        }
      }

      for (const c of catsIncoming) {
        const intervalId = intervalByValue.get(c.intervalValue);
        if (!intervalId) continue;
        const exists = await tx.orderCategoryDict.findFirst({ where: { value: c.value, intervalId } });
        if (!exists) {
          await tx.orderCategoryDict.create({ data: { value: c.value, intervalId } });
        }
      }

      for (const [value, intervalId] of intervalByValue.entries()) {
        const desired = new Set(catsIncoming.filter((c) => c.intervalValue === value).map((c) => c.value));

        await tx.orderCategoryDict.updateMany({
          where: { intervalId, NOT: { value: { in: Array.from(desired) } } },
          data: { isActive: false },
        });

        await tx.orderCategoryDict.updateMany({
          where: { intervalId, value: { in: Array.from(desired) } },
          data: { isActive: true },
        });
      }

      // 3. Справочники заказов
      if (tx.orderStatusDict) {
        await syncSimpleDict(tx, 'orderStatusDict', arrToUniqueStrings(payload?.orderFields?.statuses, 'name'));
      }
      if (tx.orderCloseReasonDict) {
        await syncSimpleDict(
          tx,
          'orderCloseReasonDict',
          arrToUniqueStrings(payload?.orderFields?.closeReasons, 'name')
        );
      }
      if (tx.orderProjectDict) {
        await syncSimpleDict(tx, 'orderProjectDict', arrToUniqueStrings(payload?.orderFields?.projects, 'name'));
      }
      if (tx.orderDiscountReasonDict) {
        await syncSimpleDict(
          tx,
          'orderDiscountReasonDict',
          arrToUniqueStrings(payload?.orderFields?.discountReason, 'name')
        );
      }

      // 4. EXECUTOR
      await syncSimpleDict(tx, 'executorRoleDict', arrToUniqueStrings(payload?.executorFields?.role, 'name'));

      // 5. CLIENTS
      await syncSimpleDict(tx, 'clientSourceDict', arrToUniqueStrings(payload?.clientFields?.source, 'name'));
      await syncSimpleDict(tx, 'clientCategoryDict', arrToUniqueStrings(payload?.clientFields?.category, 'name'));
      await syncSimpleDict(tx, 'country', arrToUniqueStrings(payload?.clientFields?.country, 'name'));

      // 6. TAGS (единая система через TagCategory+Tag)
      await Promise.all([
        upsertTags(tx, payload?.orderFields?.tags, { categoryCode: 'order', categoryName: 'Order' }),
        upsertTags(tx, payload?.orderFields?.techTags, { categoryCode: 'order-tech', categoryName: 'Order Tech' }),
        upsertTags(tx, payload?.orderFields?.taskTags, { categoryCode: 'order-task', categoryName: 'Order Task' }),
        upsertTags(tx, payload?.clientFields?.tags ?? payload?.clientFields?.tag, {
          categoryCode: 'client',
          categoryName: 'Client',
        }),
        upsertTags(tx, payload?.companyFields?.tags, { categoryCode: 'company', categoryName: 'Company' }),
        upsertTags(tx, payload?.employeeFields?.tags, { categoryCode: 'employee', categoryName: 'Employee' }),
        upsertTags(tx, payload?.taskFields?.tags, { categoryCode: 'task', categoryName: 'Task' }),
      ]);

      // 7. ASSETS
      await syncSimpleDict(tx, 'assetTypeDict', arrToUniqueStrings(payload?.assetsFields?.type, 'name'));
      await syncSimpleDict(tx, 'paymentSystemDict', arrToUniqueStrings(payload?.assetsFields?.paymentSystem, 'name'));

      const incomingDesigns = (Array.isArray(payload?.assetsFields?.cardDesigns) ? payload.assetsFields.cardDesigns : [])
        .map((d) => ({
          id: d?.id || null,
          name: pickStr(d?.name),
          url: typeof d?.url === 'string' ? d.url : '',
        }))
        .filter((d) => d.name);

      const existingDesigns = await tx.cardDesign.findMany({
        select: { id: true, name: true, imageUrl: true, isActive: true },
      });
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
            data: { name: d.name, imageUrl: imageUrl || prev.imageUrl || null, isActive: true },
          });

          if (isNew && prev.imageUrl) {
            const abs = urlToAbsPath(prev.imageUrl);
            if (abs) await safeUnlink(abs);
          }
        } else {
          await tx.cardDesign.create({ data: { name: d.name, imageUrl: imageUrl || null, isActive: true } });
        }
      }

      const incomingIds = new Set(incomingDesigns.filter((d) => d.id).map((d) => d.id));
      const toDeactivate = existingDesigns.filter((d) => !incomingIds.has(d.id));
      if (toDeactivate.length) {
        await tx.cardDesign.updateMany({
          where: { id: { in: toDeactivate.map((d) => d.id) } },
          data: { isActive: false },
        });
      }

      // 8. FINANCE
      await syncSimpleDict(tx, 'financeArticleDict', arrToUniqueStrings(payload?.financeFields?.articles, 'name'));
      await syncSimpleDict(
        tx,
        'financeSubcategoryDict',
        arrToUniqueStrings(payload?.financeFields?.subcategory, 'name')
      );

      const desiredSubs = (Array.isArray(payload?.financeFields?.subarticles) ? payload.financeFields.subarticles : [])
        .map((s) => ({
          parentName: pickStr(s?.parentName ?? s?.subarticleInterval ?? s?.parent),
          name: pickStr(s?.name ?? s?.subarticleValue),
        }))
        .filter((s) => s.name && s.parentName);

      const [arts, subcats, subsExisting] = await Promise.all([
        tx.financeArticleDict.findMany({ select: { id: true, name: true } }),
        tx.financeSubcategoryDict.findMany({ select: { id: true, name: true } }),
        tx.financeSubarticleDict.findMany({ select: { id: true, name: true, articleId: true, subcategoryId: true } }),
      ]);

      const artByName = new Map(arts.map((a) => [a.name, a.id]));
      const subcatByName = new Map(subcats.map((s) => [s.name, s.id]));

      for (const s of desiredSubs) {
        const articleId = artByName.get(s.parentName) || null;
        const subcategoryId = !articleId ? subcatByName.get(s.parentName) || null : null;
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
        const articleId = artByName.get(s.parentName) || null;
        const subcategoryId = !articleId ? subcatByName.get(s.parentName) || null : null;
        if (!articleId && !subcategoryId) continue;
        desiredKeys.add(`${s.name}|${articleId || ''}|${subcategoryId || ''}`);
      }

      const toDeactivateSubs = subsExisting.filter((r) => !desiredKeys.has(keyOf(r)));
      if (toDeactivateSubs.length) {
        await tx.financeSubarticleDict.updateMany({
          where: { id: { in: toDeactivateSubs.map((r) => r.id) } },
          data: { isActive: false },
        });
      }

      const desiredIds = subsExisting.filter((r) => desiredKeys.has(keyOf(r))).map((r) => r.id);
      if (desiredIds.length) {
        await tx.financeSubarticleDict.updateMany({
          where: { id: { in: desiredIds } },
          data: { isActive: true },
        });
      }

      // 9. SUNDRY
      if (tx.sundryTypeWorkDict) {
        await syncSimpleDict(
          tx,
          'sundryTypeWorkDict',
          arrToUniqueStrings(payload?.sundryFields?.typeWork, 'name')
        );
      }

      return getAll(tx);
    },
    { maxWait: 20000, timeout: 60000 }
  );
}

module.exports = {
  loadBundle: () => getAll(),
  saveBundle: (payload) => saveAll(payload),
  loadInactiveBundle: () => getInactive(),
  getAll,
  saveAll,
  getInactive,
};
