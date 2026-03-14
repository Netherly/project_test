const prisma = require('../../prisma/client');
const { hasTable } = require('../utils/db-schema');
const fieldsService = require('../services/fields.service');

const MIN_ITEMS = 4;

const DEFAULT_TEST_FIELDS = {
  generalFields: {
    currency: ['UAH', 'USD', 'EUR', 'PLN'],
    country: ['Украина', 'Польша', 'Германия', 'Литва'],
    businessLine: ['Лидогенерация', 'Разработка', 'Маркетинг', 'Поддержка'],
  },
  orderFields: {
    intervals: ['Разовый', 'Еженедельно', 'Ежемесячно', 'Ежеквартально'],
    categories: [
      { intervalValue: 'Разовый', value: 'Лендинг' },
      { intervalValue: 'Еженедельно', value: 'Контент-план' },
      { intervalValue: 'Ежемесячно', value: 'SEO сопровождение' },
      { intervalValue: 'Ежеквартально', value: 'Аудит рекламы' },
    ],
    statuses: ['Новый', 'В работе', 'На согласовании', 'Закрыт'],
    closeReasons: ['Нет бюджета', 'Потерян интерес', 'Выбрали конкурента', 'Не подошли сроки'],
    projects: ['Alpha', 'Beta', 'Gamma', 'Delta'],
    discountReason: ['Первый заказ', 'Партнерская скидка', 'Сезонная акция', 'Большой объем'],
    minOrderAmount: ['100 USD', '300 USD', '500 USD', '1000 USD'],
    readySolution: ['CRM под ключ', 'Telegram-бот', 'Лендинг', 'SEO-пакет'],
    tags: [
      { name: 'Приоритет', color: '#FF6B6B' },
      { name: 'Теплый лид', color: '#F7B267' },
      { name: 'Повторный заказ', color: '#4ECDC4' },
      { name: 'Кросс-продажа', color: '#6C5CE7' },
    ],
    techTags: [
      { name: 'React', color: '#61DAFB' },
      { name: 'Node.js', color: '#3C873A' },
      { name: 'PostgreSQL', color: '#336791' },
      { name: 'Docker', color: '#0DB7ED' },
    ],
    taskTags: [
      { name: 'Срочно', color: '#E63946' },
      { name: 'Баг', color: '#F77F00' },
      { name: 'Улучшение', color: '#2A9D8F' },
      { name: 'Рутина', color: '#577590' },
    ],
  },
  executorFields: {
    role: ['Менеджер', 'Маркетолог', 'Разработчик', 'Дизайнер'],
  },
  clientFields: {
    category: ['VIP', 'Постоянный', 'Новый', 'Партнер'],
    source: ['Реклама', 'Рекомендация', 'Сайт', 'Telegram'],
    business: ['E-commerce', 'Образование', 'Финансы', 'Недвижимость'],
    tags: [
      { name: 'Горячий', color: '#E63946' },
      { name: 'На паузе', color: '#FFB703' },
      { name: 'Партнер', color: '#2A9D8F' },
      { name: 'VIP', color: '#6A4C93' },
    ],
  },
  companyFields: {
    tags: [
      { name: 'Стратегический', color: '#264653' },
      { name: 'Надежный', color: '#2A9D8F' },
      { name: 'Перспективный', color: '#E9C46A' },
      { name: 'Требует внимания', color: '#E76F51' },
    ],
  },
  employeeFields: {
    tags: [
      { name: 'Remote', color: '#4361EE' },
      { name: 'Office', color: '#4CC9F0' },
      { name: 'Top', color: '#7209B7' },
      { name: 'New', color: '#43AA8B' },
    ],
  },
  assetsFields: {
    type: ['Карта', 'Счет', 'Кошелек', 'Касса'],
    paymentSystem: ['Visa', 'Mastercard', 'SWIFT', 'SEPA'],
    cardDesigns: [
      { name: 'Midnight Blue', url: '' },
      { name: 'Sunset Coral', url: '' },
      { name: 'Graphite Minimal', url: '' },
      { name: 'Emerald Wave', url: '' },
    ],
  },
  financeFields: {
    articles: ['Доход', 'Расход', 'Маркетинг', 'Операционные'],
    subcategory: ['Реклама', 'Инфраструктура', 'Зарплаты', 'Комиссии'],
    subarticles: [
      { subarticleInterval: 'Доход', name: 'Оплата заказов' },
      { subarticleInterval: 'Расход', name: 'Оплата подрядчикам' },
      { subarticleInterval: 'Реклама', name: 'Meta Ads' },
      { subarticleInterval: 'Инфраструктура', name: 'VPS и домены' },
    ],
  },
  sundryFields: {
    typeWork: ['Звонок', 'Встреча', 'Отчет', 'Переписка'],
  },
  taskFields: {
    tags: [
      { name: 'Фронтенд', color: '#118AB2' },
      { name: 'Бэкенд', color: '#073B4C' },
      { name: 'Дизайн', color: '#EF476F' },
      { name: 'Аналитика', color: '#06D6A0' },
    ],
  },
};

