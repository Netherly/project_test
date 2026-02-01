# GSSE CRM

CRM‑система для управления заказами, клиентами, сотрудниками, финансами и задачами.
Проект состоит из backend (Node.js/Express + Prisma + PostgreSQL) и frontend (React + Vite).

## Стек
- Backend: Node.js, Express, Prisma, PostgreSQL
- Frontend: React, Vite, react‑hook‑form, react‑router

## Требования
- Node.js 18+ (рекомендовано)
- npm
- PostgreSQL (или другой поддерживаемый Prisma datasource)

## Структура проекта
- `Backend/` — API, авторизация, cron‑задачи, Telegram‑бот, Prisma
- `Frontend/` — UI (React/Vite)

## Быстрый старт (локально)

### 1) Backend
```bash
cd Backend
npm install
```

Создайте `.env` (можно взять за основу `Backend/.env`) и укажите минимум:
```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public
JWT_SECRET=your_secret
PORT=3000
```

Опционально:
```
TELEGRAM_BOT_TOKEN=...
BOT_DISABLED=1            # отключить Telegram‑бота
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=3d
JWT_MAX_LOGIN_AGE_MS=259200000  # 3 дня, принудительная повторная авторизация
```

Запуск в dev‑режиме (поднимает API, выполняет prisma generate и db push):
```bash
npm run dev
```

Сидинг:
```bash
npm run seed
```

### 2) Frontend
```bash
cd Frontend
npm install
npm run dev
```

По умолчанию фронт использует API `http://localhost:3000/api`.
Если API в другом месте — задайте `VITE_API_URL` в `Frontend/.env`:
```
VITE_API_URL=http://localhost:3000/api
```

Откройте: `http://localhost:5173`

## Продакшен

Backend:
```bash
cd Backend
npm install
npm start
```

Frontend:
```bash
cd Frontend
npm install
npm run build
npm run preview
```

Собранный фронт лежит в `Frontend/dist/` — можно отдавать через nginx.

## Полезные команды

Backend:
```bash
npm run lint
npm test
```

Frontend:
```bash
npm run lint
```

## Примечания
- CORS для dev уже настроен на `http://localhost:5173` (см. `Backend/src/app.js`).
- Telegram‑бот запускается только если задан `TELEGRAM_BOT_TOKEN` и не установлен `BOT_DISABLED=1`.
