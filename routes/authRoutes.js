const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

// Register
router.post('/register', authController.register);
// Login
router.post('/login', authController.login);
// Verify Email
router.patch('/verifyEmail', authController.patchVerifyEmail);
// Get Account
router.get(
  '/account',
  authMiddleware.privateMiddleware,
  authController.getAccount
);

router.get(
  '/verifyEmail',
  authMiddleware.privateMiddleware,
  authController.getVerifyEmail
);

module.exports = router;
