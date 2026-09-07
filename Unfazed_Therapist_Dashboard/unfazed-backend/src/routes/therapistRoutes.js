const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const { protect } = require('../middleware/authMiddleware');
const { getProfile, updateProfile, getPublicProfile } = require('../controllers/therapistController');
const { getCurrentTherapist } = require('../controllers/authController');

const router = express.Router();
router.get('/public/:slug', asyncHandler(getPublicProfile));
router.use(protect);
router.get('/me', asyncHandler(getCurrentTherapist));
router.get('/profile', asyncHandler(getProfile));
router.patch('/profile', asyncHandler(updateProfile));
module.exports = router;
