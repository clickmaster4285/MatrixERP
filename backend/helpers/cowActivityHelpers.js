const mongoose = require('mongoose');

// Common validation function
exports.validateActivityId = (id) => {
   if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid COW activity ID');
   }
   return true;
};

// Build search query
exports.buildSearchQuery = (filters = {}) => {
   const {
      search,
      purpose,
      status,
      siteId,
      createdBy,
      isDeleted = false,
   } = filters;

   const query = { isDeleted: isDeleted === true || isDeleted === 'true' };

   // Search across multiple fields
   if (search) {
      query.$or = [
         { activityName: { $regex: search, $options: 'i' } },
         { purpose: { $regex: search, $options: 'i' } },
         { description: { $regex: search, $options: 'i' } },
         { notes: { $regex: search, $options: 'i' } },
         { 'sourceSite.location.address.city': { $regex: search, $options: 'i' } },
         { 'destinationSite.location.address.city': { $regex: search, $options: 'i' } }
      ];
   }

   // Apply filters
   if (purpose) query.purpose = purpose;
   if (status) query.overallStatus = status;
   if (siteId && mongoose.Types.ObjectId.isValid(siteId)) query.siteId = siteId;
   if (createdBy && mongoose.Types.ObjectId.isValid(createdBy)) query.createdBy = createdBy;

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
      response.error = error.message || error;
   }

   return res.status(statusCode).json(response);
};

// Get population config for different scenarios
exports.getPopulationConfig = (type = 'basic') => {
   const basePopulate = [
      { path: 'siteId', select: 'name siteId region' },
      { path: 'createdBy', select: 'name email role' },
      { path: 'updatedBy', select: 'name email role' },
      { path: 'teamMembers.userId', select: 'name email role' }
   ];

   if (type === 'full') {
      return [
         ...basePopulate,
         // Populate all assigned users
         { path: 'sourceSite.surveyWork.assignedUsers.userId', select: 'name email role' },
         { path: 'sourceSite.inventoryWork.assignedUsers.userId', select: 'name email role' },
         { path: 'sourceSite.transportationWork.assignedUsers.userId', select: 'name email role' },
         { path: 'sourceSite.installationWork.assignedUsers.userId', select: 'name email role' },
         { path: 'destinationSite.surveyWork.assignedUsers.userId', select: 'name email role' },
         { path: 'destinationSite.inventoryWork.assignedUsers.userId', select: 'name email role' },
         { path: 'destinationSite.transportationWork.assignedUsers.userId', select: 'name email role' },
         { path: 'destinationSite.installationWork.assignedUsers.userId', select: 'name email role' }
      ];
   }

   return basePopulate;
};

// Calculate activity stats
exports.calculateActivityStats = (activity) => {
   let totalWorkItems = 0;
   let completedWorkItems = 0;
   let inProgressWorkItems = 0;

   const sites = [];
   if (activity.sourceSite) sites.push(activity.sourceSite);
   if (activity.destinationSite) sites.push(activity.destinationSite);

   sites.forEach(site => {
      const workTypes = site.workTypes || [];
      totalWorkItems += workTypes.length;

      workTypes.forEach(workType => {
         const work = site[`${workType}Work`];
         if (work) {
            if (work.status === 'completed') completedWorkItems++;
            if (work.status === 'in-progress') inProgressWorkItems++;
         }
      });
   });

   const completionPercentage = totalWorkItems > 0
      ? Math.round((completedWorkItems / totalWorkItems) * 100)
      : 0;

   return {
      totalWorkItems,
      completedWorkItems,
      inProgressWorkItems,
      completionPercentage,
      pendingWorkItems: totalWorkItems - completedWorkItems - inProgressWorkItems
   };
};