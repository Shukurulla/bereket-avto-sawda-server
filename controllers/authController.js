const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Token yaratish
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// @desc    Ro'yxatdan o'tish
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Foydalanuvchi mavjudligini tekshirish
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Бул email дизимге әллақашан жазылған'
      });
    }

    // Yangi foydalanuvchi yaratish
    const user = await User.create({
      name,
      email,
      password,
      phone
    });

    // Token yaratish
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Tizimga kirish
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Email va parolni tekshirish
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email ҳәм парол киритилиўи шәрт'
      });
    }

    // Foydalanuvchini topish (+password bilan)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email я болмаса парол дурыс емес'
      });
    }

    // Parolni tekshirish
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email я болмаса парол дурыс емес'
      });
    }

    // Token yaratish
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Hozirgi foydalanuvchini olish
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('savedCars');

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Profilni yangilash
// @route   PUT /api/auth/updateProfile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, currentPassword, newPassword } = req.body;

    // Foydalanuvchini topish
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пайдаланыўшы табылмады'
      });
    }

    // Asosiy ma'lumotlarni yangilash
    user.name = name || user.name;
    user.phone = phone || user.phone;

    // Agar parol o'zgartirilayotgan bo'lsa
    if (currentPassword && newPassword) {
      // Joriy parolni tekshirish
      const isMatch = await user.comparePassword(currentPassword);

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Ҳәзирги парол дурыс емес'
        });
      }

      // Yangi parolni o'rnatish
      user.password = newPassword;
    }

    // Saqlash
    await user.save();

    // Parolni responsdan olib tashlash
    user.password = undefined;

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
