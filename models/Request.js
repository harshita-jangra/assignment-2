// models/Request.js
// Request Schema for asset issue requests and lifecycle tracking

const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  asset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Must request at least 1 unit']
  },
  purpose: {
    type: String,
    required: [true, 'Purpose of issue is required'],
    trim: true
  },
  expectedReturnDate: {
    type: Date,
    required: [true, 'Expected return date is required']
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Issued', 'Returned'],
    default: 'Pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  issuedAt: {
    type: Date
  },
  returnedAt: {
    type: Date
  },
  returnCondition: {
    type: String,
    enum: ['OK', 'Damaged', 'Lost', 'N/A'],
    default: 'N/A'
  },
  returnRemarks: {
    type: String,
    trim: true
  },
  rejectionReason: {
    type: String,
    trim: true
  }
});

// Dynamic virtual property to identify if issued equipment is currently overdue
requestSchema.virtual('isOverdue').get(function () {
  if (this.status === 'Issued' && this.expectedReturnDate) {
    return new Date(this.expectedReturnDate) < new Date();
  }
  return false;
});

// Configure schema to include virtuals when converting to JSON or Object
requestSchema.set('toObject', { virtuals: true });
requestSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Request', requestSchema);
