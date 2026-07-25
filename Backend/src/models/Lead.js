const mongoose = require('mongoose');
const { LEAD_STATUSES } = require('../constants');

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 255,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 40,
      default: '',
    },
    company: {
      type: String,
      trim: true,
      maxlength: 120,
      default: '',
    },
    source: {
      type: String,
      trim: true,
      maxlength: 80,
      default: 'website',
    },
    status: {
      type: String,
      enum: LEAD_STATUSES,
      default: 'new',
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

leadSchema.index({ name: 'text', email: 'text', company: 'text' });

module.exports = mongoose.model('Lead', leadSchema);
