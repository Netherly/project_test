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
   Helpers
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

/**
 * Логика сохранения ТЕГОВ через TagCategory
 */
const syncTagsWithCategory = async (tx, categoryCode, categoryName, tagsList) => {
    if (!tagsList || !Array.isArray(tagsList)) return;

    let category = await tx.tagCategory.findUnique({ where: { code: categoryCode } });
    if (!category) {
        category = await tx.tagCategory.create({
            data: { 
                id: rid(), 
                code: categoryCode, 
                name: categoryName 
            }
        });
    }

    const categoryId = category.id;
    const activeIds = [];

    for (const t of tagsList) {
        const name = pickStr(t.name);
        const color = t.color || '#ffffff';
        if (!name) continue;

        const existing = await tx.tag.findFirst({
            where: { name: name, categoryId: categoryId }
        });

        if (existing) {
            await tx.tag.update({
                where: { id: existing.id },
                data: { color: color }
            });
            activeIds.push(existing.id);
        } else {
            const created = await tx.tag.create({
                data: {
                    id: rid(),
                    name,
                    color,
                    categoryId
                }
            });
            activeIds.push(created.id);
        }
    }

    await tx.tag.deleteMany({
        where: {
            categoryId: categoryId,
            id: { notIn: activeIds }
        }
    });
};

const loadTagsByCategory = async (db, categoryCode) => {
    const category = await db.tagCategory.findUnique({ where: { code: categoryCode } });
    if (!category) return [];
    
    const tags = await db.tag.findMany({
        where: { categoryId: category.id },
        orderBy: { name: 'asc' }
    });
    return tags.map(t => ({ id: t.id, name: t.name, color: t.color }));
};


/* ==============================
   GET ACTIVE (Загрузка активных)
================================ */
async function getAll(db) {
  const _db = db || prisma;
  const whereActive = { where: { isActive: true } };
  const whereActiveHardDelete = {}; 

  const [
    orderCurrencies, countries, roles, sources, clientCategories, 
    assetTypes, paymentSystems, articles, subcategories,
    discountReasons, typeWorks
  ] = await Promise.all([
    _db.currencyDict.findMany({ ...whereActive, orderBy: { code: 'asc' } }),
    _db.country.findMany({ ...whereActive, orderBy: { name: 'asc' } }),
    _db.executorRoleDict.findMany({ ...whereActive, orderBy: { name: 'asc' } }),
    _db.clientSourceDict.findMany({ ...whereActive, orderBy: { name: 'asc' } }),
    _db.clientCategoryDict.findMany({ ...whereActive, orderBy: { name: 'asc' } }),
    _db.assetTypeDict.findMany({ ...whereActive, orderBy: { name: 'asc' } }),
    _db.paymentSystemDict.findMany({ ...whereActive, orderBy: { name: 'asc' } }),
    _db.financeArticleDict.findMany({ ...whereActive, orderBy: { name: 'asc' } }),
    _db.financeSubcategoryDict.findMany({ ...whereActive, orderBy: { name: 'asc' } }),
    
    _db.orderDiscountReasonDict ? _db.orderDiscountReasonDict.findMany({ ...whereActive, orderBy: { name: 'asc' } }) : [],
    _db.sundryTypeWorkDict ? _db.sundryTypeWorkDict.findMany({ ...whereActive, orderBy: { name: 'asc' } }) : [],
  ]);

  const [intervals, orderCats, cardDesigns, subarticles] = await Promise.all([
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
        id: true, name: true,
        article: { select: { id: true, name: true } },
        subcategory: { select: { id: true, name: true } },
      },
      orderBy: [{ article: { name: 'asc' } }, { name: 'asc' }],
    }),
  ]);

  const orderTags = await loadTagsByCategory(_db, 'ORDER');
  const techTags = await loadTagsByCategory(_db, 'TECH');
  const taskTags = await loadTagsByCategory(_db, 'TASK');
  const clientTags = await loadTagsByCategory(_db, 'CLIENT');
  const companyTags = await loadTagsByCategory(_db, 'COMPANY');
  const employeeTags = await loadTagsByCategory(_db, 'EMPLOYEE');

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
      discountReason: discountReasons ? discountReasons.map(r => ({ id: r.id, name: r.name })) : [],
      tags: orderTags,
      techTags: techTags,
      taskTags: taskTags,
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
      tags: clientTags,
    },
    companyFields: {
        tags: companyTags,
    },
    employeeFields: {
      country: countries.map((c) => ({ id: c.id, name: c.name })),
      tags: employeeTags,
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
        subarticleInterval: s.article?.name || s.subcategory?.name || null
      })),
      subcategory: subcategories.map((s) => ({ id: s.id, name: s.name })),
    },
    sundryFields: {
        typeWork: typeWorks ? typeWorks.map(t => ({ id: t.id, name: t.name })) : [],
    },
    taskFields: {
        tags: taskTags,
    }
  };
}

