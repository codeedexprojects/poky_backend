const Material = require('../../../Models/Admin/MaterialModel');

// Add material
exports.addMaterial = async (req, res) => {
  try {
    const { materialName } = req.body;

    // Check if material already exists
    const existingMaterial = await Material.findOne({ materialName });
    if (existingMaterial) {
      return res.status(400).json({ message: 'Material already exists' });
    }

    const newMaterial = new Material({ materialName });
    await newMaterial.save();

    res.status(201).json({ message: 'Material added successfully', material: newMaterial });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// View all materials
exports.viewMaterials = async (req, res) => {
  try {
    const materials = await Material.find();
    res.status(200).json({ materials });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

exports.deleteMaterial = async (req, res) => {
    try {
      const { id } = req.params; // Get the material ID from request params
  
      // Find and delete the material
      const deletedMaterial = await Material.findByIdAndDelete(id);
      if (!deletedMaterial) {
        return res.status(404).json({ message: 'Material not found' });
      }
  
      res.status(200).json({ message: 'Material deleted successfully', material: deletedMaterial });
    } catch (error) {
      res.status(500).json({ message: 'Server Error', error: error.message });
    }
  };