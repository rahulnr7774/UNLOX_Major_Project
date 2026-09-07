const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const { protect } = require('../middleware/authMiddleware');
const { requireFeature } = require('../middleware/entitlementMiddleware');
const controller = require('../controllers/noteController');

const router = express.Router();
router.use(protect, requireFeature('note_templates'));
router.get('/', asyncHandler(controller.listNotes));
router.post('/', asyncHandler(controller.createNote));
router.patch('/:id', asyncHandler(controller.updateNote));
module.exports = router;
