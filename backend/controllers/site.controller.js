// controllers/siteController.js
const Site = require('../models/Site.model');
const Project = require('../models/Project.model');
const DismantlingActivity = require('../models/dismantlingActivity.model');
const CowActivity = require('../models/COWActivity.model');
const RelocationActivity = require('../models/RelocationActivity.model');
const asyncHandler = require('../middlewares/asyncHandler.middleware');

// Helper: check if user can view a site
const canViewSite = (site, userId, userRole) => {
  if (userRole === 'admin') return true;
  if (site.createdBy && site.createdBy.toString() === userId.toString())
    return true;
  if (site.siteManager && site.siteManager.toString() === userId.toString())
    return true;
  return false;
};

// Common population configuration (DRY)
const getSitePopulations = () => [
  { path: 'project', select: 'name status manager' },
  { path: 'siteManager', select: 'name email role phone' },
  { path: 'createdBy', select: 'name email' },
];

// ===================== CREATE SITE =====================
exports.createSite = asyncHandler(async (req, res, next) => {
  const { name, siteId, region, project, siteManager, notes } = req.body;

  if (!name || !siteId || !region || !project || !siteManager) {
    return res.status(400).json({
      success: false,
      message: 'Name, site ID, region, project, and site manager are required',
    });
  }

  const siteData = {
    name,
    siteId,
    region,
    project,
    siteManager,
    notes,
    createdBy: req.user.id,
  };

  const site = await Site.create(siteData);

  // Attach site to project
  await Project.findByIdAndUpdate(project, {
    $addToSet: { sites: site._id },
  });

  const populatedSite = await Site.findById(site._id).populate(
    getSitePopulations()
  );

  res.status(201).json({
    success: true,
    data: populatedSite,
  });
});

// ===================== GET ALL SITES =====================
exports.getSites = asyncHandler(async (req, res, next) => {
  const { project, status, region, search, page = 1, limit = 10 } = req.query;

  const numericPage = parseInt(page, 10) || 1;
  const numericLimit = parseInt(limit, 10) || 10;
  const skip = (numericPage - 1) * numericLimit;

  // Build base filters
  const baseFilters = { isDeleted: false };
  if (project) baseFilters.project = project;
  if (status) baseFilters.overallStatus = status;
  if (region) baseFilters.region = region;

  const conditions = [];

  // Base filters (project, region, status)
  if (Object.keys(baseFilters).length > 0) {
    conditions.push(baseFilters);
  }

  // Permission filter: non-admin can only see their own / managed sites
  if (req.user.role !== 'admin') {
    conditions.push({
      $or: [{ createdBy: req.user.id }, { siteManager: req.user.id }],
    });
  }

  // Search filter
  if (search) {
    const searchRegex = new RegExp(search, 'i');
    conditions.push({
      $or: [
        { name: { $regex: searchRegex } },
        { siteId: { $regex: searchRegex } },
      ],
    });
  }

  // Final Mongo query
  const finalQuery =
    conditions.length > 1 ? { $and: conditions } : conditions[0] || {};

  // Fetch sites + total count
  const [sites, total] = await Promise.all([
    Site.find(finalQuery)
      .populate(getSitePopulations())
      .sort('-createdAt')
      .skip(skip)
      .limit(numericLimit),
    Site.countDocuments(finalQuery),
  ]);

  res.status(200).json({
    success: true,
    count: sites.length,
    total,
    pagination: {
      page: numericPage,
      limit: numericLimit,
      pages: Math.ceil(total / numericLimit) || 1,
    },
    data: sites,
  });
});

