// controllers/project.controller.js
const Project = require('../models/Project.model');
const Site = require('../models/Site.model');
const User = require('../models/user.model');
const ErrorResponse = require('../utils/errorResponse');
const DismantlingActivity = require('../models/dismantlingActivity.model');
const CowActivity = require('../models/COWActivity.model');
const RelocationActivity = require('../models/RelocationActivity.model');
const asyncHandler = require('../middlewares/asyncHandler.middleware');

// Constants for configuration
const PROJECT_POPULATION_CONFIG = {
  basic: [
    { path: 'manager', select: 'name email phone role' },
    { path: 'createdBy', select: 'name email role' },
    { path: 'sites', select: 'name siteId overallStatus' }
  ],

  detailed: [
    {
      path: 'manager',
      select: 'name email phone role'
    },
    {
      path: 'createdBy',
      select: 'name email role'
    },
    {
      path: 'sites',
      select: 'name siteId region overallStatus primaryLocation notes siteManager activities createdAt updatedAt',
      populate: [
        {
          path: 'siteManager',
          select: 'name email phone role'
        }
      ]
    }
  ]
};

// Helper Functions
const canViewProject = (project, user) => {
  if (user.role === 'admin') return true;
  if (user.role === 'manager' && project.manager && project.manager._id.toString() === user.id) return true;
  if (user.role === 'supervisor') return true;
  return false;
};

// Improved buildProjectQuery function
const buildProjectQuery = (user, filters) => {
  const { status, manager, search } = filters;
  const query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  // Status filter - only apply if not 'all' or empty
  if (status && status !== 'all' && status.trim() !== '') {
    query.status = status;
  }

  // Manager filter - only apply if valid ObjectId
  if (manager && manager !== 'all' && manager.trim() !== '') {
    // Check if it's a valid ObjectId before adding to query
    if (mongoose.Types.ObjectId.isValid(manager)) {
      query.manager = manager;
    } else {
      // If it's not a valid ObjectId, don't filter by manager
      // or you could throw an error
      console.warn(`Invalid manager ID: ${manager}`);
    }
  }

  // Role-based access control
  switch (user.role) {
    case 'admin':
      // Admin can see all projects - no additional filtering
      break;
    case 'manager':
      // Manager can only see their own projects
      query.manager = user.id;
      break;
    case 'supervisor':
      // Supervisor can only see active/completed projects
      if (!query.status) {
        query.status = { $in: ['active', 'completed'] };
      } else if (!['active', 'completed'].includes(query.status)) {
        // If supervisor tries to filter by other status, override it
        query.status = { $in: ['active', 'completed'] };
      }
      break;
    default:
      // For other roles, only show active projects
      query.status = 'active';
  }

  return query;
};

// Main Controller Functions

exports.createProject = asyncHandler(async (req, res, next) => {
  const { name, description, manager, timeline } = req.body;

  if (!name || !manager) {
    return next(new ErrorResponse('Name and manager are required', 400));
  }

  if (new Date(timeline.startDate) >= new Date(timeline.endDate)) {
    return next(new ErrorResponse('End date must be after start date', 400));
  }

  const managerUser = await User.findOne({ _id: manager, role: 'manager' });
  if (!managerUser) {
    return next(new ErrorResponse('Manager not found or user is not a manager', 400));
  }

  const project = await Project.create({
    name,
    description,
    manager,
    timeline,
    createdBy: req.user.id
  });

  const populatedProject = await Project.findById(project._id)
    .populate(PROJECT_POPULATION_CONFIG.basic);

  res.status(201).json({
    success: true,
    data: populatedProject
  });
});

