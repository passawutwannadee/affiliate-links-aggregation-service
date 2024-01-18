const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

// Register
router.post('/register', authController.register);
// Login
router.post('/login', authController.login);
// Login
router.post('/logout', authController.logout);
//Change Password
router.patch(
  '/password',
  authMiddleware.privateMiddleware,
  authController.changePassword
);
// Send Email
router.post(
  '/verify-email',
  authMiddleware.privateUnverifiedMiddleware,
  authController.sendVerifyEmail
);
// Verify Email
router.patch('/verify-email', authController.patchVerifyEmail);
// Get Account
router.get(
  '/account',
  authMiddleware.privateUnverifiedMiddleware,
  authController.getAccount
);

router.get(
  '/verifyEmail',
  authMiddleware.privateMiddleware,
  authController.getVerifyEmail
);

module.exports = router;
