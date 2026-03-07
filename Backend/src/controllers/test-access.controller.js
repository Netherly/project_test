const {
  COOKIE_NAME,
  assertConfigured,
  cookieOptions,
  clearCookieOptions,
  createGateToken,
  verifyPassword,
  hasValidGateCookie,
  normalizeNextPath,
} = require('../services/test-access.service');

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildPageUrl({ next, error }) {
  const qs = new URLSearchParams();
  if (error) qs.set('error', '1');
  if (next && next !== '/') qs.set('next', next);
  const query = qs.toString();
  return `/test-access${query ? `?${query}` : ''}`;
}

function renderAccessPage({ nextPath, showError }) {
  const title = 'Доступ к тестовой версии';
  const description = 'Введите общий пароль для тестового стенда. Доступ будет сохранен на 7 дней.';
  const errorText = showError ? 'Неверный пароль. Попробуйте еще раз.' : '';
  const hiddenNext = escapeHtml(nextPath);

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background:
        radial-gradient(circle at 20% 20%, rgba(99,102,241,.20), transparent 40%),
        radial-gradient(circle at 80% 10%, rgba(14,165,233,.18), transparent 35%),
        #09090b;
      color: #f4f4f5;
      padding: 24px;
    }
    .card {
      width: min(420px, 100%);
      background: rgba(24,24,27,.92);
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 18px;
      padding: 24px;
      box-shadow: 0 18px 60px rgba(0,0,0,.45);
      backdrop-filter: blur(10px);
    }
    h1 {
      margin: 0 0 10px;
      font-size: 22px;
      line-height: 1.2;
    }
    p {
      margin: 0 0 18px;
      color: #c4c4cc;
      font-size: 14px;
      line-height: 1.45;
    }
    label {
      display: block;
      margin: 0 0 8px;
      font-size: 13px;
      color: #d4d4d8;
    }
    input[type="password"] {
      width: 100%;
      height: 44px;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,.12);
      background: rgba(255,255,255,.03);
      color: #fafafa;
      padding: 0 14px;
      outline: none;
    }
    input[type="password"]:focus {
      border-color: rgba(129,140,248,.9);
      box-shadow: 0 0 0 3px rgba(129,140,248,.20);
    }
    .error {
      min-height: 20px;
      margin: 10px 0 0;
      color: #fda4af;
      font-size: 13px;
    }
    .actions {
      margin-top: 18px;
      display: flex;
      justify-content: flex-end;
    }
    button {
      height: 42px;
      border: 0;
      border-radius: 12px;
      padding: 0 16px;
      font-weight: 600;
      cursor: pointer;
      color: #111827;
      background: linear-gradient(135deg, #c4b5fd, #93c5fd);
    }
  </style>
</head>
<body>
  <main class="card">
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(description)}</p>
    <form method="post" action="/api/test-access/login" novalidate>
      <input type="hidden" name="next" value="${hiddenNext}" />
      <label for="test-access-password">Общий пароль</label>
      <input id="test-access-password" type="password" name="password" autocomplete="current-password" required autofocus />
      <div class="error">${escapeHtml(errorText)}</div>
      <div class="actions">
        <button type="submit">Продолжить</button>
      </div>
    </form>
  </main>
</body>
</html>`;
}

function noStore(res) {
  res.set('Cache-Control', 'no-store');
}

const page = (req, res, next) => {
  try {
    assertConfigured();
    noStore(res);

    const nextPath = normalizeNextPath(req.query?.next);
    if (hasValidGateCookie(req)) {
      return res.redirect(302, nextPath);
    }

    const showError = String(req.query?.error || '') === '1';
    res.status(200).type('html').send(renderAccessPage({ nextPath, showError }));
  } catch (err) {
    next(err);
  }
};

const login = (req, res, next) => {
  try {
    assertConfigured();
    noStore(res);

    const nextPath = normalizeNextPath(req.body?.next || req.query?.next);
    const password = String(req.body?.password || '');

    if (!verifyPassword(password)) {
      return res.redirect(303, buildPageUrl({ next: nextPath, error: true }));
    }

    const token = createGateToken();
    res.cookie(COOKIE_NAME, token, cookieOptions());
    return res.redirect(303, nextPath);
  } catch (err) {
    next(err);
  }
};

const check = (req, res) => {
  noStore(res);
  try {
    assertConfigured();
  } catch {
    return res.status(401).end();
  }

  if (!hasValidGateCookie(req)) {
    return res.status(401).end();
  }

  return res.status(204).end();
};

const logout = (req, res, next) => {
  try {
    noStore(res);
    res.clearCookie(COOKIE_NAME, clearCookieOptions());
    const wantsJson = (req.get('accept') || '').includes('application/json');
    if (wantsJson) return res.json({ ok: true });
    return res.redirect(303, '/test-access');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  page,
  login,
  check,
  logout,
};
