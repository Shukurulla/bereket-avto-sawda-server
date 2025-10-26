const multer = require('multer');
const path = require('path');

// Fayllarni saqlash sozlamalari
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Faqat rasmlarni qabul qilish
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Faqat rasm fayllari yuklash mumkin!'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB har bir fayl uchun
    files: 10, // Maksimal 10 ta fayl
    fieldSize: 200 * 1024 * 1024, // 200MB field size
    fields: 50, // Maksimal field soni
    parts: 100 // Maksimal part soni (files + fields)
  },
  fileFilter: fileFilter
});

module.exports = upload;
