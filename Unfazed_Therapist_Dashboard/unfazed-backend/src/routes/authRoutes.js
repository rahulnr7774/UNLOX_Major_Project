const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const { register, registerClient, login, googleAuth } = require('../controllers/authController');

const router = express.Router();
router.post('/register', asyncHandler(register));
router.post('/register-client', asyncHandler(registerClient));
router.post('/login', asyncHandler(login));
router.post('/google', asyncHandler(googleAuth));
module.exports = router;
