const bcrypt = require('bcrypt');
const prisma = require('../../prisma/client');
const { hasTable } = require('../utils/db-schema');
const { ensureTestFields } = require('./test-fields.seed');

const DEMO_PASSWORD = '123456';

const FIXED_RATES_TO_UAH = {
  UAH: 1,
  USD: 41.25,
  USDT: 41.2,
  EUR: 44.7,
  PLN: 10.45,
  GBP: 52.1,
  CHF: 46.2,
  CZK: 1.78,
  RUB: 0.44,
};

const DEMO_COMPANIES = [
  { key: 'alpha', name: '[DEMO] Alpha Flow LLC' },
  { key: 'blue', name: '[DEMO] Blue River OU' },
  { key: 'nova', name: '[DEMO] Nova Digital Sp. z o.o.' },
  { key: 'bridge', name: '[DEMO] East Bridge Ltd' },
];

const DEMO_EMPLOYEES = [
  {
    key: 'owner',
    login: 'demo.owner',
    fullName: '[DEMO] Mykyta Owner',
    email: 'demo.owner@gsse.dev',
    phone: '+380501111111',
    status: 'active',
    countryIso2: 'UA',
    currencyCode: 'UAH',
    roleName: 'Менеджер',
    crmLanguage: 'ua',
    tags: ['Remote', 'Top'],
    balance: 12500,
    requisites: [
      { label: 'UAH:Monobank', value: 'UA903052992990004149123456789' },
      { label: 'USD:Wise', value: 'US64SVBKUS6S3300958879' },
    ],
  },
  {
    key: 'sales',
    login: 'demo.sales',
    fullName: '[DEMO] Anna Sales',
    email: 'demo.sales@gsse.dev',
    phone: '+48501111222',
    status: 'active',
    countryIso2: 'PL',
    currencyCode: 'USD',
    roleName: 'Менеджер',
    crmLanguage: 'ru',
    tags: ['Office'],
    balance: 4200,
    requisites: [
      { label: 'USD:Bank Pekao', value: 'PL61109010140000071219812874' },
    ],
  },
  {
    key: 'dev',
    login: 'demo.dev',
    fullName: '[DEMO] Max Backend',
    email: 'demo.dev@gsse.dev',
    phone: '+4915111122334',
    status: 'active',
    countryIso2: 'DE',
    currencyCode: 'EUR',
    roleName: 'Разработчик',
    crmLanguage: 'en',
    tags: ['Remote'],
    balance: 6900,
    requisites: [
      { label: 'EUR:N26', value: 'DE89370400440532013000' },
    ],
  },
  {
    key: 'design',
    login: 'demo.design',
    fullName: '[DEMO] Liza Creative',
    email: 'demo.design@gsse.dev',
    phone: '+37061122334',
    status: 'pending',
    countryIso2: 'LT',
    currencyCode: 'EUR',
    roleName: 'Дизайнер',
    crmLanguage: 'ua',
    tags: ['New'],
    balance: 1800,
    requisites: [
      { label: 'EUR:Revolut', value: 'LT121000011101001000' },
    ],
  },
  {
    key: 'marketing',
    login: 'demo.marketing',
    fullName: '[DEMO] Oleg Growth',
    email: 'demo.marketing@gsse.dev',
    phone: '+447700900111',
    status: 'inactive',
    countryIso2: 'GB',
    currencyCode: 'USD',
    roleName: 'Маркетолог',
    crmLanguage: 'ru',
    tags: ['Office'],
    balance: 0,
    requisites: [
      { label: 'GBP:Barclays', value: 'GB29NWBK60161331926819' },
    ],
  },
];

