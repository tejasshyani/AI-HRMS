const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  month: {
    type: Number, // 1 - 12
    required: true
  },
  year: {
    type: Number, // e.g. 2026
    required: true
  },
  monthName: {
    type: String, // e.g. "January 2026"
    default: ''
  },
  totalCalendarDays: {
    type: Number,
    required: true
  },
  totalSundays: {
    type: Number,
    required: true
  },
  totalWorkingDays: {
    type: Number, // Standard Working Days = Total Days in Month - Total Sundays
    required: true
  },
  presentDays: {
    type: Number,
    default: 0
  },
  halfDays: {
    type: Number,
    default: 0
  },
  paidHolidays: {
    type: Number,
    default: 0
  },
  paidLeaves: {
    type: Number,
    default: 0
  },
  unpaidLeaves: {
    type: Number,
    default: 0
  },
  payableDays: {
    type: Number, // Days Present + (0.5 * Half-Days) + Paid Holidays + Paid Leaves
    required: true
  },
  baseSalary: {
    type: Number,
    required: true
  },
  perDayRate: {
    type: Number, // Base Monthly Salary / Standard Working Days
    required: true
  },
  grossPay: {
    type: Number,
    required: true
  },
  allowances: {
    hra: { type: Number, default: 0 },
    specialAllowance: { type: Number, default: 0 },
    transport: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  deductions: {
    pf: { type: Number, default: 0 },
    pt: { type: Number, default: 0 }, // Professional Tax
    tds: { type: Number, default: 0 }, // Tax Deducted at Source
    lwf: { type: Number, default: 0 }, // Labour Welfare Fund
    esic: { type: Number, default: 0 },
    unpaidLeaveDeduction: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  netSalary: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Draft', 'Generated', 'Paid'],
    default: 'Generated'
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  paidAt: {
    type: Date
  },
  paymentDateStr: {
    type: String,
    default: ''
  },
  remarks: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

payrollSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });
payrollSchema.index({ month: 1, year: 1 });

module.exports = mongoose.model('Payroll', payrollSchema);
