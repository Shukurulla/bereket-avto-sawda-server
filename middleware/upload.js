const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs').promises;

// Vaqtinchalik fayllar uchun storage
const storage = multer.memoryStorage();

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

// Rasmlarni siqish va saqlash middleware
const compressImages = async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next();
  }

  try {
    // uploads va thumbnails papkalarini yaratish
    await fs.mkdir('uploads', { recursive: true });
    await fs.mkdir('uploads/thumbnails', { recursive: true });

    const processedFiles = [];

    for (const file of req.files) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = `image-${uniqueSuffix}.webp`;
      const thumbnailFilename = `thumb-${uniqueSuffix}.webp`;

      const outputPath = path.join('uploads', filename);
      const thumbnailPath = path.join('uploads/thumbnails', thumbnailFilename);

      // Asl rasmni siqish va saqlash (max 1920x1080, 80% quality)
      await sharp(file.buffer)
        .resize(1920, 1080, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality: 80 })
        .toFile(outputPath);

      // Thumbnail yaratish (max 400x300, 70% quality)
      await sharp(file.buffer)
        .resize(400, 300, {
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: 70 })
        .toFile(thumbnailPath);

      processedFiles.push({
        filename: filename,
        path: `/uploads/${filename}`,
        thumbnail: `/uploads/thumbnails/${thumbnailFilename}`
      });
    }

    req.processedFiles = processedFiles;
    next();
  } catch (error) {
    console.error('Rasmlarni siqishda xatolik:', error);
    next(error);
  }
};

module.exports = { upload, compressImages };
