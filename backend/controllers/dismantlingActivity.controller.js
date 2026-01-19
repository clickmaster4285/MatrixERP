// controllers/dismantlingActivity.controller.js
const mongoose = require('mongoose');
const asyncHandler = require('../middlewares/asyncHandler.middleware');
const DismantlingActivity = require('../models/dismantlingActivity.model');
// Helper: build filters for list endpoint
const buildFilters = (query) => {
  const filters = {};

  if (query.status) {
    filters.status = query.status;
  }

  if (query.dismantlingType) {
    filters.dismantlingType = query.dismantlingType;
  }

  if (query.site) {
    filters.site = query.site;
  }

  if (query.assignmentStatus) {
    filters['assignment.status'] = query.assignmentStatus;
  }

  return filters;
};

// Helper: validate location array
const validateLocationArray = (location) => {
  if (!Array.isArray(location) || location.length === 0) {
    return 'At least one location entry is required';
  }

  for (let i = 0; i < location.length; i++) {
    const loc = location[i] || {};
    if (!loc.state || !loc.address || !loc.city) {
      return `Location entry ${i + 1} must include state, address, and city`;
    }
  }

  return null;
};

const safeParseJSON = (value, fallback) => {
  if (!value) return fallback;
  if (typeof value === 'object') return value; // already parsed
  try {
    return JSON.parse(value);
  } catch (err) {
    return fallback;
  }
};

exports.createDismantlingActivity = asyncHandler(async (req, res, next) => {
  // 🔹 Raw values from form-data
  const {
    site,
    dismantlingType,
    assignment: assignmentRaw,
    assignActivityTasks: assignActivityTasksRaw,
    survey: surveyRaw,
    dismantling: dismantlingRaw,
    dispatch: dispatchRaw,
    documents: documentsRaw,
    timeline: timelineRaw,
    notes,
    location: locationRaw,
    attachmentTarget,
    materialIndex,
  } = req.body;

  // 🔹 Files from multer
  const uploadedAttachments = Array.isArray(req.files)
    ? req.files.map((file) => `/uploads/attachments/${file.filename}`)
    : [];

  // 🔹 Parse JSON fields
  const assignment = safeParseJSON(assignmentRaw, null);
  const assignActivityTasks = safeParseJSON(assignActivityTasksRaw, null);
  const survey = safeParseJSON(surveyRaw, {});
  const dismantling = safeParseJSON(dismantlingRaw, {});
  const dispatch = safeParseJSON(dispatchRaw, {});
  const documents = safeParseJSON(documentsRaw, []);
  const timeline = safeParseJSON(timelineRaw, {});
  const location = safeParseJSON(locationRaw, []);

  // 🔹 Basic validations
  if (!site || !dismantlingType) {
    return res.status(400).json({
      success: false,
      message: 'Site and dismantling type are required',
    });
  }

  if (
    !assignment ||
    !Array.isArray(assignment.assignedTo) ||
    assignment.assignedTo.length === 0
  ) {
    return res.status(400).json({
      success: false,
      message: 'At least one assignedTo user is required',
    });
  }

  if (!mongoose.Types.ObjectId.isValid(site)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid site ID',
    });
  }

  // 🔹 Validate assignedTo array
  for (const userId of assignment.assignedTo) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: `Invalid assignedTo user ID: ${userId}`,
      });
    }
  }

  // 🔹 Validate location array
  const locationError = validateLocationArray(location);
  if (locationError) {
    return res.status(400).json({
      success: false,
      message: locationError,
    });
  }

  // 🔹 Build activityData
  const activityData = {
    site,
    dismantlingType,
    assignment: {
      ...assignment,
      assignedBy: req.user.id,
      status: assignment.status || 'assigned',
      assignedDate: assignment.assignedDate || new Date(),
    },
    assignActivityTasks: assignActivityTasks
      ? {
        ...assignActivityTasks,
        assignSurveyTo: Array.isArray(assignActivityTasks.assignSurveyTo)
          ? assignActivityTasks.assignSurveyTo
          : [],
        assignDismantlingTo: Array.isArray(
          assignActivityTasks.assignDismantlingTo
        )
          ? assignActivityTasks.assignDismantlingTo
          : [],
        assignStoreTo: Array.isArray(assignActivityTasks.assignStoreTo)
          ? assignActivityTasks.assignStoreTo
          : [],
        assignedSurveyDate:
          assignActivityTasks.assignedSurveyDate || new Date(),
        assignedDismantlingDate:
          assignActivityTasks.assignedDismantlingDate || new Date(),
        assignedStoreDate:
          assignActivityTasks.assignedStoreDate || new Date(),
        assignedBy: req.user.id,
      }
      : undefined,
    survey: survey || {},
    dismantling: dismantling || {},
    dispatch: dispatch || {},
    documents,
    timeline,
    notes,
    location,
    createdBy: req.user.id,
  };

  // 🔹 Attach files into correct section
  if (uploadedAttachments.length > 0) {
    if (attachmentTarget === 'dismantling') {
      activityData.dismantling = {
        ...(activityData.dismantling || {}),
        addAttachments: uploadedAttachments,
      };
    } else if (attachmentTarget === 'dispatch') {
      activityData.dispatch = {
        ...(activityData.dispatch || {}),
        addAttachments: uploadedAttachments,
      };
    } else if (attachmentTarget === 'survey-material') {
      const idx = Number(materialIndex ?? -1);
      if (
        activityData.survey &&
        Array.isArray(activityData.survey.materials) &&
        idx >= 0 &&
        idx < activityData.survey.materials.length
      ) {
        const materials = activityData.survey.materials;
        const targetMat = materials[idx] || {};
        materials[idx] = {
          ...targetMat,
          addAttachments: [
            ...(targetMat.addAttachments || []),
            ...uploadedAttachments,
          ],
        };
        activityData.survey.materials = materials;
      }
    } else if (attachmentTarget === 'survey') {
      activityData.survey = {
        ...(activityData.survey || {}),
        addAttachments: uploadedAttachments,
      };
    }
  }

  const activity = await DismantlingActivity.create(activityData);

  res.status(201).json({
    success: true,
    data: activity,
  });
});

