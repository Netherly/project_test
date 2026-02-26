const accessControlService = require('../services/access-control.service');
const prisma = require('../../prisma/client');

function pickEmployeeId(req) {
  return req.user?.employeeId || req.user?.id || null;
}

const AccessControlController = {
  async getConfig(req, res) {
    try {
      await accessControlService.assertModuleAccess({
        employeeId: pickEmployeeId(req),
        moduleKey: 'settings',
        actionKey: 'view',
      });
      const data = await accessControlService.loadConfig();
      res.json({ ok: true, data });
    } catch (err) {
      res.status(err.status || 500).json({ ok: false, error: err.message });
    }
  },

  async saveConfig(req, res) {
    try {
      await accessControlService.assertModuleAccess({
        employeeId: pickEmployeeId(req),
        moduleKey: 'settings',
        actionKey: 'edit',
      });
      const data = await accessControlService.saveConfig(req.body || {});
      res.json({ ok: true, data });
    } catch (err) {
      res.status(err.status || 500).json({ ok: false, error: err.message });
    }
  },

  async getMe(req, res) {
    try {
      const employeeId = pickEmployeeId(req);
      const effective = await accessControlService.getEffectiveAccess(employeeId);
      res.json({
        ok: true,
        data: {
          employeeId,
          bootstrapOpen: effective.bootstrapOpen,
          role: effective.role
            ? {
                id: effective.role.id,
                name: effective.role.name,
                isBase: !!effective.role.isBase,
                isProtected: !!effective.role.isProtected,
              }
            : null,
          permissions: effective.permissions || {},
        },
      });
    } catch (err) {
      res.status(err.status || 500).json({ ok: false, error: err.message });
    }
  },

  async listEmployees(req, res) {
    try {
      await accessControlService.assertModuleAccess({
        employeeId: pickEmployeeId(req),
        moduleKey: 'settings',
        actionKey: 'view',
      });

      const employees = await prisma.employee.findMany({
        select: {
          id: true,
          full_name: true,
          email: true,
          login: true,
        },
        orderBy: [{ full_name: 'asc' }, { login: 'asc' }],
      });

      res.json({ ok: true, data: employees });
    } catch (err) {
      res.status(err.status || 500).json({ ok: false, error: err.message });
    }
  },
};

module.exports = AccessControlController;
