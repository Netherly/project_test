const profileService = require("../services/profile.service");

function pickEmployeeId(req) {
  return (
    req.user?.id ||
    req.employeeId ||
    req.headers["x-employee-id"]
  );
}

async function getProfile(req, res) {
  try {
    const employeeId = pickEmployeeId(req);
    if (!employeeId) return res.status(401).json({ ok: false, error: "Unauthorized: no employee id" });

    const data = await profileService.getProfile(employeeId);
    res.json({ ok: true, data });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
}

async function updateProfile(req, res) {
  try {
    const employeeId = pickEmployeeId(req);
    if (!employeeId) return res.status(401).json({ ok: false, error: "Unauthorized: no employee id" });

    const data = await profileService.updateProfile(employeeId, req.body || {});
    res.json({ ok: true, data });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
}

async function uploadBackground(req, res) {
  try {
    const employeeId = pickEmployeeId(req);
    if (!employeeId) return res.status(401).json({ ok: false, error: "Unauthorized: no employee id" });

    const file = req.file;
    if (!file) return res.status(400).json({ ok: false, error: "File is required" });

    const url = `/uploads/profile/${file.filename}`;
    const out = await profileService.setBackground(employeeId, url);
    res.json({ ok: true, ...out });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
}

async function changePassword(req, res) {
  try {
    const employeeId = pickEmployeeId(req);
    if (!employeeId) return res.status(401).json({ ok: false, error: "Unauthorized: no employee id" });

    const { currentPassword, newPassword } = req.body || {};
    const out = await profileService.changePassword(employeeId, { currentPassword, newPassword });
    res.json({ ok: true, ...out });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
}

async function unlinkTelegram(req, res) {
  try {
    const employeeId = pickEmployeeId(req);
    if (!employeeId) return res.status(401).json({ ok: false, error: "Unauthorized: no employee id" });

    const out = await profileService.unlinkTelegram(employeeId);
    res.json({ ok: true, ...out });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
}

module.exports = {
  getProfile,
  updateProfile,
  uploadBackground,
  changePassword,
  unlinkTelegram,
};
