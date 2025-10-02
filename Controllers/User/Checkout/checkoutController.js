const Checkout = require('../../../Models/User/CheckoutModel');
const Address = require('../../../Models/User/AddressModel');
const Cart = require('../../../Models/User/CartModel');
const Product = require('../../../Models/Admin/ProductModel'); 
const { checkout } = require('../../../Routes/Admin/Invoice/invoiceRoute');
const Coupon=require('../../../Models/Admin/CouponModel');

// Create Checkout
// exports.createCheckout = async (req, res) => {
//   const { userId, addressId } = req.body;

//   try {
//     const cart = await Cart.findOne({ userId }).populate({
//       path: "items.productId",
//       populate: { path: "category", select: "_id name" },
//     });

//     if (!cart || cart.items.length === 0) {
//       return res.status(400).json({ message: "Cart is empty or not found" });
//     }

//     const address = await Address.findById(addressId);
//     if (!address || address.userId.toString() !== userId) {
//       return res.status(404).json({ message: "Invalid shipping address" });
//     }

//     // let discountedPrice = cart.totalPrice;
//     let discountedPrice = Math.round(cart.totalPrice);

//     let couponAmount = 0;
//     let couponRemoved = false;

//     if (cart.coupon) {
//       const coupon = await Coupon.findById(cart.coupon);
//       const currentDate = new Date();

//       if (
//         coupon &&
//         coupon.status === "active" &&
//         currentDate >= coupon.startDate &&
//         currentDate <= coupon.endDate
//       ) {
//         const cartCategories = cart.items.map((item) => item.productId.category?._id.toString());
//         const couponCategories = coupon.category.map((id) => id.toString());

//         console.log("Cart Categories:", cartCategories);
//         console.log("Coupon Categories:", couponCategories);

//         const hasMatchingCategory = cartCategories.some((categoryId) =>
//           couponCategories.includes(categoryId)
//         );

//         if (hasMatchingCategory) {
//           if (coupon.discountType === "percentage") {
//             couponAmount = (cart.totalPrice * coupon.discountValue) / 100;
//           } else if (coupon.discountType === "amount") {
//             couponAmount = coupon.discountValue;
//           }

//         discountedPrice = Math.round(Math.max(cart.totalPrice - couponAmount, 0));
//   // discountedPrice = Math.max(cart.totalPrice - couponAmount, 0);
//         } else {
//           couponRemoved = true;
//         }
//       } else {
//         couponRemoved = true;
//       }

//       if (couponRemoved) {
//         cart.coupon = null;
//         cart.discountedTotal = cart.totalPrice;
//         cart.coupenAmount = 0;
//         cart.discountType = null;
//         await cart.save();
//       }
//     }

//     const cartItems = cart.items.map((item) => ({
//       productId: item.productId._id,
//       quantity: item.quantity,
//       price: item.price,
//       color: item.color,
//       size: item.size,
//     }));

//     const checkout = new Checkout({
//       userId,
//       cartId: cart._id,
//       cartItems,
//       addressId: address._id,
//       totalPrice: cart.totalPrice,
//       discountedPrice,
//       coupen: couponRemoved ? null : cart.coupon,
//       coupenAmount: couponAmount,
//       discountType: couponRemoved ? null : cart.discountType,
//     });

//     await checkout.save();

//     res.status(201).json({
//       message: "Checkout created successfully",
//       couponMessage: couponRemoved
//         ? "Coupon removed due to invalid category or expiration."
//         : "Coupon applied successfully.",
//       checkout: {
//         totalPrice: checkout.totalPrice,
//         discountedPrice: checkout.discountedPrice,
//       },
//       checkoutId: checkout._id,
//     });
//   } catch (err) {
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// };

