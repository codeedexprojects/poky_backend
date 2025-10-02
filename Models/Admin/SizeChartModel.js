const mongoose = require('mongoose');
const { Schema } = mongoose;

const sizeChartSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  sizes: [
    {
      size: { type: String, required: true },
      measurements: {
        type: Map, // stores key-value pairs like { "Front Length": 40, "Hip": 32 }
        of: Schema.Types.Mixed // can be Number, String, etc.
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

sizeChartSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const SizeChart = mongoose.model('SizeChart', sizeChartSchema);

module.exports = SizeChart;
