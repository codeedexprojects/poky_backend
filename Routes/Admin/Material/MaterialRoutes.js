const express = require('express');
const router = express.Router();
const materialController = require('../../../Controllers/Admin/Material/MaterialController');

// Route to add material
router.post('/add', materialController.addMaterial);

// Route to view all materials
router.get('/view', materialController.viewMaterials);

// Delete a material
router.delete('/delete/:id', materialController.deleteMaterial); 

module.exports = router;
