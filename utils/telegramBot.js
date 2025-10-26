const TelegramBot = require("node-telegram-bot-api");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
dotenv.config();

// Bot tokenini .env dan olish
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || "@avto_satiw";

let bot = null;

// Bot'ni ishga tushirish
const initBot = () => {
  if (!BOT_TOKEN) {
    console.log("⚠️  TELEGRAM_BOT_TOKEN topilmadi. Telegram bot o'chirilgan.");
    return null;
  }

  try {
    bot = new TelegramBot(BOT_TOKEN, { polling: false });
    console.log("✅ Telegram bot ishga tushdi");
    return bot;
  } catch (error) {
    console.error("❌ Telegram bot xatolik:", error.message);
    return null;
  }
};

// Rasmni yuklash
const uploadPhoto = async (photoPath) => {
  try {
    const fullPath = path.join(__dirname, "..", photoPath);

    // Faylning mavjudligini tekshirish
    if (!fs.existsSync(fullPath)) {
      console.error("Rasm topilmadi:", fullPath);
      return null;
    }

    return fullPath;
  } catch (error) {
    console.error("Rasm yuklashda xatolik:", error);
    return null;
  }
};

// Car ma'lumotlarini formatlash
const formatCarMessage = (car) => {
  const baseUrl = process.env.FRONTEND_URL || "https://avto.kerek.uz";
  const carUrl = `${baseUrl}/car/${car._id}`;

  let message = `🚗 *${car.brand} ${car.model}*\n`;
  message += `━━━━━━━━━━━━━━━━━━\n\n`;

  // Asosiy ma'lumotlar (eng muhim)
  if (car.price) {
    message += `💰 *Narxi: ${car.price.toLocaleString()} so'm*\n\n`;
  }

  if (car.year) message += `📅 Yili: *${car.year}*\n`;

  if (car.mileage !== undefined && car.mileage !== null) {
    message += `📊 Probeg: *${car.mileage.toLocaleString()} km*\n`;
  }

  // Texnik xususiyatlar
  if (car.transmission) {
    const transmissionMap = {
      automatic: "Avtomat",
      manual: "Mexanika",
      robot: "Robot",
      cvt: "CVT",
    };
    message += `⚙️ Korobka: *${
      transmissionMap[car.transmission] || car.transmission
    }*\n`;
  }

  if (car.fuelType && car.fuelType.length > 0) {
    const fuelMap = {
      petrol: "Benzin",
      diesel: "Dizel",
      electric: "Elektr",
      hybrid: "Gibrid",
      hybrid_plugin: "Plugin-Gibrid",
      methane: "Metan",
      propane: "Propan",
    };
    const fuels = car.fuelType.map((f) => fuelMap[f] || f).join(", ");
    message += `⚡ Yoqilg'i: *${fuels}*\n`;
  }

  if (car.engineVolume && !car.fuelType?.includes("electric")) {
    message += `🔧 Dvigatel: *${car.engineVolume}L*\n`;
  }

  if (car.bodyType) {
    const bodyTypeMap = {
      sedan: "Sedan",
      suv: "SUV",
      crossover: "Krossover",
      hatchback: "Xetchbek",
      coupe: "Kupe",
      wagon: "Universal",
      minivan: "Minivan",
      pickup: "Pikap",
      van: "Furgon",
      convertible: "Kabriolet",
      other: "Boshqa",
    };
    message += `🚙 Kuzov: ${bodyTypeMap[car.bodyType] || car.bodyType}\n`;
  }

  if (car.color) {
    message += `🎨 Rangi: ${car.color}\n`;
  }

  // Joylashuv va holat
  message += `\n`;

  if (car.location) {
    if (typeof car.location === "string") {
      message += `📍 Manzil: *${car.location}*\n`;
    } else if (car.location.city || car.location.region) {
      const location = [car.location.city, car.location.region]
        .filter(Boolean)
        .join(", ");
      message += `📍 Manzil: *${location}*\n`;
    }
  }

  if (car.condition) {
    const conditionMap = {
      new: "Yangi",
      good: "Yaxshi",
      normal: "O'rtacha",
    };
    message += `✨ Holati: ${conditionMap[car.condition] || car.condition}\n`;
  }

  // Kontakt
  message += `\n━━━━━━━━━━━━━━━━━━\n`;

  if (car.contact?.phone) {
    message += `📞 *Telefon: ${car.contact.phone}*\n`;
  }

  message += `\n🔗 [📱 Batafsil ma'lumot](${carUrl})`;

  return message;
};

// Kanalga post yuborish
const postCarToChannel = async (car) => {
  if (!bot) {
    console.log("Telegram bot ishlamayapti");
    return null;
  }

  try {
    const message = formatCarMessage(car);

    // Rasmlar bilan yuborish
    if (car.images && car.images.length > 0) {
      const photos = [];

      // Eng ko'pi bilan 10 ta rasm (Telegram MediaGroup limit)
      const imagesToSend = car.images.slice(0, 10);

      for (let i = 0; i < imagesToSend.length; i++) {
        const photoPath = await uploadPhoto(imagesToSend[i]);
        if (photoPath) {
          photos.push({
            type: "photo",
            media: photoPath,
            caption: i === 0 ? message : "",
            parse_mode: i === 0 ? "Markdown" : undefined,
          });
        }
      }

      if (photos.length > 0) {
        const result = await bot.sendMediaGroup(CHANNEL_ID, photos);
        console.log(`✅ Telegram'ga yuklandi: ${car.brand} ${car.model}`);
        return result[0].message_id; // Birinchi message ID
      }
    }

    // Agar rasm bo'lmasa, faqat matn yuborish
    const result = await bot.sendMessage(CHANNEL_ID, message, {
      parse_mode: "Markdown",
      disable_web_page_preview: false,
    });
    console.log(`✅ Telegram'ga yuklandi (rasmsiz): ${car.brand} ${car.model}`);
    return result.message_id;
  } catch (error) {
    console.error("Telegram'ga yuklashda xatolik:", error.message);
    return null;
  }
};

// Postni yangilash
const updateCarPost = async (car) => {
  if (!bot || !car.telegramPostId) {
    return null;
  }

  try {
    const message = formatCarMessage(car);

    // Faqat matnni yangilash (rasmlarni yangilab bo'lmaydi)
    await bot.editMessageCaption(message, {
      chat_id: CHANNEL_ID,
      message_id: car.telegramPostId,
      parse_mode: "Markdown",
    });

    console.log(`✅ Telegram post yangilandi: ${car.brand} ${car.model}`);
    return car.telegramPostId;
  } catch (error) {
    console.error("Telegram postni yangilashda xatolik:", error.message);
    return null;
  }
};

// Postni o'chirish
const deleteCarPost = async (telegramPostId) => {
  if (!bot || !telegramPostId) {
    return false;
  }

  try {
    await bot.deleteMessage(CHANNEL_ID, telegramPostId);
    console.log(`✅ Telegram post o'chirildi: ${telegramPostId}`);
    return true;
  } catch (error) {
    console.error("Telegram postni o'chirishda xatolik:", error.message);
    return false;
  }
};

// Bot'ni test qilish
const testBot = async () => {
  if (!bot) {
    console.log("❌ Bot mavjud emas");
    return false;
  }

  try {
    const me = await bot.getMe();
    console.log(`✅ Bot ishlayapti: @${me.username}`);
    return true;
  } catch (error) {
    console.error("❌ Bot test xatolik:", error.message);
    return false;
  }
};

module.exports = {
  initBot,
  postCarToChannel,
  updateCarPost,
  deleteCarPost,
  testBot,
};
