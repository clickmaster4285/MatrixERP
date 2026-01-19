// 4. Project.model.js - Simplified
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String },
  manager: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  sites: [{ type: mongoose.Schema.ObjectId, ref: 'Site' }],
  status: { type: String, enum: ['planning', 'active', 'completed', 'cancelled'], default: 'planning' },
  timeline: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    actualStart: Date,
    actualEnd: Date
  },
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
  deletedBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.ObjectId, ref: 'User', required: true }
},
  {
    timestamps: true
  });

// Add indexes for soft delete queries
projectSchema.index({ isDeleted: 1 });
projectSchema.index({ manager: 1, isDeleted: 1 });

// Query middleware to exclude deleted documents by default
projectSchema.pre(/^find/, function (next) {
  if (this.getFilter().isDeleted === undefined) {
    this.where({ isDeleted: false });
  }
  next();
});

// Auto-update project status based on site progress
projectSchema.methods.updateProjectStatus = async function () {
  if (this.isDeleted) return; // Don't update if deleted

  const sites = await mongoose.model('Site').find({
    _id: { $in: this.sites },
    isDeleted: false
  });

  if (sites.length === 0) {
    this.status = 'planning';
    return;
  }

  const allCompleted = sites.every(site => site.overallStatus === 'completed');
  const anyInProgress = sites.some(site => site.overallStatus === 'in-progress');

  if (allCompleted) {
    this.status = 'completed';
    this.timeline.actualEnd = new Date();
  } else if (anyInProgress) {
    this.status = 'active';
    if (!this.timeline.actualStart) {
      this.timeline.actualStart = new Date();
    }
  }
};

projectSchema.pre('save', function () {
  if (!this.isDeleted) {
    this.updateProjectStatus();
  }
});

module.exports = mongoose.model('Project', projectSchema);