/* ==============================
   GET INACTIVE (Загрузка скрытых)
   !!! ВОТ ЭТОЙ ФУНКЦИИ НЕ ХВАТАЛО !!!
================================ */
async function getInactive(db) {
  const _db = db || prisma;
  const whereInactive = { where: { isActive: false } };
  
  // Теги и CardDesigns удаляются жестко, их не возвращаем в inactive (либо возвращаем [], если нужно)
  // Сложные структуры (OrderCategories) также удаляются жестко в коде saveAll. 
  // Но простые справочники имеют флаг isActive.

  const [
    currencies, countries, roles, sources, clientCategories, 
    assetTypes, paymentSystems, articles, subcategories,
    discountReasons, typeWorks
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
    
    _db.orderDiscountReasonDict ? _db.orderDiscountReasonDict.findMany({ ...whereInactive, orderBy: { name: 'asc' } }) : [],
    _db.sundryTypeWorkDict ? _db.sundryTypeWorkDict.findMany({ ...whereInactive, orderBy: { name: 'asc' } }) : [],
  ]);

  // Заглушки для тегов и сложных полей, которые удаляются жестко
  const emptyArr = [];

  return {
    generalFields: {
        currency: currencies.map((c) => ({ id: c.id, code: c.code, name: c.name || c.code })),
    },
    orderFields: {
      intervals: emptyArr,
      categories: emptyArr,
      currency: currencies.map((c) => ({ id: c.id, code: c.code, name: c.name || c.code })),
      discountReason: discountReasons ? discountReasons.map(r => ({ id: r.id, name: r.name })) : [],
      tags: emptyArr,
      techTags: emptyArr,
      taskTags: emptyArr,
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
        typeWork: typeWorks ? typeWorks.map(t => ({ id: t.id, name: t.name })) : [],
    },
    taskFields: {
        tags: emptyArr,
    }
  };
}

