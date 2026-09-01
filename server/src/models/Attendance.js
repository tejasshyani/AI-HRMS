const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  dateStr: {
    type: String, // "YYYY-MM-DD" for rapid querying and indexing
    required: true
  },
  checkInTime: {
    type: String,
    default: ''
  },
  checkOutTime: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Present', 'Half-Day', 'Leave', 'Absent'],
    default: 'Present'
  },
  remarks: {
    type: String,
    default: ''
  },
  breakMinutes: {
    type: Number,
    default: 15
  },
  overtimeHours: {
    type: Number,
    default: 0
  },
  loggedBy: {
    type: String,
    enum: ['Self', 'Admin', 'System'],
    default: 'Self'
  }
}, {
  timestamps: true
});

attendanceSchema.index({ userId: 1, dateStr: 1 }, { unique: true });
attendanceSchema.index({ dateStr: 1 });
attendanceSchema.index({ userId: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
