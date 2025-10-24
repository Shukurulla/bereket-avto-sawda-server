const Car = require("../models/Car");
const User = require("../models/User");

// @desc    Barcha avtomobillarni olish (filter bilan)
// @route   GET /api/cars
// @access  Public
exports.getCars = async (req, res) => {
  try {
    const {
      brand,
      year,
      mileage,
      fuelType,
      transmission,
      engineVolume,
      condition,
      hasSunroof,
      hasCovers,
      hasTinting,
      minYear,
      maxYear,
      minMileage,
      maxMileage,
      minPrice,
      maxPrice,
      status,
      gasType,
    } = req.query;

    // Filter yaratish
    let filter = {};

    if (brand) filter.brand = new RegExp(brand, "i");
    if (year) filter.year = year;
    if (fuelType) filter.fuelType = fuelType;
    if (transmission) filter.transmission = transmission;
    if (condition) filter.condition = condition;
    if (hasSunroof) filter.hasSunroof = hasSunroof === "true";
    if (hasCovers) filter.hasCovers = hasCovers === "true";
    if (hasTinting) filter["tinting.hasTinting"] = hasTinting === "true";
    if (status) filter.status = status;
    if (gasType && gasType !== "none") filter["gasEquipment.type"] = gasType;

    // Oraliq filterlar
    if (minYear || maxYear) {
      filter.year = {};
      if (minYear) filter.year.$gte = Number(minYear);
      if (maxYear) filter.year.$lte = Number(maxYear);
    }

    if (minMileage || maxMileage) {
      filter.mileage = {};
      if (minMileage) filter.mileage.$gte = Number(minMileage);
      if (maxMileage) filter.mileage.$lte = Number(maxMileage);
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (engineVolume) {
      filter.engineVolume = Number(engineVolume);
    }

    // Premium avtomobillarni tepaga chiqarish
    const cars = await Car.find(filter)
      .populate("owner", "name phone")
      .sort({ isPremium: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: cars.length,
      data: cars,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Bitta avtomobilni olish
// @route   GET /api/cars/:id
// @access  Public
exports.getCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id).populate(
      "owner",
      "name phone"
    );

    if (!car) {
      return res.status(404).json({
        success: false,
        message: "Avtomobil topilmadi",
      });
    }

    // Premium muddatini tekshirish
    await car.checkPremiumExpiry();

    res.status(200).json({
      success: true,
      data: car,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Yangi avtomobil qo'shish
// @route   POST /api/cars
// @access  Private
exports.createCar = async (req, res) => {
  try {
    // Rasm fayllari yo'llarini olish
    const images = req.files
      ? req.files.map((file) => `/uploads/${file.filename}`)
      : [];

    if (images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Kamida bitta rasm yuklash kerak",
      });
    }

    // Parse JSON fields from FormData
    const carData = {
      ...req.body,
      contact: req.body.contact ? JSON.parse(req.body.contact) : {},
      gasEquipment: req.body.gasEquipment ? JSON.parse(req.body.gasEquipment) : {},
      tinting: req.body.tinting ? JSON.parse(req.body.tinting) : {},
      sunProtection: req.body.sunProtection ? JSON.parse(req.body.sunProtection) : {},
      owner: req.user.id,
      images: images
    };

    const car = await Car.create(carData);

    res.status(201).json({
      success: true,
      data: car,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Avtomobilni yangilash
// @route   PUT /api/cars/:id
// @access  Private
exports.updateCar = async (req, res) => {
  try {
    let car = await Car.findById(req.params.id);

    if (!car) {
      return res.status(404).json({
        success: false,
        message: "Avtomobil topilmadi",
      });
    }

    // Faqat owner yoki admin o'zgartirishi mumkin
    if (car.owner.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Sizda bu avtomobilni o'zgartirish huquqi yo'q",
      });
    }

    // Parse JSON fields from FormData (if they exist)
    const updateData = {
      ...req.body,
    };

    if (req.body.contact) {
      updateData.contact = JSON.parse(req.body.contact);
    }
    if (req.body.gasEquipment) {
      updateData.gasEquipment = JSON.parse(req.body.gasEquipment);
    }
    if (req.body.tinting) {
      updateData.tinting = JSON.parse(req.body.tinting);
    }
    if (req.body.sunProtection) {
      updateData.sunProtection = JSON.parse(req.body.sunProtection);
    }

    // Yangi rasmlar qo'shilsa
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => `/uploads/${file.filename}`);
      updateData.images = [...car.images, ...newImages];
    }

    car = await Car.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: car,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Avtomobilni o'chirish
// @route   DELETE /api/cars/:id
// @access  Private
exports.deleteCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);

    if (!car) {
      return res.status(404).json({
        success: false,
        message: "Avtomobil topilmadi",
      });
    }

    // Faqat owner yoki admin o'chirishi mumkin
    if (car.owner.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Sizda bu avtomobilni o'chirish huquqi yo'q",
      });
    }

    await car.deleteOne();

    res.status(200).json({
      success: true,
      message: "Avtomobil o'chirildi",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Avtomobilni saqlanganlar ro'yxatiga qo'shish
// @route   POST /api/cars/:id/save
// @access  Private
exports.saveCar = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const carId = req.params.id;

    // Avtomobilni tekshirish
    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({
        success: false,
        message: "Avtomobil topilmadi",
      });
    }

    // Allaqachon saqlangan bo'lsa
    if (user.savedCars.includes(carId)) {
      return res.status(400).json({
        success: false,
        message: "Bu avtomobil allaqachon saqlangan",
      });
    }

    user.savedCars.push(carId);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Avtomobil saqlandi",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Avtomobilni saqlanganlardan o'chirish
// @route   DELETE /api/cars/:id/save
// @access  Private
exports.unsaveCar = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.savedCars = user.savedCars.filter(
      (id) => id.toString() !== req.params.id
    );
    await user.save();

    res.status(200).json({
      success: true,
      message: "Avtomobil saqlanganlardan o'chirildi",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Premium qilish (Admin only)
// @route   PUT /api/cars/:id/premium
// @access  Private/Admin
exports.makePremium = async (req, res) => {
  try {
    const { days } = req.body; // Premium muddati (kunlarda)

    const car = await Car.findById(req.params.id);

    if (!car) {
      return res.status(404).json({
        success: false,
        message: "Avtomobil topilmadi",
      });
    }

    car.isPremium = true;
    car.premiumExpiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    await car.save();

    res.status(200).json({
      success: true,
      data: car,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
