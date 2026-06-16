const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  company: {
    type: String,
    required: true
  },
  contact: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  productsSupplied: [{
    type: String
  }],
  address: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Supplier', supplierSchema);
