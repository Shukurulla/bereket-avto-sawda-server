require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');
const { initBot, postCarToChannel } = require('../utils/telegramBot');

const uploadExistingCars = async () => {
  try {
    // MongoDB'ga ulanish
    console.log('📡 MongoDB\'ga ulanmoqda...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB\'ga ulandi\n');

    // Bot'ni ishga tushirish
    console.log('🤖 Telegram bot ishga tushirilmoqda...');
    const bot = initBot();
    if (!bot) {
      console.error('❌ Bot ishlamadi. .env faylida TELEGRAM_BOT_TOKEN va TELEGRAM_CHANNEL_ID ni tekshiring.');
      process.exit(1);
    }
    console.log('✅ Bot tayyor\n');

    // Hali telegram'ga yuklanmagan mashinalarn olish
    const cars = await Car.find({
      $or: [
        { telegramPostId: { $exists: false } },
        { telegramPostId: null }
      ],
      status: 'sale' // Faqat sotuvdagi mashinalar
    }).sort({ createdAt: -1 });

    console.log(`📊 Jami ${cars.length} ta mashina topildi\n`);

    if (cars.length === 0) {
      console.log('✅ Barcha mashinalar allaqachon yuklangan!');
      process.exit(0);
    }

    let successCount = 0;
    let errorCount = 0;

    // Har bir mashinani yuklash
    for (let i = 0; i < cars.length; i++) {
      const car = cars[i];
      console.log(`\n[${i + 1}/${cars.length}] Yuklanmoqda: ${car.brand} ${car.model} (${car.year})`);

      try {
        const postId = await postCarToChannel(car);

        if (postId) {
          // Telegram post ID ni saqlash
          car.telegramPostId = postId;
          await car.save();
          successCount++;
          console.log(`   ✅ Muvaffaqiyatli yuklandi (Post ID: ${postId})`);
        } else {
          errorCount++;
          console.log(`   ❌ Yuklashda xatolik`);
        }

        // Telegram API rate limit uchun kutish (1 soniyada 30 ta xabar)
        await new Promise(resolve => setTimeout(resolve, 1500));

      } catch (error) {
        errorCount++;
        console.error(`   ❌ Xatolik: ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 NATIJALAR:');
    console.log(`   ✅ Muvaffaqiyatli: ${successCount}`);
    console.log(`   ❌ Xatolik: ${errorCount}`);
    console.log(`   📦 Jami: ${cars.length}`);
    console.log('='.repeat(50));

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Umumiy xatolik:', error);
    process.exit(1);
  }
};

// Script'ni ishga tushirish
uploadExistingCars();
