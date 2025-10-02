const express = require('express');
const router = express.Router();
const sizeChartController = require('../../../Controllers/User/SizeChart/SizeChartController');


// Get all size charts
router.get('/get', sizeChartController.getAllSizeCharts);


module.exports = router;