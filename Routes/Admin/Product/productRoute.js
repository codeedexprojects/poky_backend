const express = require('express');
const router = express.Router();
const productController = require('../../../Controllers/Admin/Product/productController');
const jwtVerify = require('../../../Middlewares/jwtMiddleware');
const multerMiddleware = require('../../../Middlewares/multerMiddleware');

// Add a new product with Cloudinary
router.post(
  '/create-product',
  jwtVerify(['admin']),
  multerMiddleware.upload.array("images", 5), // Multer memory storage
  multerMiddleware.uploadToCloudinaryMiddleware, // Upload images to Cloudinary
  productController.addProduct
);

// Get all products
router.get('/view-products', jwtVerify(['admin']), productController.getAllProducts);

// Get a single product by ID
router.get('/product/:id', productController.getProductById);

// Update a product with Cloudinary image handling
router.patch(
  '/update-product/:id',
  jwtVerify(['admin']),
  multerMiddleware.upload.array("images", 5), // Multer memory storage
  multerMiddleware.uploadToCloudinaryMiddleware, // Upload images to Cloudinary
  productController.updateProduct
);

// Delete a specific product image
router.post('/delete-product-image/:id', jwtVerify(['admin']), productController.deleteProductImage);

// Delete a product
router.delete('/delete-product/:id', jwtVerify(['admin']), productController.deleteProduct);

// Filter products based on category
router.post('/filter', jwtVerify(['admin']), productController.filterProductsByCategoryId);

module.exports = router;
