const express = require('express');
const {
  getBanners,
  getBanner,
  createBanner,
  updateBanner,
  deleteBanner,
  updateBannerOrder,
  toggleBanner
} = require('../controllers/bannerController');
const { protect, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.route('/')
  .get(getBanners)
  .post(protect, adminOnly, upload.single('image'), createBanner);

router.route('/:id')
  .get(getBanner)
  .put(protect, adminOnly, upload.single('image'), updateBanner)
  .delete(protect, adminOnly, deleteBanner);

router.put('/:id/order', protect, adminOnly, updateBannerOrder);
router.put('/:id/toggle', protect, adminOnly, toggleBanner);

module.exports = router;
