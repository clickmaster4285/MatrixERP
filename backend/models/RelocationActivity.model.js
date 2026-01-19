// RelocationActivity.model.js
const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
   street: String,
   city: String,
   state: String,
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
   // Add tracking fields
   addedBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
   addedAt: { type: Date, default: Date.now },
   workType: String, // 'surveyWork', 'civilWork', 'dismantlingWork', etc.
   siteType: String, // 'sourceSite' or 'destinationSite'
}, { _id: false });

const UserAssignmentSchema = new mongoose.Schema({
   userId: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
   role: String,
   assignedDate: { type: Date, default: Date.now },
}, { _id: false });

// REUSABLE SITE CONFIG (sourceSite & destinationSite ke liye)
const SiteConfigSchema = new mongoose.Schema({
   siteRequired: { type: Boolean, default: true, },
   operatorName: String, // no
   siteStatus: { type: String, enum: ['not-started', 'in-progress', 'completed'], default: 'not-started', },
   address: AddressSchema,

   workTypes: [{
      type: String, 
      enum: ['civil', 'te', 'material', 'survey', 'dismantling', 'store_operator', 'telecom',], 
      default: [],
   },],

   // Work Details
   civilWork: {
      status: String,
      assignedUsers: [UserAssignmentSchema],
      materials: [MaterialSchema],
      notes: String,
      addAttachments: [String],
   },
   telecomWork: {
      status: String,
      assignedUsers: [UserAssignmentSchema],
      materials: [MaterialSchema],
      notes: String,
      addAttachments: [String],
      //check the list of material from the store, if available on site
   },
   surveyWork: {
      status: String,
      assignedUsers: [UserAssignmentSchema],
      materials: [MaterialSchema],
      conductedBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
      surveyType: String,
      notes: String,
      addAttachments: [String],
   },
   dismantlingWork: {
      status: String,
      assignedUsers: [UserAssignmentSchema],
      materials: [MaterialSchema],
      conductedBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
      notes: String,
      addAttachments: [String],
      //had any things damage uplaod by surveryors  user _id
   },
   storeOperatorWork: {
      status: String,
      assignedUsers: [UserAssignmentSchema],
      materials: [MaterialSchema],
      conductedBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
      notes: String,
      addAttachments: [String],
      //gonna check all the material list uplaod by suryour if not then check the desmentelling material list
   },
});

const RelocationActivitySchema = new mongoose.Schema({
   // Main Parent Site ID (tera original wala)
   siteId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Site',
      required: true
   },

   relocationType: {
      type: String,
      enum: ['B2S', 'OMO', 'StandAlone', 'Custom'],
      required: true
   },

   overallStatus: {
      type: String,
      enum: ['draft', 'active', 'completed'],
      default: 'draft'
   },

   // Source & Destination — NO siteId inside
   sourceSite: SiteConfigSchema,
   destinationSite: SiteConfigSchema,

   materials: [MaterialSchema],
   notes: String,

   createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
   },
   updatedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
   },
   isDeleted: { type: Boolean, default: false },
   deletionDate: Date,
   deletedBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
   deletionReason: String
}, {
   timestamps: true
});

// Validation: At least one site must be active
RelocationActivitySchema.pre('save', function (next) {
   const sourceActive = this.sourceSite?.siteRequired !== false;
   const destActive = this.destinationSite?.siteRequired !== false;

   if (!sourceActive && !destActive) {
      return next(new Error('At least one of Source or Destination site must be active'));
   }
   next();
});
// RelocationActivitySchema.set('strictPopulate', false);
module.exports = mongoose.model('RelocationActivity', RelocationActivitySchema);