const RelocationActivity = require('../models/RelocationActivity.model');
const mongoose = require('mongoose');

const {
  validateActivityId,
  getPopulationConfig,
  successResponse,
  errorResponse
} = require('../helpers/relocationHelpers');

// Convert string userId → proper ObjectId for assigned users
const convertAssignedUsers = (users = []) => {
  return users
    .filter(u => u && u.userId && mongoose.isValidObjectId(u.userId))
    .map(u => ({
      userId: new mongoose.Types.ObjectId(u.userId),
      role: u.role || 'worker',
      assignedDate: u.assignedDate || new Date()
    }));
};

// Process site data for create/update - UPDATED (removed required field)
const processSiteData = (siteData) => {
  if (!siteData) return null;

  const workTypes = ['civilWork', 'telecomWork', 'surveyWork', 'dismantlingWork', 'storeOperatorWork'];

  // Initialize work types based on siteData.workTypes array
  const processedWork = {};
  workTypes.forEach(workType => {
    processedWork[workType] = {
      status: 'not-started',
      notes: siteData[workType]?.notes || '',
      // Always allow assignedUsers, don't check isRequired anymore
      assignedUsers: siteData[workType]?.assignedUsers
        ? convertAssignedUsers(siteData[workType].assignedUsers)
        : [],
      materials: [] // Always empty on creation/update - will be added via updatePhase
    };
  });

  return {
    siteRequired: siteData.siteRequired !== false,
    operatorName: siteData.operatorName || '',
    siteStatus: 'not-started',
    address: siteData.address || {},
    workTypes: siteData.workTypes || [],
    ...processedWork
  };
};

// ========= CREATE RELOCATION ACTIVITY =========
exports.createRelocationActivity = async (req, res) => {
  try {
    const {
      siteId,
      relocationType,
      overallStatus = 'draft',
      sourceSite = {},
      destinationSite = {},
      notes = ''
    } = req.body;

    // Validate required fields
    if (!siteId) {
      return errorResponse(res, 'Site ID is required', null, 400);
    }

    if (!relocationType) {
      return errorResponse(res, 'Relocation type is required', null, 400);
    }

    // Validate relocation type
    const validRelocationTypes = ['B2S', 'OMO', 'StandAlone', 'Custom'];
    if (!validRelocationTypes.includes(relocationType)) {
      return errorResponse(res, `Invalid relocation type. Must be one of: ${validRelocationTypes.join(', ')}`, null, 400);
    }

    // Process site data
    const processedSourceSite = processSiteData(sourceSite);
    const processedDestinationSite = processSiteData(destinationSite);

    // Create activity data
    const activityData = {
      siteId: new mongoose.Types.ObjectId(siteId),
      relocationType,
      overallStatus,
      notes,
      createdBy: req.user._id,
      sourceSite: processedSourceSite,
      destinationSite: processedDestinationSite,
      materials: [] // Empty materials array - will be added via updatePhase
    };

    // Create and save
    const activity = new RelocationActivity(activityData);
    await activity.save();

    // Populate basic fields for response
    const populatedActivity = await activity.populate([
      { path: 'siteId', select: 'name siteId region address' },
      { path: 'createdBy', select: 'name email role' }
    ]);

    return successResponse(res, 'Relocation activity created successfully!', populatedActivity, 201);

  } catch (error) {
    console.error('Create Relocation Error:', error);
    return errorResponse(res, 'Failed to create relocation activity', error.message);
  }
};

