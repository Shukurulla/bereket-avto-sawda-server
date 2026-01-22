const User = require('../models/User');
const Car = require('../models/Car');
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
        name: `${user.firstName} ${user.lastName}`,
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
        name: `${user.firstName} ${user.lastName}`,
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
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        savedCars: user.savedCars
      }
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

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
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

// @desc    O'z hisobini o'chirish (App Store talabi)
// @route   DELETE /api/auth/delete-account
// @access  Private
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    // Foydalanuvchini topish (parol bilan)
    const user = await User.findById(userId).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: t(req, 'auth.userNotFound')
      });
    }

    // Parol tekshiruvi (agar parol yuborilgan bo'lsa)
    if (password) {
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: t(req, 'auth.invalidCredentials')
        });
      }
    }

    // Avval foydalanuvchining e'lonlari ID larini olish
    const userCarIds = await Car.find({ owner: userId }).distinct('_id');

    // Boshqa userlarning savedCars dan bu user e'lonlarini olib tashlash
    if (userCarIds.length > 0) {
      await User.updateMany(
        { _id: { $ne: userId } },
        { $pull: { savedCars: { $in: userCarIds } } }
      );
    }

    // Foydalanuvchining barcha e'lonlarini o'chirish
    await Car.deleteMany({ owner: userId });

    // Foydalanuvchini o'chirish
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: 'Hisob muvaffaqiyatli o\'chirildi'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Admin tomonidan foydalanuvchini o'chirish
// @route   DELETE /api/auth/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Foydalanuvchini topish
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: t(req, 'auth.userNotFound')
      });
    }

    // Admin o'zini o'chira olmaydi
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'O\'zingizni o\'chira olmaysiz'
      });
    }

    // Foydalanuvchining barcha e'lonlarini o'chirish
    await Car.deleteMany({ owner: userId });

    // Boshqa userlarning savedCars dan bu user e'lonlarini olib tashlash
    await User.updateMany(
      { _id: { $ne: userId } },
      { $pull: { savedCars: { $in: await Car.find({ owner: userId }).distinct('_id') } } }
    );

    // Foydalanuvchini o'chirish
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: 'Foydalanuvchi muvaffaqiyatli o\'chirildi'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Barcha foydalanuvchilarni olish (Admin uchun)
// @route   GET /api/auth/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const skip = (page - 1) * limit;

    // Total count
    const total = await User.countDocuments();

    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: users,
      total: total,
      page: page,
      limit: limit,
      totalPages: Math.ceil(total / limit),
      count: users.length,
      hasMore: page * limit < total,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
