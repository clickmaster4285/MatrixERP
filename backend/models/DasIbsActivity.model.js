// DasIbsActivity.model.js
const mongoose = require('mongoose');

// ==================== REUSABLE SCHEMAS ====================
const AddressSchema = new mongoose.Schema(
  {
    street: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
  },
  { _id: false }
);

// ==================== MATERIAL SCHEMA ====================
const MaterialSchema = new mongoose.Schema(
  {
    materialCode: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unit: {
      type: String,
      enum: ['pcs', 'meters', 'kg', 'liters', 'set', 'roll', 'box'],
      required: true,
    },

    condition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor', 'scrap', 'new', 'used'],
      default: 'good',
    },

    canBeReused: { type: Boolean, default: true },

    source: {
      type: String,
      enum: ['existing-on-site', 'to-be-procured', 'from-survey', 'from-store'],
      default: 'to-be-procured',
    },

    addedBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
    addedAt: { type: Date, default: Date.now },

    uploadSource: {
      type: String,
      enum: ['survey', 'civil', 'installation', 'testing', 'manual'],
      default: 'survey',
    },

    installationDate: Date,
    installedBy: { type: mongoose.Schema.ObjectId, ref: 'User' },

    notes: String,
  },
  { _id: false }
);

// ==================== OTHER SUB SCHEMAS ====================
const UserAssignmentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    role: String,
    assignedDate: { type: Date, default: Date.now },
  },
  { _id: false }
);

const SignalMeasurementSchema = new mongoose.Schema(
  {
    rsrp: Number,
    rsrq: Number,
    sinr: Number,
    rssi: Number,
    measuredAt: { type: Date, default: Date.now },
    location: String,
    operator: String,
  },
  { _id: false }
);

// ==================== WORK SECTION ====================
const WorkSectionSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['not-started', 'in-progress', 'completed', 'on-hold'],
      default: 'not-started',
    },

    // ✅ no default [] stored
    assignedUsers: { type: [UserAssignmentSchema], default: undefined },

    startDate: Date,
    completionDate: Date,

    materials: {
      // ✅ no default [] stored
      uploadedList: { type: [MaterialSchema], default: undefined },

      approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'materials-under-review'],
        default: 'pending',
      },
      reviewNotes: String,

      totalItems: { type: Number, default: 0 },

      procurementStatus: {
        type: String,
        enum: [
          'not-started',
          'in-progress',
          'partially-received',
          'fully-received',
        ],
        default: 'not-started',
      },

      // ✅ no default [] stored
      materialListAttachments: { type: [String], default: undefined },
    },

    notes: String,

    // ✅ no default [] stored
    addAttachments: { type: [String], default: undefined },

    conductedBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
  },
  { _id: false }
);

// ==================== IBS REQUIREMENTS (PER SITE) ====================
const IbsRequirementsSchema = new mongoose.Schema(
  {
    isRequired: { type: Boolean, default: false },

    buildingName: String,
    floorCount: Number,

    // ✅ no default [] stored
    floorPlans: { type: [String], default: undefined },

    coverageZones: {
      type: [
        {
          zoneName: String,
          floor: Number,
        },
      ],
      default: undefined,
    },

    notes: String,

    assignedTo: { type: mongoose.Schema.ObjectId, ref: 'User' },
    assignedBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
    assignedDate: Date,

    status: {
      type: String,
      enum: ['not-started', 'in-progress', 'completed'],
      default: 'not-started',
    },
  },
  { _id: false }
);

// ==================== SITE CONFIG ====================
const SiteConfigSchema = new mongoose.Schema(
  {
    siteType: {
      type: String,
      enum: ['survey', 'destination', 'indoor-building'],
      default: 'survey',
    },

    // ✅ optional subdoc should not appear unless provided
    address: { type: AddressSchema, default: undefined },

    surveyWork: { type: WorkSectionSchema, default: undefined },
    ibsRequirements: { type: IbsRequirementsSchema, default: undefined },

    civilWork: { type: WorkSectionSchema, default: undefined },
    telecomWork: { type: WorkSectionSchema, default: undefined },
    installationWork: { type: WorkSectionSchema, default: undefined },
    testingWork: { type: WorkSectionSchema, default: undefined },
  },
  { _id: false }
);

// ==================== PRE WALK TEST ====================
const PreWalkTestSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending',
    },
    assignedTo: { type: mongoose.Schema.ObjectId, ref: 'User' },
    assignedBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
    assignedDate: Date,
    testDate: Date,
    notes: String,

    // ✅ no default [] stored
    addAttachments: { type: [String], default: undefined },
  },
  { _id: false }
);