const DEMO_CLIENTS = [
  {
    email: 'nordic.store@demo.test',
    name: '[DEMO] Nordic Store',
    fullName: 'Nordic Store GmbH',
    phone: '+49301234567',
    city: 'Berlin',
    countryIso2: 'DE',
    currencyCode: 'EUR',
    categoryName: 'VIP',
    sourceName: 'Сайт',
    groupName: 'VIP',
    managerKey: 'owner',
    companyKey: 'alpha',
    status: 'active',
    tags: ['VIP', 'Горячий'],
    paymentDetails: 'Invoice + monthly reconciliation',
    accesses: [
      { login: 'crm-nordic', password: 'Nordic#123', description: 'CRM admin' },
      { login: 'ads-nordic', password: 'Ads#123', description: 'Google Ads' },
    ],
  },
  {
    email: 'kyiv.clinic@demo.test',
    name: '[DEMO] Kyiv Clinic',
    fullName: 'ТОВ Київ Клінік',
    phone: '+380671234567',
    city: 'Kyiv',
    countryIso2: 'UA',
    currencyCode: 'UAH',
    categoryName: 'Новый',
    sourceName: 'Telegram',
    groupName: 'Новые',
    managerKey: 'sales',
    companyKey: 'bridge',
    status: 'active',
    tags: ['Горячий'],
    paymentDetails: 'Оплата на ФОП по счету',
    accesses: [
      { login: 'clinic-admin', password: 'Clinic#123', description: 'Website admin' },
    ],
  },
  {
    email: 'warsaw.edu@demo.test',
    name: '[DEMO] Warsaw Education',
    fullName: 'Warsaw Education Hub',
    phone: '+48555111222',
    city: 'Warsaw',
    countryIso2: 'PL',
    currencyCode: 'PLN',
    categoryName: 'Партнер',
    sourceName: 'Рекомендация',
    groupName: 'Партнеры',
    managerKey: 'sales',
    companyKey: 'nova',
    status: 'paused',
    tags: ['Партнер'],
    paymentDetails: 'Split monthly invoices',
    accesses: [
      { login: 'edu-owner', password: 'Edu#123', description: 'Owner account' },
    ],
  },
  {
    email: 'dubai.logistics@demo.test',
    name: '[DEMO] Dubai Logistics',
    fullName: 'Dubai Logistics LLC',
    phone: '+971501234567',
    city: 'Dubai',
    countryIso2: 'AE',
    currencyCode: 'USD',
    categoryName: 'VIP',
    sourceName: 'Реклама',
    groupName: 'В работе',
    managerKey: 'owner',
    companyKey: 'blue',
    status: 'active',
    tags: ['VIP'],
    paymentDetails: 'SWIFT in USD',
    accesses: [
      { login: 'logistics-main', password: 'Log#123', description: 'Main portal' },
      { login: 'logistics-erp', password: 'Erp#123', description: 'ERP access' },
    ],
  },
  {
    email: 'tbilisi.travels@demo.test',
    name: '[DEMO] Tbilisi Travels',
    fullName: 'Tbilisi Travels',
    phone: '+995555111222',
    city: 'Tbilisi',
    countryIso2: 'GE',
    currencyCode: 'USD',
    categoryName: 'Постоянный',
    sourceName: 'Сайт',
    groupName: 'В работе',
    managerKey: 'marketing',
    companyKey: 'blue',
    status: 'archived',
    tags: ['На паузе'],
    paymentDetails: 'Archived demo client',
    accesses: [],
  },
  {
    email: 'tokyo.commerce@demo.test',
    name: '[DEMO] Tokyo Commerce',
    fullName: 'Tokyo Commerce KK',
    phone: '+81312345678',
    city: 'Tokyo',
    countryIso2: 'JP',
    currencyCode: 'USD',
    categoryName: 'Новый',
    sourceName: 'Реклама',
    groupName: 'Новые',
    managerKey: 'dev',
    companyKey: 'alpha',
    status: 'active',
    tags: ['Партнер'],
    paymentDetails: 'Wire transfer with 30% prepayment',
    accesses: [
      { login: 'tokyo-dashboard', password: 'Tokyo#123', description: 'Analytics dashboard' },
    ],
  },
];

const DEMO_ASSETS = [
  {
    accountName: '[DEMO] UAH Main Card',
    currencyCode: 'UAH',
    typeName: 'Карта',
    paymentSystemName: 'Visa',
    cardDesignName: 'Midnight Grid',
    employeeKey: 'owner',
    companyKey: 'alpha',
    openingBalance: 350000,
    requisites: [
      { label: 'Номер карты', value: '4444 1111 2222 3333' },
      { label: 'IBAN', value: 'UA893052992990004149123456789' },
    ],
  },
  {
    accountName: '[DEMO] USD Ops Account',
    currencyCode: 'USD',
    typeName: 'Счет',
    paymentSystemName: 'SWIFT',
    cardDesignName: 'Carbon Mesh',
    employeeKey: 'sales',
    companyKey: 'bridge',
    openingBalance: 8500,
    requisites: [
      { label: 'SWIFT', value: 'CHASUS33' },
      { label: 'Account', value: '40817810099910004312' },
    ],
  },
  {
    accountName: '[DEMO] EUR Agency Wallet',
    currencyCode: 'EUR',
    typeName: 'Кошелек',
    paymentSystemName: 'SEPA',
    cardDesignName: 'Sunset Flow',
    employeeKey: 'design',
    companyKey: 'nova',
    openingBalance: 6400,
    requisites: [
      { label: 'Wallet', value: 'EUWALLET-8821' },
    ],
  },
  {
    accountName: '[DEMO] PLN Reserve',
    currencyCode: 'PLN',
    typeName: 'Счет',
    paymentSystemName: 'SEPA',
    cardDesignName: 'Emerald Wave',
    employeeKey: 'marketing',
    companyKey: 'nova',
    openingBalance: 12000,
    requisites: [
      { label: 'IBAN', value: 'PL61109010140000071219812874' },
    ],
  },
  {
    accountName: '[DEMO] USDT Treasury',
    currencyCode: 'USDT',
    typeName: 'Кошелек',
    paymentSystemName: 'SWIFT',
    cardDesignName: 'Carbon Mesh',
    employeeKey: 'dev',
    companyKey: 'blue',
    openingBalance: 2800,
    requisites: [
      { label: 'TRC20', value: 'TRX-7dj83nHDemoTreasury' },
    ],
  },
];

