const Product = require('../../../Models/Admin/ProductModel');
const fs = require('fs');
const path = require('path');

// Add a new product
exports.addProduct = async (req, res) => {
  try {
    const imageUrls = req.files ? req.files.map(file => file.path) : [];
    if (!req.body.product_Code) {
      return res.status(400).json({ error: "Product Code is required." });
    }

    const existingProduct = await Product.findOne({ product_Code: req.body.product_Code });
    if (existingProduct) {
      return res.status(400).json({ error: "A product with the same Product Code already exists." });
    }

    // Parse categories and subcategories as arrays
    let categories = [];
    let subcategories = [];
    
    try {
      // Handle categories - can be string or array
      if (req.body.category) {
        categories = typeof req.body.category === "string" 
          ? JSON.parse(req.body.category) 
          : (Array.isArray(req.body.category) ? req.body.category : [req.body.category]);
      }
      
      // Handle subcategories - can be string or array
      if (req.body.subcategory) {
        subcategories = typeof req.body.subcategory === "string" 
          ? JSON.parse(req.body.subcategory) 
          : (Array.isArray(req.body.subcategory) ? req.body.subcategory : [req.body.subcategory]);
      }
    } catch (parseError) {
      return res.status(400).json({ 
        error: "Invalid categories/subcategories format", 
        details: parseError.message 
      });
    }

    // Validate that at least one category and subcategory is provided
    if (!categories.length) {
      return res.status(400).json({ error: "At least one product category is required" });
    }
    if (!subcategories.length) {
      return res.status(400).json({ error: "At least one product subcategory is required" });
    }

    // Parse colors
    let colors = [];
    try {
      colors = typeof req.body.colors === "string" ? JSON.parse(req.body.colors) : (req.body.colors || []);
    } catch (parseError) {
      return res.status(400).json({ error: "Invalid colors format", details: parseError.message });
    }

    const validatedColors = colors.map(color => ({
      color: color.color || "",
      sizes: (color.sizes || []).map(size => ({
        size: size.size || "",
        stock: parseInt(size.stock || 0, 10),
      })),
    }));

    const totalStock = validatedColors.reduce(
      (total, color) => total + color.sizes.reduce((cTotal, size) => cTotal + size.stock, 0),
      0
    );

    const selectedSizeCharts = Array.isArray(req.body.sizeChartRefs)
      ? req.body.sizeChartRefs
      : (req.body.sizeChartRefs ? [req.body.sizeChartRefs] : []);

    const newProduct = new Product({
      ...req.body,
      category: categories,
      subcategory: subcategories,
      images: imageUrls,
      colors: validatedColors,
      totalStock,
      sizeChartRefs: selectedSizeCharts,
    });

    const savedProduct = await newProduct.save();
    res.status(201).json({ 
      message: "Product added successfully", 
      product: await savedProduct.populate(['category', 'subcategory'])
    });
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(400).json({ error: "Product creation failed", details: error.message });
  }
};

