// COWActivity.model.js
const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
   street: String,
   city: String,
   state: String,
}, { _id: false });

const UserAssignmentSchema = new mongoose.Schema({
   userId: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
   role: String,
   assignedDate: { type: Date, default: Date.now },
}, { _id: false });

const MaterialSchema = new mongoose.Schema({
   materialCode: String,
   name: String,
   quantity: Number,
   unit: String,
   notes: String,
   condition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor', 'scrap'],
   },
    conditionBreakdown: {
      excellent: { type: Number, default: 0, min: 0 },
      good: { type: Number, default: 0, min: 0 },
      fair: { type: Number, default: 0, min: 0 },
      poor: { type: Number, default: 0, min: 0 },
      scrap: { type: Number, default: 0, min: 0 },
   },
    
   

   canBeReused: Boolean,
   addedBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
   addedAt: { type: Date, default: Date.now },
   workType: String,
   siteType: String,


 takenFrom: { type: String, default: 'own-store', trim: true },
  takenFromCustom: { type: String, trim: true },
   receipts: { type: [String], default: [] },
  
   

}, { _id: false });

const LocationSchema = new mongoose.Schema({
   address: AddressSchema,
   type: {
      type: String,
      enum: ['source', 'destination', 'storage', 'other'],
   },
}, { _id: false });

// ========== WORK TYPE SCHEMAS ==========
const SurveyWorkSchema = new mongoose.Schema({
   status: {
      type: String,
      enum: ['not-started', 'in-progress', 'completed'],
      default: 'not-started'
   },
   assignedUsers: [UserAssignmentSchema],
   materials: [MaterialSchema],
   notes: String,
   attachments: [String],
   startTime: Date,
   endTime: Date,
}, { _id: false });

const InventoryWorkSchema = new mongoose.Schema({
   status: {
      type: String,
      enum: ['not-started', 'in-progress', 'completed'],
      default: 'not-started'
   },
   assignedUsers: [UserAssignmentSchema],
   materials: [MaterialSchema],
   notes: String,
   attachments: [String],
   startTime: Date,
   endTime: Date,
}, { _id: false });

const TransportationWorkSchema = new mongoose.Schema({
   status: {
      type: String,
      enum: ['not-started', 'loading', 'in-transit', 'unloading', 'completed'],
      default: 'not-started'
   },
   assignedUsers: [UserAssignmentSchema],
   // materials: [MaterialSchema],
   notes: String,
   attachments: [String],
   vehicleNumber: String,
   driverName: String,
   driverContact: String,
   startTime: Date,
   endTime: Date,
}, { _id: false });

const InstallationWorkSchema = new mongoose.Schema({
   status: {
      type: String,
      enum: ['not-started', 'in-progress', 'completed'],
      default: 'not-started'
   },
   assignedUsers: [UserAssignmentSchema],
   // materials: [MaterialSchema],
   notes: String,
   attachments: [String],
   startTime: Date,
   endTime: Date,
}, { _id: false });

// ========== SITE CONFIG SCHEMA ==========
const SiteConfigSchema = new mongoose.Schema({
   location: LocationSchema,
   workTypes: [{
      type: String,
      enum: ['survey', 'inventory', 'transportation', 'installation', 'integration'],
   }],
   surveyWork: SurveyWorkSchema,
   inventoryWork: InventoryWorkSchema,
   transportationWork: TransportationWorkSchema,
   installationWork: InstallationWorkSchema,
   
   siteStatus: {
      type: String,
      enum: ['not-started', 'in-progress', 'completed'],
      default: 'not-started'
   },
}, { _id: false });

// ========== MAIN COW ACTIVITY SCHEMA ==========
const COWActivitySchema = new mongoose.Schema({
   activityName: {
      type: String,
      required: true,
      trim: true
   },
   siteId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Site',
      required: true
   },
   purpose: {
      type: String,
      enum: ['event-coverage', 'disaster-recovery', 'network-expansion', 'maintenance', 'testing', 'other'],
      required: true
   },
   description: String,
   plannedStartDate: Date,
   plannedEndDate: Date,
   actualStartDate: Date,
   actualEndDate: Date,
   sourceSite: SiteConfigSchema,
   destinationSite: SiteConfigSchema,
   overallStatus: {
      type: String,
      enum: ['planned', 'in-progress', 'completed', 'cancelled', 'on-hold'],
      default: 'planned'
   },
   teamMembers: [UserAssignmentSchema],
   notes: String,
   createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
   },
   updatedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
   },
   isDeleted: { type: Boolean, default: false },
}, {
   timestamps: true
});

// ========== INDEXES ==========
// Fixed: Changed parentSiteId to siteId
COWActivitySchema.index({ siteId: 1 });
COWActivitySchema.index({ overallStatus: 1 });
COWActivitySchema.index({ plannedStartDate: 1 });
COWActivitySchema.index({ purpose: 1 });
COWActivitySchema.index({ isDeleted: 1 });

// ========== MIDDLEWARE ==========

COWActivitySchema.pre(/^find/, function (next) {
   if (this.getFilter().isDeleted === undefined) {
      this.where({ isDeleted: false });
   }
   next();
});

// Status calculation middleware
COWActivitySchema.pre('save', function (next) {
   if (this.isDeleted) return next();

   let totalWorkItems = 0;
   let completedWorkItems = 0;

   // Check both sites
   const sites = [];
   if (this.sourceSite) sites.push(this.sourceSite);
   if (this.destinationSite) sites.push(this.destinationSite);

   sites.forEach(site => {
      const workTypes = site.workTypes || [];
      totalWorkItems += workTypes.length;

      workTypes.forEach(workType => {
         const work = site[`${workType}Work`];
         if (work && work.status === 'completed') {
            completedWorkItems++;
         }
      });

      // Update site status
      if (workTypes.length > 0) {
         if (completedWorkItems === totalWorkItems) {
            site.siteStatus = 'completed';
         } else if (completedWorkItems > 0) {
            site.siteStatus = 'in-progress';
         } else {
            site.siteStatus = 'not-started';
         }
      }
   });

   // Update overall status
   if (totalWorkItems > 0) {
      const completionPercentage = Math.round((completedWorkItems / totalWorkItems) * 100);
      if (completionPercentage === 100) {
         this.overallStatus = 'completed';
      } else if (completionPercentage > 0) {
         this.overallStatus = 'in-progress';
      } else {
         this.overallStatus = 'planned';
      }
   }

   next();
});

module.exports = mongoose.model('COWActivity', COWActivitySchema);