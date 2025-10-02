const ProductSpecification = require('../../../Models/Admin/SpecificationsModel');

// Add new specification
exports.addSpecification = async (req, res) => {
  try {
    const { name, type } = req.body;

    // Validate input
    if (!name || !type) {
      return res.status(400).json({ message: 'Name and type are required' });
    }

    // Check if specification already exists
    const existingSpec = await ProductSpecification.findOne({ name, type });
    if (existingSpec) {
      return res.status(400).json({ message: 'Specification with this name and type already exists' });
    }

    // Create new specification
    const newSpec = new ProductSpecification({
      name,
      type
    });

    await newSpec.save();

    res.status(201).json({
      message: 'Specification added successfully',
      specification: newSpec
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Server Error', 
      error: error.message 
    });
  }
};

// Get all specifications
exports.getAllSpecifications = async (req, res) => {
  try {
    const specifications = await ProductSpecification.find();
    
    res.status(200).json({
      count: specifications.length,
      specifications
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Server Error', 
      error: error.message 
    });
  }
};

// Get specifications by type
exports.getSpecificationsByType = async (req, res) => {
  try {
    const { type } = req.params;
    
    const specifications = await ProductSpecification.find({ type });
    
    res.status(200).json({
      count: specifications.length,
      specifications
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Server Error', 
      error: error.message 
    });
  }
};

// Toggle specification status (active/inactive)
exports.toggleSpecificationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    const specification = await ProductSpecification.findById(id);
    if (!specification) {
      return res.status(404).json({ message: 'Specification not found' });
    }

    specification.isActive = !specification.isActive;
    await specification.save();

    res.status(200).json({
      message: 'Specification status updated successfully',
      specification
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Server Error', 
      error: error.message 
    });
  }
};

// Delete specification
exports.deleteSpecification = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedSpec = await ProductSpecification.findByIdAndDelete(id);
    if (!deletedSpec) {
      return res.status(404).json({ message: 'Specification not found' });
    }

    res.status(200).json({
      message: 'Specification deleted successfully',
      specification: deletedSpec
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Server Error', 
      error: error.message 
    });
  }
};