// ===================== GET SITE BY ID =====================
exports.getSiteById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    // Get site with populated fields
    const site = await Site.findById(id)
      .populate({
        path: 'project',
        select: 'name manager status'
      })
      .populate({
        path: 'siteManager',
        select: 'name phone role'
      })
      .populate({
        path: 'createdBy',
        select: 'name email'
      });

    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }

    if (site.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Site has been deleted'
      });
    }

    // Check permissions
    if (!canViewSite(site, req.user.id, req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this site',
      });
    }

    // Get dismantling activities for this site
    const dismantlingActivities = await DismantlingActivity.find({
      site: id,
      isDeleted: false
    })
      .populate({
        path: 'assignment.assignedTo',
        select: 'name email phone role'
      })
      .populate({
        path: 'assignment.assignedBy',
        select: 'name email'
      })
      .populate({
        path: 'survey.conductedBy',
        select: 'name email phone role'
      })
      .populate({
        path: 'dismantling.conductedBy',
        select: 'name email phone role'
      })
      .populate({
        path: 'createdBy',
        select: 'name email'
      })
      .select('-__v');

    // Get COW activities for this site
    const cowActivities = await CowActivity.find({
      siteId: id,
      isDeleted: false
    })
      .populate({
        path: 'sourceSite.surveyWork.assignedUsers.userId',
        select: 'name email phone role'
      })
      .populate({
        path: 'sourceSite.inventoryWork.assignedUsers.userId',
        select: 'name email phone role'
      })
      .populate({
        path: 'sourceSite.transportationWork.assignedUsers.userId',
        select: 'name email phone role'
      })
      .populate({
        path: 'sourceSite.installationWork.assignedUsers.userId',
        select: 'name email phone role'
      })
      .populate({
        path: 'destinationSite.surveyWork.assignedUsers.userId',
        select: 'name email phone role'
      })
      .populate({
        path: 'destinationSite.inventoryWork.assignedUsers.userId',
        select: 'name email phone role'
      })
      .populate({
        path: 'destinationSite.transportationWork.assignedUsers.userId',
        select: 'name email phone role'
      })
      .populate({
        path: 'destinationSite.installationWork.assignedUsers.userId',
        select: 'name email phone role'
      })
      .populate({
        path: 'teamMembers',
        select: 'name email phone role'
      })
      .populate({
        path: 'createdBy',
        select: 'name email'
      })
      .select('-__v');

    // Get relocation activities for this site
    const relocationActivities = await RelocationActivity.find({
      siteId: id,
      isDeleted: false
    })
      .populate({
        path: 'sourceSite.surveyWork.assignedUsers.userId',
        select: 'name email phone role'
      })
      .populate({
        path: 'sourceSite.storeOperatorWork.assignedUsers.userId',
        select: 'name email phone role'
      })
      .populate({
        path: 'sourceSite.civilWork.assignedUsers.userId',
        select: 'name email phone role'
      })
      .populate({
        path: 'sourceSite.telecomWork.assignedUsers.userId',
        select: 'name email phone role'
      })
      .populate({
        path: 'destinationSite.civilWork.assignedUsers.userId',
        select: 'name email phone role'
      })
      .populate({
        path: 'destinationSite.telecomWork.assignedUsers.userId',
        select: 'name email phone role'
      })
      .populate({
        path: 'destinationSite.surveyWork.assignedUsers.userId',
        select: 'name email phone role'
      })
      .populate({
        path: 'createdBy',
        select: 'name email'
      })
      .select('-__v');

    // Transform the site object to include activities
    const siteWithActivities = {
      ...site.toObject(),
      activities: {
        dismantling: {
          count: dismantlingActivities.length,
          activities: dismantlingActivities.map(activity => ({
            _id: activity._id,
            dismantlingType: activity.dismantlingType,
            location: activity.location,
            assignment: activity.assignment,
            survey: activity.survey,
            dismantling: activity.dismantling,
            dispatch: activity.dispatch,
            timeline: activity.timeline,
            status: activity.timeline?.status || 'pending',
            overallStatus: activity.timeline?.status || 'pending',
            completionPercentage: activity.timeline?.completionPercentage || 0,
            notes: activity.timeline?.notes || '',
            createdAt: activity.createdAt,
            updatedAt: activity.updatedAt
          }))
        },
        cow: {
          count: cowActivities.length,
          activities: cowActivities.map(activity => ({
            _id: activity._id,
            activityName: activity.activityName,
            purpose: activity.purpose,
            description: activity.description,
            plannedStartDate: activity.plannedStartDate,
            plannedEndDate: activity.plannedEndDate,
            sourceSite: {
              location: activity.sourceSite?.location,
              workTypes: activity.sourceSite?.workTypes,
              siteStatus: activity.sourceSite?.siteStatus,
              surveyWork: activity.sourceSite?.surveyWork,
              inventoryWork: activity.sourceSite?.inventoryWork,
              transportationWork: activity.sourceSite?.transportationWork,
              installationWork: activity.sourceSite?.installationWork
            },
            destinationSite: {
              location: activity.destinationSite?.location,
              workTypes: activity.destinationSite?.workTypes,
              siteStatus: activity.destinationSite?.siteStatus,
              surveyWork: activity.destinationSite?.surveyWork,
              inventoryWork: activity.destinationSite?.inventoryWork,
              transportationWork: activity.destinationSite?.transportationWork,
              installationWork: activity.destinationSite?.installationWork
            },
            overallStatus: activity.overallStatus,
            teamMembers: activity.teamMembers,
            notes: activity.notes,
            createdAt: activity.createdAt,
            updatedAt: activity.updatedAt
          }))
        },
        relocation: {
          count: relocationActivities.length,
          activities: relocationActivities.map(activity => ({
            _id: activity._id,
            relocationType: activity.relocationType,
            overallStatus: activity.overallStatus,
            sourceSite: {
              siteRequired: activity.sourceSite?.siteRequired,
              operatorName: activity.sourceSite?.operatorName,
              siteStatus: activity.sourceSite?.siteStatus,
              address: activity.sourceSite?.address,
              workTypes: activity.sourceSite?.workTypes,
              civilWork: activity.sourceSite?.civilWork,
              telecomWork: activity.sourceSite?.telecomWork,
              surveyWork: activity.sourceSite?.surveyWork,
              dismantlingWork: activity.sourceSite?.dismantlingWork,
              storeOperatorWork: activity.sourceSite?.storeOperatorWork
            },
            destinationSite: {
              siteRequired: activity.destinationSite?.siteRequired,
              operatorName: activity.destinationSite?.operatorName,
              siteStatus: activity.destinationSite?.siteStatus,
              address: activity.destinationSite?.address,
              workTypes: activity.destinationSite?.workTypes,
              civilWork: activity.destinationSite?.civilWork,
              telecomWork: activity.destinationSite?.telecomWork,
              surveyWork: activity.destinationSite?.surveyWork,
              dismantlingWork: activity.destinationSite?.dismantlingWork,
              storeOperatorWork: activity.destinationSite?.storeOperatorWork
            },
            materials: activity.materials,
            notes: activity.notes,
            createdAt: activity.createdAt,
            updatedAt: activity.updatedAt
          }))
        }
      }
    };

    res.status(200).json({
      success: true,
      data: siteWithActivities
    });

  } catch (error) {
    console.error('Error fetching site by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// ===================== UPDATE SITE =====================
exports.updateSite = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const { name, siteManager, region, siteId, project, notes, overallStatus } =
    req.body;

  // Find site
  const site = await Site.findById(id);
  if (!site) {
    return res.status(404).json({
      success: false,
      message: 'Site not found',
    });
  }

  // Permission check
  const canUpdate =
    req.user.role === 'admin' ||
    site.createdBy.toString() === req.user.id.toString() ||
    site.siteManager.toString() === req.user.id.toString();

  if (!canUpdate) {
    return res.status(403).json({
      success: false,
      message: 'You are not authorized to update this site',
    });
  }

  // ------------ APPLY UPDATES ------------
  if (name !== undefined) site.name = name;
  if (siteManager !== undefined) site.siteManager = siteManager;
  if (region !== undefined) site.region = region;
  if (siteId !== undefined) site.siteId = siteId;

  // If project changed → update old & new project site list
  if (project !== undefined && project.toString() !== site.project.toString()) {
    await Project.findByIdAndUpdate(site.project, {
      $pull: { sites: site._id },
    });
    await Project.findByIdAndUpdate(project, {
      $addToSet: { sites: site._id },
    });
    site.project = project;
  }

  if (notes !== undefined) site.notes = notes;
  if (overallStatus !== undefined) site.overallStatus = overallStatus;

  await site.save();

  const updatedSite = await Site.findById(id).populate(getSitePopulations());

  res.status(200).json({
    success: true,
    data: updatedSite,
  });
});