// Get all products (updated to handle array population)
exports.getAllProducts = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = {};
    
    if (category) {
      const categoryArray = category.split(',');
      // Use $in to match any of the categories in the array
      filter.category = { $in: categoryArray };
    }
    
    const products = await Product.find(filter)
      .populate('category')
      .populate('subcategory')
      .sort({ createdAt: -1 });

    res.status(200).json(products);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update product (updated for multiple categories/subcategories)
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const existingImages = product.images || [];
    const newImages = req.files ? req.files.map(file => file.path) : [];
    if (existingImages.length + newImages.length > 5) {
      return res.status(400).json({ message: "Cannot have more than 5 images for a product" });
    }

    const updatedProductData = { ...req.body, images: [...existingImages, ...newImages] };

    // Parse categories if provided
    if (req.body.category) {
      try {
        updatedProductData.category = typeof req.body.category === "string" 
          ? JSON.parse(req.body.category) 
          : (Array.isArray(req.body.category) ? req.body.category : [req.body.category]);
      } catch (err) {
        return res.status(400).json({ message: "Invalid category format" });
      }
    }

    // Parse subcategories if provided
    if (req.body.subcategory) {
      try {
        updatedProductData.subcategory = typeof req.body.subcategory === "string" 
          ? JSON.parse(req.body.subcategory) 
          : (Array.isArray(req.body.subcategory) ? req.body.subcategory : [req.body.subcategory]);
      } catch (err) {
        return res.status(400).json({ message: "Invalid subcategory format" });
      }
    }

    // Parse sizeChartRefs
    if (req.body.sizeChartRefs) {
      try {
        updatedProductData.sizeChartRefs = Array.isArray(req.body.sizeChartRefs)
          ? req.body.sizeChartRefs
          : JSON.parse(req.body.sizeChartRefs);
      } catch (err) {
        return res.status(400).json({ message: "Invalid sizeChartRefs format" });
      }
    }

    // Parse colors
    if (req.body.colors) {
      let parsedColors;
      try {
        parsedColors = typeof req.body.colors === "string" ? JSON.parse(req.body.colors) : req.body.colors;
      } catch (err) {
        return res.status(400).json({ message: "Invalid colors format" });
      }

      if (Array.isArray(parsedColors)) {
        const updatedColors = parsedColors.map(color => ({
          color: color.color,
          sizes: color.sizes.map(size => ({ size: size.size, stock: size.stock })),
        }));

        const totalStock = updatedColors.reduce((total, color) => {
          return total + color.sizes.reduce((sTotal, size) => sTotal + size.stock, 0);
        }, 0);

        updatedProductData.colors = updatedColors;
        updatedProductData.totalStock = totalStock;
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id, 
      updatedProductData, 
      { new: true }
    ).populate(['category', 'subcategory']);
    
    res.status(200).json({ message: "Product updated successfully", product: updatedProduct });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category')
      .populate('subcategory');
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update product
// exports.updateProduct = async (req, res) => {
//   try {
//     const product = await Product.findById(req.params.id);
//     if (!product) return res.status(404).json({ message: "Product not found" });

//     const existingImages = product.images || [];
//     const newImages = req.files ? req.files.map(file => file.path) : [];
//     if (existingImages.length + newImages.length > 5) {
//       return res.status(400).json({ message: "Cannot have more than 5 images for a product" });
//     }

//     const updatedProductData = { ...req.body, images: [...existingImages, ...newImages] };

//     // Parse sizeChartRefs
//     if (req.body.sizeChartRefs) {
//       try {
//         updatedProductData.sizeChartRefs = Array.isArray(req.body.sizeChartRefs)
//           ? req.body.sizeChartRefs
//           : JSON.parse(req.body.sizeChartRefs);
//       } catch (err) {
//         return res.status(400).json({ message: "Invalid sizeChartRefs format" });
//       }
//     }

//     // Parse colors
//     if (req.body.colors) {
//       let parsedColors;
//       try {
//         parsedColors = typeof req.body.colors === "string" ? JSON.parse(req.body.colors) : req.body.colors;
//       } catch (err) {
//         return res.status(400).json({ message: "Invalid colors format" });
//       }

//       if (Array.isArray(parsedColors)) {
//         const updatedColors = parsedColors.map(color => ({
//           color: color.color,
//           sizes: color.sizes.map(size => ({ size: size.size, stock: size.stock })),
//         }));

//         const totalStock = updatedColors.reduce((total, color) => {
//           return total + color.sizes.reduce((sTotal, size) => sTotal + size.stock, 0);
//         }, 0);

//         updatedProductData.colors = updatedColors;
//         updatedProductData.totalStock = totalStock;
//       }
//     }

//     const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updatedProductData, { new: true });
//     res.status(200).json({ message: "Product updated successfully", product: updatedProduct });
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// };

// Delete a specific product image
exports.deleteProductImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { imageName } = req.body; 

    const product = await Product.findById(id);
    
    if (!product) return res.status(404).json({ message: 'Product not found' });
    

    if (product.images.length === 1 && product.images.includes(imageName)) {
      return res.status(400).json({ message: 'At least one product image is required' });
    }

    const updatedImages = product.images.filter(img => img !== imageName);
    if (updatedImages.length === product.images.length) {
      return res.status(400).json({ message: 'Image not found in product' });
    }
    product.images = updatedImages;
    await product.save();

    res.status(200).json({ message: 'Image deleted successfully', images: product.images });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete a product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Delete all product images from local storage
    product.images.forEach(img => {
      if (fs.existsSync(img)) fs.unlinkSync(img);
    });

    await Product.findByIdAndDelete(id);
    res.status(200).json({ message: "Product and associated images deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(400).json({ error: error.message });
  }
};

// Filter products by category IDs
exports.filterProductsByCategoryId = async (req, res) => {
  try {
    const { categoryIds } = req.body;
    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      return res.status(400).json({ message: 'No category IDs provided for filtering' });
    }

    const filteredProducts = await Product.find({ category: { $in: categoryIds } });
    res.status(200).json({ message: 'Products filtered successfully', products: filteredProducts });
  } catch (error) {
    console.error('Error filtering products by category ID:', error);
    res.status(500).json({ message: 'Failed to filter products', error: error.message });
  }
};
