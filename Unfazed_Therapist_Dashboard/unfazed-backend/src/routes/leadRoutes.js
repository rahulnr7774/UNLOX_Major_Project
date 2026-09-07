const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const { protect } = require('../middleware/authMiddleware');
const controller = require('../controllers/leadController');

const router = express.Router();
router.post('/', asyncHandler(controller.createLead));
router.get('/', protect, asyncHandler(controller.listLeads));
router.patch('/:id/accept', protect, asyncHandler(controller.acceptLead));

module.exports = router;