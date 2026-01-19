// helpers/relocationHelpers.js
const mongoose = require('mongoose');

// Common validation function
exports.validateActivityId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('Invalid relocation activity ID');
  }
  return true;
};

// Common population configuration (simplified)
exports.getPopulationConfig = (type = 'full') => {
  const basePopulate = [
    { path: 'siteId', select: 'name siteId region address' },
    { path: 'createdBy', select: 'name email role' },
    { path: 'updatedBy', select: 'name email role' },
  ];

  if (type === 'full') {
    return [
      ...basePopulate,
      // User assignments population
      {
        path: 'sourceSite.civilWork.assignedUsers.userId',
        select: 'name email role department',
      },
      {
        path: 'sourceSite.telecomWork.assignedUsers.userId',
        select: 'name email role department',
      },
      {
        path: 'sourceSite.surveyWork.assignedUsers.userId',
        select: 'name email role department',
      },
      {
        path: 'sourceSite.dismantlingWork.assignedUsers.userId',
        select: 'name email role department',
      },
      {
        path: 'sourceSite.storeOperatorWork.assignedUsers.userId',
        select: 'name email role department',
      },
      {
        path: 'destinationSite.civilWork.assignedUsers.userId',
        select: 'name email role department',
      },
      {
        path: 'destinationSite.telecomWork.assignedUsers.userId',
        select: 'name email role department',
      },
      {
        path: 'destinationSite.surveyWork.assignedUsers.userId',
        select: 'name email role department',
      },
      {
        path: 'destinationSite.dismantlingWork.assignedUsers.userId',
        select: 'name email role department',
      },
      {
        path: 'destinationSite.storeOperatorWork.assignedUsers.userId',
        select: 'name email role department',
      },
    ];
  }

  return basePopulate;
};

// Build search query
exports.buildSearchQuery = (filters = {}) => {
  const {
    search,
    relocationType,
    status,
    siteId,
    createdBy,
    isDeleted = false,
  } = filters;

  const query = { isDeleted: isDeleted === true || isDeleted === 'true' };

  // Search across multiple fields
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
  if (siteId)
    query.siteId = mongoose.Types.ObjectId.isValid(siteId) ? siteId : null;
  if (createdBy)
    query.createdBy = mongoose.Types.ObjectId.isValid(createdBy)
      ? createdBy
      : null;

  return query;
};

// Success response handler
exports.successResponse = (res, message, data = null, statusCode = 200) => {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString(),
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

// Error response handler
exports.errorResponse = (res, message, error = null, statusCode = 500) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
  };

  if (error && process.env.NODE_ENV === 'development') {
    response.error = error.message;
  }

  return res.status(statusCode).json(response);
};