// ========= GET ALL ACTIVITIES =========
exports.getAllRelocationActivities = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      relocationType,
      status,
      siteId,
      createdBy,
      isDeleted = false,
    } = req.query;

    // Build query
    const query = { isDeleted: isDeleted === 'true' || isDeleted === true };

    // Search across fields
    if (search) {
      query.$or = [
        { 'sourceSite.address.city': { $regex: search, $options: 'i' } },
        { 'destinationSite.address.city': { $regex: search, $options: 'i' } },
        { relocationType: { $regex: search, $options: 'i' } },
        { overallStatus: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
      ];
    }

    // Apply filters
    if (relocationType) query.relocationType = relocationType;
    if (status) query.overallStatus = status;
    if (siteId && mongoose.Types.ObjectId.isValid(siteId)) query.siteId = siteId;
    if (createdBy && mongoose.Types.ObjectId.isValid(createdBy)) query.createdBy = createdBy;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const [activities, total] = await Promise.all([
      RelocationActivity.find(query)
        .populate([
          { path: 'siteId', select: 'name siteId region' },
          { path: 'createdBy', select: 'name email' },
          { path: 'updatedBy', select: 'name email' }
        ])
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      RelocationActivity.countDocuments(query)
    ]);

    // Response
    const response = {
      items: activities,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage: skip + limitNum < total,
        hasPrevPage: parseInt(page) > 1,
      },
    };

    return successResponse(res, 'Relocation activities retrieved successfully', response);

  } catch (error) {
    console.error('Error fetching relocation activities:', error);
    return errorResponse(res, 'Failed to fetch relocation activities', error);
  }
};

// ========= GET BY ID =========
exports.getRelocationActivityById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!validateActivityId(id)) {
      return errorResponse(res, 'Invalid relocation activity ID', null, 400);
    }

    // Find with populated fields
    const activity = await RelocationActivity.findById(id)
      .populate([
        { path: 'siteId', select: 'name siteId region address' },
        { path: 'createdBy', select: 'name email role' },
        { path: 'updatedBy', select: 'name email role' },
        // Populate assigned users
        { path: 'sourceSite.surveyWork.assignedUsers.userId', select: 'name email role' },
        { path: 'sourceSite.civilWork.assignedUsers.userId', select: 'name email role' },
        { path: 'sourceSite.telecomWork.assignedUsers.userId', select: 'name email role' },
        { path: 'sourceSite.dismantlingWork.assignedUsers.userId', select: 'name email role' },
        { path: 'sourceSite.storeOperatorWork.assignedUsers.userId', select: 'name email role' },
        { path: 'destinationSite.surveyWork.assignedUsers.userId', select: 'name email role' },
        { path: 'destinationSite.civilWork.assignedUsers.userId', select: 'name email role' },
        { path: 'destinationSite.telecomWork.assignedUsers.userId', select: 'name email role' },
        { path: 'destinationSite.dismantlingWork.assignedUsers.userId', select: 'name email role' },
        { path: 'destinationSite.storeOperatorWork.assignedUsers.userId', select: 'name email role' }
      ]);

    if (!activity) {
      return errorResponse(res, 'Relocation activity not found', null, 404);
    }

    return successResponse(res, 'Relocation activity retrieved successfully', activity);

  } catch (error) {
    console.error('Error fetching relocation activity:', error);
    return errorResponse(res, 'Failed to fetch relocation activity', error);
  }
};

