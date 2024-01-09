const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middlewares/authMiddleware');

// Get Products
router.get('/', productController.getProducts);

// Create product
router.post(
  '/',
  authMiddleware.privateMiddleware,
  productController.createProduct
);

// Update product
router.post('/', productController.createProduct);

// Delete product
router.delete(
  '/',
  authMiddleware.privateMiddleware,
  productController.removeProducts
);

// Get Products
router.get('/categories', productController.getProductCategories);

module.exports = router;
