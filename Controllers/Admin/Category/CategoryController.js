const Category = require('../../../Models/Admin/CategoryModel');
const fs = require('fs');
const path = require('path');

// Create a new category
exports.createCategory = async (req, res) => {
    const { name, description, isActive } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: 'Category image is required' });
    }

    try {
        const imageUrl = req.file.path; // Local file path

        const newCategory = new Category({
            name,
            image: imageUrl,
            isActive: isActive === undefined ? true : isActive,
            description,
        });

        await newCategory.save();

        res.status(201).json({
            message: 'Category created successfully',
            category: newCategory
        });
    } catch (err) {
        console.error('Error creating category:', err);
        res.status(500).json({ message: 'Error creating category', error: err.message });
    }
};

// Get all categories
exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.find().sort({ createdAt: -1 });

        const categoriesWithImageUrl = categories.map(category => ({
            id: category._id,
            name: category.name,
            isActive: category.isActive,
            description: category.description,
            imageUrl: category.image
        }));

        res.status(200).json(categoriesWithImageUrl);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching categories', error: err.message });
    }
};

// Get a category by ID
exports.getCategoryById = async (req, res) => {
    const { id } = req.params;

    try {
        const category = await Category.findById(id);

        if (!category) return res.status(404).json({ message: 'Category not found' });

        res.status(200).json({
            id: category._id,
            name: category.name,
            isActive: category.isActive,
            description: category.description,
            imageUrl: category.image
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching category', error: err.message });
    }
};

// Update category
exports.updateCategory = async (req, res) => {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    try {
        const category = await Category.findById(id);
        if (!category) return res.status(404).json({ message: 'Category not found' });

        if (name) category.name = name;
        if (description) category.description = description;
        if (isActive !== undefined) category.isActive = isActive === 'true' || isActive === true;

        if (req.file) {
            // Delete old image if it exists
            if (category.image && fs.existsSync(category.image)) {
                fs.unlinkSync(category.image);
            }

            category.image = req.file.path; // Update with new image path
        }

        await category.save();

        res.status(200).json({ message: 'Category updated successfully', category });
    } catch (err) {
        console.error(`Error updating category: ${err.message}`);
        res.status(500).json({ message: 'Error updating category', error: err.message });
    }
};

// Delete category
exports.deleteCategory = async (req, res) => {
    const { id } = req.params;

    try {
        const category = await Category.findById(id);
        if (!category) return res.status(404).json({ message: 'Category not found' });

        // Delete image from local storage
        if (category.image && fs.existsSync(category.image)) {
            fs.unlinkSync(category.image);
        }

        await Category.findByIdAndDelete(id);

        res.status(200).json({ message: 'Category deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error deleting category', error: err.message });
    }
};

// Search category by name
exports.searchCategory = async (req, res) => {
    const { name } = req.query;

    try {
        const query = {};
        if (name) query.name = { $regex: name, $options: 'i' };

        const categories = await Category.find(query);

        const categoriesWithImageUrl = categories.map(category => ({
            id: category._id,
            name: category.name,
            isActive: category.isActive,
            description: category.description,
            imageUrl: category.image
        }));

        res.status(200).json(categoriesWithImageUrl);
    } catch (err) {
        res.status(500).json({ message: 'Error searching categories', error: err.message });
    }
};
