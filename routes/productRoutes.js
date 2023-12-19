const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Get Products
router.get('/', productController.getProducts);

// Create product
router.post('/', productController.createProduct);

// Update product
router.post('/', productController.createProduct);

module.exports = router;
