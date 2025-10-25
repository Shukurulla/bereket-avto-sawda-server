const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  // ============================================
  // ASOSIY MA'LUMOTLAR
  // ============================================
  brand: {
    type: String,
    required: [true, 'Marka kiritilishi shart'],
    trim: true
  },
  model: {
    type: String,
    required: [true, 'Model kiritilishi shart'],
    trim: true
  },
  year: {
    type: Number,
    required: [true, 'Yil kiritilishi shart'],
    min: 1900,
    max: new Date().getFullYear() + 1
  },
  mileage: {
    type: Number,
    required: [true, 'Probeg kiritilishi shart'],
    min: 0
  },
  price: {
    type: Number,
    min: 0
  },

  // VIN kod
  vinCode: {
    type: String,
    trim: true,
    uppercase: true,
    maxlength: 17
  },

  // ============================================
  // TASHQI KO'RINISH
  // ============================================

  // Rang
  color: {
    type: String,
    trim: true
  },

  // Tana turi (sedan, hatchback, SUV, ...)
  bodyType: {
    type: String,
    enum: ['sedan', 'hatchback', 'suv', 'crossover', 'coupe', 'wagon', 'minivan', 'pickup', 'van', 'convertible', 'other'],
    default: 'sedan'
  },

  // Eshiklar soni
  doors: {
    type: Number,
    enum: [2, 3, 4, 5],
    default: 4
  },

  // O'rindiqlar soni
  seats: {
    type: Number,
    min: 2,
    max: 50,
    default: 5
  },

  // ============================================
  // TEXNIK XUSUSIYATLAR
  // ============================================

  transmission: {
    type: String,
    enum: ['automatic', 'manual', 'robot', 'cvt'],
    required: [true, 'Korobka turi kiritilishi shart']
  },

  // Yoqilg'i turi
  fuelType: {
    type: String,
    enum: ['petrol', 'diesel', 'electric', 'hybrid', 'hybrid_plugin'],
    required: [true, 'Yoqilg\'i turi kiritilishi shart']
  },

  // Dvigatel hajmi (litrda)
  engineVolume: {
    type: Number,
    min: 0,
    max: 20
  },

  // Dvigatel quvvati (hp - ot kuchi)
  enginePower: {
    type: Number,
    min: 0
  },

  // Elektromobil uchun batareya sig'imi (kWh)
  batteryCapacity: {
    type: Number,
    min: 0
  },

  // Elektromobil uchun quvvatlash masofasi (km)
  electricRange: {
    type: Number,
    min: 0
  },

  // Yoqilg'i sarfi (l/100km)
  fuelConsumption: {
    city: Number,      // Shaharda
    highway: Number,   // Yo'lda
    combined: Number   // Aralash
  },

  // Haydovchi tizimi
  driveType: {
    type: String,
    enum: ['fwd', 'rwd', 'awd', '4wd'],  // FWD=old, RWD=orqa, AWD=to'liq, 4WD=4x4
    default: 'fwd'
  },

  // ============================================
  // GAZ JIHOZI (TZ bo'yicha)
  // ============================================

  gasEquipment: {
    hasGasEquipment: {
      type: Boolean,
      default: false
    },
    gasType: {
      type: String,
      enum: ['none', 'methane', 'propane']
    },
    generation: {
      type: String,  // Metan uchun: 1-avlod, 2-avlod, 3-avlod, 4-avlod
      trim: true
    }
  },

  // ============================================
  // QO'SHIMCHA JIHOZLAR VA FUNKSIYALAR
  // ============================================

  // Lyuk
  hasSunroof: {
    type: Boolean,
    default: false
  },

  // Panoramik lyuk
  hasPanoramicRoof: {
    type: Boolean,
    default: false
  },

  // Chexollar
  hasCovers: {
    type: Boolean,
    default: false
  },

  // Chexol turi
  coverType: {
    type: String,
    enum: ['none', 'fabric', 'leather', 'eco-leather', 'combined']
  },

  // Tonirovka
  tinting: {
    hasTinting: {
      type: Boolean,
      default: false
    },
    location: {
      type: String,
      enum: ['none', 'rear', 'full']
    },
    permissionExpiry: {
      type: Date
    }
  },

  // Quyosh himoyasi
  sunProtection: {
    hasSunProtection: {
      type: Boolean,
      default: false
    },
    location: {
      type: String,
      enum: ['none', 'front', 'full']
    }
  },

  // Multimedia tizim
  hasMultimedia: {
    type: Boolean,
    default: false
  },

  multimediaFeatures: [{
    type: String,
    enum: ['android_auto', 'apple_carplay', 'bluetooth', 'usb', 'aux', 'navigation', 'touchscreen', 'wifi']
  }],

  // Kamera tizimlari
  cameras: [{
    type: String,
    enum: ['rear_camera', 'front_camera', '360_camera', 'parking_sensors', 'blind_spot']
  }],

  // Klimat nazorati
  climateControl: {
    type: String,
    enum: ['none', 'ac', 'climate_control', 'dual_zone', 'multi_zone']
  },

  // O'rindiq qizdiruvi
  heatedSeats: {
    type: String,
    enum: ['none', 'front', 'front_rear', 'all']
  },

  // O'rindiq ventilyatsiyasi
  ventilatedSeats: {
    type: Boolean,
    default: false
  },

  // Rul qizdiruvi
  heatedSteeringWheel: {
    type: Boolean,
    default: false
  },

  // Kruiz-kontrol
  cruiseControl: {
    type: String,
    enum: ['none', 'standard', 'adaptive']
  },

  // Keyless entry
  keylessEntry: {
    type: Boolean,
    default: false
  },

  // Start/Stop button
  startStopButton: {
    type: Boolean,
    default: false
  },

  // Yog'och detallar
  woodTrim: {
    type: Boolean,
    default: false
  },

  // Elektr ko'zgular
  powerMirrors: {
    type: Boolean,
    default: false
  },

  // Elektr derazalar
  powerWindows: {
    type: String,
    enum: ['none', 'front', 'all']
  },

  // Yomg'ir sensorlari
  rainSensor: {
    type: Boolean,
    default: false
  },

  // Yorug'lik sensorlari
  lightSensor: {
    type: Boolean,
    default: false
  },

  // ============================================
  // XAVFSIZLIK TIZIMLARI
  // ============================================

  safetyFeatures: [{
    type: String,
    enum: [
      'abs',           // ABS tormoz tizimi
      'esp',           // Stabilizatsiya tizimi
      'traction',      // Traction control
      'airbags_front', // Old xavfsizlik yostiqlari
      'airbags_side',  // Yon xavfsizlik yostiqlari
      'airbags_curtain', // Parda xavfsizlik yostiqlari
      'lane_assist',   // Bo'lak yordamchisi
      'collision_warning', // To'qnashuv ogohlantiruvi
      'auto_brake',    // Avtomatik tormozlanish
      'isofix',        // ISOFIX bolalar o'rindig'i
      'alarm',         // Signalizatsiya
      'immobilizer'    // Immobilayzer
    ]
  }],

  // Xavfsizlik yostiqlari soni
  airbagsCount: {
    type: Number,
    min: 0,
    max: 12
  },

  // ============================================
  // HOLATI VA TARIX
  // ============================================

  condition: {
    type: String,
    enum: ['new', 'good', 'normal'],
    required: [true, 'Holat kiritilishi shart']
  },

  // Avariyada bo'lgan
  hasAccidentHistory: {
    type: Boolean,
    default: false
  },

  // Ta'mirlangan
  hasRepairHistory: {
    type: Boolean,
    default: false
  },

  // Ro'yxatdan o'tgan davlat
  countryOfOrigin: {
    type: String,
    trim: true
  },

  // Egalar soni
  ownersCount: {
    type: Number,
    min: 1,
    default: 1
  },

  // Xizmat ko'rsatish tarixi
  serviceHistory: {
    type: Boolean,
    default: false
  },

  // Kafolat
  warranty: {
    hasWarranty: {
      type: Boolean,
      default: false
    },
    expiryDate: Date,
    description: String
  },

  // ============================================
  // JOYLASHUV
  // ============================================

  location: {
    city: {
      type: String,
      trim: true
    },
    region: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    }
  },

  // ============================================
  // TAVSIF VA KONTAKT
  // ============================================

  description: {
    type: String,
    maxlength: 2000
  },

  contact: {
    phone: {
      type: String,
      required: [true, 'Telefon raqam kiritilishi shart']
    },
    telegram: String,
    instagramReels: String,
    whatsapp: String
  },

  // ============================================
  // MEDIA
  // ============================================

  images: [{
    type: String,
    required: true
  }],

  // Video havola
  videoUrl: {
    type: String,
    trim: true
  },

  // ============================================
  // PREMIUM VA STATUS
  // ============================================

  isPremium: {
    type: Boolean,
    default: false
  },
  premiumExpiresAt: {
    type: Date
  },

  status: {
    type: String,
    enum: ['sale', 'sold', 'reserved'],
    default: 'sale'
  },

  // Ko'rilgan
  views: {
    type: Number,
    default: 0
  },

  // ============================================
  // EGASI VA SANA
  // ============================================

  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update vaqtini avtomatik o'zgartirish
carSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Premium muddatini tekshirish
carSchema.methods.checkPremiumExpiry = function() {
  if (this.isPremium && this.premiumExpiresAt && new Date() > this.premiumExpiresAt) {
    this.isPremium = false;
    return this.save();
  }
  return Promise.resolve(this);
};

module.exports = mongoose.model('Car', carSchema);
