const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

// Get Products
router.get('/', userController.getUsers);
// Edit Profile Picture
router.patch(
  '/profile_picture',
  authMiddleware.privateMiddleware,
  userController.editProfilePicture
);

module.exports = router;
