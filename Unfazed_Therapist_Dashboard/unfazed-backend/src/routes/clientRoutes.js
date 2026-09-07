const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const { protect } = require('../middleware/authMiddleware');
const controller = require('../controllers/clientController');

const router = express.Router();
router.use(protect);
router.get('/', asyncHandler(controller.listClients));
router.post('/', asyncHandler(controller.createClient));
router.get('/:id', asyncHandler(controller.getClient));
router.get('/:id/sessions', asyncHandler(controller.getClientSessions));
router.patch('/:id', asyncHandler(controller.updateClient));
module.exports = router;
