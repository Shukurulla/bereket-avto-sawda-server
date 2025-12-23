const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Car = require('../models/Car');
require('../models/User'); // User modelini ro'yxatdan o'tkazish

const getLatestCars = async () => {
  try {
    // MongoDB ga ulanish
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB ulandi\n');

    // Oxirgi 4 ta mashinani olish (eng yangi birinchi)
    const cars = await Car.find()
      .sort({ createdAt: -1 })
      .limit(4)
      .populate('owner', 'name phone')
      .lean();

    if (cars.length === 0) {
      console.log('Hech qanday mashina topilmadi');
      process.exit(0);
    }

    console.log(`========================================`);
    console.log(`  OXIRGI ${cars.length} TA QO'SHILGAN MASHINA`);
    console.log(`========================================\n`);

    cars.forEach((car, index) => {
      console.log(`--- MASHINA #${index + 1} ---`);
      console.log(`ID: ${car._id}`);
      console.log(`Marka: ${car.brand}`);
      console.log(`Model: ${car.model}`);
      console.log(`Yil: ${car.year}`);
      console.log(`Narx: ${car.price ? car.price.toLocaleString() + ' so\'m' : 'Ko\'rsatilmagan'}`);
      console.log(`Probeg: ${car.mileage.toLocaleString()} km`);
      console.log(`Korobka: ${car.transmission}`);
      console.log(`Holat: ${car.condition}`);
      console.log(`Status: ${car.status}`);
      console.log(`Rang: ${car.color || 'Ko\'rsatilmagan'}`);
      console.log(`Joylashuv: ${car.location || 'Ko\'rsatilmagan'}`);
      console.log(`Telefon: ${car.contact?.phone || 'Ko\'rsatilmagan'}`);
      console.log(`Rasmlar soni: ${car.images?.length || 0}`);
      console.log(`Ko'rilgan: ${car.views || 0} marta`);
      console.log(`Qo'shilgan: ${new Date(car.createdAt).toLocaleString('uz-UZ')}`);
      console.log(`\n`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Xatolik:', error.message);
    process.exit(1);
  }
};

getLatestCars();
