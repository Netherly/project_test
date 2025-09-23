import { Router } from 'express';
import { AssetsController } from './assets.controller.js';

export const assetsRouter = Router();

// GET /api/assets
assetsRouter.get('/', AssetsController.list);

// GET /api/assets/:id
assetsRouter.get('/:id', AssetsController.byId);

// POST /api/assets
assetsRouter.post('/', AssetsController.create);

// PATCH /api/assets/:id
assetsRouter.patch('/:id', AssetsController.update);

// DELETE /api/assets/:id
assetsRouter.delete('/:id', AssetsController.remove);

// POST /api/assets/:id/duplicate
assetsRouter.post('/:id/duplicate', AssetsController.duplicate);

// PATCH /api/assets/:id/requisites
assetsRouter.patch('/:id/requisites', AssetsController.upsertRequisites);

// POST /api/assets/recalc-month?companyId=...
assetsRouter.post('/recalc-month', AssetsController.recalcMonth);
