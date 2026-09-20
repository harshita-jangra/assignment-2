// models/Maintenance.js
// Maintenance Schema for tracking servicing, repairs, and scheduled inspections

const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  asset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: [true, 'Asset reference is required']
  },
  serviceDate: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String,
    required: [true, 'Service description is required'],
    trim: true
  },
  cost: {
    type: Number,
    required: [true, 'Maintenance cost is required'],
    min: [0, 'Cost cannot be negative'],
    default: 0
  },
  nextServiceDue: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Scheduled', 'In Progress', 'Completed'],
    default: 'Completed'
  },
  performedBy: {
    type: String,
    trim: true,
    default: 'Institutional Technical Services'
  },
  notes: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Maintenance', maintenanceSchema);
