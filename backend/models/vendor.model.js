// models/Vendor.model.js
const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    vendorCode: {
      type: String,
      trim: true,
      uppercase: true,
      // unique: true,
      // sparse: true, // allow null/undefined but keep unique when present
    },

    type: {
      type: String,
      enum: ['supplier', 'contractor', 'manufacturer', 'distributor', 'other'],
      default: 'supplier',
    },

    contactPerson: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    country: { type: String, trim: true },

    taxNumber: { type: String, trim: true },
    registrationNumber: { type: String, trim: true },

    notes: { type: String, trim: true },

    createdBy: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.ObjectId, ref: 'User' },

    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
    deletedBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

vendorSchema.index({ name: 1 });


module.exports = mongoose.model('Vendor', vendorSchema);
