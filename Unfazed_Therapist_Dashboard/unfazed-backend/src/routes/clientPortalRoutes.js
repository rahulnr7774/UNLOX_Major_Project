const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const { protectClient, protectClientStatus } = require('../middleware/clientAuthMiddleware');
const { getPortal, getApprovalStatus, updateProfile, downloadReceipt } = require('../controllers/clientPortalController');

const router = express.Router();
router.get('/portal', protectClient, asyncHandler(getPortal));
router.get('/approval-status', protectClientStatus, asyncHandler(getApprovalStatus));
router.get('/notifications', protectClient, asyncHandler(require('../controllers/notificationController').listNotifications));
router.patch('/notifications/read-all', protectClient, asyncHandler(require('../controllers/notificationController').markAllNotificationsRead));
router.patch('/notifications/:id/read', protectClient, asyncHandler(require('../controllers/notificationController').markNotificationRead));
router.get('/payments/:paymentId/receipt', protectClient, asyncHandler(downloadReceipt));
router.patch('/profile', protectClient, asyncHandler(updateProfile));

module.exports = router;