// src/data/sampleClients.js
// --------------------------------------------------------------------
// Демонстрационные данные для страницы «Клиенты».
// ▸ 9 записей в трёх группах (1 — Партнёры, 2 — Наши клиенты, 3 — По ситуации)
// ▸ tags — массив объектов { name, color } для использования с TagSelector.
// ▸ Добавлены referrer_id и referrer_first_id для корректного открытия карточек
//   рефералов по клику.
// --------------------------------------------------------------------

export const sampleClients = [
  /* =========================== ПАРТНЁРЫ (1) ======================== */
  {
    id: 1,
    group: 1,
    name: 'ООО «АльфаСтрой»',
    tags: [
      { name: 'B2B', color: '#f39c12' },
      { name: 'строительство', color: '#16a085' },
      { name: 'VIP', color: '#e74c3c' },
      { name: 'недвижимость', color: '#8e44ad' },
      { name: 'долгосрочно', color: '#2980b9' }
    ],
    note: 'Крупный партнёр, ведём проекты по развитию инфраструктуры с 2020 г.',
    intro_description:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
    source: 'LinkedIn',
    full_name: 'Иванов Иван Иванович',
    country: 'Россия',
    currency: 'RUB',
    hourly_rate: 0,
    percent: 10,
    referrer_name: 'Петров Пётр',
    referrer_first_name: 'Петров Пётр',
    referrer_id: 9,           // ← ссылка на клиента-реферала
    referrer_first_id: 9,     // ← ссылка на первого реферала
    status: 'активен',
    last_order_date: '2025-06-30',
     credentials: []
  },
  {
    id: 2,
    group: 1,
    name: 'ООО «ГлобалСнаб»',
    tags: [
      { name: 'логистика', color: '#e67e22' },
      { name: 'B2B', color: '#f39c12' },
      { name: 'NDA', color: '#95a5a6' }
    ],
    note: 'Поставщик стройматериалов; ждут КП до конца июля.',
    intro_description: 'Дистрибьютор и экспортёр стройматериалов в СНГ.',
    source: 'Email',
    full_name: 'Кузнецов Сергей',
    country: 'Россия',
    currency: 'RUB',
    hourly_rate: 0,
    percent: 8,
    referrer_name: '—',
    referrer_first_name: '—',
    referrer_id: null,
    referrer_first_id: null,
    status: 'ожидание',
     credentials: [],
    last_order_date: '—'
  },
  {
    id: 6,
    group: 1,
    name: 'Delta Logistics',
    tags: [
      { name: 'логистика', color: '#e67e22' },
      { name: 'международные перевозки', color: '#d35400' }
    ],
    note: 'Ищут IT-партнёра для автоматизации склада и трекинга.',
    intro_description: 'Топ-10 грузовой перевозчик по Европе.',
    source: 'Cold email',
    full_name: 'Matteo Rossi',
    country: 'Italy',
    currency: 'EUR',
    hourly_rate: 0,
    percent: 6,
    referrer_name: '—',
    referrer_first_name: '—',
    referrer_id: null,
    referrer_first_id: null,
    status: 'переговоры',
     credentials: [],
    last_order_date: '—'
  },
  {
    id: 9,
    group: 1,
    name: 'Петров Пётр',
    tags: [
      { name: 'реферер', color: '#2980b9' }
    ],
    note: 'Ключевой партнёр-реферер.',
    intro_description: 'Отвечает за привлечение клиентов (Referral Partner).',
    source: 'Referral program',
    full_name: 'Петров Пётр',
    country: 'Россия',
    currency: 'RUB',
    hourly_rate: 0,
    percent: 0,
    referrer_name: '—',
    referrer_first_name: '—',
    referrer_id: null,
    referrer_first_id: null,
    status: 'партнёр',
     credentials: [],
    last_order_date: '—'
  },

  /* ======================= НАШИ КЛИЕНТЫ (2) ======================== */
  {
    id: 3,
    group: 2,
    name: 'Beta Solutions LLC',
    tags: [
      { name: 'SaaS', color: '#2ecc71' },
      { name: 'подписка', color: '#3498db' }
    ],
    note: 'Перешли с тарифа «Standard» на «Enterprise»; нужна интеграция API.',
    intro_description:
      'Американский разработчик ПО для маркет-автоматизации малого бизнеса.',
    source: 'Referral',
    full_name: 'Jessica Miller',
    country: 'USA',
    currency: 'USD',
    hourly_rate: 120,
    percent: 0,
    referrer_name: '—',
    referrer_first_name: '—',
    referrer_id: null,
    referrer_first_id: null,
    status: 'активен',
    credentials: [
      {
        login: 'beta_solutions_login',
        password: 'betaPass123',  }],
    last_order_date: '2025-07-14'
  },
  {
    id: 4,
    group: 2,
    name: 'Gamma Corp.',
    tags: [
      { name: 'e-commerce', color: '#9b59b6' },
      { name: 'retail', color: '#c0392b' },
      { name: 'cloud', color: '#27ae60' }
    ],
    note: 'Годовой контракт на поддержку и DevOps согласован.',
    intro_description: 'Крупный онлайн-ритейлер бытовой техники в Европе.',
    source: 'Conference',
    full_name: 'Hans Müller',
    country: 'Germany',
    currency: 'EUR',
    hourly_rate: 95,
    percent: 0,
    referrer_name: '—',
    referrer_first_name: '—',
    referrer_id: null,
    referrer_first_id: null,
    status: 'активен',
     credentials: [],
    last_order_date: '2025-07-10'
  },
  {
    id: 7,
    group: 2,
    name: 'Omega Health Inc.',
    tags: [
      { name: 'healthcare', color: '#e74c3c' },
      { name: 'SaaS', color: '#2ecc71' },
      { name: 'подписка', color: '#3498db' }
    ],
    note: 'Нужна HIPAA-совместимая облачная платформа для пациентов.',
    intro_description: 'США: SaaS-решение для управления медицинскими данными.',
    source: 'LinkedIn',
    full_name: 'Dr. Emily Zhao',
    country: 'USA',
    currency: 'USD',
    hourly_rate: 130,
    percent: 0,
    referrer_name: '—',
    referrer_first_name: '—',
    referrer_id: null,
    referrer_first_id: null,
    status: 'активен',
    last_order_date: '2025-07-12',
     credentials: []
  },

  /* ====================== ПО СИТУАЦИИ (3) ========================== */
  {
    id: 5,
    group: 3,
    name: 'StartUp X',
    tags: [
      { name: 'FinTech', color: '#1abc9c' },
      { name: 'prototype', color: '#e84393' },
      { name: 'urgent', color: '#d63031' },
      { name: 'NDA', color: '#95a5a6' }
    ],
    note: 'Нужен MVP до Demo-Day; высокие риски финансирования.',
    intro_description: 'Финтех-платформа P2P-кредитования в ЮВА.',
    source: 'Pitch-deck',
    full_name: 'Nguyen Hoang Minh',
    country: 'Vietnam',
    currency: 'USD',
    hourly_rate: 75,
    percent: 5,
    referrer_name: '—',
    referrer_first_name: '—',
    referrer_id: null,
    referrer_first_id: null,
    status: 'переговоры',
    last_order_date: '—',
     credentials: []
  },
  {
    id: 8,
    group: 3,
    name: 'Project Y',
    tags: [
      { name: 'AI', color: '#8e44ad' },
      { name: 'stealth', color: '#34495e' },
      { name: 'prototype', color: '#e27a3f' }
    ],
    note: 'Stealth-стартап в области генеративного видео, бюджет ограничен.',
    intro_description: 'Автоматизация генеративных моделей для видео (stealth-режим).',
    source: 'Accelerator',
    full_name: 'Confidential',
    country: 'UK',
    currency: 'GBP',
    hourly_rate: 85,
    percent: 4,
    referrer_name: '—',
    referrer_first_name: '—',
    referrer_id: null,
    referrer_first_id: null,
    status: 'поиск финансирования',
    last_order_date: '—'
  },
  // ДОПОЛНЕНИЯ:

/* =========================== ПАРТНЁРЫ (1) ======================== */
{
  id: 10,
  group: 1,
  name: 'АО «ЭнергоПром»',
  tags: [
    { name: 'энергетика', color: '#e67e22' },
    { name: 'B2B', color: '#f39c12' },
    { name: 'производство', color: '#16a085' },
    { name: 'долгосрочно', color: '#2980b9' }
  ],
  note: 'Рассматривают возможность внедрения систем мониторинга.',
  intro_description: 'Крупный поставщик электроэнергии и промышленных решений.',
  source: 'Webinar',
  full_name: 'Сидоров Алексей',
  country: 'Россия',
  currency: 'RUB',
  hourly_rate: 0,
  percent: 7,
  referrer_name: 'Петров Пётр',
  referrer_first_name: 'Петров Пётр',
  referrer_id: 9,
  referrer_first_id: 9,
  status: 'переговоры',
  last_order_date: '—'
},

/* ======================= НАШИ КЛИЕНТЫ (2) ======================== */
{
  id: 11,
  group: 2,
  name: 'Zeta Innovations',
  tags: [
    { name: 'IoT', color: '#2980b9' },
    { name: 'подписка', color: '#3498db' },
    { name: 'SaaS', color: '#2ecc71' }
  ],
  note: 'Интересуются white-label решением под смарт-устройства.',
  intro_description: 'Канадский стартап в области домашних IoT-решений.',
  source: 'Tech blog',
  full_name: 'Chloe Laurent',
  country: 'Canada',
  currency: 'CAD',
  hourly_rate: 100,
  percent: 0,
  referrer_name: '—',
  referrer_first_name: '—',
  referrer_id: null,
  referrer_first_id: null,
  status: 'активен',
  last_order_date: '2025-07-13'
},

/* ====================== ПО СИТУАЦИИ (3) ========================== */
{
  id: 12,
  group: 3,
  name: 'NeoSpace Lab',
  tags: [
    { name: 'R&D', color: '#9b59b6' },
    { name: 'prototype', color: '#e84393' },
    { name: 'space-tech', color: '#1abc9c' },
    { name: 'grant', color: '#95a5a6' }
  ],
  note: 'Проект под грант ЕС; ищут команду для создания цифрового двойника спутника.',
  intro_description: 'Европейская исследовательская группа в аэрокосмической отрасли.',
  source: 'Grant platform',
  full_name: 'Lukas Heinemann',
  country: 'Austria',
  currency: 'EUR',
  hourly_rate: 90,
  percent: 3,
  referrer_name: '—',
  referrer_first_name: '—',
  referrer_id: null,
  referrer_first_id: null,
  status: 'грантовая заявка',
  last_order_date: '—'
},
/* =========================== ПАРТНЁРЫ (1) ======================== */
{
  id: 13,
  group: 1,
  name: 'АО «НефтеГазИнжиниринг»',
  tags: [
    { name: 'энергетика', color: '#e67e22' },
    { name: 'инжиниринг', color: '#8e44ad' },
    { name: 'B2B', color: '#f39c12' }
  ],
  note: 'Интересуются цифровизацией полевых операций и AR-мониторингом.',
  intro_description: 'Проектный интегратор для нефтегазового сектора.',
  source: 'LinkedIn',
  full_name: 'Ахметов Рустам',
  country: 'Казахстан',
  currency: 'KZT',
  hourly_rate: 0,
  percent: 6,
  referrer_name: 'Петров Пётр',
  referrer_first_name: 'Петров Пётр',
  referrer_id: 9,
  referrer_first_id: 9,
  status: 'переговоры',
  last_order_date: '—'
},
{
  id: 14,
  group: 1,
  name: 'BuildTech Partners',
  tags: [
    { name: 'строительство', color: '#16a085' },
    { name: 'цифровизация', color: '#3498db' },
    { name: 'B2B', color: '#f39c12' }
  ],
  note: 'Партнёр в рамках BIM-автоматизации для жилого строительства.',
  intro_description: 'Инжиниринговая компания, работающая в странах Балтии.',
  source: 'Conference',
  full_name: 'Martins Ozols',
  country: 'Latvia',
  currency: 'EUR',
  hourly_rate: 0,
  percent: 9,
  referrer_name: '—',
  referrer_first_name: '—',
  referrer_id: null,
  referrer_first_id: null,
  status: 'активен',
  last_order_date: '2025-07-01'
},

/* ======================= НАШИ КЛИЕНТЫ (2) ======================== */
{
  id: 15,
  group: 2,
  name: 'CloudWell Inc.',
  tags: [
    { name: 'облачные сервисы', color: '#27ae60' },
    { name: 'DevOps', color: '#c0392b' },
    { name: 'поддержка', color: '#95a5a6' }
  ],
  note: 'Переходят с AWS на собственную облачную платформу.',
  intro_description: 'Поставщик облачных решений для среднего бизнеса в США.',
  source: 'Referral',
  full_name: 'Andrew Collins',
  country: 'USA',
  currency: 'USD',
  hourly_rate: 110,
  percent: 0,
  referrer_name: 'Jessica Miller',
  referrer_first_name: 'Jessica Miller',
  referrer_id: 3,
  referrer_first_id: 3,
  status: 'активен',
  last_order_date: '2025-07-15'
},
{
  id: 16,
  group: 2,
  name: 'Retail Nova',
  tags: [
    { name: 'retail', color: '#c0392b' },
    { name: 'маркетинг', color: '#f1c40f' },
    { name: 'анализ данных', color: '#8e44ad' }
  ],
  note: 'Заказали дашборд с аналитикой покупательского поведения.',
  intro_description: 'Сеть магазинов одежды с фокусом на digital-стратегии.',
  source: 'Online form',
  full_name: 'Eva Kowalska',
  country: 'Poland',
  currency: 'PLN',
  hourly_rate: 80,
  percent: 0,
  referrer_name: '—',
  referrer_first_name: '—',
  referrer_id: null,
  referrer_first_id: null,
  status: 'ожидание',
  last_order_date: '2025-07-05'
},

/* ====================== ПО СИТУАЦИИ (3) ========================== */
{
  id: 17,
  group: 3,
  name: 'NextGen BioLab',
  tags: [
    { name: 'biotech', color: '#1abc9c' },
    { name: 'исследования', color: '#34495e' },
    { name: 'MVP', color: '#e84393' }
  ],
  note: 'Запросили помощь в создании платформы анализа генома.',
  intro_description: 'Стартап из Израиля в области биотехнологий.',
  source: 'Startup competition',
  full_name: 'Yael Ben-Ari',
  country: 'Israel',
  currency: 'ILS',
  hourly_rate: 95,
  percent: 4,
  referrer_name: '—',
  referrer_first_name: '—',
  referrer_id: null,
  referrer_first_id: null,
  status: 'переговоры',
  last_order_date: '—'
},
/* =========================== ПАРТНЁРЫ (1) ======================== */
{
  id: 18,
  group: 1,
  name: 'ИнтелТех Системс',
  tags: [
    { name: 'интеграция', color: '#8e44ad' },
    { name: 'автоматизация', color: '#2980b9' },
    { name: 'B2B', color: '#f39c12' }
  ],
  note: 'Проект по внедрению ERP в производственный кластер.',
  intro_description: 'Системный интегратор в Центральной Азии.',
  source: 'Conference',
  full_name: 'Жумабеков Тимур',
  country: 'Uzbekistan',
  currency: 'UZS',
  hourly_rate: 0,
  percent: 5,
  referrer_name: 'Петров Пётр',
  referrer_first_name: 'Петров Пётр',
  referrer_id: 9,
  referrer_first_id: 9,
  status: 'активен',
  last_order_date: '2025-06-28'
},
{
  id: 19,
  group: 1,
  name: 'SmartCom Systems',
  tags: [
    { name: 'телеком', color: '#3498db' },
    { name: 'B2B', color: '#f39c12' },
    { name: 'инфраструктура', color: '#16a085' }
  ],
  note: 'Проект сотовой сети в горах, требуются IoT-решения.',
  intro_description: 'Развивают мобильную связь в труднодоступных регионах.',
  source: 'Tender',
  full_name: 'Ahmad Durrani',
  country: 'Pakistan',
  currency: 'PKR',
  hourly_rate: 0,
  percent: 7,
  referrer_name: '—',
  referrer_first_name: '—',
  referrer_id: null,
  referrer_first_id: null,
  status: 'переговоры',
  last_order_date: '—'
},
{
  id: 20,
  group: 1,
  name: 'ООО «ВекторСофт»',
  tags: [
    { name: 'разработка', color: '#9b59b6' },
    { name: 'B2B', color: '#f39c12' },
    { name: 'аутсорс', color: '#34495e' }
  ],
  note: 'Партнёр по ряду backend-решений для маркетплейсов.',
  intro_description: 'Аутсорс-компания, работающая по SLA-моделям.',
  source: 'LinkedIn',
  full_name: 'Калюжный Роман',
  country: 'Беларусь',
  currency: 'BYN',
  hourly_rate: 0,
  percent: 10,
  referrer_name: '—',
  referrer_first_name: '—',
  referrer_id: null,
  referrer_first_id: null,
  status: 'активен',
  last_order_date: '2025-07-08'
},
{
  id: 21,
  group: 1,
  name: 'QazaqTech Group',
  tags: [
    { name: 'ИТ', color: '#2ecc71' },
    { name: 'госзаказ', color: '#c0392b' },
    { name: 'инфраструктура', color: '#34495e' }
  ],
  note: 'Участвуют в тендере на создание дата-центра.',
  intro_description: 'Группа компаний для цифровизации госсектора.',
  source: 'Gov portal',
  full_name: 'Алдияров Бауржан',
  country: 'Kazakhstan',
  currency: 'KZT',
  hourly_rate: 0,
  percent: 8,
  referrer_name: 'Петров Пётр',
  referrer_first_name: 'Петров Пётр',
  referrer_id: 9,
  referrer_first_id: 9,
  status: 'ожидание',
  last_order_date: '—'
},

/* ======================= НАШИ КЛИЕНТЫ (2) ======================== */
{
  id: 22,
  group: 2,
  name: 'NovaMed AI',
  tags: [
    { name: 'healthtech', color: '#e74c3c' },
    { name: 'AI', color: '#8e44ad' },
    { name: 'SaaS', color: '#2ecc71' }
  ],
  note: 'Разработка модуля распознавания изображений для МРТ.',
  intro_description: 'Американский стартап в области ИИ для медицины.',
  source: 'Referral',
  full_name: 'Dr. James Nolan',
  country: 'USA',
  currency: 'USD',
  hourly_rate: 125,
  percent: 0,
  referrer_name: 'Jessica Miller',
  referrer_first_name: 'Jessica Miller',
  referrer_id: 3,
  referrer_first_id: 3,
  status: 'активен',
  last_order_date: '2025-07-14'
},
{
  id: 23,
  group: 2,
  name: 'GreenPay',
  tags: [
    { name: 'FinTech', color: '#1abc9c' },
    { name: 'подписка', color: '#3498db' },
    { name: 'экологично', color: '#2ecc71' }
  ],
  note: 'Переходят на облачную CRM и биллинг-систему.',
  intro_description: 'Сервис мобильных платежей с ориентацией на ESG.',
  source: 'Tech review',
  full_name: 'Sophie Lang',
  country: 'UK',
  currency: 'GBP',
  hourly_rate: 105,
  percent: 0,
  referrer_name: '—',
  referrer_first_name: '—',
  referrer_id: null,
  referrer_first_id: null,
  status: 'активен',
  last_order_date: '2025-07-13',
   credentials: [
      {
        login: 'alfastroy_login',
        password: 's3cr3tPass!',
        description: 'Основной доступ для менеджера'
      },
      {
        login: 'alfastroy_backup',
        password: 'backup1234',
        description: 'Резервный доступ'
      }
    ]
},
{
  id: 24,
  group: 2,
  name: 'ShopifyNext',
  tags: [
    { name: 'e-commerce', color: '#9b59b6' },
    { name: 'retail', color: '#c0392b' }
  ],
  note: 'Адаптируют storefront под глобальный рынок.',
  intro_description: 'Стартап с фокусом на headless e-commerce.',
  source: 'Email',
  full_name: 'Carlos Ramirez',
  country: 'Mexico',
  currency: 'MXN',
  hourly_rate: 85,
  percent: 0,
  referrer_name: '—',
  referrer_first_name: '—',
  referrer_id: null,
  referrer_first_id: null,
  status: 'ожидание',
  last_order_date: '2025-07-09',
   credentials: [
      {
        login: 'globalsnab_main',
        password: 'globSup#2025',
        description: 'Доступ для отдела закупок'
      }
    ]
},

/* ====================== ПО СИТУАЦИИ (3) ========================== */
{
  id: 25,
  group: 3,
  name: 'Alpha Quantum',
  tags: [
    { name: 'stealth', color: '#34495e' },
    { name: 'quantum', color: '#8e44ad' },
    { name: 'prototype', color: '#e84393' }
  ],
  note: 'Тестируют прототип симулятора для квантовых сетей.',
  intro_description: 'Исследовательская группа в области квантових обчислень.',
  source: 'Academic network',
  full_name: 'Dr. Felix Bauer',
  country: 'Germany',
  currency: 'EUR',
  hourly_rate: 100,
  percent: 4,
  referrer_name: '—',
  referrer_first_name: '—',
  referrer_id: null,
  referrer_first_id: null,
  status: 'исследование',
  last_order_date: '—',
  credentials: [
      { login: 'deltalog_login', password: 'DL2025!', description: 'Основной доступ' }
    ]
},
{
  id: 26,
  group: 3,
  name: 'Astra Robotics',
  tags: [
    { name: 'robotics', color: '#d35400' },
    { name: 'prototype', color: '#e84393' },
    { name: 'industrial', color: '#95a5a6' }
  ],
  note: 'Создание MVP системы автоматизации сборки дронов.',
  intro_description: 'Южнокорейский хардвар-стартап.',
  source: 'Accelerator',
  full_name: 'Jin-woo Park',
  country: 'South Korea',
  currency: 'KRW',
  hourly_rate: 95,
  percent: 5,
  referrer_name: '—',
  referrer_first_name: '—',
  referrer_id: null,
  referrer_first_id: null,
  status: 'поиск инвестора',
  last_order_date: '—'
},
{
  id: 27,
  group: 3,
  name: 'Ocean Data Lab',
  tags: [
    { name: 'research', color: '#2980b9' },
    { name: 'climate', color: '#27ae60' },
    { name: 'prototype', color: '#e84393' }
  ],
  note: 'Данные со спутников о динамике океанических течений.',
  intro_description: 'Исследовательская группа в области океанографии.',
  source: 'Scientific Grant',
  full_name: 'Marie Chevalier',
  country: 'France',
  currency: 'EUR',
  hourly_rate: 88,
  percent: 3,
  referrer_name: '—',
  referrer_first_name: '—',
  referrer_id: null,
  referrer_first_id: null,
  status: 'подготовка заявки',
  last_order_date: '—'
},
/* =========================== ПАРТНЁРЫ (1) ======================== */
{
  id: 28,
  group: 1,
  name: 'ООО «ТехноАльянс»',
  tags: [
    { name: 'промисловість', color: '#c0392b' },
    { name: 'B2B', color: '#f39c12' },
    { name: 'сервіс', color: '#95a5a6' }
  ],
  note: 'Обговорюємо сервісну підтримку ІТ-інфраструктури на заводах.',
  intro_description: 'Технічне обслуговування промислових підприємств.',
  source: 'Webinar',
  full_name: 'Гринько Павло',
  country: 'Україна',
  currency: 'UAH',
  hourly_rate: 0,
  percent: 7,
  referrer_name: 'Петров Пётр',
  referrer_first_name: 'Петров Пётр',
  referrer_id: 9,
  referrer_first_id: 9,
  status: 'активен',
  last_order_date: '2025-07-01'
},
{
  id: 29,
  group: 1,
  name: 'TechBridge Ltd.',
  tags: [
    { name: 'IT-послуги', color: '#8e44ad' },
    { name: 'партнерство', color: '#2ecc71' }
  ],
  note: 'Обговорюємо спільні R&D проєкти.',
  intro_description: 'Консалтингова компанія у сфері цифрової трансформації.',
  source: 'Hackathon',
  full_name: 'Nina Sanders',
  country: 'Ireland',
  currency: 'EUR',
  hourly_rate: 0,
  percent: 6,
  referrer_name: '—',
  referrer_first_name: '—',
  referrer_id: null,
  referrer_first_id: null,
  status: 'переговоры',
  last_order_date: '—'
},
{
  id: 30,
  group: 1,
  name: 'Nordic Systems AB',
  tags: [
    { name: 'інфраструктура', color: '#2980b9' },
    { name: 'європейський ринок', color: '#27ae60' }
  ],
  note: 'Партнер у розробці IoT-рішень для будівництва.',
  intro_description: 'Шведський системний інтегратор.',
  source: 'LinkedIn',
  full_name: 'Björn Lindström',
  country: 'Sweden',
  currency: 'SEK',
  hourly_rate: 0,
  percent: 9,
  referrer_name: '—',
  referrer_first_name: '—',
  referrer_id: null,
  referrer_first_id: null,
  status: 'активен',
  last_order_date: '2025-07-11'
},

/* ======================= НАШИ КЛИЕНТЫ (2) ======================== */
{
  id: 31,
  group: 2,
  name: 'EduSpark',
  tags: [
    { name: 'EdTech', color: '#9b59b6' },
    { name: 'SaaS', color: '#2ecc71' },
    { name: 'підписка', color: '#3498db' }
  ],
  note: 'Доопрацьовуємо функціонал LMS платформи.',
  intro_description: 'Онлайн-платформа для освіти в Азії.',
  source: 'Referral',
  full_name: 'Tan Mei Ling',
  country: 'Malaysia',
  currency: 'MYR',
  hourly_rate: 92,
  percent: 0,
  referrer_name: 'Jessica Miller',
  referrer_first_name: 'Jessica Miller',
  referrer_id: 3,
  referrer_first_id: 3,
  status: 'активен',
  last_order_date: '2025-07-14'
},
{
  id: 32,
  group: 2,
  name: 'DataWell Inc.',
  tags: [
    { name: 'Big Data', color: '#e67e22' },
    { name: 'аналітика', color: '#2980b9' }
  ],
  note: 'Запитали модуль візуалізації аналітики у BI-системі.',
  intro_description: 'BI-платформа для медіа та реклами.',
  source: 'Tech blog',
  full_name: 'Emily Grant',
  country: 'Australia',
  currency: 'AUD',
  hourly_rate: 115,
  percent: 0,
  referrer_name: '—',
  referrer_first_name: '—',
  referrer_id: null,
  referrer_first_id: null,
  status: 'активен',
  last_order_date: '2025-07-13'
},
{
  id: 33,
  group: 2,
  name: 'LegalBot',
  tags: [
    { name: 'LegalTech', color: '#34495e' },
    { name: 'чат-бот', color: '#95a5a6' },
    { name: 'підписка', color: '#3498db' }
  ],
  note: 'Запускають нову лінійку послуг з автоматизації контрактів.',
  intro_description: 'Автоматизований юридичний помічник.',
  source: 'Cold email',
  full_name: 'Marek Novak',
  country: 'Czech Republic',
  currency: 'CZK',
  hourly_rate: 90,
  percent: 0,
  referrer_name: '—',
  referrer_first_name: '—',
  referrer_id: null,
  referrer_first_id: null,
  status: 'ожидание',
  last_order_date: '2025-07-12'
},
{
  id: 34,
  group: 2,
  name: 'AgroTrack',
  tags: [
    { name: 'AgriTech', color: '#1abc9c' },
    { name: 'IoT', color: '#2ecc71' }
  ],
  note: 'Інтегрують трекінг посівів з аналітикою ґрунту.',
  intro_description: 'Платформа для точного землеробства.',
  source: 'Industry fair',
  full_name: 'Sándor Tóth',
  country: 'Hungary',
  currency: 'HUF',
  hourly_rate: 88,
  percent: 0,
  referrer_name: '—',
  referrer_first_name: '—',
  referrer_id: null,
  referrer_first_id: null,
  status: 'активен',
  last_order_date: '2025-07-13'
},

/* ====================== ПО СИТУАЦИИ (3) ========================== */
{
  id: 35,
  group: 3,
  name: 'DeepSynth AI',
  tags: [
    { name: 'AI', color: '#8e44ad' },
    { name: 'music', color: '#e84393' },
    { name: 'prototype', color: '#e27a3f' }
  ],
  note: 'Розробляють генеративну платформу для синтезу музики.',
  intro_description: 'Музичний стартап у сфері генеративного ШІ.',
  source: 'Startup Hub',
  full_name: 'Luca Ferrari',
  country: 'Italy',
  currency: 'EUR',
  hourly_rate: 95,
  percent: 5,
  referrer_name: '—',
  referrer_first_name: '—',
  referrer_id: null,
  referrer_first_id: null,
  status: 'поиск инвестора',
  last_order_date: '—'
},
{
  id: 36,
  group: 3,
  name: 'NanoLab Start',
  tags: [
    { name: 'R&D', color: '#27ae60' },
    { name: 'biotech', color: '#1abc9c' }
  ],
  note: 'Готується заявка на Horizon Europe.',
  intro_description: 'Стартап в області наночастинок для фармацевтики.',
  source: 'Grant application',
  full_name: 'Ieva Bērziņa',
  country: 'Latvia',
  currency: 'EUR',
  hourly_rate: 78,
  percent: 4,
  referrer_name: '—',
  referrer_first_name: '—',
  referrer_id: null,
  referrer_first_id: null,
  status: 'підготовка заявки',
  last_order_date: '—'
},
{
  id: 37,
  group: 3,
  name: 'Zer0Trace',
  tags: [
    { name: 'cybersecurity', color: '#34495e' },
    { name: 'MVP', color: '#e84393' },
    { name: 'stealth', color: '#34495e' }
  ],
  note: 'Секретний MVP інструменту для анонімізації даних.',
  intro_description: 'Кібербезпековий стартап з акцентом на конфіденційність.',
  source: 'Confidential',
  full_name: 'Confidential',
  country: 'Estonia',
  currency: 'EUR',
  hourly_rate: 100,
  percent: 3,
  referrer_name: '—',
  referrer_first_name: '—',
  referrer_id: null,
  referrer_first_id: null,
  status: 'stealth',
  last_order_date: '—'
}

];
