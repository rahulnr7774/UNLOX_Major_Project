const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const { protect } = require('../middleware/authMiddleware');
const controller = require('../controllers/paymentController');

const router = express.Router();
router.use(protect);
router.get('/', asyncHandler(controller.listPayments));
router.post('/orders', asyncHandler(controller.createOrder));
router.post('/verify', asyncHandler(controller.verifyPayment));
module.exports = router;
