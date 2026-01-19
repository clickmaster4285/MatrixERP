const mongoose = require('mongoose');

const RequestMaterialSchema = new mongoose.Schema(
  {
    materialCode: { type: String, required: true },
    name: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    unit: { type: String, default: 'pcs' },
    condition: { type: String, default: 'good' },
    notes: { type: String },
  },
  { _id: false }
);

const InventoryAllocationRequestSchema = new mongoose.Schema(
  {
    activityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    activityType: { type: String, required: true, index: true },
    activityName: { type: String },

    phase: { type: String, required: true }, // sourceSite / destinationSite
    subPhase: { type: String, required: true }, // civilWork / telecomWork etc

    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    requestedAt: { type: Date, default: Date.now },

    materials: { type: [RequestMaterialSchema], default: [] },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
      index: true,
    },

    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    decisionNote: { type: String },

    // ✅ This makes it “update same request on updates”
    requestKey: { type: String, unique: true, index: true },

    // Optional (you DO have siteId in response, so keep it)
    siteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Site' },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  'InventoryAllocationRequest',
  InventoryAllocationRequestSchema
);
