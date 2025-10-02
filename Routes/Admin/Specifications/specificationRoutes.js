const express = require('express');
const router = express.Router();
const specificationController = require('../../../Controllers/Admin/Specifications/specificationController');

// Add new specification
router.post('/add', specificationController.addSpecification);

// Get all specifications
router.get('/all', specificationController.getAllSpecifications);

// Get specifications by type
router.get('/all/type/:type', specificationController.getSpecificationsByType);

// Toggle specification status (active/inactive)
router.patch('/toggle-status/:id', specificationController.toggleSpecificationStatus);

// Delete specification
router.delete('/delete/:id', specificationController.deleteSpecification);

module.exports = router;
