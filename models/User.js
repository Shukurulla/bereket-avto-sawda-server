const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Ism kiritilishi shart'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email kiritilishi shart'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Parol kiritilishi shart'],
    minlength: 6,
    select: false
  },
  phone: {
    type: String,
    required: [true, 'Telefon raqam kiritilishi shart']
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  savedCars: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Parolni hash qilish (saqlashdan oldin)
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Parolni tekshirish
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