exports.createCheckout = async (req, res) => {
  const { userId, addressId } = req.body;

  try {
    // Find the user's cart with populated product details
    const cart = await Cart.findOne({ userId }).populate({
      path: "items.productId",
      populate: { path: "category", select: "_id name" },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty or not found" });
    }

    // Validate shipping address
    const address = await Address.findById(addressId);
    if (!address || address.userId.toString() !== userId) {
      return res.status(404).json({ message: "Invalid shipping address" });
    }

    // Check stock availability for all items
    const stockErrors = [];
    const updatedCartItems = [];

    for (const item of cart.items) {
      const product = await Product.findById(item.productId._id);
      
      if (!product) {
        stockErrors.push(`Product ${item.productId.title} no longer available`);
        continue;
      }

      // Find the color and size combination in the product
      const colorObj = product.colors.find(c => c.color === item.color);
      if (!colorObj) {
        stockErrors.push(`Color ${item.color} not available for product ${item.productId.title}`);
        continue;
      }

      const sizeObj = colorObj.sizes.find(s => s.size === item.size);
      if (!sizeObj) {
        stockErrors.push(`Size ${item.size} not available for product ${item.productId.title} in color ${item.color}`);
        continue;
      }

      // Check stock quantity
      if (sizeObj.stock < item.quantity) {
        stockErrors.push(
          `Only ${sizeObj.stock} items available for ${item.productId.title} (${item.color}, ${item.size})`
        );
        continue;
      }

      updatedCartItems.push(item);
    }

    if (stockErrors.length > 0) {
      return res.status(400).json({ 
        message: "Some items in your cart are no longer available in the requested quantity",
        errors: stockErrors 
      });
    }

    // Calculate discounted price
    let discountedPrice = Math.round(cart.totalPrice);
    let couponAmount = 0;
    let couponRemoved = false;

    if (cart.coupon) {
      const coupon = await Coupon.findById(cart.coupon);
      const currentDate = new Date();

      if (
        coupon &&
        coupon.status === "active" &&
        currentDate >= coupon.startDate &&
        currentDate <= coupon.endDate
      ) {
        const cartCategories = cart.items.map((item) => 
          item.productId.category?._id.toString()
        );
        const couponCategories = coupon.category.map((id) => id.toString());

        const hasMatchingCategory = cartCategories.some((categoryId) =>
          couponCategories.includes(categoryId)
        );

        if (hasMatchingCategory) {
          if (coupon.discountType === "percentage") {
            couponAmount = (cart.totalPrice * coupon.discountValue) / 100;
          } else if (coupon.discountType === "amount") {
            couponAmount = coupon.discountValue;
          }

          discountedPrice = Math.round(Math.max(cart.totalPrice - couponAmount, 0));
        } else {
          couponRemoved = true;
        }
      } else {
        couponRemoved = true;
      }

      if (couponRemoved) {
        cart.coupon = null;
        cart.discountedTotal = cart.totalPrice;
        cart.coupenAmount = 0;
        cart.discountType = null;
        await cart.save();
      }
    }

    // Prepare cart items for checkout
    const cartItems = updatedCartItems.map((item) => ({
      productId: item.productId._id,
      quantity: item.quantity,
      price: item.price,
      color: item.color,
      size: item.size,
    }));

    // Create checkout
    const checkout = new Checkout({
      userId,
      cartId: cart._id,
      cartItems,
      addressId: address._id,
      totalPrice: cart.totalPrice,
      discountedPrice,
      coupen: couponRemoved ? null : cart.coupon,
      coupenAmount: couponAmount,
      discountType: couponRemoved ? null : cart.discountType,
    });

    await checkout.save();

    res.status(201).json({
      message: "Checkout created successfully",
      couponMessage: couponRemoved
        ? "Coupon removed due to invalid category or expiration."
        : "Coupon applied successfully.",
      checkout: {
        totalPrice: checkout.totalPrice,
        discountedPrice: checkout.discountedPrice,
      },
      checkoutId: checkout._id,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// Get Checkout by ID
exports.getCheckoutById = async (req, res) => {
  try {
    const checkout = await Checkout.findById(req.params.id)
      .populate('userId', 'name email') // Populate user info
      .populate('addressId', 'firstName lastName area country number address landmark city landmark state addressType pincode ') // Populate address details
      .populate({
        path: 'cartItems.productId', 
        model: 'Products', 
        select: 'title  images color size freeDelivery actualPrice offerPrice', 
      }). populate({
        path: 'coupen', 
        model: 'Coupon', 
        select: 'discountValue  discountType code title', 
      })

    if (!checkout) {
      return res.status(404).json({ message: "Checkout not found" });
    }

    res.status(200).json({ checkout });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// Get All Checkouts for a User
exports.getUserCheckouts = async (req, res) => {
  try {
    const checkouts = await Checkout.find({ userId: req.user.userId })
      .populate({
        path: 'cartItems.productId',
        model: 'Products',
        select: 'title offerPrice  color size', // Include color and size
      });

    res.status(200).json({ checkouts });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// delete checkout
exports.deletCheckout = async (req, res) => {
  try {
    const deletedCheckout = await Checkout.findByIdAndDelete(req.params.id);
    if (!deletedCheckout) {
      return res.status(404).json({ message: "checkout details not found" });
    }
    res.status(200).json({ message: "checkout deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};