const DEFAULT_TEST_CLIENT_GROUPS = [
  { order: 1, name: 'Новые' },
  { order: 2, name: 'В работе' },
  { order: 3, name: 'VIP' },
  { order: 4, name: 'Партнеры' },
];

function pickText(value) {
  if (typeof value === 'string') return value.trim();
  if (!value || typeof value !== 'object') return '';
  const candidate =
    value.value ??
    value.name ??
    value.code ??
    value.intervalValue ??
    value.categoryValue ??
    value.articleValue ??
    value.subarticleValue ??
    value.subarticleInterval ??
    '';
  return String(candidate || '').trim();
}

function cloneValue(value) {
  if (!value || typeof value !== 'object') return value;
  return { ...value };
}

function topUpList(existing, defaults, keyFn) {
  const result = Array.isArray(existing) ? existing.map(cloneValue) : [];
  const seen = new Set(
    result
      .map((item) => String(keyFn(item) || '').trim().toLowerCase())
      .filter(Boolean)
  );

  for (const item of defaults) {
    if (result.length >= MIN_ITEMS) break;
    const key = String(keyFn(item) || '').trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    result.push(cloneValue(item));
    seen.add(key);
  }

  return result;
}

function topUpTextList(existing, defaults) {
  return topUpList(existing, defaults, pickText);
}

function topUpTags(existing, defaults) {
  return topUpList(existing, defaults, (item) => pickText(item?.name ?? item));
}

function topUpIntervals(existing, defaults) {
  return topUpList(existing, defaults, (item) => pickText(item?.value ?? item?.intervalValue ?? item));
}

function topUpCategories(existing, defaults) {
  return topUpList(existing, defaults, (item) => {
    const interval = pickText(item?.intervalValue ?? item?.categoryInterval ?? item?.interval);
    const value = pickText(item?.value ?? item?.categoryValue ?? item);
    return `${interval}|${value}`;
  });
}

function topUpSubarticles(existing, defaults) {
  return topUpList(existing, defaults, (item) => {
    const parent = pickText(
      item?.parentName ??
        item?.subarticleInterval ??
        item?.articleName ??
        item?.subcategoryName
    );
    const name = pickText(item?.name ?? item?.subarticleValue ?? item);
    return `${parent}|${name}`;
  });
}

async function ensureTestClientGroups() {
  if (!(await hasTable('ClientGroup'))) return;

  for (const group of DEFAULT_TEST_CLIENT_GROUPS) {
    const byOrder = await prisma.clientGroup.findFirst({ where: { order: group.order } });
    if (byOrder) {
      if (byOrder.name !== group.name) {
        await prisma.clientGroup.update({
          where: { id: byOrder.id },
          data: { name: group.name },
        });
      }
      continue;
    }

    const byName = await prisma.clientGroup.findUnique({ where: { name: group.name } });
    if (byName) {
      if (byName.order !== group.order) {
        await prisma.clientGroup.update({
          where: { id: byName.id },
          data: { order: group.order },
        });
      }
      continue;
    }

    await prisma.clientGroup.create({ data: group });
  }
}

