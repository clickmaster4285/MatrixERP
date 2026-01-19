// 2. Site.model.js - Simplified main site model
const mongoose = require('mongoose');

const siteSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  siteId: { type: String, unique: true, required: true },
  region: { type: String, required: true },
  project: { type: mongoose.Schema.ObjectId, ref: 'Project', required: true },
  siteManager: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  // activities: [{ type: mongoose.Schema.ObjectId, ref: 'Activity' }],
  // we have add the new activities , this was the old and not wokring but now we have update things , 
  overallStatus: { type: String, enum: ['planned', 'in-progress', 'completed'], default: 'planned' },
  notes: { type: String},
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
  deletedBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

// Add indexes
siteSchema.index({ isDeleted: 1 });
siteSchema.index({ project: 1, isDeleted: 1 });
siteSchema.index({ siteId: 1, isDeleted: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });

// Query middleware to exclude deleted documents by default
siteSchema.pre(/^find/, function (next) {
  if (this.getFilter().isDeleted === undefined) {
    this.where({ isDeleted: false });
  }
  next();
});

siteSchema.pre('save', function () {
  if (!this.isDeleted) {
  }
});

module.exports = mongoose.model('Site', siteSchema);