const mongoose = require('mongoose');

const incentiveSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  loanAmount: {
    type: Number,
    required: true,
    min: 0
  },
  customerName: {
    type: String,
    trim: true,
    default: ''
  },
  loanAccountNo: {
    type: String,
    trim: true,
    default: ''
  },
  loanType: {
    type: String,
    enum: ['Personal Loan', 'Home Loan', 'Business Loan', 'Auto Loan', 'Mortgage Loan', 'Other'],
    default: 'Personal Loan'
  },
  disbursedDate: {
    type: Date,
    default: Date.now
  },
  dateStr: {
    type: String,
    required: true
  },
  slabPercentage: {
    type: Number,
    default: 0
  },
  incentiveAmount: {
    type: Number,
    default: 0
  },
  remarks: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['Submitted', 'Approved', 'Processed'],
    default: 'Approved'
  },
  loggedBy: {
    type: String,
    default: 'Self'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Incentive', incentiveSchema);
