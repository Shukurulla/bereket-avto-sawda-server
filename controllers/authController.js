const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { t } = require('../i18n');

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
    const { firstName, lastName, phone, password } = req.body;

    // Foydalanuvchi mavjudligini tekshirish (phone bo'yicha)
    const userExists = await User.findOne({ phone });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: t(req, 'auth.phoneExists')
      });
    }

    // Yangi foydalanuvchi yaratish
    const user = await User.create({
      firstName,
      lastName,
      phone,
      password
    });

    // Token yaratish
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
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
    const { phone, password } = req.body;

    // Phone va parolni tekshirish
    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: t(req, 'auth.phonePasswordRequired')
      });
    }

    // Foydalanuvchini topish (+password bilan)
    const user = await User.findOne({ phone }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: t(req, 'auth.invalidCredentials')
      });
    }

    // Parolni tekshirish
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: t(req, 'auth.invalidCredentials')
      });
    }

    // Token yaratish
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
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
    const { firstName, lastName, phone, currentPassword, newPassword } = req.body;

    // Foydalanuvchini topish
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: t(req, 'auth.userNotFound')
      });
    }

    // Asosiy ma'lumotlarni yangilash
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.phone = phone || user.phone;

    // Agar parol o'zgartirilayotgan bo'lsa
    if (currentPassword && newPassword) {
      // Joriy parolni tekshirish
      const isMatch = await user.comparePassword(currentPassword);

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: t(req, 'auth.currentPasswordWrong')
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
