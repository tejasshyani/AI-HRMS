const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Holiday title is required'],
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  dateStr: {
    type: String, // "YYYY-MM-DD"
    required: true
  },
  isRecurring: {
    type: Boolean,
    default: true
  },
  category: {
    type: String,
    enum: ['National Holiday', 'Public Holiday', 'Company Holiday', 'Observance'],
    default: 'Public Holiday'
  },
  description: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

holidaySchema.index({ dateStr: 1 });
holidaySchema.index({ isRecurring: 1 });

module.exports = mongoose.model('Holiday', holidaySchema);
