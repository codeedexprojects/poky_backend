const Products = require("../../../Models/Admin/ProductModel");
const Wishlist=require("../../../Models/User/WishlistModel")


exports.MainSearch = async (req, res) => {
  const { query, page = 1, limit = 10, userId } = req.query;

  try {
    if (!query || query.trim() === "") {
      return res.status(400).json({ message: "Search query is required" });
    }

    const searchRegex = new RegExp(query, "i");

    // Search for products
    let products = await Products.find({
      $or: [
        { title: searchRegex },
        { description: searchRegex },
        { product_Code: searchRegex },
        { "colors.color": searchRegex },
        { "features.netWeight": searchRegex },
        { "features.fit": searchRegex },
        { "features.sleevesType": searchRegex },
        { "features.Length": searchRegex },
        { "features.occasion": searchRegex },
        { "features.innerLining": searchRegex },
        { manufacturerName: searchRegex },
        { manufacturerBrand: searchRegex },
      ],
    })
      .populate("category")
      .populate("subcategory")
      .populate({
        path: "colors.sizes",
        select: "size stock",
      })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    // If userId is provided, check wishlist
    if (userId) {
      const wishlist = await Wishlist.findOne({ userId });

      if (wishlist) {
        const wishlistedProductIds = new Set(
          wishlist.items.map((item) => item.productId.toString())
        );

        products = products.map((product) => {
          const productObj = product.toObject();
          productObj.isInWishlist = wishlistedProductIds.has(
            productObj._id.toString()
          );
          return productObj;
        });
      }
    }

    // ✅ Response same as getAllProducts
    res.status(200).json(products);
  } catch (err) {
    console.error("Error fetching search results:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