const DEMO_ORDERS = [
  {
    numberOrder: 'DEMO-1001',
    name: '[DEMO] CRM Setup',
    clientEmail: 'nordic.store@demo.test',
    employeeKey: 'owner',
    stage: 'IN_WORK',
    stageIndex: 1,
    urgency: 'two',
    interval: 'Ежемесячно',
    orderType: 'CRM под ключ',
    orderStatus: 'В работе',
    project: 'Alpha',
    currencyCode: 'EUR',
    price: 4800,
    amount: 4800,
    budget: 5200,
    hourlyRate: 45,
    sharePercent: 15,
    tags: ['Приоритет'],
    orderDescription: 'Полный запуск CRM и интеграций.',
  },
  {
    numberOrder: 'DEMO-1002',
    name: '[DEMO] Ads Audit',
    clientEmail: 'dubai.logistics@demo.test',
    employeeKey: 'marketing',
    stage: 'LEAD',
    stageIndex: 0,
    urgency: 'one',
    interval: 'Разовый',
    orderType: 'Аудит рекламы',
    orderStatus: 'Новый',
    project: 'Beta',
    currencyCode: 'USD',
    price: 950,
    amount: 950,
    budget: 1250,
    hourlyRate: 65,
    sharePercent: 10,
    tags: ['Теплый лид'],
    orderDescription: 'Разовый аудит рекламных кампаний.',
  },
  {
    numberOrder: 'DEMO-1003',
    name: '[DEMO] Landing Refresh',
    clientEmail: 'kyiv.clinic@demo.test',
    employeeKey: 'design',
    stage: 'WAIT_PAYMENT',
    stageIndex: 2,
    urgency: 'three',
    interval: 'Разовый',
    orderType: 'Лендинг',
    orderStatus: 'На согласовании',
    project: 'Gamma',
    currencyCode: 'UAH',
    price: 78000,
    amount: 78000,
    budget: 90000,
    hourlyRate: 28,
    sharePercent: 12,
    tags: ['Кросс-продажа'],
    orderDescription: 'Редизайн и новый оффер для лендинга.',
  },
  {
    numberOrder: 'DEMO-1004',
    name: '[DEMO] Telegram Bot',
    clientEmail: 'warsaw.edu@demo.test',
    employeeKey: 'dev',
    stage: 'SUCCESS',
    stageIndex: 0,
    urgency: 'two',
    interval: 'Разовый',
    orderType: 'Telegram-бот',
    orderStatus: 'Закрыт',
    project: 'Delta',
    currencyCode: 'USD',
    price: 2100,
    amount: 2100,
    budget: 2600,
    hourlyRate: 40,
    sharePercent: 20,
    tags: ['Повторный заказ'],
    orderDescription: 'Бот с оплатами и CRM webhook.',
  },
  {
    numberOrder: 'DEMO-1005',
    name: '[DEMO] SEO Retainer',
    clientEmail: 'tokyo.commerce@demo.test',
    employeeKey: 'marketing',
    stage: 'CLIENT_THINKS',
    stageIndex: 3,
    urgency: 'four',
    interval: 'Ежемесячно',
    orderType: 'SEO-пакет',
    orderStatus: 'На согласовании',
    project: 'Alpha',
    currencyCode: 'USD',
    price: 1200,
    amount: 1200,
    budget: 1500,
    hourlyRate: 38,
    sharePercent: 8,
    tags: ['Теплый лид'],
    orderDescription: 'Помесячный SEO пакет с контентом.',
  },
  {
    numberOrder: 'DEMO-1006',
    name: '[DEMO] Analytics Dashboard',
    clientEmail: 'nordic.store@demo.test',
    employeeKey: 'dev',
    stage: 'TESTING',
    stageIndex: 4,
    urgency: 'one',
    interval: 'Разовый',
    orderType: 'CRM под ключ',
    orderStatus: 'В работе',
    project: 'Beta',
    currencyCode: 'USD',
    price: 1600,
    amount: 1600,
    budget: 1900,
    hourlyRate: 55,
    sharePercent: 15,
    tags: ['Приоритет'],
    orderDescription: 'Отдельный BI дашборд и аналитика продаж.',
  },
];

