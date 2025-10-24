// src/routes/profile.routes.js
const express = require("express");
const router = express.Router();

const authJwt = require("../middlewares/auth.middleware");
const ctrl = require("../controllers/profile.controller");

const multer = require("multer");
const fs = require("fs");
const path = require("path");

const uploadDir = path.join(process.cwd(), "uploads", "profile");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname || "");
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext || ".jpg"}`;
    cb(null, name);
  },
});
const upload = multer({ storage });

// base: /api/profile (см. index.js: router.use('/profile', authJwt, profileRoutes))
router.get("/", authJwt, ctrl.getProfile);
router.put("/", authJwt, express.json(), ctrl.updateProfile);
router.post("/background", authJwt, upload.single("file"), ctrl.uploadBackground);

module.exports = router;
