const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Get All Products
router.get('/', productController.getProducts);

// Create product
router.post('/', productController.createProduct);

module.exports = router;
