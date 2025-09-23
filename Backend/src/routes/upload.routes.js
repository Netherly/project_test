const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

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

const upload = multer({ storage });

// POST /api/upload/card-design
router.post('/card-design', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ ok: false, error: 'Файл не загружен' });
  }

  // URL для фронта
  const url = `/uploads/card-designs/${req.file.filename}`;
  res.json({ ok: true, url });
});

module.exports = router;
