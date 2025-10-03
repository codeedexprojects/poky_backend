const SubCategory = require('../../../Models/Admin/SubcategoyModel');
const fs = require('fs');

// Create subcategory
exports.createSubCategory = async (req, res) => {
    const { title, category, isActive } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: "SubCategory Image is required" });
    }

    try {
        const newSubCategory = new SubCategory({
            title,
            category,
            isActive: isActive === undefined ? true : isActive,
            image: req.file.path // Local file path
        });

        await newSubCategory.save();
        res.status(201).json({ message: 'SubCategory created successfully', SubCategory: newSubCategory });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error });
    }
};

// Get all subcategories
exports.getSubCategories = async (req, res) => {
    try {
        const subcategory = await SubCategory.find().populate('category').sort({ createdAt: -1 });
        res.status(200).json(subcategory);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Error fetching Sub categories', error: err.message });
    }
};

// Get subcategory by Id
exports.getSubCategoryById = async (req, res) => {
    const { id } = req.params;
    try {
        const subcategory = await SubCategory.findById(id).populate('category');
        if (!subcategory) {
            return res.status(404).json({ message: 'SubCategory not found' });
        }
        res.status(200).json(subcategory);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching Subcategory', error: err.message });
    }
};

// Update subcategory
exports.updateSubCategory = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    try {
        if (req.file) {
            // Delete old image if exists
            const oldSubCategory = await SubCategory.findById(id);
            if (oldSubCategory && oldSubCategory.image && fs.existsSync(oldSubCategory.image)) {
                fs.unlinkSync(oldSubCategory.image);
            }
            updates.image = req.file.path; // Update with new local image path
        }

        if (updates.isActive !== undefined) {
            updates.isActive = updates.isActive === 'true' || updates.isActive === true;
        }

        const updatedSubCategory = await SubCategory.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true,
        });

        if (!updatedSubCategory) {
            return res.status(404).json({ message: 'SubCategory not found' });
        }

        res.status(200).json({ message: 'SubCategory updated successfully', updatedSubCategory });
    } catch (err) {
        res.status(500).json({ message: 'Error updating SubCategory', error: err.message });
    }
};

// Delete subcategory
exports.deleteSubCategory = async (req, res) => {
    const { id } = req.params;

    try {
        const subcategory = await SubCategory.findById(id);
        if (!subcategory) {
            return res.status(404).json({ message: 'SubCategory not found' });
        }

        // Delete image from local storage
        if (subcategory.image && fs.existsSync(subcategory.image)) {
            fs.unlinkSync(subcategory.image);
        }

        await SubCategory.findByIdAndDelete(id);
        res.status(200).json({ message: 'SubCategory deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting Subcategory', error: err.message });
    }
};

// Search subcategory
exports.searchSubCategory = async (req, res) => {
    const { name } = req.query;

    try {
        const query = {};
        if (name) {
            query.title = { $regex: name, $options: 'i' }; // Case-insensitive regex
        }

        const SubCategoryData = await SubCategory.find(query).populate('category').sort({ createdAt: -1 });
        res.status(200).json(SubCategoryData);
    } catch (err) {
        res.status(500).json({ message: 'Error searching subcategories', error: err.message });
    }
};
