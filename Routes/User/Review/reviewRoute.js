const express = require('express');
const router = express.Router();
const ReviewController = require('../../../Controllers/User/Review/reviewController');
const multerMiddleware = require('../../../Middlewares/multerMiddleware');
const jwtVerify = require('../../../Middlewares/jwtMiddleware');

// Add review with image upload (Cloudinary)
router.post(
  '/add',
  jwtVerify(['user']),
  multerMiddleware.upload.single('image'),
  multerMiddleware.uploadToCloudinaryMiddleware, // Updated middleware
  ReviewController.addReview
);

// Get reviews by product
router.get('/:productId', ReviewController.getReviewsByProduct);

module.exports = router;
