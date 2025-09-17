// src/routes/rates.routes.js
const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/rates.controller');
const validate = require('../middlewares/validateRates');
// const auth = require('../middlewares/authMiddleware');

/**
 * READ
 */
// последний снэпшот
router.get('/latest', /*auth,*/ ctrl.getLatest);

// список постранично: /api/rates/list?page=1&pageSize=200
router.get('/list',   /*auth,*/ ctrl.list);

// по диапазону: /api/rates/range?start=YYYY-MM-DD&end=YYYY-MM-DD
router.get('/range',  /*auth,*/ ctrl.listByRange);

/**
 * CREATE/UPSERT
 */
// UPSERT (создать или обновить по date); тело — объект или массив
router.post('/',      /*auth,*/ validate, ctrl.upsert);

// ADD (строгое создание; упадёт на дубликате date); тело — объект или массив
router.post('/add',   /*auth,*/ validate, ctrl.add);

/**
 * UPDATE
 */
// PATCH /api/rates/:id — обновление по id
router.patch('/:id',  /*auth,*/ ctrl.update);

// PATCH /api/rates — объект или массив с {id,...} и/или {date,...}
router.patch('/',     /*auth,*/ ctrl.update);

/**
 * DELETE
 */
// DELETE /api/rates/:id — удалить по id
router.delete('/:id', /*auth,*/ ctrl.remove);

// DELETE /api/rates
//   ?date=YYYY-MM-DD                     — удалить по дате
//   ?start=YYYY-MM-DD&end=YYYY-MM-DD     — удалить по диапазону
//   body: { ids:[], dates:[], range:{start,end} } — пакетное удаление
router.delete('/',    /*auth,*/ ctrl.remove);

module.exports = router;
 