async function ensureTestFields() {
  const current = await fieldsService.loadBundle();

  const next = {
    ...current,
    generalFields: {
      ...current.generalFields,
      currency: topUpTextList(current?.generalFields?.currency, DEFAULT_TEST_FIELDS.generalFields.currency),
      country: topUpTextList(current?.generalFields?.country, DEFAULT_TEST_FIELDS.generalFields.country),
      businessLine: topUpTextList(
        current?.generalFields?.businessLine,
        DEFAULT_TEST_FIELDS.generalFields.businessLine
      ),
    },
    orderFields: {
      ...current.orderFields,
      intervals: topUpIntervals(current?.orderFields?.intervals, DEFAULT_TEST_FIELDS.orderFields.intervals),
      categories: topUpCategories(current?.orderFields?.categories, DEFAULT_TEST_FIELDS.orderFields.categories),
      statuses: topUpTextList(current?.orderFields?.statuses, DEFAULT_TEST_FIELDS.orderFields.statuses),
      closeReasons: topUpTextList(
        current?.orderFields?.closeReasons,
        DEFAULT_TEST_FIELDS.orderFields.closeReasons
      ),
      projects: topUpTextList(current?.orderFields?.projects, DEFAULT_TEST_FIELDS.orderFields.projects),
      discountReason: topUpTextList(
        current?.orderFields?.discountReason,
        DEFAULT_TEST_FIELDS.orderFields.discountReason
      ),
      minOrderAmount: topUpTextList(
        current?.orderFields?.minOrderAmount,
        DEFAULT_TEST_FIELDS.orderFields.minOrderAmount
      ),
      readySolution: topUpTextList(
        current?.orderFields?.readySolution,
        DEFAULT_TEST_FIELDS.orderFields.readySolution
      ),
      tags: topUpTags(current?.orderFields?.tags, DEFAULT_TEST_FIELDS.orderFields.tags),
      techTags: topUpTags(current?.orderFields?.techTags, DEFAULT_TEST_FIELDS.orderFields.techTags),
      taskTags: topUpTags(current?.orderFields?.taskTags, DEFAULT_TEST_FIELDS.orderFields.taskTags),
    },
    executorFields: {
      ...current.executorFields,
      role: topUpTextList(current?.executorFields?.role, DEFAULT_TEST_FIELDS.executorFields.role),
    },
    clientFields: {
      ...current.clientFields,
      category: topUpTextList(current?.clientFields?.category, DEFAULT_TEST_FIELDS.clientFields.category),
      source: topUpTextList(current?.clientFields?.source, DEFAULT_TEST_FIELDS.clientFields.source),
      business: topUpTextList(current?.clientFields?.business, DEFAULT_TEST_FIELDS.clientFields.business),
      tags: topUpTags(current?.clientFields?.tags, DEFAULT_TEST_FIELDS.clientFields.tags),
    },
    companyFields: {
      ...current.companyFields,
      tags: topUpTags(current?.companyFields?.tags, DEFAULT_TEST_FIELDS.companyFields.tags),
    },
    employeeFields: {
      ...current.employeeFields,
      tags: topUpTags(current?.employeeFields?.tags, DEFAULT_TEST_FIELDS.employeeFields.tags),
    },
    assetsFields: {
      ...current.assetsFields,
      type: topUpTextList(current?.assetsFields?.type, DEFAULT_TEST_FIELDS.assetsFields.type),
      paymentSystem: topUpTextList(
        current?.assetsFields?.paymentSystem,
        DEFAULT_TEST_FIELDS.assetsFields.paymentSystem
      ),
      cardDesigns: topUpList(
        current?.assetsFields?.cardDesigns,
        DEFAULT_TEST_FIELDS.assetsFields.cardDesigns,
        (item) => pickText(item?.name ?? item)
      ),
    },
    financeFields: {
      ...current.financeFields,
      articles: topUpTextList(current?.financeFields?.articles, DEFAULT_TEST_FIELDS.financeFields.articles),
      subcategory: topUpTextList(
        current?.financeFields?.subcategory,
        DEFAULT_TEST_FIELDS.financeFields.subcategory
      ),
      subarticles: topUpSubarticles(
        current?.financeFields?.subarticles,
        DEFAULT_TEST_FIELDS.financeFields.subarticles
      ),
    },
    sundryFields: {
      ...current.sundryFields,
      typeWork: topUpTextList(current?.sundryFields?.typeWork, DEFAULT_TEST_FIELDS.sundryFields.typeWork),
    },
    taskFields: {
      ...current.taskFields,
      tags: topUpTags(current?.taskFields?.tags, DEFAULT_TEST_FIELDS.taskFields.tags),
    },
  };

  await fieldsService.saveBundle(next);
  await ensureTestClientGroups();
}

module.exports = {
  ensureTestFields,
};
