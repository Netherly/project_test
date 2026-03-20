const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const MAX_CARD_DESIGN_BYTES = 2 * 1024 * 1024;

// директория для сохранения (../.. от src/routes → Backend/uploads/card-designs)
const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'card-designs');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// конфигурация хранения
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = Date.now() + '_' + Math.floor(Math.random() * 1e9);
    cb(null, `${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_CARD_DESIGN_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!file?.mimetype?.startsWith('image/')) {
      return cb(new Error('Разрешены только изображения'));
    }
    cb(null, true);
  },
});

// POST /api/upload/card-design
router.post('/card-design', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ ok: false, error: 'Размер файла превышает 2 МБ' });
    }
    if (err) {
      return res.status(400).json({ ok: false, error: err.message || 'Не удалось загрузить файл' });
    }
    if (!req.file) {
      return res.status(400).json({ ok: false, error: 'Файл не загружен' });
    }

    const url = `/uploads/card-designs/${req.file.filename}`;
    res.json({ ok: true, url });
  });
});

module.exports = router;