const DEMO_TRANSACTIONS = [
  {
    description: '[DEMO] Предоплата по CRM Setup',
    dateOffset: -6,
    assetAccountName: '[DEMO] EUR Agency Wallet',
    operation: 'DEPOSIT',
    amount: 3200,
    commission: 12,
    categoryName: 'Доход',
    subcategoryName: 'Оплата заказов',
    clientEmail: 'nordic.store@demo.test',
    companyKey: 'alpha',
    orderNumber: 'DEMO-1001',
    counterparty: 'Nordic Store GmbH',
    employeeKey: 'owner',
  },
  {
    description: '[DEMO] Оплата подрядчику backend',
    dateOffset: -5,
    assetAccountName: '[DEMO] USD Ops Account',
    operation: 'WITHDRAW',
    amount: 900,
    commission: 7,
    categoryName: 'Расход',
    subcategoryName: 'Оплата подрядчикам',
    clientEmail: 'nordic.store@demo.test',
    companyKey: 'bridge',
    orderNumber: 'DEMO-1001',
    counterparty: 'Freelance Backend',
    employeeKey: 'dev',
  },
  {
    description: '[DEMO] Рекламный кабинет Meta Ads',
    dateOffset: -4,
    assetAccountName: '[DEMO] USD Ops Account',
    operation: 'WITHDRAW',
    amount: 650,
    commission: 5,
    categoryName: 'Маркетинг',
    subcategoryName: 'Meta Ads',
    clientEmail: 'dubai.logistics@demo.test',
    companyKey: 'blue',
    orderNumber: 'DEMO-1002',
    counterparty: 'Meta Ads',
    employeeKey: 'marketing',
  },
  {
    description: '[DEMO] Пополнение основного счета',
    dateOffset: -3,
    assetAccountName: '[DEMO] UAH Main Card',
    operation: 'DEPOSIT',
    amount: 50000,
    commission: 0,
    categoryName: 'Доход',
    subcategoryName: 'Оплата заказов',
    clientEmail: 'kyiv.clinic@demo.test',
    companyKey: 'alpha',
    orderNumber: 'DEMO-1003',
    counterparty: 'Clinic transfer',
    employeeKey: 'sales',
  },
  {
    description: '[DEMO] Возврат клиенту по Landing Refresh',
    dateOffset: -2,
    assetAccountName: '[DEMO] EUR Agency Wallet',
    operation: 'WITHDRAW',
    amount: 300,
    commission: 0,
    categoryName: 'Расход',
    subcategoryName: 'Оплата подрядчикам',
    clientEmail: 'kyiv.clinic@demo.test',
    companyKey: 'nova',
    orderNumber: 'DEMO-1003',
    counterparty: 'Kyiv Clinic',
    employeeKey: 'owner',
  },
  {
    description: '[DEMO] Оплата заказа Telegram Bot',
    dateOffset: -1,
    assetAccountName: '[DEMO] USDT Treasury',
    operation: 'DEPOSIT',
    amount: 2100,
    commission: 3,
    categoryName: 'Доход',
    subcategoryName: 'Оплата заказов',
    clientEmail: 'warsaw.edu@demo.test',
    companyKey: 'blue',
    orderNumber: 'DEMO-1004',
    counterparty: 'Warsaw Education Hub',
    employeeKey: 'dev',
  },
  {
    description: '[DEMO] Зарплата маркетолога',
    dateOffset: 0,
    assetAccountName: '[DEMO] PLN Reserve',
    operation: 'WITHDRAW',
    amount: 3500,
    commission: 0,
    categoryName: 'Расход',
    subcategoryName: 'Оплата подрядчикам',
    clientEmail: 'warsaw.edu@demo.test',
    companyKey: 'nova',
    orderNumber: null,
    counterparty: 'Payroll',
    employeeKey: 'marketing',
  },
  {
    description: '[DEMO] Абонплата банка',
    dateOffset: 0,
    assetAccountName: '[DEMO] UAH Main Card',
    operation: 'WITHDRAW',
    amount: 450,
    commission: 10,
    categoryName: 'Операционные',
    subcategoryName: 'VPS и домены',
    clientEmail: null,
    companyKey: 'alpha',
    orderNumber: null,
    counterparty: 'Bank fee',
    employeeKey: 'owner',
  },
];

const DEMO_REGULAR_PAYMENTS = [
  {
    description: '[DEMO] Ежемесячный VPS',
    period: 'Ежемесячно',
    time: '09:00',
    nextPaymentOffset: 3,
    assetAccountName: '[DEMO] UAH Main Card',
    operation: 'WITHDRAW',
    amount: 1800,
    commission: 0,
    categoryName: 'Операционные',
    subcategoryName: 'VPS и домены',
    counterparty: 'Hosting',
    orderNumber: null,
  },
  {
    description: '[DEMO] Еженедельный рекламный бюджет',
    period: 'Еженедельно',
    time: '12:00',
    nextPaymentOffset: 1,
    assetAccountName: '[DEMO] USD Ops Account',
    operation: 'WITHDRAW',
    amount: 250,
    commission: 2,
    categoryName: 'Маркетинг',
    subcategoryName: 'Meta Ads',
    counterparty: 'Meta Ads',
    orderNumber: 'DEMO-1002',
  },
  {
    description: '[DEMO] Поддержка аналитики',
    period: 'Ежемесячно',
    time: '16:30',
    nextPaymentOffset: 5,
    assetAccountName: '[DEMO] USDT Treasury',
    operation: 'DEPOSIT',
    amount: 450,
    commission: 0,
    categoryName: 'Доход',
    subcategoryName: 'Оплата заказов',
    counterparty: 'Nordic Store GmbH',
    orderNumber: 'DEMO-1006',
  },
];

const DEMO_TASKS = [
  {
    title: '[DEMO] Утвердить roadmap CRM',
    description: 'Проверить scope, сроки и состав команды.',
    status: 'pending',
    employeeKey: 'owner',
    clientEmail: 'nordic.store@demo.test',
    companyKey: 'alpha',
    country: 'Germany',
    category: 'Стратегия',
  },
  {
    title: '[DEMO] Подготовить креативы для Dubai Logistics',
    description: 'Собрать 3 варианта баннеров и 2 видео.',
    status: 'in_progress',
    employeeKey: 'design',
    clientEmail: 'dubai.logistics@demo.test',
    companyKey: 'blue',
    country: 'UAE',
    category: 'Дизайн',
  },
  {
    title: '[DEMO] Согласовать медиаплан',
    description: 'Сверить CPL и лимиты на неделю.',
    status: 'pending',
    employeeKey: 'marketing',
    clientEmail: 'tokyo.commerce@demo.test',
    companyKey: 'alpha',
    country: 'Japan',
    category: 'Маркетинг',
  },
  {
    title: '[DEMO] Проверить webhook оплаты',
    description: 'Прогнать успешный и неуспешный сценарии.',
    status: 'completed',
    employeeKey: 'dev',
    clientEmail: 'warsaw.edu@demo.test',
    companyKey: 'nova',
    country: 'Poland',
    category: 'Backend',
  },
  {
    title: '[DEMO] Обновить шаблон договора',
    description: 'Вынести правки по оплате и SLA.',
    status: 'pending',
    employeeKey: 'sales',
    clientEmail: 'kyiv.clinic@demo.test',
    companyKey: 'bridge',
    country: 'Ukraine',
    category: 'Документы',
  },
];

