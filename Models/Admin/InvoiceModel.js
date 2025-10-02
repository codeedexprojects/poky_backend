const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoice_Number: { type:String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order_id:{type: mongoose.Schema.Types.ObjectId, ref: 'orders', required: true},
  customerName: { type: String, required: true },
  customerMobile: { type: String, required: true },
address: {  // Changed from ObjectId to embedded document
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    number: { type: String, required: true },
    address: { type: String, required: true },
    area: { type: String, required: true },
    landmark: { type: String },
    pincode: { type: Number, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    addressType: { type: String, enum: ['home', 'work', 'other'], required: true }
  },  products: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Products', required: true },
      size: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true },
    },
  ],
  SubTotalAmount: { type: Number, required: true },
  Delivery_Charge:{ type: Number },
  Discounted_Amount:{ type: Number },
  totalAmount: { type: Number, required: true },
  payment_method:{ type: String, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Paid', 'Unpaid', 'Refund'],
    default: 'Pending',
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Pre-save hook to update `updatedAt`
invoiceSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);
