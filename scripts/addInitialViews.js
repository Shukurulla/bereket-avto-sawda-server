const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Car = require('../models/Car');

// Environment variables
dotenv.config();

// Database ulanish
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB ga ulandi');
  } catch (error) {
    console.error('❌ MongoDB ga ulanishda xatolik:', error.message);
    process.exit(1);
  }
};

const addInitialViews = async () => {
  try {
    await connectDB();

    console.log('🔄 Hozirgi avtomobillarga 100 ta views qo\'shilmoqda...');

    // Barcha avtomobillarni topish
    const cars = await Car.find({});

    console.log(`📊 Jami ${cars.length} ta avtomobil topildi`);

    let updatedCount = 0;

    for (const car of cars) {
      const oldViews = car.views || 0;
      const newViews = oldViews + 100;

      car.views = newViews;
      await car.save();
      updatedCount++;
      console.log(`✅ ${car.brand} ${car.model}: ${oldViews} → ${newViews} views`);
    }

    console.log(`\n✅ Jarayon tugadi! ${updatedCount} ta avtomobil yangilandi.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Xatolik:', error.message);
    process.exit(1);
  }
};

// Skriptni ishga tushirish
addInitialViews();