function isNumber(value) {
  return Number.isFinite(Number(value));
}

function startOfDayOffset(offset = 0) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date;
}

function toDateOnlyInput(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function amountToUah(currencyCode, amount) {
  const rate = FIXED_RATES_TO_UAH[String(currencyCode || '').toUpperCase()] || 1;
  return Number((Number(amount || 0) * rate).toFixed(2));
}

function pickLatestRates() {
  const usd = FIXED_RATES_TO_UAH.USD;
  const rub = FIXED_RATES_TO_UAH.RUB;
  const usdt = FIXED_RATES_TO_UAH.USDT;
  return { usd, rub, usdt };
}

async function findByName(modelName, name) {
  if (!name) return null;
  return prisma[modelName].findFirst({
    where: { name: { equals: String(name), mode: 'insensitive' } },
  });
}

async function upsertByFirst(modelName, where, data) {
  const existing = await prisma[modelName].findFirst({ where, select: { id: true } });
  if (existing?.id) {
    return prisma[modelName].update({ where: { id: existing.id }, data });
  }
  return prisma[modelName].create({ data });
}

async function ensureDemoRates() {
  const base = pickLatestRates();
  const rows = [];

  for (let i = 6; i >= 0; i -= 1) {
    const day = startOfDayOffset(-i);
    const drift = (6 - i) * 0.05;
    const usd = Number((base.usd + drift).toFixed(4));
    const rub = Number((base.rub + drift / 10).toFixed(4));
    const usdt = Number((base.usdt + drift).toFixed(4));

    const created = await prisma.exchangeRates.upsert({
      where: { date: day },
      update: {
        uah: 1,
        usd,
        rub,
        usdt,
        uah_rub: Number((1 / rub).toFixed(8)),
        uah_usd: Number((1 / usd).toFixed(8)),
        uah_usdt: Number((1 / usdt).toFixed(8)),
        usd_uah: usd,
        usd_rub: Number((usd / rub).toFixed(8)),
        usd_usdt: Number((usd / usdt).toFixed(8)),
        usdt_uah: usdt,
        usdt_usd: Number((usdt / usd).toFixed(8)),
        usdt_rub: Number((usdt / rub).toFixed(8)),
        rub_uah: rub,
        rub_usd: Number((rub / usd).toFixed(8)),
        rub_usdt: Number((rub / usdt).toFixed(8)),
      },
      create: {
        date: day,
        uah: 1,
        usd,
        rub,
        usdt,
        uah_rub: Number((1 / rub).toFixed(8)),
        uah_usd: Number((1 / usd).toFixed(8)),
        uah_usdt: Number((1 / usdt).toFixed(8)),
        usd_uah: usd,
        usd_rub: Number((usd / rub).toFixed(8)),
        usd_usdt: Number((usd / usdt).toFixed(8)),
        usdt_uah: usdt,
        usdt_usd: Number((usdt / usd).toFixed(8)),
        usdt_rub: Number((usdt / rub).toFixed(8)),
        rub_uah: rub,
        rub_usd: Number((rub / usd).toFixed(8)),
        rub_usdt: Number((rub / usdt).toFixed(8)),
      },
    });
    rows.push(created);
  }

  return rows;
}

async function loadLookups() {
  const [
    currencies,
    countries,
    roles,
    sources,
    categories,
    groups,
    assetTypes,
    paymentSystems,
    cardDesigns,
    articles,
    subarticles,
    tags,
  ] = await Promise.all([
    prisma.currencyDict.findMany(),
    prisma.country.findMany(),
    prisma.executorRoleDict.findMany(),
    prisma.clientSourceDict.findMany(),
    prisma.clientCategoryDict.findMany(),
    (await hasTable('ClientGroup')) ? prisma.clientGroup.findMany() : Promise.resolve([]),
    prisma.assetTypeDict.findMany(),
    prisma.paymentSystemDict.findMany(),
    prisma.cardDesign.findMany(),
    prisma.financeArticleDict.findMany(),
    prisma.financeSubarticleDict.findMany(),
    prisma.tag.findMany({ include: { category: true } }),
  ]);

  return {
    currenciesByCode: new Map(currencies.map((row) => [String(row.code).toUpperCase(), row])),
    countriesByIso2: new Map(
      countries.map((row) => [String(row.iso2 || '').toUpperCase(), row]).filter(([key]) => key)
    ),
    rolesByName: new Map(roles.map((row) => [row.name, row])),
    sourcesByName: new Map(sources.map((row) => [row.name, row])),
    categoriesByName: new Map(categories.map((row) => [row.name, row])),
    groupsByName: new Map(groups.map((row) => [row.name, row])),
    assetTypesByName: new Map(assetTypes.map((row) => [row.name, row])),
    paymentSystemsByName: new Map(paymentSystems.map((row) => [row.name, row])),
    cardDesignsByName: new Map(cardDesigns.map((row) => [row.name, row])),
    articlesByName: new Map(articles.map((row) => [row.name, row])),
    subarticlesByName: new Map(subarticles.map((row) => [row.name, row])),
    tagsByCodeAndName: new Map(
      tags.map((row) => [`${row.category?.code || ''}:${row.name}`, row]).filter(([key]) => key)
    ),
  };
}

async function ensureCompanies() {
  const result = new Map();
  for (const item of DEMO_COMPANIES) {
    const row = await upsertByFirst('company', { name: item.name }, { name: item.name });
    result.set(item.key, row);
  }
  return result;
}

async function ensureEmployees(lookups) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const result = new Map();

  for (const item of DEMO_EMPLOYEES) {
    const role = lookups.rolesByName.get(item.roleName) || null;
    const country = lookups.countriesByIso2.get(item.countryIso2) || null;
    const currency = lookups.currenciesByCode.get(item.currencyCode) || null;

    const row = await prisma.employee.upsert({
      where: { login: item.login },
      update: {
        status: item.status,
        full_name: item.fullName,
        email: item.email,
        phone: item.phone,
        password: passwordHash,
        countryId: country?.id || null,
        currencyId: currency?.id || null,
        roleId: role?.id || null,
        balance: item.balance,
      },
      create: {
        login: item.login,
        status: item.status,
        full_name: item.fullName,
        email: item.email,
        phone: item.phone,
        password: passwordHash,
        countryId: country?.id || null,
        currencyId: currency?.id || null,
        roleId: role?.id || null,
        balance: item.balance,
      },
    });

    await prisma.employeeSettings.upsert({
      where: { employeeId: row.id },
      update: {
        crmLanguage: item.crmLanguage,
        currencyId: currency?.id || null,
        timezone: 'Europe/Kyiv',
      },
      create: {
        employeeId: row.id,
        crmLanguage: item.crmLanguage,
        currencyId: currency?.id || null,
        timezone: 'Europe/Kyiv',
      },
    });

    await prisma.employeeRequisite.deleteMany({ where: { employeeId: row.id } });
    if (Array.isArray(item.requisites) && item.requisites.length) {
      await prisma.employeeRequisite.createMany({
        data: item.requisites.map((req) => ({
          employeeId: row.id,
          label: req.label,
          value: req.value,
          bank: req.label.split(':')[1] || '',
          currency: req.label.split(':')[0] || '',
        })),
      });
    }

    await prisma.employeeTag.deleteMany({ where: { employeeId: row.id } });
    const employeeTagIds = item.tags
      .map((name) => lookups.tagsByCodeAndName.get(`employee:${name}`)?.id)
      .filter(Boolean);
    if (employeeTagIds.length) {
      await prisma.employeeTag.createMany({
        data: employeeTagIds.map((tagId) => ({ employeeId: row.id, tagId })),
        skipDuplicates: true,
      });
    }

    result.set(item.key, row);
  }

  return result;
}

