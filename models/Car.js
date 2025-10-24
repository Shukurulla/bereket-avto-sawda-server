const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  // Asosiy ma'lumotlar
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

  // Texnik xususiyatlar
  transmission: {
    type: String,
    enum: ['automatic', 'manual'],
    required: [true, 'Korobka turi kiritilishi shart']
  },
  fuelType: [{
    type: String,
    enum: ['petrol', 'methane', 'propane', 'electric']
  }],
  engineVolume: {
    type: Number,
    min: 0
  },
  hasSunroof: {
    type: Boolean,
    default: false
  },
  location: {
    type: String,
    trim: true
  },

  // Qo'shimcha jihozlar
  hasCovers: {
    type: Boolean,
    default: false
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

  // Holati
  condition: {
    type: String,
    enum: ['new', 'good', 'normal'],
    required: [true, 'Holat kiritilishi shart']
  },

  // Tavsif
  description: {
    type: String,
    maxlength: 2000
  },

  // Aloqa ma'lumotlari
  contact: {
    phone: {
      type: String,
      required: [true, 'Telefon raqam kiritilishi shart']
    },
    telegram: String,
    instagramReels: String
  },

  // Rasmlar
  images: [{
    type: String,
    required: true
  }],

  // Premium
  isPremium: {
    type: Boolean,
    default: false
  },
  premiumExpiresAt: {
    type: Date
  },

  // Sotish statusi
  status: {
    type: String,
    enum: ['sale', 'sold'],
    default: 'sale'
  },

  // Egasi
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Sana
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
