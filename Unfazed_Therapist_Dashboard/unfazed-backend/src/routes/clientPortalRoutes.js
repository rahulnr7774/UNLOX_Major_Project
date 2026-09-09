const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const { protectClient } = require('../middleware/clientAuthMiddleware');
const { getPortal, updateProfile, downloadReceipt } = require('../controllers/clientPortalController');

const router = express.Router();
router.get('/portal', protectClient, asyncHandler(getPortal));
router.get('/payments/:paymentId/receipt', protectClient, asyncHandler(downloadReceipt));
router.patch('/profile', protectClient, asyncHandler(updateProfile));

module.exports = router;