async function ensureClients(lookups, companies, employees) {
  const result = new Map();

  for (const item of DEMO_CLIENTS) {
    const row = await upsertByFirst(
      'client',
      { email: item.email },
      {
        name: item.name,
        full_name: item.fullName,
        email: item.email,
        phone: item.phone,
        city: item.city,
        status: item.status,
        payment_details: item.paymentDetails,
        countryId: lookups.countriesByIso2.get(item.countryIso2)?.id || null,
        currencyId: lookups.currenciesByCode.get(item.currencyCode)?.id || null,
        categoryId: lookups.categoriesByName.get(item.categoryName)?.id || null,
        sourceId: lookups.sourcesByName.get(item.sourceName)?.id || null,
        groupId: lookups.groupsByName.get(item.groupName)?.id || null,
        managerId: employees.get(item.managerKey)?.id || null,
        companyId: companies.get(item.companyKey)?.id || null,
        messenger_name: item.name,
        note: `${item.name} seeded for demo testing`,
      }
    );

    await prisma.clientTag.deleteMany({ where: { clientId: row.id } });
    const tagIds = item.tags
      .map((name) => lookups.tagsByCodeAndName.get(`client:${name}`)?.id)
      .filter(Boolean);
    if (tagIds.length) {
      await prisma.clientTag.createMany({
        data: tagIds.map((tagId) => ({ clientId: row.id, tagId })),
        skipDuplicates: true,
      });
    }

    await prisma.credential.deleteMany({ where: { clientId: row.id } });
    if (Array.isArray(item.accesses) && item.accesses.length) {
      await prisma.credential.createMany({
        data: item.accesses.map((access) => ({
          clientId: row.id,
          login: access.login,
          password: access.password,
          description: access.description,
        })),
      });
    }

    result.set(item.email, row);
  }

  return result;
}

