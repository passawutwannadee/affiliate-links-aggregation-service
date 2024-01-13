const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const collectionController = require('../controllers/collectionController');

// Create collections
router.post(
  '/',
  authMiddleware.privateMiddleware,
  collectionController.createCollections
);

// Create collections
router.put(
  '/',
  authMiddleware.privateMiddleware,
  collectionController.manageCollection
);

// get collections
router.get('/', collectionController.getCollections);

// Delete product
router.delete(
  '/',
  authMiddleware.privateMiddleware,
  collectionController.removeCollections
);

module.exports = router;
