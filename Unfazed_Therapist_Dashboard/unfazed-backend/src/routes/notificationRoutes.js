const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const { protect } = require('../middleware/authMiddleware');
const { protectClient } = require('../middleware/clientAuthMiddleware');
const { listNotifications, markNotificationRead, markAllNotificationsRead } = require('../controllers/notificationController');

const router = express.Router();

router.get('/therapist', protect, asyncHandler(listNotifications));
router.patch('/therapist/read-all', protect, asyncHandler(markAllNotificationsRead));
router.patch('/therapist/:id/read', protect, asyncHandler(markNotificationRead));
router.get('/client', protectClient, asyncHandler(listNotifications));
router.patch('/client/read-all', protectClient, asyncHandler(markAllNotificationsRead));
router.patch('/client/:id/read', protectClient, asyncHandler(markNotificationRead));

module.exports = router;
