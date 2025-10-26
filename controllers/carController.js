const Car = require("../models/Car");
const User = require("../models/User");

// @desc    Barcha avtomobillarni olish (filter bilan)
// @route   GET /api/cars
// @access  Public
exports.getCars = async (req, res) => {
  try {
    const {
      // Asosiy ma'lumotlar
      brand,
      model,
      year,
      mileage,
      minYear,
      maxYear,
      minMileage,
      maxMileage,
      minPrice,
      maxPrice,

      // Tashqi ko'rinish
      color,
      bodyType,
      doors,
      seats,

      // Texnik xususiyatlar
      fuelType,
      transmission,
      engineVolume,
      minEnginePower,
      maxEnginePower,
      driveType,

      // Gaz jihozi
      gasType,
      gasGeneration,

      // Qo'shimcha jihozlar
      hasSunroof,
      hasPanoramicRoof,
      hasCovers,
      hasTinting,
      hasMultimedia,
      climateControl,
      heatedSeats,
      cruiseControl,
      keylessEntry,
      startStopButton,

      // Kameralar va sensorlar
      hasRearCamera,
      has360Camera,
      hasParkingSensors,
      hasBlindSpot,
      rainSensor,
      lightSensor,

      // Xavfsizlik
      hasABS,
      hasESP,
      hasAirbags,
      minAirbagsCount,

      // Holat va tarix
      condition,
      hasAccidentHistory,
      hasServiceHistory,
      hasWarranty,
      countryOfOrigin,
      maxOwnersCount,

      // Joylashuv
      city,
      region,

      // Status
      status,
      isPremium,
    } = req.query;

    // Filter yaratish
    let filter = {};

    // Asosiy ma'lumotlar
    if (brand) filter.brand = new RegExp(brand, "i");
    if (model) filter.model = new RegExp(model, "i");
    if (year) filter.year = Number(year);
    if (color) filter.color = new RegExp(color, "i");

    // Tashqi ko'rinish
    if (bodyType) filter.bodyType = bodyType;
    if (doors) filter.doors = Number(doors);
    if (seats) filter.seats = Number(seats);

    // Texnik xususiyatlar
    if (fuelType) filter.fuelType = fuelType;
    if (transmission) filter.transmission = transmission;
    if (engineVolume) filter.engineVolume = Number(engineVolume);
    if (driveType) filter.driveType = driveType;

    // Gaz jihozi
    if (gasType && gasType !== "none") {
      filter["gasEquipment.hasGasEquipment"] = true;
      filter["gasEquipment.type"] = gasType;
    }
    if (gasGeneration) filter["gasEquipment.generation"] = gasGeneration;

    // Qo'shimcha jihozlar
    if (hasSunroof) filter.hasSunroof = hasSunroof === "true";
    if (hasPanoramicRoof) filter.hasPanoramicRoof = hasPanoramicRoof === "true";
    if (hasCovers) filter.hasCovers = hasCovers === "true";
    if (hasTinting) filter["tinting.hasTinting"] = hasTinting === "true";
    if (hasMultimedia) filter.hasMultimedia = hasMultimedia === "true";
    if (climateControl) filter.climateControl = climateControl;
    if (heatedSeats) filter.heatedSeats = heatedSeats;
    if (cruiseControl) filter.cruiseControl = cruiseControl;
    if (keylessEntry) filter.keylessEntry = keylessEntry === "true";
    if (startStopButton) filter.startStopButton = startStopButton === "true";

    // Kameralar
    if (hasRearCamera === "true") filter.cameras = { $in: ["rear_camera"] };
    if (has360Camera === "true") filter.cameras = { $in: ["360_camera"] };
    if (hasParkingSensors === "true") filter.cameras = { $in: ["parking_sensors"] };
    if (hasBlindSpot === "true") filter.cameras = { $in: ["blind_spot"] };

    // Sensorlar
    if (rainSensor) filter.rainSensor = rainSensor === "true";
    if (lightSensor) filter.lightSensor = lightSensor === "true";

    // Xavfsizlik
    if (hasABS === "true") filter.safetyFeatures = { $in: ["abs"] };
    if (hasESP === "true") filter.safetyFeatures = { $in: ["esp"] };
    if (hasAirbags === "true") filter.safetyFeatures = { $in: ["airbags_front"] };

    // Holat va tarix
    if (condition) filter.condition = condition;
    if (hasAccidentHistory) filter.hasAccidentHistory = hasAccidentHistory === "true";
    if (hasServiceHistory) filter.serviceHistory = hasServiceHistory === "true";
    if (hasWarranty) filter["warranty.hasWarranty"] = hasWarranty === "true";
    if (countryOfOrigin) filter.countryOfOrigin = new RegExp(countryOfOrigin, "i");

    // Joylashuv
    if (city) filter["location.city"] = new RegExp(city, "i");
    if (region) filter["location.region"] = new RegExp(region, "i");

    // Status
    if (status) filter.status = status;
    if (isPremium) filter.isPremium = isPremium === "true";

    // Oraliq filterlar (Range filters)
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

    if (minEnginePower || maxEnginePower) {
      filter.enginePower = {};
      if (minEnginePower) filter.enginePower.$gte = Number(minEnginePower);
      if (maxEnginePower) filter.enginePower.$lte = Number(maxEnginePower);
    }

    if (minAirbagsCount) {
      filter.airbagsCount = { $gte: Number(minAirbagsCount) };
    }

    if (maxOwnersCount) {
      filter.ownersCount = { $lte: Number(maxOwnersCount) };
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
        message: "Автомобил табылмады",
      });
    }

    // Premium muddatini tekshirish
    await car.checkPremiumExpiry();

    // Ko'rilganlar sonini oshirish (views increment)
    car.views = (car.views || 0) + 1;
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
        message: "Кеминде бир сүўрет жүклеў керек",
      });
    }

    // Parse JSON fields from FormData
    const carData = {
      ...req.body,
      owner: req.user.id,
      images: images
    };

    // Parse complex/nested fields if they exist
    if (req.body.contact) carData.contact = JSON.parse(req.body.contact);
    // location is now a simple string, no need to parse
    if (req.body.tinting) carData.tinting = JSON.parse(req.body.tinting);
    if (req.body.sunProtection) carData.sunProtection = JSON.parse(req.body.sunProtection);
    if (req.body.gasEquipment) carData.gasEquipment = JSON.parse(req.body.gasEquipment);
    if (req.body.fuelConsumption) carData.fuelConsumption = JSON.parse(req.body.fuelConsumption);
    if (req.body.warranty) carData.warranty = JSON.parse(req.body.warranty);

    // Parse array fields
    if (req.body.multimediaFeatures) carData.multimediaFeatures = JSON.parse(req.body.multimediaFeatures);
    if (req.body.cameras) carData.cameras = JSON.parse(req.body.cameras);
    if (req.body.safetyFeatures) carData.safetyFeatures = JSON.parse(req.body.safetyFeatures);

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
        message: "Автомобил табылмады",
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

    // Parse complex/nested fields if they exist
    if (req.body.contact) updateData.contact = JSON.parse(req.body.contact);
    // location is a simple string, no need to parse
    if (req.body.location) updateData.location = req.body.location;
    if (req.body.tinting) updateData.tinting = JSON.parse(req.body.tinting);
    if (req.body.sunProtection) updateData.sunProtection = JSON.parse(req.body.sunProtection);
    if (req.body.gasEquipment) updateData.gasEquipment = JSON.parse(req.body.gasEquipment);
    if (req.body.fuelConsumption) updateData.fuelConsumption = JSON.parse(req.body.fuelConsumption);
    if (req.body.warranty) updateData.warranty = JSON.parse(req.body.warranty);

    // Parse array fields
    if (req.body.multimediaFeatures) updateData.multimediaFeatures = JSON.parse(req.body.multimediaFeatures);
    if (req.body.cameras) updateData.cameras = JSON.parse(req.body.cameras);
    if (req.body.safetyFeatures) updateData.safetyFeatures = JSON.parse(req.body.safetyFeatures);

    // Rasmlarni boshqarish
    let finalImages = [...car.images];

    // Agar existingImages yuborilgan bo'lsa (o'chirilmaganlar ro'yxati)
    if (req.body.existingImages) {
      const existingImages = JSON.parse(req.body.existingImages);
      finalImages = existingImages;
    }

    // Yangi rasmlar qo'shilsa
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => `/uploads/${file.filename}`);
      finalImages = [...finalImages, ...newImages];
    }

    updateData.images = finalImages;

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
        message: "Автомобил табылмады",
      });
    }

    // Faqat owner yoki admin o'chirishi mumkin
    if (car.owner.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Sizda bu avtomobilni o'chirish huquqi yo'q",
      });
    }

    await Car.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Avtomobil o'chirildi",
    });
  } catch (error) {
    console.error('Error deleting car:', error);
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
        message: "Автомобил табылмады",
      });
    }

    // Allaqachon saqlangan bo'lsa
    if (user.savedCars.includes(carId)) {
      return res.status(400).json({
        success: false,
        message: "Бул автомобил әллақашан сақланған",
      });
    }

    user.savedCars.push(carId);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Автомобил сақланды",
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
      message: "Автомобил сақланғанлардан өширилди",
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
        message: "Автомобил табылмады",
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

