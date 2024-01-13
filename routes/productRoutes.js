const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const upload = multer(multerConfig.config).single(multerConfig.keyUpload);

// Get Products
router.get('/', productController.getProducts);

// Create product
router.post(
  '/',
  authMiddleware.privateMiddleware,
  upload,
  productController.createProduct
);

// Update product
router.put(
  '/',
  authMiddleware.privateMiddleware,
  upload,
  productController.editProducts
);

// Delete product
router.delete(
  '/',
  authMiddleware.privateMiddleware,
  productController.removeProducts
);

// Get Products
router.get('/categories', productController.getProductCategories);

module.exports = router;
