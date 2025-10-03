const express = require('express');
const router = express.Router();
const categoryController = require('../../../Controllers/Admin/Category/CategoryController');
const jwtVerify = require('../../../Middlewares/jwtMiddleware');
const multerMiddleware = require('../../../Middlewares/multerMiddleware');

// Create a new category with Cloudinary
router.post(
  '/create',
  jwtVerify(['admin']),
  multerMiddleware.upload.single('image'), // Multer memory storage
  multerMiddleware.uploadToCloudinaryMiddleware, // Upload to Cloudinary
  categoryController.createCategory
);

// Get all categories
router.get('/get', categoryController.getCategories);

// Get single category by id
router.get('/get/:id', categoryController.getCategoryById);

// Update category with Cloudinary
router.patch(
  '/update/:id',
  jwtVerify(['admin']),
  multerMiddleware.upload.single('image'), // Multer memory storage
  multerMiddleware.uploadToCloudinaryMiddleware, // Upload to Cloudinary
  categoryController.updateCategory
);

// Delete category
router.delete('/delete/:id', jwtVerify(['admin']), categoryController.deleteCategory);

// Search category
router.get('/search', categoryController.searchCategory);

module.exports = router;
