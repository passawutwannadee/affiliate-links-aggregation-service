const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

// Get Products
router.get('/', userController.getUsers);

module.exports = router;
