const express = require('express');
const {
  register,
  login,
  getMe,
  updateProfile,
  deleteAccount,
  deleteUser,
  getAllUsers
} = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/updateProfile', protect, updateProfile);

// O'z hisobini o'chirish (App Store talabi)
router.delete('/delete-account', protect, deleteAccount);

// Admin routes
router.get('/users', protect, adminOnly, getAllUsers);
router.delete('/users/:id', protect, adminOnly, deleteUser);

module.exports = router;