exports.updateDismantlingActivity = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid activity ID',
    });
  }

  const activity = await DismantlingActivity.findById(id);

  if (!activity || activity.isDeleted) {
    return res.status(404).json({
      success: false,
      message: 'Dismantling activity not found',
    });
  }

  // 🔹 Raw body from multipart/form-data
  const {
    dismantlingType,
    assignment: assignmentRaw,
    assignActivityTasks: assignActivityTasksRaw,
    survey: surveyRaw,
    dismantling: dismantlingRaw,
    dispatch: dispatchRaw,
    documents: documentsRaw,
    timeline: timelineRaw,
    status,
    notes,
    location: locationRaw,
    attachmentTarget,
    materialIndex,
  } = req.body;

  // 🔹 Files from multer
  const uploadedAttachments = Array.isArray(req.files)
    ? req.files.map((file) => `/uploads/attachments/${file.filename}`)
    : [];

  // 🔹 Parse JSON fields
  const assignment = safeParseJSON(assignmentRaw, null);
  const assignActivityTasks = safeParseJSON(assignActivityTasksRaw, null);
  const survey = safeParseJSON(surveyRaw, null);
  const dismantling = safeParseJSON(dismantlingRaw, null);
  const dispatch = safeParseJSON(dispatchRaw, null);
  const documents = safeParseJSON(documentsRaw, null);
  const timeline = safeParseJSON(timelineRaw, null);
  const location = safeParseJSON(locationRaw, null);

  // 🔹 Update dismantlingType if provided
  if (dismantlingType !== undefined) {
    activity.dismantlingType = dismantlingType;
  }

  // 🔹 Merge assignment (keep existing, override with incoming)
  if (assignment) {
    const currentAssignment = activity.assignment
      ? activity.assignment.toObject()
      : {};

    activity.assignment = {
      ...currentAssignment,
      ...assignment,
    };

    if (!activity.assignment.assignedBy) {
      activity.assignment.assignedBy = req.user.id;
    }
    if (!activity.assignment.assignedDate) {
      activity.assignment.assignedDate = new Date();
    }
  }

  // 🔹 Merge assignActivityTasks
  if (assignActivityTasks) {
    const currentTasks = activity.assignActivityTasks
      ? activity.assignActivityTasks.toObject()
      : {};

    activity.assignActivityTasks = {
      ...currentTasks,
      ...assignActivityTasks,
    };

    // Normalize arrays
    if (assignActivityTasks.assignSurveyTo !== undefined) {
      activity.assignActivityTasks.assignSurveyTo = Array.isArray(
        assignActivityTasks.assignSurveyTo
      )
        ? assignActivityTasks.assignSurveyTo
        : [assignActivityTasks.assignSurveyTo].filter(Boolean);
    }

    if (assignActivityTasks.assignDismantlingTo !== undefined) {
      activity.assignActivityTasks.assignDismantlingTo = Array.isArray(
        assignActivityTasks.assignDismantlingTo
      )
        ? assignActivityTasks.assignDismantlingTo
        : [assignActivityTasks.assignDismantlingTo].filter(Boolean);
    }

    if (assignActivityTasks.assignStoreTo !== undefined) {
      activity.assignActivityTasks.assignStoreTo = Array.isArray(
        assignActivityTasks.assignStoreTo
      )
        ? assignActivityTasks.assignStoreTo
        : [assignActivityTasks.assignStoreTo].filter(Boolean);
    }

    // Set assigned dates if we now have assignees
    if (
      activity.assignActivityTasks.assignSurveyTo?.length &&
      !activity.assignActivityTasks.assignedSurveyDate
    ) {
      activity.assignActivityTasks.assignedSurveyDate = new Date();
    }

    if (
      activity.assignActivityTasks.assignDismantlingTo?.length &&
      !activity.assignActivityTasks.assignedDismantlingDate
    ) {
      activity.assignActivityTasks.assignedDismantlingDate = new Date();
    }

    if (
      activity.assignActivityTasks.assignStoreTo?.length &&
      !activity.assignActivityTasks.assignedStoreDate
    ) {
      activity.assignActivityTasks.assignedStoreDate = new Date();
    }

    // Ensure assignedBy always present
    if (!activity.assignActivityTasks.assignedBy) {
      activity.assignActivityTasks.assignedBy = req.user.id;
    }
  }


  // 🔹 Merge survey
  if (survey) {
    const currentSurvey = activity.survey ? activity.survey.toObject() : {};

    activity.survey = {
      ...currentSurvey,
      ...survey,
      conductedBy: req.user.id, // ✅ always set to logged-in surveyor
      surveyDate: survey.surveyDate || currentSurvey.surveyDate || new Date(), // optional
    };
  }

  // 🔹 Merge dismantling
  if (dismantling) {
    const currentDismantling = activity.dismantling
      ? activity.dismantling.toObject()
      : {};
    activity.dismantling = {
      ...currentDismantling,
      ...dismantling,
    };

    // if (!activity.dismantling.teamLeader) {
    //   activity.dismantling.teamLeader = req.user.id;
    // }
  }

  // 🔹 Merge dispatch
  if (dispatch) {
    const currentDispatch = activity.dispatch
      ? activity.dispatch.toObject()
      : {};
    activity.dispatch = {
      ...currentDispatch,
      ...dispatch,
    };
  }

  // 🔹 Merge timeline
  if (timeline) {
    const currentTimeline = activity.timeline
      ? activity.timeline.toObject()
      : {};
    activity.timeline = {
      ...currentTimeline,
      ...timeline,
    };
  }

  // 🔹 Replace documents if provided
  if (documents) {
    activity.documents = documents;
  }

  // 🔹 Replace location if provided (validate first)
  if (location) {
    const locationError = validateLocationArray(location);
    if (locationError) {
      return res.status(400).json({
        success: false,
        message: locationError,
      });
    }
    activity.location = location;
  }

  // 🔹 Simple scalar updates
  if (status !== undefined) {
    activity.status = status;
  }

  if (notes !== undefined) {
    activity.notes = notes;
  }

  // 🔹 Handle uploaded attachments
  if (uploadedAttachments.length > 0) {
    if (attachmentTarget === 'dismantling') {
      const currentDismantling = activity.dismantling || {};
      const existing = Array.isArray(currentDismantling.addAttachments)
        ? currentDismantling.addAttachments
        : [];

      activity.dismantling = {
        ...currentDismantling,
        addAttachments: [...existing, ...uploadedAttachments],
      };
    } else if (attachmentTarget === 'dispatch') {
      const currentDispatch = activity.dispatch || {};
      const existing = Array.isArray(currentDispatch.addAttachments)
        ? currentDispatch.addAttachments
        : [];

      activity.dispatch = {
        ...currentDispatch,
        addAttachments: [...existing, ...uploadedAttachments],
      };
    } else if (attachmentTarget === 'survey') {
      const currentSurvey = activity.survey || {};
      const existing = Array.isArray(currentSurvey.addAttachments)
        ? currentSurvey.addAttachments
        : [];

      activity.survey = {
        ...currentSurvey,
        addAttachments: [...existing, ...uploadedAttachments],
      };
    } else if (attachmentTarget === 'survey-material') {
      const idx = Number(materialIndex ?? -1);

      if (
        activity.survey &&
        Array.isArray(activity.survey.materials) &&
        idx >= 0 &&
        idx < activity.survey.materials.length
      ) {
        const materials = activity.survey.materials;
        const mat = materials[idx] || {};
        const existing = Array.isArray(mat.addAttachments)
          ? mat.addAttachments
          : [];

        materials[idx] = {
          ...mat,
          addAttachments: [...existing, ...uploadedAttachments],
        };

        activity.survey.materials = materials;
      }
    }
  }

  // 🔹 Save → triggers pre('save') to recalc completion & status
  await activity.save();

  res.status(200).json({
    success: true,
    data: activity,
  });
});

