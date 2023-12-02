const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Register
router.post('/register', authController.register);
// Login
router.post('/login', authController.login);
// Verify Email
router.patch('/verifyEmail', authController.verifyEmail);

module.exports = router;