// ==================== MAIN SCHEMA ====================
const DasIbsActivitySchema = new mongoose.Schema(
  {
    site: {
      type: mongoose.Schema.ObjectId,
      ref: 'Site',
      required: true,
    },

    siteType: {
      type: String,
      enum: ['DAS', 'IBS'],
      required: true,
    },

    // ✅ Optional at creation time (and stays absent unless provided)
    sourceSite: { type: SiteConfigSchema, default: undefined },
    destinationSite: { type: SiteConfigSchema, default: undefined },

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
      dueDate: Date,
    },

 

    // ✅ Optional
    surveyMeasurements: {
      type: {
        signalTests: { type: [SignalMeasurementSchema], default: undefined },
        powerAvailability: {
          type: String,
          enum: ['available', 'partial', 'not-available'],
        },
      },
      default: undefined,
    },

    // ✅ Optional
    preWalkTest: { type: PreWalkTestSchema, default: undefined },

    // ✅ Optional
    documents: {
      type: [
        {
          docType: {
            type: String,
            enum: [
              'survey-report',
              'test-report',
              'design-doc',
              'boq',
              'other',
            ],
          },
          docName: String,
          fileUrl: String,
          uploadedBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
          uploadDate: { type: Date, default: Date.now },
        },
      ],
      default: undefined,
    },

    overallStatus: {
      type: String,
      enum: [
        'draft',
        'survey-assigned',
        'survey-in-progress',
        'survey-completed',
        'materials-uploaded',
        'materials-under-review',
        'materials-approved',
        'handover-completed',
        'cancelled',
      ],
      default: 'draft',
    },

    completionPercentage: { type: Number, default: 0 },

    notes: String,

    createdBy: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.ObjectId, ref: 'User' },

    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
    deletedBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
  },
  { timestamps: true, minimize: true }
);

// ==================== INDEXES ====================
DasIbsActivitySchema.index({ site: 1, isDeleted: 1 });
DasIbsActivitySchema.index({ overallStatus: 1 });
DasIbsActivitySchema.index({ 'assignment.assignedTo': 1 });

// ==================== FIND MIDDLEWARE (ONE ONLY) ====================
DasIbsActivitySchema.pre(/^find/, function (next) {
  if (this.getOptions()?.includeDeleted) return next();
  if (this.getFilter().isDeleted === undefined) {
    this.where({ isDeleted: false });
  }
  next();
});

// ==================== SAVE MIDDLEWARE (ONE ONLY) ====================
DasIbsActivitySchema.pre('save', function (next) {
  // enforce correct siteType labels only if those objects exist
  if (this.sourceSite) this.sourceSite.siteType = 'survey';

  if (this.destinationSite) {
    this.destinationSite.siteType =
      this.siteType === 'DAS' ? 'destination' : 'indoor-building';
  }

  // only aggregate if master list exists or sites exist
  if (this.sourceSite || this.destinationSite) {
 
    this.aggregateSurveyMaterials();
  }

  next();
});

// ==================== METHODS ====================
DasIbsActivitySchema.methods.aggregateSurveyMaterials = function () {
  const list = [];

  if (this.sourceSite?.surveyWork?.materials?.uploadedList?.length) {
    list.push(...this.sourceSite.surveyWork.materials.uploadedList);
  }

  if (this.destinationSite?.surveyWork?.materials?.uploadedList?.length) {
    list.push(...this.destinationSite.surveyWork.materials.uploadedList);
  }

  if (!list.length) return;

  
};

DasIbsActivitySchema.methods.uploadSurveyMaterials = function (
  materials,
  userId,
  target = 'destination' // 'source' | 'destination'
) {
  const site = target === 'source' ? this.sourceSite : this.destinationSite;
  if (!site) throw new Error('Site not found');

  site.surveyWork ||= {};
  site.surveyWork.materials ||= {};
  site.surveyWork.materials.uploadedList ||= [];

  const mapped = materials.map((m) => ({
    ...m,
    addedBy: userId,
    addedAt: new Date(),
  }));

  site.surveyWork.materials.uploadedList.push(...mapped);
  site.surveyWork.materials.totalItems =
    site.surveyWork.materials.uploadedList.length;

  this.overallStatus = 'materials-uploaded';
  return mapped;
};



// ==================== EXPORT ====================
module.exports = mongoose.model('DasIbsActivity', DasIbsActivitySchema);
