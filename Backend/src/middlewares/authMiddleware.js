// src/middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');

function extractToken(req) {
  const h = req.headers.authorization || '';
  const [scheme, value] = h.split(' ');
  if (scheme && scheme.toLowerCase() === 'bearer' && value) return value;
  // опционально: поддержка cookie
  if (req.cookies?.token) return req.cookies.token;
  return null;
}

const authMiddleware = (req, res, next) => {
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: 'JWT secret is not configured' });
  }

  const token = extractToken(req);
  if (!token) {
    res.set('WWW-Authenticate', 'Bearer realm="api"');
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],     // под вашу сигнатуру
      clockTolerance: 5          // допуск 5с на рассинхрон часов
    });
    // единообразно: кладём в req.user
    req.user = { employeeId: decoded.employeeId, ...decoded };
    return next();
  } catch (err) {
    res.set('WWW-Authenticate', 'Bearer error="invalid_token"');
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = authMiddleware;
