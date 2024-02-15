const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authMiddleware.adminMiddleware, adminController.getUserReports);
router.post('/user', authMiddleware.adminMiddleware, adminController.banUser);
router.post(
  '/user/warn',
  authMiddleware.adminMiddleware,
  adminController.warnUser
);
router.put(
  '/ticket',
  authMiddleware.adminMiddleware,
  adminController.updateTicket
);
router.get(
  '/ban-appeals',
  authMiddleware.adminMiddleware,
  adminController.getBanAppeals
);
router.put(
  '/user/unban',
  authMiddleware.adminMiddleware,
  adminController.unbanUser
);

module.exports = router;
