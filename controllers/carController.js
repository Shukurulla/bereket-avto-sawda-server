const Car = require("../models/Car");
const User = require("../models/User");
const { postCarToChannel, updateCarPost, deleteCarPost } = require("../utils/telegramBot");

// Kiril -> Lotin transliteratsiya
const cyrillicToLatin = (text) => {
  const map = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '',
    'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    'ў': 'o\'', 'қ': 'q', 'ғ': 'g\'', 'ҳ': 'h'
  };
  return text.toLowerCase().split('').map(char => map[char] || char).join('');
};

// Matnni normallashtirish (kirilni lotinga, kichik harfga)
const normalizeText = (text) => {
  if (!text) return '';
  return cyrillicToLatin(text.toLowerCase().trim());
};

// Levenshtein distance - ikki so'z orasidagi farq
const levenshteinDistance = (str1, str2) => {
  const m = str1.length;
  const n = str2.length;
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
};

// O'xshashlik foizini hisoblash (0-100)
const calculateSimilarity = (str1, str2) => {
  const s1 = normalizeText(str1);
  const s2 = normalizeText(str2);

  if (s1 === s2) return 100;
  if (!s1 || !s2) return 0;

  const distance = levenshteinDistance(s1, s2);
  const maxLen = Math.max(s1.length, s2.length);
  const similarity = ((maxLen - distance) / maxLen) * 100;

  return Math.round(similarity);
};