exports.getDismantlingActivities = asyncHandler(async (req, res, next) => {
  let { page = 1, limit = 10 } = req.query;
  page = parseInt(page, 10) || 1;
  limit = parseInt(limit, 10) || 10;

  const baseFilters = buildFilters(req.query);
  const skip = (page - 1) * limit;

  const user = req.user; // from auth middleware
  const isAdminOrManager = ['admin', 'manager'].includes(user.role);

  let query = { ...baseFilters };

  // 🔐 Restrict non-admin/manager to only activities they are assigned to
  if (!isAdminOrManager) {
    const userId = new mongoose.Types.ObjectId(user._id);

    query = {
      $and: [
        baseFilters,
        {
          $or: [
            // main assignment
            { 'assignment.assignedTo': userId },

            // surveyor for this activity
            { 'survey.conductedBy': userId },

            // member of dismantling team
            { 'dismantling.teamMembers': userId },

            // assignActivityTasks based access
            { 'assignActivityTasks.assignSurveyTo': userId },
            { 'assignActivityTasks.assignDismantlingTo': userId },
            { 'assignActivityTasks.assignStoreTo': userId },

            // TODO: if you have store-location role, add its path here
            // { 'storeLocation.assignedTo': userId },
          ],
        },
      ],
    };
  }

  const [activities, total] = await Promise.all([
    DismantlingActivity.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate('site', 'name siteId region')
      .populate('assignment.assignedTo', 'name email role')
      .populate('assignment.assignedBy', 'name email role')
      .populate('survey.conductedBy', 'name email role')
      // .populate('dismantling.teamMembers', 'name email role')
      .populate('documents.uploadedBy', 'name email')
      .populate('createdBy', 'name email role')
      .populate('deletedBy', 'name email'),
    DismantlingActivity.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    count: activities.length,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
    data: activities,
  });
});

exports.getDismantlingActivity = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid activity ID',
    });
  }

  const activity = await DismantlingActivity.findById(id)
    .populate('site', 'name siteId region')
    .populate('assignment.assignedTo', 'name email role')
    .populate('assignment.assignedBy', 'name email role')
    .populate('survey.conductedBy', 'name email role')

    // .populate('dismantling.teamMembers', 'name email role')
    .populate('documents.uploadedBy', 'name email')
    .populate('createdBy', 'name email role')
    .populate('deletedBy', 'name email');

  if (!activity || activity.isDeleted) {
    return res.status(404).json({
      success: false,
      message: 'Dismantling activity not found',
    });
  }

  res.status(200).json({
    success: true,
    data: activity,
  });
});

exports.softDeleteDismantlingActivity = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid activity ID',
    });
  }

  const activity = await DismantlingActivity.findById(id);

  if (!activity || activity.isDeleted) {
    return res.status(404).json({
      success: false,
      message: 'Dismantling activity not found',
    });
  }

  activity.isDeleted = true;
  activity.deletedAt = new Date();
  activity.deletedBy = req.user.id;

  await activity.save();

  res.status(200).json({
    success: true,
    message: 'Dismantling activity deleted successfully',
  });
});