async function ensureAssets(lookups, companies, employees) {
  const result = new Map();

  for (const item of DEMO_ASSETS) {
    const row = await upsertByFirst(
      'asset',
      { accountName: item.accountName },
      {
        accountName: item.accountName,
        currencyId: lookups.currenciesByCode.get(item.currencyCode)?.id,
        typeId: lookups.assetTypesByName.get(item.typeName)?.id || null,
        paymentSystemId: lookups.paymentSystemsByName.get(item.paymentSystemName)?.id || null,
        cardDesignId: lookups.cardDesignsByName.get(item.cardDesignName)?.id || null,
        employeeId: employees.get(item.employeeKey)?.id || null,
        companyId: companies.get(item.companyKey)?.id || null,
        balance: item.openingBalance,
        turnoverStartBalance: item.openingBalance,
        turnoverIncoming: 0,
        turnoverOutgoing: 0,
        turnoverEndBalance: item.openingBalance,
        balanceUAH: amountToUah(item.currencyCode, item.openingBalance),
      }
    );

    await prisma.assetRequisite.deleteMany({ where: { assetId: row.id } });
    if (Array.isArray(item.requisites) && item.requisites.length) {
      await prisma.assetRequisite.createMany({
        data: item.requisites.map((req) => ({
          assetId: row.id,
          label: req.label,
          value: req.value,
        })),
      });
    }

    result.set(item.accountName, row);
  }

  return result;
}

async function ensureOrders(lookups, clients, employees) {
  const result = new Map();

  for (const [index, item] of DEMO_ORDERS.entries()) {
    const client = clients.get(item.clientEmail) || null;
    const row = await upsertByFirst(
      'order',
      { numberOrder: item.numberOrder },
      {
        numberOrder: item.numberOrder,
        orderSequence: index + 1001,
        name: item.name,
        title: item.name,
        clientId: client?.id || null,
        clientName: client?.name || client?.full_name || null,
        employeeId: employees.get(item.employeeKey)?.id || null,
        stage: item.stage,
        stageIndex: item.stageIndex,
        urgency: item.urgency,
        interval: item.interval,
        orderType: item.orderType,
        orderStatus: item.orderStatus,
        project: item.project,
        orderDescription: item.orderDescription,
        currencyId: lookups.currenciesByCode.get(item.currencyCode)?.id || null,
        currencyType: item.currencyCode,
        currencyRate: FIXED_RATES_TO_UAH[item.currencyCode] || 1,
        price: item.price,
        amount: item.amount,
        budget: item.budget,
        hourlyRate: item.hourlyRate,
        sharePercent: item.sharePercent,
        date: startOfDayOffset(-(index + 3)),
        orderDate: startOfDayOffset(-(index + 3)),
        plannedFinishDate: startOfDayOffset(index + 5),
        meta: {
          seed: 'demo',
          variant: item.orderType,
        },
      }
    );

    await prisma.orderTag.deleteMany({ where: { orderId: row.id } });
    const tagIds = item.tags
      .map((name) => lookups.tagsByCodeAndName.get(`order:${name}`)?.id)
      .filter(Boolean);
    if (tagIds.length) {
      await prisma.orderTag.createMany({
        data: tagIds.map((tagId) => ({ orderId: row.id, tagId })),
        skipDuplicates: true,
      });
    }

    result.set(item.numberOrder, row);
  }

  return result;
}

function buildTransactionDates() {
  return DEMO_TRANSACTIONS.map((item) => ({
    key: item.description,
    date: startOfDayOffset(item.dateOffset),
  }));
}

