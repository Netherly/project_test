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

router.get("/", authJwt, ctrl.getProfile);
router.put("/", authJwt, express.json(), ctrl.updateProfile);
router.post("/background", authJwt, upload.single("file"), ctrl.uploadBackground);
router.put("/password", authJwt, express.json(), ctrl.changePassword);
router.post("/telegram/unlink", authJwt, ctrl.unlinkTelegram);

module.exports = router;
