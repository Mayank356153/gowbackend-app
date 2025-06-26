const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  label: {
    type: String,           // e.g. "Home", "Work"
    trim: true
  },
  street:    { type: String, required: true, trim: true },
  area:      { type: String, trim: true },
  city:      { type: String, required: true, trim: true },
  state:     { type: String, required: true, trim: true },
  country:   { type: String, required: true, trim: true },
  postalCode:{ type: String, required: true, trim: true },
  isDefault: { type: Boolean, default: false }
}, {
  timestamps: true
});

module.exports = mongoose.model('Address', addressSchema);
