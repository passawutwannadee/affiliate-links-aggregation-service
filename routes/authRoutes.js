const express = require('express')
const router = express.Router();
const authController = require('../controllers/authController')

// Register
router.post('/register', authController.register)

module.exports = router