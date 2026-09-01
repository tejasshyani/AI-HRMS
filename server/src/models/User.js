const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  employeeId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: [true, 'Password hash is required']
  },
  phone: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['admin', 'employee'],
    default: 'employee'
  },
  baseSalary: {
    type: Number,
    required: true,
    default: 50000
  },
  joiningDate: {
    type: Date,
    default: Date.now
  },
  department: {
    type: String,
    default: 'Finance & Accounts'
  },
  designation: {
    type: String,
    default: 'Financial Analyst'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  avatar: {
    type: String,
    default: ''
  },
  experienceYears: {
    type: Number,
    default: 2.5
  },
  leaveBalances: {
    casualLeave: { type: Number, default: 12 },
    casualLeaveUsed: { type: Number, default: 4 },
    sickLeave: { type: Number, default: 6 },
    sickLeaveUsed: { type: Number, default: 2 },
    earnedLeave: { type: Number, default: 15 },
    earnedLeaveUsed: { type: Number, default: 8 },
    compOff: { type: Number, default: 3 },
    compOffUsed: { type: Number, default: 1 }
  },
  punctualityScore: {
    type: Number,
    default: 85 // Percentage
  },
  riskCategory: {
    type: String,
    enum: ['Low Risk', 'Medium Risk', 'High Risk'],
    default: 'Low Risk'
  }
}, {
  timestamps: true
});

userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
