const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const { protectClient } = require('../middleware/clientAuthMiddleware');
const controller = require('../controllers/clientBookingController');

const router = express.Router();
router.use(protectClient);
router.get('/therapists', asyncHandler(controller.listTherapists));
router.get('/therapists/:therapistId/availability', asyncHandler(controller.listAvailability));
router.post('/waitlist', asyncHandler(controller.joinWaitlist));
router.get('/waitlist', asyncHandler(controller.listWaitlist));
router.get('/packages', asyncHandler(controller.listPackages));
router.post('/packages/:packageId/orders', asyncHandler(controller.createPackageOrder));
router.post('/packages/verify', asyncHandler(controller.verifyPayment));
router.post('/orders', asyncHandler(controller.createOrder));
router.post('/verify', asyncHandler(controller.verifyPayment));
router.post('/package-book', asyncHandler(controller.bookWithPackage));
router.get('/sessions/:sessionId/status', asyncHandler(controller.getSessionStatus));
module.exports = router;
