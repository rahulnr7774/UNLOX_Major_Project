const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const { protect } = require('../middleware/authMiddleware');
const controller = require('../controllers/packageController');

const router = express.Router();
router.use(protect);
router.get('/', asyncHandler(controller.listPackages));
router.post('/', asyncHandler(controller.createPackage));
router.patch('/:id', asyncHandler(controller.updatePackage));
module.exports = router;