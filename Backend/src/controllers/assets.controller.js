const AssetsService = require('../services/assets.service');

async function list(req, res, next) {
  try { res.json(await AssetsService.list()); }
  catch (e) { next(e); }
}

async function byId(req, res, next) {
  try { res.json(await AssetsService.byId(req.params.id)); }
  catch (e) { next(e); }
}

async function create(req, res, next) {
  try { res.status(201).json(await AssetsService.create(req.body)); }
  catch (e) { next(e); }
}

async function update(req, res, next) {
  try { res.json(await AssetsService.update(req.params.id, req.body)); }
  catch (e) { next(e); }
}

async function remove(req, res, next) {
  try { res.json(await AssetsService.remove(req.params.id)); }
  catch (e) { next(e); }
}

async function duplicate(req, res, next) {
  try { res.status(201).json(await AssetsService.duplicate(req.params.id)); }
  catch (e) { next(e); }
}

async function upsertRequisites(req, res, next) {
  try { res.json(await AssetsService.upsertRequisites(req.params.id, req.body?.requisites ?? [])); }
  catch (e) { next(e); }
}

async function recalcMonth(req, res, next) {
  try { res.json(await AssetsService.recalcAllBalancesForCurrentMonth(req.query.companyId)); }
  catch (e) { next(e); }
}

module.exports = {
  list,
  byId,
  create,
  update,
  remove,
  duplicate,
  upsertRequisites,
  recalcMonth,
};
