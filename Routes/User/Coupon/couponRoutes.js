const express = require('express');
const router = express.Router();
const CouponController = require('../../../Controllers/User/Coupon/couponController');

// get all coupon
router.get('/list', CouponController.getCoupons)



module.exports = router;
 