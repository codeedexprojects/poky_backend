const Product = require('../../../Models/Admin/ProductModel');
const Wishlist = require('../../../Models/User/WishlistModel');
const Review = require("../../../Models/User/ReviewModel");
const Order = require("../../../Models/User/OrderModel");

const getProductReviewsData = async (productId) => {
  const reviews = await Review.find({ productId })
    .populate("userId", "name")
    .sort({ createdAt: -1 })
    .lean();

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  return {
    reviews,
    averageRating: Math.round(averageRating * 10) / 10, 
    reviewCount: reviews.length
  };
};

exports.getAllProducts = async (req, res) => {
  try {
    const { userId } = req.query;

    // Fetch all products
    const products = await Product.find()
      .populate('category')
      .populate('subcategory')
      .sort({ createdAt: -1 })
      .lean();

    let wishlistItems = [];

    if (userId) {
      const wishlist = await Wishlist.findOne({ userId });
      if (wishlist) {
        wishlistItems = wishlist.items.map(item => item.productId.toString());
      }
    }

    // Get reviews data for all products
    const productsWithReviews = await Promise.all(
      products.map(async (product) => {
        const reviewsData = await getProductReviewsData(product._id);
        return {
          ...product,
          isInWishlist: wishlistItems.includes(product._id.toString()),
          ...reviewsData
        };
      })
    );

    res.status(200).json(productsWithReviews);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get a single product by ID with reviews and wishlist status
exports.getProductById = async (req, res) => {
  try {
    const { userId } = req.query;

    const product = await Product.findById(req.params.id)
      .populate('category')
      .populate('subcategory')
      .lean();

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let isInWishlist = false;
    if (userId) {
      const wishlist = await Wishlist.findOne({ userId, "items.productId": product._id });
      if (wishlist) {
        isInWishlist = true;
      }
    }

    // Get reviews data
    const reviewsData = await getProductReviewsData(product._id);

    res.status(200).json({
      ...product,
      isInWishlist,
      ...reviewsData
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get products by category ID with reviews
exports.getProductsByCategoryId = async (req, res) => {
  try {
    const { userId } = req.query;
    const categoryId = req.params.categoryId;

    const products = await Product.find({ category: categoryId })
      .populate('category')
      .populate('subcategory')
      .sort({ createdAt: -1 })
      .lean();

    if (products.length === 0) {
      return res.status(404).json({ message: "No products found in this category" });
    }

    let wishlistedProductIds = new Set();
    if (userId) {
      const wishlist = await Wishlist.findOne({ userId });
      if (wishlist) {
        wishlistedProductIds = new Set(wishlist.items.map(item => item.productId.toString()));
      }
    }

    // Add reviews data and wishlist status
    const productsWithReviews = await Promise.all(
      products.map(async (product) => {
        const reviewsData = await getProductReviewsData(product._id);
        return {
          ...product,
          isInWishlist: wishlistedProductIds.has(product._id.toString()),
          ...reviewsData
        };
      })
    );

    res.status(200).json(productsWithReviews);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get products by category and subcategory with reviews
exports.getProductsByCategoryAndSubcategoryId = async (req, res) => {
  try {
    const { categoryId, subcategoryId } = req.params;
    const { userId } = req.query;

    const products = await Product.find({ category: categoryId, subcategory: subcategoryId })
      .populate('category')
      .populate('subcategory')
      .lean();

    if (products.length === 0) {
      return res.status(404).json({ message: "No products found in this category and subcategory" });
    }

    let wishlistedProductIds = new Set();
    if (userId) {
      const wishlist = await Wishlist.findOne({ userId });
      if (wishlist) {
        wishlistedProductIds = new Set(wishlist.items.map(item => item.productId.toString()));
      }
    }

    const productsWithReviews = await Promise.all(
      products.map(async (product) => {
        const reviewsData = await getProductReviewsData(product._id);
        return {
          ...product,
          isInWishlist: wishlistedProductIds.has(product._id.toString()),
          ...reviewsData
        };
      })
    );

    res.status(200).json(productsWithReviews);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Search products by name with reviews
exports.searchProductsByName = async (req, res) => {
  try {
    const { name, userId } = req.query;
    const products = await Product.find({ title: { $regex: name, $options: 'i' } })
      .populate('category')
      .populate('subcategory')
      .lean();

    if (products.length === 0) {
      return res.status(404).json({ message: "No products found matching the search criteria" });
    }

    let wishlistedProductIds = new Set();
    if (userId) {
      const wishlist = await Wishlist.findOne({ userId });
      if (wishlist) {
        wishlistedProductIds = new Set(wishlist.items.map(item => item.productId.toString()));
      }
    }

    const productsWithReviews = await Promise.all(
      products.map(async (product) => {
        const reviewsData = await getProductReviewsData(product._id);
        return {
          ...product,
          isInWishlist: wishlistedProductIds.has(product._id.toString()),
          ...reviewsData
        };
      })
    );

    res.status(200).json(productsWithReviews);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get similar products with reviews
exports.getSimilarProducts = async (req, res) => {
  try {
    const { productId } = req.params;
    const { userId } = req.query;

    const referenceProduct = await Product.findById(productId).lean();
    if (!referenceProduct) {
      return res.status(404).json({ message: "Reference product not found" });
    }

    const query = {
      category: referenceProduct.category,
      subcategory: referenceProduct.subcategory,
      _id: { $ne: referenceProduct._id },
      $or: [
        { 'colors.color': { $in: referenceProduct.colors.map(colorObj => colorObj.color) } },
        { 'features.material': referenceProduct.features.material },
        { manufacturerBrand: referenceProduct.manufacturerBrand }
      ]
    };

    const similarProducts = await Product.find(query)
      .populate('category')
      .populate('subcategory')
      .lean();

    if (similarProducts.length === 0) {
      return res.status(404).json({ message: "No similar products found" });
    }

    let wishlistedProductIds = new Set();
    if (userId) {
      const wishlist = await Wishlist.findOne({ userId });
      if (wishlist) {
        wishlistedProductIds = new Set(wishlist.items.map(item => item.productId.toString()));
      }
    }

    const productsWithReviews = await Promise.all(
      similarProducts.map(async (product) => {
        const reviewsData = await getProductReviewsData(product._id);
        return {
          ...product,
          isInWishlist: wishlistedProductIds.has(product._id.toString()),
          ...reviewsData
        };
      })
    );

    res.status(200).json(productsWithReviews);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Review Controllers (Keep your existing review functions)
exports.addReview = async (req, res) => {
  const { userId, productId, rating, message } = req.body;
  const image = req.fileUrl;

  try {
    const order = await Order.findOne({
      userId,
      "products.productId": productId,
      status: "Delivered", 
    });

    if (!order) {
      return res.status(403).json({
        message: "You can only review products you have purchased and received.",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const review = new Review({
      userId,
      productId,
      rating,
      message,
      image,
    });

    await review.save();

    res.status(201).json({ message: "Review added successfully", review });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get All Reviews for a Product
exports.getReviewsByProduct = async (req, res) => {
  const { productId } = req.params;

  try {
    const reviews = await Review.find({ productId }).populate("userId", "name").sort({createdAt: -1});
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};