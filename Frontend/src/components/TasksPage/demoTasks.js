const NON_PROD_HOSTS = new Set(["localhost", "127.0.0.1", "gsse.dev"]);

export function shouldBootstrapDemoTasks() {
  if (typeof window === "undefined") return false;
  const host = String(window.location.hostname || "").trim().toLowerCase();
  if (!host) return false;
  if (NON_PROD_HOSTS.has(host)) return true;
  return host !== "gsse.work";
}

export const demoTasks = [
  {
    id: "DEMO-TASK-001",
    level: "A",
    executionDate: "15.03.2026",
    executionTime: "10:00",
    fromTo: "[DEMO] Mykyta Owner -> [DEMO] Anna Sales",
    orderNumber: "DEMO-1001",
    client: "[DEMO] Nordic Store",
    description: "Созвон по roadmap и старту CRM",
    task: "Подтвердить этапы интеграции и ответственных",
    deadline: "17.03.2026",
    status: "В ожидании",
  },
  {
    id: "DEMO-TASK-002",
    level: "B",
    executionDate: "16.03.2026",
    executionTime: "12:30",
    fromTo: "[DEMO] Anna Sales -> [DEMO] Liza Creative",
    orderNumber: "DEMO-1003",
    client: "[DEMO] Kyiv Clinic",
    description: "Подготовка нового hero-блока",
    task: "Сделать 3 варианта визуала и CTA",
    deadline: "18.03.2026",
    status: "В работе",
  },
  {
    id: "DEMO-TASK-003",
    level: "A",
    executionDate: "16.03.2026",
    executionTime: "15:00",
    fromTo: "[DEMO] Oleg Growth -> [DEMO] Max Backend",
    orderNumber: "DEMO-1002",
    client: "[DEMO] Dubai Logistics",
    description: "Интеграция заявок Meta Ads",
    task: "Проверить webhook и UTM-мэппинг",
    deadline: "19.03.2026",
    status: "В ожидании",
  },
  {
    id: "DEMO-TASK-004",
    level: "C",
    executionDate: "17.03.2026",
    executionTime: "09:45",
    fromTo: "[DEMO] Max Backend -> [DEMO] Mykyta Owner",
    orderNumber: "DEMO-1004",
    client: "[DEMO] Warsaw Education",
    description: "Финальная проверка телеграм-бота",
    task: "Прогнать оплату, уведомления и fallback-сценарии",
    deadline: "20.03.2026",
    status: "Завершено",
  },
  {
    id: "DEMO-TASK-005",
    level: "B",
    executionDate: "18.03.2026",
    executionTime: "11:15",
    fromTo: "[DEMO] Anna Sales -> [DEMO] Oleg Growth",
    orderNumber: "DEMO-1005",
    client: "[DEMO] Tokyo Commerce",
    description: "Подготовка медиаплана на месяц",
    task: "Собрать гипотезы, бюджет и CPL-прогноз",
    deadline: "21.03.2026",
    status: "Отменено",
  },
];
