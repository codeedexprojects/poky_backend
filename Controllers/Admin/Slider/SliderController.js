const Slider = require('../../../Models/Admin/SliderModel');
const fs = require('fs');

// Create new slider
exports.createSlider = async (req, res) => {
    const { title, category, label } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: "Please upload an image" });
    }

    try {
        const slider = new Slider({
            title,
           
            category,
            label,
            image: req.file.path, // Local file path
        });
        await slider.save();
        res.status(201).json({ message: "Slider created successfully", slider });
    } catch (err) {
        res.status(500).json({ message: 'Error creating slider', error: err.message });
    }
};

// Get all sliders
exports.getAllSliders = async (req, res) => {
    try {
        const sliders = await Slider.find().sort({ createdAt: -1 });
        res.status(200).json(sliders);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching sliders', error: err.message });
    }
};

// Update a slider
exports.updateSlider = async (req, res) => {
    const { id } = req.params;
    const { title, link, category, label, isActive } = req.body;

    try {
        const slider = await Slider.findById(id);
        if (!slider) return res.status(404).json({ message: "Slider not found" });

        slider.title = title || slider.title;
        slider.link = link || slider.link;
        slider.category = category || slider.category;
        slider.label = label || slider.label;
        slider.isActive = isActive !== undefined ? isActive : slider.isActive;

        // Update image if a new one is uploaded
        if (req.file) {
            // Delete old image from local storage
            if (slider.image && fs.existsSync(slider.image)) {
                fs.unlinkSync(slider.image);
            }
            slider.image = req.file.path; // Update with new local image path
        }

        await slider.save();
        res.status(200).json({ message: 'Slider updated successfully', slider });
    } catch (err) {
        res.status(500).json({ message: 'Error updating slider', error: err.message });
    }
};

// Delete a slider
exports.deleteSlider = async (req, res) => {
    const { id } = req.params;

    try {
        const slider = await Slider.findById(id);
        if (!slider) return res.status(404).json({ message: "Slider not found" });

        // Delete image from local storage
        if (slider.image && fs.existsSync(slider.image)) {
            fs.unlinkSync(slider.image);
        }

        await slider.deleteOne();
        res.status(200).json({ message: 'Slider deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting slider', error: err.message });
    }
};

// Search slider
exports.searchSlider = async (req, res) => {
    const { name } = req.query;

    try {
        const query = {};
        if (name) {
            query.$or = [
                { title: { $regex: name, $options: 'i' } },
            ];
        }

        const sliderData = await Slider.find(query).populate('category');
        res.status(200).json(sliderData);
    } catch (err) {
        res.status(500).json({ message: 'Error searching sliders', error: err.message });
    }
};
