const express = require('express');
const router = express.Router();
const sizeChartController = require('../../../Controllers/Admin/SizeChart/sizeChartController');

// Create a new size chart
router.post('/create', sizeChartController.createSizeChart);

// Get all size charts
router.get('/get', sizeChartController.getAllSizeCharts);

// Get a single size chart by ID
router.get('/:id', sizeChartController.getSizeChartById);

// Update a size chart
router.patch('/update/:id', sizeChartController.updateSizeChart);

// Delete a size chart
router.delete('/delete/:id', sizeChartController.deleteSizeChart);

module.exports = router;