// @desc    Barcha avtomobillarni olish (filter bilan)
// @route   GET /api/cars
// @access  Public
exports.getCars = async (req, res) => {
  try {
    const {
      // Qidiruv
      search,
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

    // Search - brand va model'da qidirish
    if (search) {
      filter.$or = [
        { brand: new RegExp(search, "i") },
        { model: new RegExp(search, "i") },
        // Brand va model birgalikda qidirish
        { $expr: {
          $regexMatch: {
            input: { $concat: ["$brand", " ", "$model"] },
            regex: search,
            options: "i"
          }
        }}
      ];
    }

    // Asosiy ma'lumotlar
    if (brand && !search) filter.brand = new RegExp(brand, "i");
    if (model && !search) filter.model = new RegExp(model, "i");
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

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    // Umumiy soni (pagination uchun)
    const total = await Car.countDocuments(filter);

    // Premium avtomobillarni tepaga chiqarish
    const cars = await Car.find(filter)
      .populate("owner", "name phone")
      .sort({ isPremium: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: cars,
      total: total,
      page: page,
      limit: limit,
      totalPages: Math.ceil(total / limit),
      count: cars.length,
      hasMore: page * limit < total,
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

    // Narx reytingini hisoblash - o'xshash mashinalar orasida (fuzzy matching bilan)
    let priceRating = null;
    if (car.price) {
      // Barcha sotuvdagi mashinalarni olish
      const allCars = await Car.find({
        status: 'sale',
        price: { $exists: true, $gt: 0 }
      }).select('brand model price');

      // Fuzzy matching bilan o'xshash mashinalarni topish (70%+ o'xshashlik)
      const SIMILARITY_THRESHOLD = 70;
      const similarCars = allCars.filter(c => {
        const brandSimilarity = calculateSimilarity(car.brand, c.brand);
        const modelSimilarity = calculateSimilarity(car.model, c.model);
        // Ikkala maydon ham 70%+ o'xshash bo'lishi kerak
        return brandSimilarity >= SIMILARITY_THRESHOLD && modelSimilarity >= SIMILARITY_THRESHOLD;
      });

      if (similarCars.length > 1) {
        // Narxlarni sortlash (arzondan qimmatga)
        const prices = similarCars.map(c => c.price).sort((a, b) => a - b);
        const currentCarIndex = prices.findIndex(p => p >= car.price);

        // Arzonlik foizi: qancha arzon bo'lsa, shuncha yuqori ball
        // Eng arzon = 100%, eng qimmat = 0%
        const position = currentCarIndex === -1 ? prices.length - 1 : currentCarIndex;
        const percentile = ((prices.length - 1 - position) / (prices.length - 1)) * 100;

        priceRating = {
          percentage: Math.round(percentile),
          totalSimilar: similarCars.length,
          position: position + 1, // 1 dan boshlanadigan pozitsiya
          cheapest: prices[0],
          mostExpensive: prices[prices.length - 1],
          average: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
        };
      }
    }

    res.status(200).json({
      success: true,
      data: car,
      priceRating
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
    // Siqilgan rasmlar yo'llarini olish
    const images = req.processedFiles
      ? req.processedFiles.map((file) => file.path)
      : [];

    const thumbnails = req.processedFiles
      ? req.processedFiles.map((file) => file.thumbnail)
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
      images: images,
      thumbnails: thumbnails
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

    // Telegram'ga yuklash (asynchronous)
    if (car.status === 'sale') {
      postCarToChannel(car).then(postId => {
        if (postId) {
          car.telegramPostId = postId;
          car.save().catch(err => console.error('Telegram post ID saqlanmadi:', err));
        }
      }).catch(err => console.error('Telegram\'ga yuklashda xatolik:', err));
    }

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
    let finalThumbnails = [...(car.thumbnails || [])];

    // Agar existingImages yuborilgan bo'lsa (o'chirilmaganlar ro'yxati)
    if (req.body.existingImages) {
      const existingImages = JSON.parse(req.body.existingImages);
      finalImages = existingImages;

      // Thumbnails ham filterlash
      if (car.thumbnails && car.thumbnails.length > 0) {
        const existingIndices = existingImages.map(img => car.images.indexOf(img)).filter(i => i !== -1);
        finalThumbnails = existingIndices.map(i => car.thumbnails[i]).filter(Boolean);
      }
    }

    // Yangi rasmlar qo'shilsa
    if (req.processedFiles && req.processedFiles.length > 0) {
      const newImages = req.processedFiles.map((file) => file.path);
      const newThumbnails = req.processedFiles.map((file) => file.thumbnail);
      finalImages = [...finalImages, ...newImages];
      finalThumbnails = [...finalThumbnails, ...newThumbnails];
    }

    updateData.images = finalImages;
    updateData.thumbnails = finalThumbnails;

    car = await Car.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    // Telegram'da postni yangilash (faqat matn)
    if (car.telegramPostId && car.status === 'sale') {
      updateCarPost(car).catch(err => console.error('Telegram postni yangilashda xatolik:', err));
    }

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

    // Telegram'dan postni o'chirish
    if (car.telegramPosts && car.telegramPosts.length > 0) {
      deleteCarPost(car).catch(err => console.error('Telegram postni o\'chirishda xatolik:', err));
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
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const skip = (page - 1) * limit;

    // Total count
    const total = await Car.countDocuments({ owner: req.user.id });

    const cars = await Car.find({ owner: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: cars,
      total: total,
      page: page,
      limit: limit,
      totalPages: Math.ceil(total / limit),
      count: cars.length,
      hasMore: page * limit < total,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Barcha avtomobillarni o'chirish (Admin only)
// @route   DELETE /api/cars/all
// @access  Private/Admin
exports.deleteAllCars = async (req, res) => {
  try {
    const { deleteCarPost } = require("../utils/telegramBot");

    // Barcha mashinalarni olish (telegram postlarni o'chirish uchun)
    const cars = await Car.find({});

    // Har bir mashina uchun telegram postni o'chirish
    for (const car of cars) {
      if (car.telegramPosts && car.telegramPosts.length > 0) {
        try {
          await deleteCarPost(car);
        } catch (err) {
          console.error(`Telegram post o'chirishda xatolik: ${car._id}`, err.message);
        }
      }
    }

    // Barcha mashinalarni o'chirish
    const result = await Car.deleteMany({});

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} ta avtomobil o'chirildi`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
