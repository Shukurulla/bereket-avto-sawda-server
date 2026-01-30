const express = require('express');
const {
  getCars,
  getCar,
  getMyCars,
  createCar,
  updateCar,
  deleteCar,
  deleteAllCars,
  saveCar,
  unsaveCar,
  makePremium,
  getSimilarCars
} = require('../controllers/carController');
const { protect, adminOnly } = require('../middleware/auth');
const { upload, compressImages } = require('../middleware/upload');

const router = express.Router();

router.route('/')
  .get(getCars)
  .post(protect, upload.array('images', 10), compressImages, createCar);

router.get('/my', protect, getMyCars);
router.delete('/all', protect, adminOnly, deleteAllCars);

router.route('/:id')
  .get(getCar)
  .put(protect, upload.array('images', 10), compressImages, updateCar)
  .delete(protect, deleteCar);

router.route('/:id/save')
  .post(protect, saveCar)
  .delete(protect, unsaveCar);

router.get('/:id/similar', getSimilarCars);
router.put('/:id/premium', protect, adminOnly, makePremium);

module.exports = router;
