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
// Edit Profile Picture
router.patch(
  '/profile',
  authMiddleware.privateMiddleware,
  userController.editProfile
);

router.get(
  '/ban',
  authMiddleware.privateMiddleware,
  userController.getBanReason
);

router.post(
  '/ban/appeal',
  authMiddleware.privateMiddleware,
  userController.banAppeal
);

module.exports = router;
