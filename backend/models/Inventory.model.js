// models/Inventory.model.js
const mongoose = require('mongoose');

const sourceHistorySchema = new mongoose.Schema(
  {
    activityId: { type: mongoose.Schema.ObjectId, required: true },
    activityType: { type: String, required: true },
    activityName: { type: String },
    phase: { type: String },     // sourceSite / destinationSite / survey etc
    subPhase: { type: String },  // surveyWork etc
    quantity: { type: Number, required: true },
    condition: { type: String, default: 'good' },
    unit: { type: String, default: 'pcs' },
    activityLocation: { type: String },
    addedBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const inventorySchema = new mongoose.Schema(
  {
    materialCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    materialName: {
      type: String,
      required: true,
      trim: true,
    },
    category: { type: String, default: 'others' },

    // Location
    location: { type: String, default: 'global' }, // keep it always filled
    locationName: String,

    totalQuantity: { type: Number, required: true, min: 0, default: 0 },
    availableQuantity: { type: Number, required: true, min: 0, default: 0 },
    allocatedQuantity: { type: Number, min: 0, default: 0 },

    unit: { type: String, default: 'pcs' },
    pricePerUnit: { type: String },

    conditionBreakdown: {
      excellent: { type: Number, default: 0 },
      good: { type: Number, default: 0 },
      fair: { type: Number, default: 0 },
      poor: { type: Number, default: 0 },
      scrap: { type: Number, default: 0 },
    },

    vendor: { type: mongoose.Schema.ObjectId, ref: 'Vendor' },
    specifications: { type: Map, of: String, default: {} },

    sourceActivity: {
      activityId: mongoose.Schema.ObjectId,
      activityType: { type: String },
      activityName: String,
    },

    // ✅ NEW: history of additions per activity
    sourceHistory: { type: [sourceHistorySchema], default: [] },

    activityAllocations: [
      {
        activityId: mongoose.Schema.ObjectId,
        activityType: { type: String },
        quantity: Number,
        allocatedDate: Date,
        status: { type: String, default: 'allocated' },
        returnCondition: String,
        returnDate: Date,
      },
    ],

    createdBy: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false },
    lastUpdatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// ✅ FIX: inventory is location-based so index must be compound
inventorySchema.index(
  { materialCode: 1 },
  { unique: true }
);

inventorySchema.index({ sourceActivity: 1 });

module.exports = mongoose.model('Inventory', inventorySchema);
