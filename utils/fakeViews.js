const cron = require('node-cron');
const Car = require('../models/Car');

/**
 * Har soatda ishlaydigan fake views qo'shish funksiyasi
 * Avtomobil views 100 dan kam bo'lsa, 10-20 gacha random views qo'shadi
 */
const addFakeViews = async () => {
  try {
    console.log('🔄 Fake views qo\'shish jarayoni boshlandi...');

    // Faqat sotuvda bo'lgan va views < 100 bo'lgan avtomobillarni topish
    const cars = await Car.find({
      status: 'sale',
      views: { $lt: 100 }
    });

    if (cars.length === 0) {
      console.log('✅ Barcha avtomobillar 100+ views ga erishgan');
      return;
    }

    let updatedCount = 0;

    for (const car of cars) {
      // 10 dan 20 gacha random son
      const randomViews = Math.floor(Math.random() * 11) + 10; // 10-20

      // Yangi views hisoblash (100 dan oshmasligi kerak)
      const newViews = Math.min(car.views + randomViews, 100);

      // Agar views o'zgargan bo'lsa, yangilash
      if (newViews !== car.views) {
        car.views = newViews;
        await car.save();
        updatedCount++;
        console.log(`✅ ${car.brand} ${car.model}: ${car.views - randomViews} → ${newViews} views`);
      }
    }

    console.log(`✅ Fake views qo'shish tugadi. ${updatedCount} ta avtomobil yangilandi.`);
  } catch (error) {
    console.error('❌ Fake views qo\'shishda xatolik:', error.message);
  }
};

/**
 * Cron job ni ishga tushirish
 * Har soatda ishga tushadi
 */
const startFakeViewsCron = () => {
  // Har soat 0-daqiqada ishga tushadi
  cron.schedule('0 * * * *', () => {
    console.log('⏰ Soatlik fake views cron job ishga tushdi');
    addFakeViews();
  });

  console.log('✅ Fake views cron job ishga tushirildi (har soat)');

  // Birinchi marta darhol ishga tushirish (test uchun)
  // addFakeViews();
};

module.exports = { startFakeViewsCron, addFakeViews };