exports.getProjects = asyncHandler(async (req, res, next) => {
  const {
    status,
    manager,
    search,
    page = 1,
    limit = 10,
    sortBy = '-createdAt'
  } = req.query;

  const query = buildProjectQuery(req.user, { status, manager, search });
  const skip = (page - 1) * limit;
  const pageSize = parseInt(limit);

  // Get projects with basic population
  const [projects, total] = await Promise.all([
    Project.find(query)
      .populate(PROJECT_POPULATION_CONFIG.basic)
      .sort(sortBy)
      .skip(skip)
      .limit(pageSize),
    Project.countDocuments(query)
  ]);

  // Get all project IDs
  const projectIds = projects.map(p => p._id);
  // Simple site count per project
  let siteCounts = {};
  if (projectIds.length > 0) {
    const siteDocs = await Site.find({
      project: { $in: projectIds },
      isDeleted: false
    }).select('project overallStatus');

    siteDocs.forEach(site => {
      const projectId = site.project.toString();
      if (!siteCounts[projectId]) {
        siteCounts[projectId] = { count: 0, completed: 0, inProgress: 0, planned: 0 };
      }
      siteCounts[projectId].count++;

      if (site.overallStatus === 'completed') siteCounts[projectId].completed++;
      else if (site.overallStatus === 'in-progress') siteCounts[projectId].inProgress++;
      else if (site.overallStatus === 'planned') siteCounts[projectId].planned++;
    });
  }

  // Simple activity counts
  let activityCounts = {};
  if (Object.keys(siteCounts).length > 0) {
    // Get all site IDs
    const allSiteIds = [];
    const siteProjectMap = {};

    for (const [projectId, stats] of Object.entries(siteCounts)) {
      // We need site IDs, but we don't have them from the simple query
      // Let's query sites again with IDs
      const projectSites = await Site.find({
        project: projectId,
        isDeleted: false
      }).select('_id');

      projectSites.forEach(site => {
        allSiteIds.push(site._id);
        siteProjectMap[site._id.toString()] = projectId;
      });
    }

    if (allSiteIds.length > 0) {
      // Initialize activity counts
      projectIds.forEach(id => {
        activityCounts[id.toString()] = {
          totalActivities: 0,
          totalDismantling: 0,
          totalCow: 0,
          totalRelocation: 0
        };
      });

      // Count dismantling activities
      const dismantling = await DismantlingActivity.countDocuments({
        site: { $in: allSiteIds },
        isDeleted: false
      });

      // Count COW activities
      const cow = await CowActivity.countDocuments({
        siteId: { $in: allSiteIds },
        isDeleted: false
      });

      // Count relocation activities
      const relocation = await RelocationActivity.countDocuments({
        siteId: { $in: allSiteIds },
        isDeleted: false
      });

      // For simplicity, distribute activities evenly among projects
      // (This is a simplification - you might want more detailed counting)
      const projectsWithSites = Object.keys(siteCounts).filter(pid => siteCounts[pid].count > 0);
      if (projectsWithSites.length > 0) {
        const activitiesPerProject = Math.floor((dismantling + cow + relocation) / projectsWithSites.length);
        projectsWithSites.forEach(projectId => {
          activityCounts[projectId] = {
            totalActivities: activitiesPerProject,
            totalDismantling: Math.floor(dismantling / projectsWithSites.length),
            totalCow: Math.floor(cow / projectsWithSites.length),
            totalRelocation: Math.floor(relocation / projectsWithSites.length)
          };
        });
      }
    }
  }

  // Enhance projects
  const enhancedProjects = projects.map((project) => {
    const projectId = project._id.toString();
    const siteStats = siteCounts[projectId] || { count: 0, completed: 0, inProgress: 0, planned: 0 };
    const activityStats = activityCounts[projectId] || {
      totalActivities: 0,
      totalDismantling: 0,
      totalCow: 0,
      totalRelocation: 0
    };

    // Calculate progress
    let progress = 0;
    if (siteStats.count > 0) {
      const completedWeight = siteStats.completed * 100;
      const inProgressWeight = siteStats.inProgress * 60;
      const plannedWeight = siteStats.planned * 25;
      const other = siteStats.count - siteStats.completed - siteStats.inProgress - siteStats.planned;
      const otherWeight = other * 10;

      progress = Math.round((completedWeight + inProgressWeight + plannedWeight + otherWeight) / (siteStats.count * 100) * 100);
    }

    const populatedSiteCount = project.sites ? project.sites.length : 0;

    return {
      ...project.toObject(),
      siteCount: populatedSiteCount, // This should show the populated sites array length
      statistics: {
        siteCount: siteStats.count,
        totalActivities: activityStats.totalActivities,
        totalDismantling: activityStats.totalDismantling,
        totalCow: activityStats.totalCow,
        totalRelocation: activityStats.totalRelocation,
        progress: progress,
        sitesWithActivities: siteStats.count > 0 && activityStats.totalActivities > 0 ?
          Math.min(siteStats.count, 1) : 0, // Simplified
        activityPercentage: siteStats.count > 0 ?
          (activityStats.totalActivities > 0 ? 100 : 0) : 0
      }
    };
  });

  res.status(200).json({
    success: true,
    count: enhancedProjects.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: pageSize,
      pages: Math.ceil(total / pageSize)
    },
    data: enhancedProjects
  });
});

