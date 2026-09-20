// models/Asset.js
// Asset Schema for lab equipment and hardware inventory

const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  assetTag: {
    type: String,
    required: [true, 'Asset Tag is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Asset Name is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Electronics', 'Testing & Measurement', 'Prototyping', 'Computing', 'Soldering', 'General Lab'],
    default: 'Electronics'
  },
  location: {
    type: String,
    required: [true, 'Location / Room is required'],
    trim: true
  },
  condition: {
    type: String,
    enum: ['Good', 'Fair', 'Damaged', 'Under Maintenance'],
    default: 'Good'
  },
  totalQuantity: {
    type: Number,
    required: [true, 'Total Quantity is required'],
    min: [0, 'Total quantity cannot be negative']
  },
  availableQuantity: {
    type: Number,
    required: [true, 'Available Quantity is required'],
    min: [0, 'Available quantity cannot be negative']
  },
  issuedQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Issued quantity cannot be negative']
  },
  damagedQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Damaged quantity cannot be negative']
  },
  lostQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Lost quantity cannot be negative']
  },
  description: {
    type: String,
    trim: true,
    default: 'High precision equipment for academic laboratory experiments.'
  },
  image: {
    type: String,
    default: '/images/default-asset.svg'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Virtual to check if item is currently in stock
assetSchema.virtual('isInStock').get(function () {
  return this.availableQuantity > 0;
});

module.exports = mongoose.model('Asset', assetSchema);
