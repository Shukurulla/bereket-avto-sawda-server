const TelegramBot = require("node-telegram-bot-api");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
dotenv.config();

// Bot tokenini .env dan olish
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || "@avto_satiw";

let bot = null;
let botInitPromise = null;

// Bot'ni ishga tushirish
const initBot = async () => {
  // Agar bot allaqachon ishga tushgan bo'lsa
  if (bot) {
    return bot;
  }

  // Agar ishga tushirish jarayoni davom etayotgan bo'lsa, kutish
  if (botInitPromise) {
    return botInitPromise;
  }

  if (!BOT_TOKEN) {
    console.log("⚠️  TELEGRAM_BOT_TOKEN topilmadi. Telegram bot o'chirilgan.");
    return null;
  }

  // Ishga tushirish jarayonini boshlash
  botInitPromise = (async () => {
    try {
      bot = new TelegramBot(BOT_TOKEN, { polling: false });
      console.log("✅ Telegram bot ishga tushdi");
      console.log(`📢 Kanal ID: ${CHANNEL_ID}`);

      // Bot ma'lumotlarini olish
      const me = await bot.getMe();
      console.log(`🤖 Bot username: @${me.username}`);

      return bot;
    } catch (error) {
      console.error("❌ Telegram bot xatolik:", error.message);
      bot = null;
      return null;
    } finally {
      botInitPromise = null;
    }
  })();

  return botInitPromise;
};

