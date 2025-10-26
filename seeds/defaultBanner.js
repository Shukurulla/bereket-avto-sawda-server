const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const Banner = require("../models/Banner");

// Environment variables
dotenv.config();

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB ga ulanish muvaffaqiyatli");
  } catch (error) {
    console.error("MongoDB ulanishda xatolik:", error.message);
    process.exit(1);
  }
};

// Default banner yaratish
const seedDefaultBanner = async () => {
  try {
    await connectDB();

    // Tekshiramiz, default banner mavjudmi
    const existingBanner = await Banner.findOne({
      title: "Default Banner",
    });

    if (existingBanner) {
      console.log("✅ Default banner allaqachon mavjud!");
      console.log("Banner ID:", existingBanner._id);
      console.log("Banner title:", existingBanner.title);
      process.exit(0);
      return;
    }

    // Default rasm fayl nomi
    const defaultImageName = "default-banner.jpg";
    const sourcePath = path.join(__dirname, "..", defaultImageName);
    const uploadsDir = path.join(__dirname, "..", "uploads");
    const destPath = path.join(uploadsDir, defaultImageName);

    // uploads papkasi mavjudligini tekshirish
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log("📁 uploads papkasi yaratildi");
    }

    // Default rasmni tekshirish
    if (!fs.existsSync(sourcePath)) {
      console.error("❌ Default rasm topilmadi:", sourcePath);
      console.log(
        "⚠️  Iltimos, default-banner.jpg faylini backend papkasiga qo'ying!"
      );
      process.exit(1);
      return;
    }

    // Rasmni uploads papkasiga ko'chirish (agar u yerda yo'q bo'lsa)
    if (!fs.existsSync(destPath)) {
      fs.copyFileSync(sourcePath, destPath);
      console.log("🖼️  Default rasm uploads papkasiga ko'chirildi");
    }

    // Default banner yaratish
    const defaultBanner = new Banner({
      title: "Default Banner",
      image: `/uploads/${defaultImageName}`,
      link: "/cars",
      order: 1,
      isActive: true,
    });

    await defaultBanner.save();

    console.log("✅ Default banner muvaffaqiyatli yaratildi!");
    console.log("Banner ma'lumotlari:");
    console.log("- ID:", defaultBanner._id);
    console.log("- Title:", defaultBanner.title);
    console.log("- Image:", defaultBanner.image);
    console.log("- Link:", defaultBanner.link);
    console.log("- Order:", defaultBanner.order);
    console.log("- Active:", defaultBanner.isActive);

    process.exit(0);
  } catch (error) {
    console.error("❌ Xatolik yuz berdi:", error.message);
    process.exit(1);
  }
};

// Script'ni ishga tushirish
seedDefaultBanner();
