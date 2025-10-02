const Coupon = require('../../../Models/Admin/CouponModel')


exports.getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find().populate('category','name').sort({createdAt:-1})
        res.status(200).json( coupons );
    } catch (err) {
        res.status(500).json({message:"Error fetching coupons", error: err.message})
    }
};