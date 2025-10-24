const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedAdmin = async () => {
  try {
    // Database ulanish
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB ulandi');

    // Admin mavjudligini tekshirish
    const adminExists = await User.findOne({ email: 'admin@gmail.com' });

    if (adminExists) {
      console.log('Admin foydalanuvchi allaqachon mavjud!');
      process.exit(0);
    }

    // Yangi admin yaratish
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@gmail.com',
      password: 'admin123',
      phone: '+998901234567',
      role: 'admin'
    });

    console.log('✅ Admin foydalanuvchi yaratildi!');
    console.log('Email: admin@gmail.com');
    console.log('Parol: admin123');

    process.exit(0);
  } catch (error) {
    console.error('Xato:', error.message);
    process.exit(1);
  }
};

seedAdmin();