// ========= UPDATE ACTIVITY (BASIC INFO ONLY) =========
exports.updateRelocationActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate ID
    if (!validateActivityId(id)) {
      return errorResponse(res, 'Invalid relocation activity ID', null, 400);
    }

    // Check if activity exists
    const existingActivity = await RelocationActivity.findById(id);
    if (!existingActivity) {
      return errorResponse(res, 'Relocation activity not found', null, 404);
    }

    // Prepare update object - only basic fields
    const updateObject = {
      updatedBy: req.user._id,
      updatedAt: new Date()
    };

    // Allowed basic fields to update
    const allowedFields = [
      'relocationType',
      'overallStatus',
      'notes'
    ];

    // Copy allowed fields
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updateObject[field] = updateData[field];
      }
    });

    // Process site updates (basic info only)
    if (updateData.sourceSite) {
      updateObject.sourceSite = {
        ...existingActivity.sourceSite.toObject(),
        siteRequired: updateData.sourceSite.siteRequired !== undefined
          ? updateData.sourceSite.siteRequired
          : existingActivity.sourceSite.siteRequired,
        operatorName: updateData.sourceSite.operatorName || existingActivity.sourceSite.operatorName,
        address: updateData.sourceSite.address || existingActivity.sourceSite.address,
        workTypes: updateData.sourceSite.workTypes || existingActivity.sourceSite.workTypes
      };

      // Update work types (removed required field)
      const workTypes = ['civilWork', 'telecomWork', 'surveyWork', 'dismantlingWork', 'storeOperatorWork'];
      workTypes.forEach(workType => {
        if (updateData.sourceSite[workType]) {
          updateObject.sourceSite[workType] = {
            status: existingActivity.sourceSite[workType]?.status || 'not-started',
            notes: updateData.sourceSite[workType].notes || existingActivity.sourceSite[workType]?.notes || '',
            assignedUsers: updateData.sourceSite[workType].assignedUsers
              ? convertAssignedUsers(updateData.sourceSite[workType].assignedUsers)
              : existingActivity.sourceSite[workType]?.assignedUsers || [],
            materials: existingActivity.sourceSite[workType]?.materials || [] // Keep existing materials
          };
        }
      });
    }

    if (updateData.destinationSite) {
      updateObject.destinationSite = {
        ...existingActivity.destinationSite.toObject(),
        siteRequired: updateData.destinationSite.siteRequired !== undefined
          ? updateData.destinationSite.siteRequired
          : existingActivity.destinationSite.siteRequired,
        operatorName: updateData.destinationSite.operatorName || existingActivity.destinationSite.operatorName,
        address: updateData.destinationSite.address || existingActivity.destinationSite.address,
        workTypes: updateData.destinationSite.workTypes || existingActivity.destinationSite.workTypes
      };

      // Update work types (removed required field)
      const workTypes = ['civilWork', 'telecomWork', 'surveyWork', 'dismantlingWork', 'storeOperatorWork'];
      workTypes.forEach(workType => {
        if (updateData.destinationSite[workType]) {
          updateObject.destinationSite[workType] = {
            status: existingActivity.destinationSite[workType]?.status || 'not-started',
            notes: updateData.destinationSite[workType].notes || existingActivity.destinationSite[workType]?.notes || '',
            assignedUsers: updateData.destinationSite[workType].assignedUsers
              ? convertAssignedUsers(updateData.destinationSite[workType].assignedUsers)
              : existingActivity.destinationSite[workType]?.assignedUsers || [],
            materials: existingActivity.destinationSite[workType]?.materials || [] // Keep existing materials
          };
        }
      });
    }

    // Perform update
    const updatedActivity = await RelocationActivity.findByIdAndUpdate(
      id,
      updateObject,
      { new: true, runValidators: true }
    ).populate([
      { path: 'siteId', select: 'name siteId region' },
      { path: 'createdBy', select: 'name email' },
      { path: 'updatedBy', select: 'name email' }
    ]);

    return successResponse(res, 'Relocation activity updated successfully', updatedActivity);

  } catch (error) {
    console.error('Error updating relocation activity:', error);
    return errorResponse(res, 'Failed to update relocation activity', error);
  }
};

// ========= SOFT DELETE =========
exports.softDeleteRelocationActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { deletionReason } = req.body;

    // Validate ID
    if (!validateActivityId(id)) {
      return errorResponse(res, 'Invalid relocation activity ID', null, 400);
    }

    // Find and update
    const updatedActivity = await RelocationActivity.findByIdAndUpdate(
      id,
      {
        isDeleted: true,
        deletionDate: new Date(),
        deletedBy: req.user._id,
        deletionReason
      },
      { new: true }
    );

    if (!updatedActivity) {
      return errorResponse(res, 'Relocation activity not found', null, 404);
    }

    return successResponse(res, 'Relocation activity deleted successfully', updatedActivity);

  } catch (error) {
    console.error('Error deleting relocation activity:', error);
    return errorResponse(res, 'Failed to delete relocation activity', error);
  }
};