// @desc    O'xshash avtomobillarni olish
// @route   GET /api/cars/:id/similar
// @access  Public
exports.getSimilarCars = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);

    if (!car) {
      return res.status(404).json({
        success: false,
        message: "Автомобил табылмады",
      });
    }

    // O'xshash mashinalarni topish:
    // 1. Bir xil marka
    // 2. Narx ±30% oralig'ida
    // 3. Joriy mashinani o'zi emas
    const priceRange = car.price ? car.price * 0.3 : 50000000;
    const minPrice = car.price ? car.price - priceRange : 0;
    const maxPrice = car.price ? car.price + priceRange : 999999999;

    const similarCars = await Car.find({
      _id: { $ne: car._id }, // O'zini chiqarib tashlash
      brand: car.brand,
      status: 'sale', // Faqat sotuvdagi mashinalar
      $or: [
        { price: { $gte: minPrice, $lte: maxPrice } },
        { price: null } // Narxi ko'rsatilmagan mashinalar ham
      ]
    })
      .populate("owner", "name phone")
      .sort({ isPremium: -1, createdAt: -1 })
      .limit(6); // Faqat 6 ta

    res.status(200).json({
      success: true,
      count: similarCars.length,
      data: similarCars,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Foydalanuvchining avtomobillarini olish
// @route   GET /api/cars/my
// @access  Private
exports.getMyCars = async (req, res) => {
  try {
    const cars = await Car.find({ owner: req.user.id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: cars.length,
      cars,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