// ===================== DELETE SITE =====================
exports.deleteSite = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const site = await Site.findOne({
    _id: id,
    isDeleted: { $in: [false, true] },
  });

  if (!site) {
    return res.status(404).json({
      success: false,
      message: 'Site not found',
    });
  }

  // Only admin or creator can delete
  const canDelete =
    req.user.role === 'admin' ||
    (site.createdBy && site.createdBy.toString() === req.user.id.toString());

  if (!canDelete) {
    return res.status(403).json({
      success: false,
      message: 'You are not authorized to delete this site',
    });
  }

  if (site.isDeleted) {
    return res.status(200).json({
      success: true,
      message: 'Site already deleted',
    });
  }

  try {
    // Track deleted activities counts
    let deletedCounts = {
      dismantling: 0,
      cow: 0,
      relocation: 0
    };

    // 1. Soft delete Dismantling Activities
    const dismantlingResult = await DismantlingActivity.updateMany(
      { site: id, isDeleted: false },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: req.user.id
        }
      }
    );
    deletedCounts.dismantling = dismantlingResult.modifiedCount;

    // 2. Soft delete COW Activities
    const cowResult = await CowActivity.updateMany(
      { siteId: id, isDeleted: false },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: req.user.id
        }
      }
    );
    deletedCounts.cow = cowResult.modifiedCount;

    // 3. Soft delete Relocation Activities
    const relocationResult = await RelocationActivity.updateMany(
      { siteId: id, isDeleted: false },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: req.user.id
        }
      }
    );
    deletedCounts.relocation = relocationResult.modifiedCount;

    // 4. Soft delete the site
    site.isDeleted = true;
    site.deletedAt = new Date();
    site.deletedBy = req.user.id;
    await site.save();

    // 5. Remove site from project
    if (site.project) {
      await Project.findByIdAndUpdate(
        site.project,
        { $pull: { sites: site._id } }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Site and all related activities deleted successfully',
      deletedActivities: deletedCounts
    });

  } catch (error) {
    console.error('Error deleting site and activities:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting site and activities',
      error: error.message
    });
  }
});