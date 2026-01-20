const mongoose = require('mongoose');

const stockLogSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required'],
    index: true
  },
  companyId: {
    type: String,
    required: [true, 'Company ID is required'],
    index: true
  },
  changeType: {
    type: String,
    enum: ['increase', 'decrease', 'initial'],
    required: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required']
  },
  previousStock: {
    type: Number,
    required: true
  },
  newStock: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    trim: true
  },
  performedBy: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

stockLogSchema.index({ productId: 1, createdAt: -1 });
stockLogSchema.index({ companyId: 1, createdAt: -1 });

module.exports = mongoose.model('StockLog', stockLogSchema);