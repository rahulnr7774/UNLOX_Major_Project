const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const { protect } = require('../middleware/authMiddleware');
const { requireFeature } = require('../middleware/entitlementMiddleware');
const { getAnalytics } = require('../controllers/analyticsController');

const router = express.Router();
router.get('/', protect, requireFeature('analytics'), asyncHandler(getAnalytics));
module.exports = router;
