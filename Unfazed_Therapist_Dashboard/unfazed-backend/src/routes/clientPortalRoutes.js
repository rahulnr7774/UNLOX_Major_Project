const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const { protectClient } = require('../middleware/clientAuthMiddleware');
const { getPortal } = require('../controllers/clientPortalController');

const router = express.Router();
router.get('/portal', protectClient, asyncHandler(getPortal));

module.exports = router;