// Rasmni yuklash
const uploadPhoto = async (photoPath) => {
  try {
    // photoPath "/uploads/image.webp" formatida keladi
    // Boshidagi "/" ni olib tashlaymiz
    const relativePath = photoPath.startsWith('/') ? photoPath.slice(1) : photoPath;
    const fullPath = path.join(__dirname, "..", relativePath);

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

// HTML uchun maxsus belgilarni escape qilish
const escapeHtml = (text) => {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

// Car ma'lumotlarini formatlash (HTML format)
const formatCarMessage = (car) => {
  const baseUrl = process.env.FRONTEND_URL || "https://avto.kerek.uz";
  const carUrl = `${baseUrl}/car/${car._id}`;

  // Brand va model ni escape qilish
  const brand = escapeHtml(car.brand);
  const model = escapeHtml(car.model);

  let message = `🚗 <b>${brand} ${model}</b>\n`;
  message += `━━━━━━━━━━━━━━━━━━\n\n`;

  // Asosiy ma'lumotlar (eng muhim)
  if (car.price) {
    message += `💰 <b>Narxi: ${car.price.toLocaleString()} so'm</b>\n\n`;
  }

  if (car.year) message += `📅 Yili: <b>${car.year}</b>\n`;

  if (car.mileage !== undefined && car.mileage !== null) {
    message += `📊 Probeg: <b>${car.mileage.toLocaleString()} km</b>\n`;
  }

  // Texnik xususiyatlar
  if (car.transmission) {
    const transmissionMap = {
      automatic: "Avtomat",
      manual: "Mexanika",
      robot: "Robot",
      cvt: "CVT",
    };
    message += `⚙️ Korobka: <b>${
      transmissionMap[car.transmission] || escapeHtml(car.transmission)
    }</b>\n`;
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
    const fuels = car.fuelType.map((f) => fuelMap[f] || escapeHtml(f)).join(", ");
    message += `⚡ Yoqilg'i: <b>${fuels}</b>\n`;
  }

  if (car.engineVolume && !car.fuelType?.includes("electric")) {
    message += `🔧 Dvigatel: <b>${car.engineVolume}L</b>\n`;
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
    message += `🚙 Kuzov: ${bodyTypeMap[car.bodyType] || escapeHtml(car.bodyType)}\n`;
  }

  if (car.color) {
    message += `🎨 Rangi: ${escapeHtml(car.color)}\n`;
  }

  // Joylashuv va holat
  message += `\n`;

  if (car.location) {
    if (typeof car.location === "string") {
      message += `📍 Manzil: <b>${escapeHtml(car.location)}</b>\n`;
    } else if (car.location.city || car.location.region) {
      const location = [car.location.city, car.location.region]
        .filter(Boolean)
        .map(l => escapeHtml(l))
        .join(", ");
      message += `📍 Manzil: <b>${location}</b>\n`;
    }
  }

  if (car.condition) {
    const conditionMap = {
      new: "Yangi",
      good: "Yaxshi",
      normal: "O'rtacha",
    };
    message += `✨ Holati: ${conditionMap[car.condition] || escapeHtml(car.condition)}\n`;
  }

  // Kontakt
  message += `\n━━━━━━━━━━━━━━━━━━\n`;

  if (car.contact?.phone) {
    message += `📞 <b>Telefon: ${escapeHtml(car.contact.phone)}</b>\n`;
  }

  message += `\n🔗 <a href="${carUrl}">📱 Batafsil ma'lumot</a>`;

  return message;
};

// Kanalga post yuborish
const postCarToChannel = async (car) => {
  // Bot null bo'lsa, ishga tushirishga harakat qilish
  if (!bot) {
    console.log("⚠️ Bot null, ishga tushirishga harakat qilinmoqda...");
    await initBot();
  }

  if (!bot) {
    console.log("❌ Telegram bot ishlamayapti - bot null");
    return null;
  }

  try {
    console.log(`📤 Telegram'ga yuklash boshlanmoqda: ${car.brand} ${car.model}`);

    // Tekshirish: bu car allaqachon shu kanalga yuklanganmi?
    if (car.telegramPosts && car.telegramPosts.length > 0) {
      const existingPost = car.telegramPosts.find(
        p => p.channelId === CHANNEL_ID
      );
      if (existingPost) {
        console.log(`⏭️  ${car.brand} ${car.model} allaqachon ${CHANNEL_ID} kanalda`);
        return existingPost.postId;
      }
    }

    const message = formatCarMessage(car);

    // Rasmlar bilan yuborish
    if (car.images && car.images.length > 0) {
      // Barcha rasmlarni tekshirish va to'plash
      const validPhotoPaths = [];
      for (const imagePath of car.images) {
        const fullPath = await uploadPhoto(imagePath);
        if (fullPath) {
          validPhotoPaths.push(fullPath);
        }
      }

      if (validPhotoPaths.length > 0) {
        console.log(`📷 ${validPhotoPaths.length} ta rasm topildi`);

        let result;

        // Agar 2 va undan ko'p rasm bo'lsa, sendMediaGroup ishlatish
        if (validPhotoPaths.length >= 2) {
          // Media guruhini tayyorlash
          const mediaGroup = validPhotoPaths.map((photoPath, index) => ({
            type: "photo",
            media: fs.createReadStream(photoPath),
            // Faqat birinchi rasmga caption qo'shish
            ...(index === 0 && {
              caption: message,
              parse_mode: "HTML",
            }),
          }));

          console.log(`📤 ${validPhotoPaths.length} ta rasmni guruhlab yuborilmoqda...`);
          const results = await bot.sendMediaGroup(CHANNEL_ID, mediaGroup);
          result = results[0]; // Birinchi xabarning ID sini olish

          console.log(`✅ Telegram'ga ${validPhotoPaths.length} ta rasm yuklandi: ${car.brand} ${car.model}`);
        } else {
          // Faqat bitta rasm bo'lsa, sendPhoto ishlatish
          console.log(`📤 Bitta rasm yuborilmoqda...`);
          result = await bot.sendPhoto(CHANNEL_ID, validPhotoPaths[0], {
            caption: message,
            parse_mode: "HTML",
          });

          console.log(`✅ Telegram'ga yuklandi: ${car.brand} ${car.model}`);
        }

        // Yangi post ma'lumotini saqlash
        if (!car.telegramPosts) car.telegramPosts = [];
        car.telegramPosts.push({
          channelId: CHANNEL_ID,
          postId: result.message_id
        });
        await car.save();

        return result.message_id;
      } else {
        console.log(`⚠️ Hech qanday rasm topilmadi`);
      }
    }

    // Agar rasm bo'lmasa, faqat matn yuborish
    console.log(`📤 Rasmsiz matn yuborilmoqda...`);
    const result = await bot.sendMessage(CHANNEL_ID, message, {
      parse_mode: "HTML",
      disable_web_page_preview: false,
    });
    console.log(`✅ Telegram'ga yuklandi (rasmsiz): ${car.brand} ${car.model}`);

    // Yangi post ma'lumotini saqlash
    if (!car.telegramPosts) car.telegramPosts = [];
    car.telegramPosts.push({
      channelId: CHANNEL_ID,
      postId: result.message_id
    });
    await car.save();

    return result.message_id;
  } catch (error) {
    console.error("❌ Telegram'ga yuklashda xatolik:", error.message);
    console.error("Stack:", error.stack);
    return null;
  }
};

// Postni yangilash
const updateCarPost = async (car) => {
  if (!bot) await initBot();
  if (!bot || !car.telegramPosts || car.telegramPosts.length === 0) {
    return null;
  }

  try {
    const message = formatCarMessage(car);

    // Hozirgi kanal uchun postni topish
    const post = car.telegramPosts.find(p => p.channelId === CHANNEL_ID);
    if (!post) {
      console.log(`⚠️  ${car.brand} ${car.model} bu kanalda post yo'q`);
      return null;
    }

    // Faqat matnni yangilash (rasmlarni yangilab bo'lmaydi)
    await bot.editMessageCaption(message, {
      chat_id: CHANNEL_ID,
      message_id: post.postId,
      parse_mode: "HTML",
    });

    console.log(`✅ Telegram post yangilandi: ${car.brand} ${car.model}`);
    return post.postId;
  } catch (error) {
    console.error("Telegram postni yangilashda xatolik:", error.message);
    return null;
  }
};

// Postni o'chirish
const deleteCarPost = async (car) => {
  if (!bot) await initBot();
  if (!bot || !car.telegramPosts || car.telegramPosts.length === 0) {
    return false;
  }

  try {
    // Hozirgi kanal uchun postni topish
    const post = car.telegramPosts.find(p => p.channelId === CHANNEL_ID);
    if (!post) {
      console.log(`⚠️  ${car.brand} ${car.model} bu kanalda post yo'q`);
      return false;
    }

    await bot.deleteMessage(CHANNEL_ID, post.postId);
    console.log(`✅ Telegram post o'chirildi: ${post.postId}`);

    // Postni arraydan olib tashlash
    car.telegramPosts = car.telegramPosts.filter(
      p => p.channelId !== CHANNEL_ID
    );
    await car.save();

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
