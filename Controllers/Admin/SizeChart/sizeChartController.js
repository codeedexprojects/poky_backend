const SizeChart = require('../../../Models/Admin/SizeChartModel');

// Create a new size chart
exports.createSizeChart = async (req, res) => {
  try {
    const { title, sizes } = req.body;
    
    const sizeChart = new SizeChart({
      title,
      sizes
    });

    const savedSizeChart = await sizeChart.save();
    res.status(201).json(savedSizeChart);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all size charts
exports.getAllSizeCharts = async (req, res) => {
  try {
    const sizeCharts = await SizeChart.find();
    res.json(sizeCharts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single size chart by ID
exports.getSizeChartById = async (req, res) => {
  try {
    const sizeChart = await SizeChart.findById(req.params.id);
    if (!sizeChart) {
      return res.status(404).json({ message: 'Size chart not found' });
    }
    res.json(sizeChart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a size chart
exports.updateSizeChart = async (req, res) => {
  try {
    const { title, sizes } = req.body;
    
    const updatedSizeChart = await SizeChart.findByIdAndUpdate(
      req.params.id,
      {
        title,
        sizes,
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!updatedSizeChart) {
      return res.status(404).json({ message: 'Size chart not found' });
    }
    res.json(updatedSizeChart);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a size chart
exports.deleteSizeChart = async (req, res) => {
  try {
    const deletedSizeChart = await SizeChart.findByIdAndDelete(req.params.id);
    if (!deletedSizeChart) {
      return res.status(404).json({ message: 'Size chart not found' });
    }
    res.json({ message: 'Size chart deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};