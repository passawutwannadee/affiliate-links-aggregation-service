const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authMiddleware.adminMiddleware, adminController.getUserReports);

module.exports = router;
