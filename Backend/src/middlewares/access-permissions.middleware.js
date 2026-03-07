const {
  actionFromMethod,
  assertModuleAccess,
} = require('../services/access-control.service');

function requireModuleAccess(moduleKey, explicitAction) {
  return async (req, res, next) => {
    try {
      const actionKey = explicitAction || actionFromMethod(req.method);
      const employeeId = req.user?.employeeId || req.user?.id || null;
      await assertModuleAccess({ employeeId, moduleKey, actionKey });
      next();
    } catch (err) {
      res.status(err.status || 500).json({ ok: false, error: err.message });
    }
  };
}

module.exports = { requireModuleAccess };
