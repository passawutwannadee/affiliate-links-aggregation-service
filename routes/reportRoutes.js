const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authMiddleware.adminMiddleware, reportController.getReports);

router.post(
  '/',
  authMiddleware.privateMiddleware,
  reportController.createReports
);

router.get('/categories', reportController.getReportCategories);

module.exports = router;
