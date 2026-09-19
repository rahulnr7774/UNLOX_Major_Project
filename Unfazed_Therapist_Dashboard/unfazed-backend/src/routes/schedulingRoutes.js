const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const { protect } = require('../middleware/authMiddleware');
const controller = require('../controllers/schedulingController');

const router = express.Router();
router.use(protect);
router.get('/availability', asyncHandler(controller.getAvailability));
router.put('/availability', asyncHandler(controller.saveAvailability));
router.get('/waitlist', asyncHandler(controller.listWaitlist));
router.patch('/waitlist/:entryId/open', asyncHandler(controller.openWaitlistSlot));
router.patch('/waitlist/:entryId/cancel', asyncHandler(controller.cancelWaitlist));
router.get('/sessions', asyncHandler(controller.listSessions));
router.post('/sessions', asyncHandler(controller.createSession));
router.patch('/sessions/:id', asyncHandler(controller.updateSession));
router.post('/sessions/:id/start', asyncHandler(controller.startSession));
router.post('/sessions/:id/end', asyncHandler(controller.endSession));
module.exports = router;
