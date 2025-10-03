const express = require('express');
const router = express.Router();
const multerMiddleware = require('../../../Middlewares/multerMiddleware');
const SliderController = require('../../../Controllers/Admin/Slider/SliderController');
const jwtVerify = require('../../../Middlewares/jwtMiddleware');

// Create a new slider with Cloudinary
router.post(
  '/create',
  jwtVerify(['admin']),
  multerMiddleware.upload.single('image'), // Multer memory storage
  multerMiddleware.uploadToCloudinaryMiddleware, // Upload to Cloudinary
  SliderController.createSlider
);

// Get all sliders
router.get('/', SliderController.getAllSliders);

// Update slider with Cloudinary
router.patch(
  '/:id',
  jwtVerify(['admin']),
  multerMiddleware.upload.single('image'), // Multer memory storage
  multerMiddleware.uploadToCloudinaryMiddleware, // Upload to Cloudinary
  SliderController.updateSlider
);

// Delete slider
router.delete('/:id', jwtVerify(['admin']), SliderController.deleteSlider);

// Search slider
router.get('/search', jwtVerify(['admin']), SliderController.searchSlider);

module.exports = router;
