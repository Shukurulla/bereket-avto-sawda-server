const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Car = require('../models/Car');
require('../models/User');

const deleteLatestCars = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB ulandi\n');

    // O'chiriladigan mashinalar ID lari
    const carIds = [
      '691efd12d8fc678d7c3239a1', // Chevrolet Cobalt 2020
      '691eee7fd8fc678d7c323805', // сьалк аллада
      '691eeba9d8fc678d7c3237a7', // чевроле мрр
      '69145342d8fc678d7c321318'  // Ferrari F40
    ];

    console.log(`${carIds.length} ta mashina o'chirilmoqda...\n`);

    const result = await Car.deleteMany({ _id: { $in: carIds } });

    console.log(`✅ ${result.deletedCount} ta mashina muvaffaqiyatli o'chirildi!`);

    process.exit(0);
  } catch (error) {
    console.error('Xatolik:', error.message);
    process.exit(1);
  }
};

deleteLatestCars();