async function ensureTransactions(lookups, assets, clients, companies, orders, employees) {
  const rates = pickLatestRates();
  const initialBalances = new Map(
    DEMO_ASSETS.map((item) => [item.accountName, Number(item.openingBalance || 0)])
  );
  const runningByAccount = new Map(initialBalances);
  const turnoverByAccount = new Map();

  const datedRows = buildTransactionDates();
  const byDescription = new Map(datedRows.map((item) => [item.key, item.date]));

  for (const item of DEMO_TRANSACTIONS) {
    const asset = assets.get(item.assetAccountName);
    if (!asset?.id) continue;

    const current = Number(runningByAccount.get(item.assetAccountName) || 0);
    const amount = Number(item.amount || 0);
    const commission = Number(item.commission || 0);
    const isDeposit = item.operation === 'DEPOSIT';
    const balanceBefore = current;
    const balanceAfter = isDeposit
      ? Number((current + amount - commission).toFixed(2))
      : Number((current - amount - commission).toFixed(2));

    runningByAccount.set(item.assetAccountName, balanceAfter);

    const stats = turnoverByAccount.get(item.assetAccountName) || {
      incoming: 0,
      outgoing: 0,
      lastEntryDate: null,
    };
    if (isDeposit) {
      stats.incoming += amount;
      stats.outgoing += commission;
    } else {
      stats.outgoing += amount + commission;
    }
    stats.lastEntryDate = byDescription.get(item.description);
    turnoverByAccount.set(item.assetAccountName, stats);

    const client = item.clientEmail ? clients.get(item.clientEmail) : null;
    const company = companies.get(item.companyKey) || null;
    const order = item.orderNumber ? orders.get(item.orderNumber) : null;
    const category = lookups.articlesByName.get(item.categoryName) || null;
    const subcategory = lookups.subarticlesByName.get(item.subcategoryName) || null;
    const accountCurrency = DEMO_ASSETS.find((row) => row.accountName === item.assetAccountName)?.currencyCode || 'UAH';
    const date = byDescription.get(item.description);

    const sumUAH = amountToUah(accountCurrency, amount);
    const sumUSD = Number((sumUAH / rates.usd).toFixed(2));
    const sumRUB = Number((sumUAH / rates.rub).toFixed(2));

    await upsertByFirst(
      'transaction',
      { description: item.description },
      {
        date,
        category: item.categoryName,
        subcategory: item.subcategoryName,
        categoryId: category?.id || null,
        subcategoryId: subcategory?.id || null,
        description: item.description,
        accountId: asset.id,
        accountCurrency,
        operation: item.operation,
        amount,
        commission,
        counterparty: item.counterparty,
        counterpartyRequisites: `${item.counterparty || 'Counterparty'} / ${accountCurrency}`,
        orderId: order?.id || null,
        orderNumber: order?.numberOrder || item.orderNumber || null,
        orderCurrency: order?.currencyType || accountCurrency,
        sumUAH,
        sumUSD,
        sumRUB,
        sumByRatesOrderAmountCurrency: order ? Number(order.amount || order.price || 0) : null,
        sumByRatesUAH: order ? amountToUah(order.currencyType || 'UAH', Number(order.amount || order.price || 0)) : null,
        sumByRatesUSD: order
          ? Number((amountToUah(order.currencyType || 'UAH', Number(order.amount || order.price || 0)) / rates.usd).toFixed(2))
          : null,
        sumByRatesRUB: order
          ? Number((amountToUah(order.currencyType || 'UAH', Number(order.amount || order.price || 0)) / rates.rub).toFixed(2))
          : null,
        sentToCounterparty: isDeposit,
        sendLion: false,
        balanceBefore,
        balanceAfter,
        clientId: client?.id || null,
        companyId: company?.id || null,
        employeeId: employees.get(item.employeeKey)?.id || null,
      }
    );
  }

  for (const item of DEMO_ASSETS) {
    const asset = assets.get(item.accountName);
    if (!asset?.id) continue;

    const current = Number(runningByAccount.get(item.accountName) || item.openingBalance || 0);
    const stats = turnoverByAccount.get(item.accountName) || {
      incoming: 0,
      outgoing: 0,
      lastEntryDate: null,
    };

    await prisma.asset.update({
      where: { id: asset.id },
      data: {
        balance: current,
        turnoverStartBalance: item.openingBalance,
        turnoverIncoming: Number(stats.incoming.toFixed(2)),
        turnoverOutgoing: Number(stats.outgoing.toFixed(2)),
        turnoverEndBalance: current,
        balanceUAH: amountToUah(item.currencyCode, current),
        lastEntryDate: stats.lastEntryDate,
      },
    });
  }
}

async function ensureRegularPayments(lookups, assets, orders) {
  if (!(await hasTable('RegularPayment'))) return;

  for (const item of DEMO_REGULAR_PAYMENTS) {
    const asset = assets.get(item.assetAccountName);
    if (!asset?.id) continue;
    const order = item.orderNumber ? orders.get(item.orderNumber) : null;
    const category = lookups.articlesByName.get(item.categoryName) || null;
    const subcategory = lookups.subarticlesByName.get(item.subcategoryName) || null;
    const accountCurrency = DEMO_ASSETS.find((row) => row.accountName === item.assetAccountName)?.currencyCode || 'UAH';

    await upsertByFirst(
      'regularPayment',
      { description: item.description },
      {
        status: 'Активен',
        period: item.period,
        cycleDay: String(startOfDayOffset(item.nextPaymentOffset).getDate()),
        time: item.time,
        nextPaymentDate: startOfDayOffset(item.nextPaymentOffset),
        lastPaymentDate: null,
        category: item.categoryName,
        subcategory: item.subcategoryName,
        categoryId: category?.id || null,
        subcategoryId: subcategory?.id || null,
        description: item.description,
        accountId: asset.id,
        accountCurrency,
        operation: item.operation,
        amount: item.amount,
        commission: item.commission,
        counterparty: item.counterparty,
        counterpartyRequisites: `${item.counterparty} / ${accountCurrency}`,
        orderId: order?.id || null,
        orderNumber: order?.numberOrder || item.orderNumber || null,
        orderCurrency: order?.currencyType || accountCurrency,
      }
    );
  }
}

async function ensureTaskRows(clients, companies, employees) {
  for (const item of DEMO_TASKS) {
    await upsertByFirst(
      'task',
      { title: item.title },
      {
        title: item.title,
        description: item.description,
        status: item.status,
        employeeId: employees.get(item.employeeKey)?.id,
        clientId: clients.get(item.clientEmail)?.id || null,
        companyId: companies.get(item.companyKey)?.id || null,
        country: item.country,
        category: item.category,
        source: 'DEMO',
      }
    );
  }
}

async function ensureDemoData() {
  await ensureTestFields();
  await ensureDemoRates();

  const lookups = await loadLookups();
  const companies = await ensureCompanies();
  const employees = await ensureEmployees(lookups);
  const clients = await ensureClients(lookups, companies, employees);
  const assets = await ensureAssets(lookups, companies, employees);
  const orders = await ensureOrders(lookups, clients, employees);

  await ensureTransactions(lookups, assets, clients, companies, orders, employees);
  await ensureRegularPayments(lookups, assets, orders);
  await ensureTaskRows(clients, companies, employees);
}

module.exports = {
  ensureDemoData,
  DEMO_PASSWORD,
};