/* ==============================
   PUT (Сохранение)
================================ */
async function saveAll(payload) {
  return prisma.$transaction(async (tx) => {
    
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
    const intervalsToDelete = existingIntervals.filter((i) => !keepSet.has(i.value));
    if (intervalsToDelete.length) {
      const toDeleteIds = intervalsToDelete.map((i) => i.id);
      await tx.orderCategoryDict.deleteMany({ where: { intervalId: { in: toDeleteIds } } });
      await tx.orderIntervalDict.deleteMany({ where: { id: { in: toDeleteIds } } });
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
      const intervalId = intervalByValue.get(c.intervalValue);
      if (!intervalId) continue; 
      
      const exists = await tx.orderCategoryDict.findFirst({ where: { value: c.value, intervalId } });
      if (!exists) {
          await tx.orderCategoryDict.create({ data: { value: c.value, intervalId } });
      }
    }
    
    for (const [value, intervalId] of intervalByValue.entries()) {
      const desired = new Set(catsIncoming.filter((c) => c.intervalValue === value).map((c) => c.value));
      await tx.orderCategoryDict.deleteMany({ where: { intervalId, NOT: { value: { in: Array.from(desired) } } } });
    }

    // 3. ПРИЧИНЫ СКИДОК
    if(tx.orderDiscountReasonDict) {
        await syncSimpleDict(tx, 'orderDiscountReasonDict', arrToUniqueStrings(payload?.orderFields?.discountReason, 'name'));
    }

    // 4. ТЕГИ
    await syncTagsWithCategory(tx, 'ORDER', 'Заказы', payload?.orderFields?.tags);
    await syncTagsWithCategory(tx, 'TECH', 'Технологии', payload?.orderFields?.techTags);
    await syncTagsWithCategory(tx, 'TASK', 'Задачи', payload?.orderFields?.taskTags);
    
    // 5. ИСПОЛНИТЕЛИ
    await syncSimpleDict(tx, 'executorRoleDict', arrToUniqueStrings(payload?.executorFields?.role, 'name'));

    // 6. КЛИЕНТЫ
    await syncSimpleDict(tx, 'clientSourceDict', arrToUniqueStrings(payload?.clientFields?.source, 'name'));
    await syncSimpleDict(tx, 'clientCategoryDict', arrToUniqueStrings(payload?.clientFields?.category, 'name'));
    await syncSimpleDict(tx, 'country', arrToUniqueStrings(payload?.clientFields?.country, 'name'));
    
    await syncTagsWithCategory(tx, 'CLIENT', 'Клиенты', payload?.clientFields?.tags);

    // 7. КОМПАНИИ
    await syncTagsWithCategory(tx, 'COMPANY', 'Компании', payload?.companyFields?.tags);

    // 8. СОТРУДНИКИ
    await syncTagsWithCategory(tx, 'EMPLOYEE', 'Сотрудники', payload?.employeeFields?.tags);

    // 9. АКТИВЫ
    await syncSimpleDict(tx, 'assetTypeDict', arrToUniqueStrings(payload?.assetsFields?.type, 'name'));
    await syncSimpleDict(tx, 'paymentSystemDict', arrToUniqueStrings(payload?.assetsFields?.paymentSystem, 'name'));

    // Дизайн карт
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

    // 10. ФИНАНСЫ
    await syncSimpleDict(tx, 'financeArticleDict', arrToUniqueStrings(payload?.financeFields?.articles, 'name'));
    await syncSimpleDict(tx, 'financeSubcategoryDict', arrToUniqueStrings(payload?.financeFields?.subcategory, 'name'));

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
      let articleId = artByName.get(s.parentName) || null;
      let subcategoryId = !articleId ? (subcatByName.get(s.parentName) || null) : null;

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
      let articleId = artByName.get(s.parentName) || null;
      let subcategoryId = !articleId ? (subcatByName.get(s.parentName) || null) : null;
      if (!articleId && !subcategoryId) continue;
      desiredKeys.add(`${s.name}|${articleId || ''}|${subcategoryId || ''}`);
    }
    const toDeleteSubs = subsExisting.filter((r) => !desiredKeys.has(keyOf(r)));
    if (toDeleteSubs.length) {
      await tx.financeSubarticleDict.deleteMany({ where: { id: { in: toDeleteSubs.map((r) => r.id) } } });
    }

    // 11. ЖУРНАЛ (SUNDRY)
    if(tx.sundryTypeWorkDict) {
        await syncSimpleDict(tx, 'sundryTypeWorkDict', arrToUniqueStrings(payload?.sundryFields?.typeWork, 'name'));
    }

    return getAll(tx);
  });
}

module.exports = {
  loadBundle: () => getAll(),
  saveBundle: (payload) => saveAll(payload),
  loadInactiveBundle: () => getInactive(),
  getAll,
  saveAll,
  getInactive
};