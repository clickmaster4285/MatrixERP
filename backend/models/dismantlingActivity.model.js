// DismantlingActivity.model.js - Specific for dismantling operations
const mongoose = require('mongoose');

const dismantlingActivitySchema = new mongoose.Schema(
  {
    // Basic Information
    site: { type: mongoose.Schema.ObjectId, ref: 'Site', required: true },
    dismantlingType: {
      type: String,
      enum: ['B2S', 'StandAlone', 'OMO'],
      required: true,
    },

    location: [
      {
        state: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
      },
    ],

    // Assignment
    assignment: {
      assignedTo: [
        { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
      ],
      assignedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
      },
      assignedDate: { type: Date, default: Date.now },
      status: {
        type: String,
        enum: [
          'assigned',
          'in-progress',
          'surveying',
          'dismantling',
          'dispatching',
          'completed',
          'on-hold',
        ],
        default: 'assigned',
      },
    },

    assignActivityTasks: {
      // SURVEY
      assignSurveyTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

      assignedSurveyDate: { type: Date, default: Date.now },
      surveyDueDate: { type: Date },

      // DISMANTLING
      assignDismantlingTo: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      ],
      assignedDismantlingDate: { type: Date, default: Date.now },
      dismantlingDueDate: { type: Date },

      // STORE
      assignStoreTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      assignedStoreDate: { type: Date, default: Date.now },
      storeDueDate: { type: Date },

      // META
      assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },

    // Survey Phase
    survey: {
      addAttachments: [String], // URLs of uploaded photos
      conductedBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
      surveyDate: Date,
      materials: [
        {
          materialId: { type: String },
          name: String,
          quantity: Number,
          unit: String,
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

           addedBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
          addedAt: { type: Date, default: Date.now },
            
          canBeReused: Boolean,
          notes: String,
        },
      ],
      report: String,
      status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed'],
        default: 'pending',
      },
    },

    // Dismantling Phase
    dismantling: {
      startDate: Date,
      endDate: Date,
      addAttachments: [String],
      conductedBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
      // teamLeader: { type: mongoose.Schema.ObjectId, ref: 'User' },
      // teamMembers: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
      materials: [
        {
          materialId: { type: String },
          name: String,
          quantityDismantled: Number,
          conditionAfterDismantling: String,
          conditionBreakdown: {
            excellent: { type: Number, default: 0, min: 0 },
            good: { type: Number, default: 0, min: 0 },
            fair: { type: Number, default: 0, min: 0 },
            poor: { type: Number, default: 0, min: 0 },
            scrap: { type: Number, default: 0, min: 0 },
          },

            addedBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
             addedAt: { type: Date, default: Date.now },

          damageNotes: String,
          dismantlingDate: Date,
        },
      ],
      issuesEncountered: String,

      status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed'],
        default: 'pending',
      },
    },

    // Dispatch/Storage Phase/location storage
    dispatch: {
      destinationDetails: String,
      dispatchDate: Date,
      conductedBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
      materials: [
        {
          materialId: { type: String },
          name: String,
          quantity: Number,
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

            addedBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
             addedAt: { type: Date, default: Date.now },
          canBeReused: Boolean,
          notes: String,
        },
      ],
      receiverName: String,
      destinationlocation: {
        type: String,
        enum: ['own-store', 'ufone', 'ptcl', 'zong', 'other'],
      },
      status: {
        type: String,
        enum: ['pending', 'in-transit', 'in-progress', 'received', 'completed'],
        default: 'pending',
      },
      addAttachments: [String],
    },

    // Documentation
    documents: [
      {
        documentType: {
          type: String,
          enum: [
            'survey-report',
            'dismantling-report',
            'dispatch-note',
            'receipt',
            'other',
          ],
        },
        documentName: String,
        fileUrl: String,
        uploadedBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
        uploadDate: { type: Date, default: Date.now },
      },
    ],

    // Timeline
    timeline: {
      plannedStartDate: Date,
      plannedEndDate: Date,
      actualStartDate: Date,
      actualEndDate: Date,
      surveyCompletionDate: Date,
      dismantlingCompletionDate: Date,
      dispatchCompletionDate: Date,
    },

    // Overall Status
    status: {
      type: String,
      enum: [
        'planned',
        'in-progress',
        'surveying',
        'dismantling',
        'dispatching',
        'completed',
        'on-hold',
      ],
      default: 'planned',
    },
    completionPercentage: { type: Number, min: 0, max: 100, default: 0 },

    // Audit Fields
    notes: String,
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
    deletedBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
  }
);

// Indexes
dismantlingActivitySchema.index({ site: 1, isDeleted: 1 });
dismantlingActivitySchema.index({ status: 1 });
dismantlingActivitySchema.index({ 'assignment.assignedTo': 1 });

// Query middleware
dismantlingActivitySchema.pre(/^find/, function (next) {
  if (this.getFilter().isDeleted === undefined) {
    this.where({ isDeleted: false });
  }
  next();
});

// Auto-calculate completion percentage
dismantlingActivitySchema.methods.calculateCompletion = function () {
  let totalWeight = 0;
  let completedWeight = 0;

  // Survey phase weight: 30%
  totalWeight += 30;
  if (this.survey.status === 'completed') completedWeight += 30;

  // Dismantling phase weight: 40%
  totalWeight += 40;
  if (this.dismantling.status === 'completed') completedWeight += 40;

  // Dispatch phase weight: 30%
  totalWeight += 30;
  if (this.dispatch.status === 'completed') completedWeight += 30;

  this.completionPercentage =
    totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
};

// Update overall status based on phase statuses
dismantlingActivitySchema.methods.updateStatus = function () {
  if (this.dispatch.status === 'completed') {
    // Overall process done
    this.status = 'completed';
    this.assignment.status = 'completed';
  } else if (this.dismantling.status === 'completed') {
    // Dismantling done, now moving to dispatch phase
    this.status = 'dispatching';
    this.assignment.status = 'dispatching';
  } else if (this.survey.status === 'completed') {
    // Survey done, now in dismantling phase
    this.status = 'dismantling';
    this.assignment.status = 'dismantling';
  } else if (this.survey.status === 'in-progress') {
    // Actively surveying
    this.status = 'surveying';
    this.assignment.status = 'surveying';
  } else {
    // Fallback: still assigned but not started
    this.status = this.status || 'planned';
    this.assignment.status = this.assignment.status || 'assigned';
  }
};

// Pre-save middleware
dismantlingActivitySchema.pre('save', function () {
  if (!this.isDeleted) {
    this.calculateCompletion();
    this.updateStatus();
  }
});

module.exports = mongoose.model(
  'DismantlingActivity',
  dismantlingActivitySchema
);