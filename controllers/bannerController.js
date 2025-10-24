const Banner = require('../models/Banner');

// @desc    Barcha bannerlarni olish
// @route   GET /api/banners
// @access  Public
exports.getBanners = async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true }).sort({ order: 1 });

    res.status(200).json({
      success: true,
      count: banners.length,
      data: banners
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Bitta bannerni olish
// @route   GET /api/banners/:id
// @access  Public
exports.getBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner topilmadi'
      });
    }

    res.status(200).json({
      success: true,
      data: banner
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Yangi banner yaratish
// @route   POST /api/banners
// @access  Private/Admin
exports.createBanner = async (req, res) => {
  try {
    // Rasm yuklangan bo'lsa
    if (req.file) {
      req.body.image = `/uploads/${req.file.filename}`;
    }

    const banner = await Banner.create(req.body);

    res.status(201).json({
      success: true,
      data: banner
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Bannerni yangilash
// @route   PUT /api/banners/:id
// @access  Private/Admin
exports.updateBanner = async (req, res) => {
  try {
    let banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner topilmadi'
      });
    }

    // Yangi rasm yuklangan bo'lsa
    if (req.file) {
      req.body.image = `/uploads/${req.file.filename}`;
    }

    banner = await Banner.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: banner
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Bannerni o'chirish
// @route   DELETE /api/banners/:id
// @access  Private/Admin
exports.deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner topilmadi'
      });
    }

    await banner.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Banner o\'chirildi'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Banner tartibini o'zgartirish
// @route   PUT /api/banners/:id/order
// @access  Private/Admin
exports.updateBannerOrder = async (req, res) => {
  try {
    const { order } = req.body;

    const banner = await Banner.findByIdAndUpdate(
      req.params.id,
      { order },
      { new: true, runValidators: true }
    );

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner topilmadi'
      });
    }

    res.status(200).json({
      success: true,
      data: banner
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Banner aktivligini o'zgartirish
// @route   PUT /api/banners/:id/toggle
// @access  Private/Admin
exports.toggleBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner topilmadi'
      });
    }

    banner.isActive = !banner.isActive;
    await banner.save();

    res.status(200).json({
      success: true,
      data: banner
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
