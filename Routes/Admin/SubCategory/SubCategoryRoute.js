const express = require('express');
const router = express.Router();
const SubcategoryController = require('../../../Controllers/Admin/SubCategory/SubCategoryController');
const jwtVerify = require('../../../Middlewares/jwtMiddleware');
const multerMiddleware = require('../../../Middlewares/multerMiddleware');

// Create new subcategory with Cloudinary
router.post(
  '/create',
  jwtVerify(['admin']),
  multerMiddleware.upload.single('image'), // Multer memory storage
  multerMiddleware.uploadToCloudinaryMiddleware, // Upload to Cloudinary
  SubcategoryController.createSubCategory
);

// Get all subcategories
router.get('/get', SubcategoryController.getSubCategories);

// Get subcategory by ID
router.get('/get/:id', SubcategoryController.getSubCategoryById);

// Update subcategory with Cloudinary
router.patch(
  '/update/:id',
  jwtVerify(['admin']),
  multerMiddleware.upload.single('image'), // Multer memory storage
  multerMiddleware.uploadToCloudinaryMiddleware, // Upload to Cloudinary
  SubcategoryController.updateSubCategory
);

// Delete subcategory
router.delete('/delete/:id', jwtVerify(['admin']), SubcategoryController.deleteSubCategory);

// Search subcategory
router.get('/search', SubcategoryController.searchSubCategory);

module.exports = router;