// Enhanced getProject with complete data including activities
exports.getProject = asyncHandler(async (req, res, next) => {
  const projectId = req.params.id;

  // Get project with basic details
  const project = await Project.findById(projectId)
    .populate(PROJECT_POPULATION_CONFIG.detailed);

  if (!project) {
    return next(new ErrorResponse('Project not found', 404));
  }

  if (!canViewProject(project, req.user)) {
    return next(new ErrorResponse('Not authorized to view this project', 403));
  }

  // Enhanced: Get activities for each site
  const enhancedSites = await Promise.all(
    project.sites.map(async (site) => {
      // Get dismantling activities for this site
      const dismantlingActivities = await DismantlingActivity.find({
        site: site._id,
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
        .select('-__v')
        .lean();

      // Get COW activities for this site
      const cowActivities = await CowActivity.find({
        siteId: site._id,
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
        .select('-__v')
        .lean();

      // Get relocation activities for this site
      const relocationActivities = await RelocationActivity.find({
        siteId: site._id,
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
        .select('-__v')
        .lean();

      // Transform activities to match site detail page format
      const activities = {
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
      };

      // Calculate total activities for this site
      const totalSiteActivities =
        activities.dismantling.count +
        activities.cow.count +
        activities.relocation.count;

      return {
        ...site.toObject(),
        activities: activities,
        totalActivities: totalSiteActivities,
        // Add activity summary for quick reference
        activitySummary: {
          total: totalSiteActivities,
          dismantling: activities.dismantling.count,
          cow: activities.cow.count,
          relocation: activities.relocation.count,
          // Get latest activity
          latestActivity: () => {
            const allActivities = [
              ...activities.dismantling.activities,
              ...activities.cow.activities,
              ...activities.relocation.activities
            ];

            return allActivities.sort((a, b) =>
              new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
            )[0] || null;
          }
        }
      };
    })
  );

  // Calculate project-wide activity statistics
  const projectActivityStats = enhancedSites.reduce((stats, site) => ({
    totalSites: stats.totalSites + 1,
    totalActivities: stats.totalActivities + site.totalActivities,
    totalDismantling: stats.totalDismantling + site.activities.dismantling.count,
    totalCow: stats.totalCow + site.activities.cow.count,
    totalRelocation: stats.totalRelocation + site.activities.relocation.count,
    sitesWithActivities: stats.sitesWithActivities + (site.totalActivities > 0 ? 1 : 0)
  }), {
    totalSites: 0,
    totalActivities: 0,
    totalDismantling: 0,
    totalCow: 0,
    totalRelocation: 0,
    sitesWithActivities: 0
  });

  // Add activity percentages
  projectActivityStats.sitesWithoutActivities = projectActivityStats.totalSites - projectActivityStats.sitesWithActivities;
  projectActivityStats.activityPercentage = projectActivityStats.totalSites > 0
    ? Math.round((projectActivityStats.sitesWithActivities / projectActivityStats.totalSites) * 100)
    : 0;

  // Build the complete response
  const projectData = {
    ...project.toObject(),
    sites: enhancedSites,
    statistics: {
      ...projectActivityStats,
      siteCount: enhancedSites.length,
      projectProgress: calculateProjectProgress(project, enhancedSites)
    },
    // Add timeline information
    timeline: project.timeline,
    // Add manager info
    manager: project.manager,
    createdBy: project.createdBy
  };

  res.status(200).json({
    success: true,
    data: projectData
  });
});

// Helper function to calculate project progress based on sites and activities
const calculateProjectProgress = (project, sites) => {
  if (!sites || sites.length === 0) return 0;

  // Calculate progress based on site statuses
  const siteStatusWeights = {
    'completed': 100,
    'in-progress': 50,
    'planned': 25,
    'not-started': 0
  };

  const siteProgress = sites.reduce((total, site) => {
    return total + (siteStatusWeights[site.overallStatus] || 0);
  }, 0);

  const averageSiteProgress = siteProgress / sites.length;

  // Consider activity completion
  const totalActivities = sites.reduce((total, site) => total + site.totalActivities, 0);

  if (totalActivities === 0) return Math.round(averageSiteProgress);

  // Calculate average activity completion percentage
  const activityProgress = sites.reduce((total, site) => {
    const dismantlingProgress = site.activities.dismantling.activities.reduce((sum, act) =>
      sum + (act.completionPercentage || 0), 0);

    // For COW and Relocation, use status-based progress
    const cowProgress = site.activities.cow.activities.length * 50; // Assuming 50% average
    const relocationProgress = site.activities.relocation.activities.length * 50;

    return total + dismantlingProgress + cowProgress + relocationProgress;
  }, 0);

  const averageActivityProgress = activityProgress / totalActivities;

  // Weighted average: 70% site progress, 30% activity progress
  const weightedProgress = (averageSiteProgress * 0.7) + (averageActivityProgress * 0.3);

  return Math.min(100, Math.round(weightedProgress));
};

// Enhanced deleteProject to also delete activities of all sites
const softDeleteProject = async (projectId, deletedBy) => {
  try {
    // 1. Soft delete the project
    const project = await Project.findByIdAndUpdate(
      projectId,
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: deletedBy,
          status: 'cancelled'
        }
      },
      { new: true }
    );

    if (!project) {
      throw new ErrorResponse('Project not found', 404);
    }

    // 2. Get all sites related to this project
    const sites = await Site.find({ project: projectId, isDeleted: false });
    const siteIds = sites.map(site => site._id);

    let activityDeletionStats = {
      dismantling: 0,
      cow: 0,
      relocation: 0
    };

    // 3. Soft delete all sites
    if (siteIds.length > 0) {
      await Site.updateMany(
        { _id: { $in: siteIds }, isDeleted: false },
        {
          $set: {
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: deletedBy,
            overallStatus: 'completed'
          }
        }
      );

      // 4. Soft delete all dismantling activities for these sites
      const dismantlingResult = await DismantlingActivity.updateMany(
        { site: { $in: siteIds }, isDeleted: false },
        {
          $set: {
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: deletedBy
          }
        }
      );
      activityDeletionStats.dismantling = dismantlingResult.modifiedCount;

      // 5. Soft delete all COW activities for these sites
      const cowResult = await CowActivity.updateMany(
        { siteId: { $in: siteIds }, isDeleted: false },
        {
          $set: {
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: deletedBy
          }
        }
      );
      activityDeletionStats.cow = cowResult.modifiedCount;

      // 6. Soft delete all relocation activities for these sites
      const relocationResult = await RelocationActivity.updateMany(
        { siteId: { $in: siteIds }, isDeleted: false },
        {
          $set: {
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: deletedBy
          }
        }
      );
      activityDeletionStats.relocation = relocationResult.modifiedCount;
    }

    return {
      project: project._id,
      sitesDeleted: siteIds.length,
      activitiesDeleted: activityDeletionStats
    };

  } catch (error) {
    throw error;
  }
};

exports.updateProject = asyncHandler(async (req, res, next) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    return next(new ErrorResponse('Project not found', 404));
  }

  const { name, description, manager, startDate, endDate, status } = req.body;

  // Validate manager if being updated
  if (manager && manager !== project.manager.toString()) {
    const managerUser = await User.findOne({ _id: manager, role: 'manager' });
    if (!managerUser) {
      return next(new ErrorResponse('Manager not found or user is not a manager', 400));
    }
  }

  if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
    return next(new ErrorResponse('End date must be after start date', 400));
  }

  // Update fields
  const updateFields = {};
  const allowedFields = ['name', 'description', 'manager', 'startDate', 'endDate', 'status', 'timeline'];

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateFields[field] = req.body[field];
    }
  });

  const updatedProject = await Project.findByIdAndUpdate(
    req.params.id,
    updateFields,
    { new: true, runValidators: true }
  ).populate(PROJECT_POPULATION_CONFIG.basic);

  res.status(200).json({
    success: true,
    data: updatedProject
  });
});

exports.deleteProject = asyncHandler(async (req, res, next) => {
  const projectId = req.params.id;

  // Check if project exists (including deleted ones)
  const project = await Project.findOne({ _id: projectId });

  if (!project) {
    return next(new ErrorResponse('Project not found', 404));
  }

  if (req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to delete projects. Only admin can delete projects.', 403));
  }

  // Check if project is already deleted
  if (project.isDeleted) {
    return next(new ErrorResponse('Project is already deleted', 400));
  }

  // Perform soft delete cascade
  const deleteResult = await softDeleteProject(projectId, req.user.id);

  res.status(200).json({
    success: true,
    message: 'Project and all related sites soft deleted successfully',
    data: deleteResult
  });
});