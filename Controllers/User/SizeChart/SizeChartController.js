const SizeChart = require('../../../Models/Admin/SizeChartModel');


exports.getAllSizeCharts = async (req, res) => {
    try {
      const sizeCharts = await SizeChart.find();
      res.json(sizeCharts);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };