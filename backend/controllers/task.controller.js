const {
  getModel,
  getPopulateFields,
  ACTIVITY_CONFIGS,
  buildUserQuery,
} = require('../helpers/activityUtils');
const {
  createDismantlingTask,
  createRelocationTask,
  createCOWTask,
  getCOWRole,
  isUserInArray,
} = require('../helpers/activityHelpers');

const {
  syncSurveyMaterialsToInventory,
} = require('../helpers/activityInventorySync');

const {
  upsertInventoryAllocationRequestFromPhase,
} = require('../helpers/inventoryAllocationRequest.helper');

const {
  handleInventoryAfterPhaseUpdate,
} = require('../helpers/InventoryAfterPhaseUpdate');

const Inventory = require('../models/Inventory.model');

// ========== ACTIVITY PROCESSING FUNCTIONS ==========
const processDismantlingActivities = (activity, userId) => {
  const tasks = [];

  // Check Team Leader assignment
  if (
    activity.assignment?.assignedTo?.some((u) => u._id.toString() === userId)
  ) {
    tasks.push(
      createDismantlingTask(
        activity,
        'assignment.assignedTo',
        'assignment.assignedTo',
        null,
        userId
      )
    );
  }

  // Check Survey assignment
  if (
    activity.assignActivityTasks?.assignSurveyTo?.some(
      (u) => u._id.toString() === userId
    )
  ) {
    tasks.push(
      createDismantlingTask(
        activity,
        'assignActivityTasks.assignSurveyTo',
        'assignActivityTasks.assignSurveyTo',
        'survey',
        userId
      )
    );
  }

  // Check Dismantling assignment
  if (
    activity.assignActivityTasks?.assignDismantlingTo?.some(
      (u) => u._id.toString() === userId
    )
  ) {
    tasks.push(
      createDismantlingTask(
        activity,
        'assignActivityTasks.assignDismantlingTo',
        'assignActivityTasks.assignDismantlingTo',
        'dismantling',
        userId
      )
    );
  }

  // Check Store assignment
  if (
    activity.assignActivityTasks?.assignStoreTo?.some(
      (u) => u._id.toString() === userId
    )
  ) {
    tasks.push(
      createDismantlingTask(
        activity,
        'assignActivityTasks.assignStoreTo',
        'assignActivityTasks.assignStoreTo',
        'dispatch',
        userId
      )
    );
  }

  // If user is creator but not assigned to any specific role
  if (
    tasks.length === 0 &&
    activity.createdBy &&
    activity.createdBy._id.toString() === userId
  ) {
    tasks.push(
      createDismantlingTask(activity, 'Creator', 'createdBy', null, userId)
    );
  }

  return tasks;
};

const processRelocationActivities = (activity, userId) => {
  const tasks = [];
  const sites = ACTIVITY_CONFIGS.relocation.sites;
  const workTypes = ACTIVITY_CONFIGS.relocation.workTypes;

  sites.forEach((siteType) => {
    const site = activity[siteType];
    if (site) {
      workTypes.forEach((workType) => {
        const work = site[workType];

        if (work?.assignedUsers) {
          const userAssignment = work.assignedUsers.find((assignedUser) => {
            if (!assignedUser.userId) return false;

            const assignedUserId = assignedUser.userId._id
              ? assignedUser.userId._id.toString()
              : assignedUser.userId.toString();

            return assignedUserId === userId;
          });

          if (userAssignment) {
            const task = createRelocationTask(
              activity,
              siteType,
              workType,
              userAssignment,
              userId
            );
            if (task) tasks.push(task);
          }
        }
      });
    }
  });

  return tasks;
};

const processCOWActivities = (activity, userId) => {
  const tasks = [];
  const config = ACTIVITY_CONFIGS.cow;

  // Check work assignments
  config.sites.forEach((siteType) => {
    const site = activity[siteType];
    if (!site) return;

    const configuredWorkTypes = site.workTypes || [];

    configuredWorkTypes.forEach((workTypeName) => {
      const workTypeKey = `${workTypeName}Work`;

      if (!config.workTypes.includes(workTypeKey)) {
        return;
      }

      const work = site[workTypeKey];

      if (!work?.assignedUsers) {
        return;
      }

      const userAssignment = work.assignedUsers.find((assignedUser) => {
        if (!assignedUser.userId) return false;

        const assignedUserId = assignedUser.userId._id
          ? assignedUser.userId._id.toString()
          : assignedUser.userId.toString();
        return assignedUserId === userId;
      });

      if (userAssignment) {
        const task = createCOWTask(
          activity,
          siteType,
          workTypeKey,
          {
            ...userAssignment,
            role: userAssignment.role || getCOWRole(workTypeKey),
          },
          userId
        );
        if (task) tasks.push(task);
      }
    });
  });

  // Check team members assignments
  if (activity.teamMembers?.length > 0) {
    const teamAssignment = activity.teamMembers.find((member) => {
      if (!member.userId) return false;

      const memberUserId = member.userId._id
        ? member.userId._id.toString()
        : member.userId.toString();
      return memberUserId === userId;
    });

    if (teamAssignment) {
      tasks.push(
        createCOWTask(
          activity,
          'team',
          'teamMember',
          {
            ...teamAssignment,
            role: teamAssignment.role || 'Team Member',
          },
          userId
        )
      );
    }
  }
 // console.log("activity" , activity);

  // If user is creator but not assigned to any specific work
  if (tasks.length === 0 && activity.createdBy) {
    const createdById = activity.createdBy._id
      ? activity.createdBy._id.toString()
      : activity.createdBy.toString();

    if (createdById === userId) {
      tasks.push({
        _id: `${activity._id}_creator`,
        parentActivityId: activity._id,
        activityType: 'cow',
        title: `${activity.activityName} - COW Project`,
        siteId: activity.siteId?._id || 'N/A',
        siteName: activity.siteId?.name || 'Unknown Site',
        status: activity.overallStatus || 'planned',
        myRole: 'Project Creator',
        assignedIn: 'createdBy',
        assignedBy: activity.createdBy?.name || 'System',
        assignedById: activity.createdBy?._id,
        purpose: activity.purpose,
        sourceSite: activity.sourceSite
          ? {
              location: activity.sourceSite.location,
              workTypes: activity.sourceSite.workTypes || [],
            }
          : null,
        destinationSite: activity.destinationSite
          ? {
              location: activity.destinationSite.location,
              workTypes: activity.destinationSite.workTypes || [],
            }
          : null,
        plannedStartDate: activity.plannedStartDate,
        plannedEndDate: activity.plannedEndDate,
        updatedAt: activity.updatedAt,
        createdAt: activity.createdAt,
      });
    }
  }
  return tasks;
};

const processActivities = (type, activity, userId) => {
  switch (type) {
    case 'dismantling':
      return processDismantlingActivities(activity, userId);
    case 'relocation':
      return processRelocationActivities(activity, userId);
    case 'cow':
      return processCOWActivities(activity, userId);
    default:
      return [];
  }
};

// ========== MAIN CONTROLLER FUNCTIONS ==========
const getActivities = async (req, res) => {
  const { activityType } = req.params;
  const user = req.user;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const statusFilter = req.query.status;

  try {
    const typesToFetch = activityType
      ? [activityType]
      : Object.keys(ACTIVITY_CONFIGS);
    let allTasks = [];

    for (const type of typesToFetch) {
      const Model = getModel(type);
      let query = { isDeleted: false };

      // RBAC - Find activities where user is assigned
      if (!['super-admin', 'project-manager'].includes(user.role)) {
        query = buildUserQuery(type, user._id, query);
      }

      if (statusFilter) {
        const config = ACTIVITY_CONFIGS[type];
        if (config?.statusField) {
          query[config.statusField] = statusFilter;
        }
      }

      const populateFields = getPopulateFields(type);
      const activities = await Model.find(query)
        .populate(populateFields)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      for (const activity of activities) {
        const userId = user._id.toString();
        const tasks = processActivities(type, activity, userId);
        allTasks = allTasks.concat(tasks);
      }
    }

    // Final sort & pagination
    allTasks.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    const total = allTasks.length;
    const paginated = allTasks.slice((page - 1) * limit, page * limit);

    res.json({
      success: true,
      count: paginated.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: paginated,
    });
  } catch (err) {
    console.error('getActivities error:', err);
    res.status(500).json({ message: err.message });
  }
};

const checkAssignmentOrGlobal = async (req, res, next) => {
  const { activityType, activityId } = req.params;
  const Model = getModel(activityType);

  try {
    const activity = await Model.findById(activityId);
    if (!activity || activity.isDeleted) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    const userId = req.user._id;
    const userRole = req.user.role;

    // Global roles bypass all checks
    if (['super-admin', 'project-manager'].includes(userRole)) {
      req.activity = activity;
      return next();
    }

    let isAssigned = false;
    const config = ACTIVITY_CONFIGS[activityType];

    if (!config) {
      return res.status(400).json({ message: 'Invalid activity type' });
    }

    if (activityType === 'dismantling') {
      const assignedTo = activity.assignment?.assignedTo || [];
      const surveyTo = activity.assignActivityTasks?.assignSurveyTo || [];
      const dismantleTo =
        activity.assignActivityTasks?.assignDismantlingTo || [];
      const storeTo = activity.assignActivityTasks?.assignStoreTo || [];

      isAssigned = [...assignedTo, ...surveyTo, ...dismantleTo, ...storeTo]
        .map((id) => id.toString())
        .includes(userId.toString());
    } else if (activityType === 'relocation' || activityType === 'cow') {
      const checkWorkAssignment = (site) => {
        if (!site) return false;

        if (activityType === 'relocation') {
          return config.workTypes.some((workTypeKey) => {
            const work = site[workTypeKey];
           return work?.assignedUsers?.some((assignedUser) => {
  const assignedUserId = getIdStr(assignedUser?.userId);
  return assignedUserId === userId.toString();
});

          });
        } else {
          const configuredWorkTypes = site.workTypes || [];
          return configuredWorkTypes.some((workTypeName) => {
            const workTypeKey = `${workTypeName}Work`;
            const work = site[workTypeKey];
           return work?.assignedUsers?.some((assignedUser) => {
  const assignedUserId = getIdStr(assignedUser?.userId);
  return assignedUserId === userId.toString();
});

          });
        }
      };

      const isTeamMember =
        activityType === 'cow'
          ? activity.teamMembers?.some(
              (member) =>
                getIdStr(member?.userId) === userId.toString()

            )
          : false;

      isAssigned =
        checkWorkAssignment(activity.sourceSite) ||
        checkWorkAssignment(activity.destinationSite) ||
        isTeamMember;
    }

    if (!isAssigned) {
      return res
        .status(403)
        .json({ message: 'You are not assigned to this activity' });
    }

    req.activity = activity;
    next();
  } catch (err) {
    console.error('checkAssignmentOrGlobal error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ========== PHASE UPDATE HANDLERS ==========
const dismantlingPhaseHandler = (
  activity,
  phase,
  updates,
  currentUser,
  uploadedAttachments
) => {
  const validPhases = ['survey', 'dismantling', 'dispatch'];
  if (!validPhases.includes(phase)) {
    throw new Error('Invalid phase for dismantling');
  }

  activity[phase] = { ...(activity[phase] || {}), ...(updates || {}) };

  // Add attachments
  if (uploadedAttachments.length > 0) {
    activity[phase] = activity[phase] || {};
    const existing = Array.isArray(activity[phase].addAttachments)
      ? activity[phase].addAttachments
      : [];
    activity[phase].addAttachments = [...existing, ...uploadedAttachments];
  }

  // ---------------- MATERIALS TRACKING (survey + dismantling + dispatch) ----------------
  const applyTrackedMaterials = (phaseKey) => {
    if (!updates || !('materials' in updates)) return; // only if materials key was sent

    const incoming = Array.isArray(updates.materials) ? updates.materials : [];

    const prevMaterials = Array.isArray(activity[phaseKey]?.materials)
      ? activity[phaseKey].materials
      : [];

    activity[phaseKey] = activity[phaseKey] || {};
    activity[phaseKey].materials = incoming.map((m) => {
      const materialId = String(m?.materialId || m?.materialCode || '').trim();

      const existing = prevMaterials.find((x) => {
        const existingId = String(x?.materialId || x?.materialCode || '').trim();
        return existingId && materialId && existingId === materialId;
      });

      return {
        // ✅ your schema field
        materialId,

        // ✅ keep your existing fields
        name: m?.name,
        quantity: Number(m?.quantity || 0),
        unit: m?.unit,
        condition: m?.condition || 'good',
        conditionBreakdown: m?.conditionBreakdown || {},
        canBeReused: m?.canBeReused ?? true,
        notes: m?.notes,

        // ✅ tracking (preserve if already exists)
        addedBy: m?.addedBy || existing?.addedBy || currentUser._id,
        addedAt: m?.addedAt || existing?.addedAt || new Date(),
        updatedAt: new Date(),
      };
    });
  };

  // Apply tracking for all 3 phases
  if (phase === 'survey') applyTrackedMaterials('survey');
  if (phase === 'dismantling') applyTrackedMaterials('dismantling');
  if (phase === 'dispatch') applyTrackedMaterials('dispatch');

  // Keep your existing survey status/report handling (optional but safe)
  if (phase === 'survey') {
    if (updates?.status) activity.survey.status = updates.status;
    if (updates?.report) activity.survey.report = updates.report;
  }

  // Auto-set dates
  if (updates?.status === 'in-progress' && !activity[phase].startDate) {
    activity[phase].startDate = new Date();
  }
  if (updates?.status === 'completed' && !activity[phase].endDate) {
    activity[phase].endDate = new Date();
  }
};


const relocationPhaseHandler = (
  activity,
  phase,
  subPhase,
  updates,
  currentUser,
  uploadedAttachments
) => {
  const validPhases = ['sourceSite', 'destinationSite'];
  const validSubPhases = ACTIVITY_CONFIGS.relocation.workTypes;

  if (!validPhases.includes(phase)) {
    throw new Error('Phase must be either sourceSite or destinationSite');
  }

  if (!validSubPhases.includes(subPhase)) {
    throw new Error(
      `Invalid subPhase. Must be one of: ${validSubPhases.join(', ')}`
    );
  }

  const site = activity[phase];
  if (!site || site.siteRequired === false) {
    throw new Error(`${phase} is not active`);
  }

  const work = site[subPhase];
  if (!work || work.required === false) {
    throw new Error(`${subPhase} is not required`);
  }

  return commonPhaseUpdate(
    site,
    subPhase,
    updates,
    currentUser,
    uploadedAttachments,
    phase,
    subPhase
  );
};

const cowPhaseHandler = (
  activity,
  phase,
  subPhase,
  updates,
  currentUser,
  uploadedAttachments
) => {
  const validPhases = ['sourceSite', 'destinationSite'];
  const validSubPhases = ACTIVITY_CONFIGS.cow.workTypes;

  if (!validPhases.includes(phase)) {
    throw new Error('Phase must be either sourceSite or destinationSite');
  }

  if (!validSubPhases.includes(subPhase)) {
    throw new Error(
      `Invalid subPhase. Must be one of: ${validSubPhases.join(', ')}`
    );
  }

  const site = activity[phase];
  if (!site) {
    throw new Error(`${phase} not found`);
  }

  const workTypeName = subPhase.replace('Work', '');
  if (!site.workTypes || !site.workTypes.includes(workTypeName)) {
    throw new Error(`${workTypeName} work is not configured for this site`);
  }

  let work = site[subPhase];

  if (!work) {
    work = {
      status: 'not-started',
      assignedUsers: [],
      notes: '',
      attachments: [],
      startTime: null,
      endTime: null,
    };

    // Only add materials for survey and inventory work
    if (subPhase === 'surveyWork' || subPhase === 'inventoryWork') {
      work.materials = [];
    }

    site[subPhase] = work;
  }

  const { materials, ...otherUpdates } = updates || {};

  // Apply other updates
  Object.keys(otherUpdates).forEach((key) => {
    if (otherUpdates[key] !== undefined) {
      work[key] = otherUpdates[key];
    }
  });

  // Handle materials ONLY for survey and inventory work
  if (
    (subPhase === 'surveyWork' || subPhase === 'inventoryWork') &&
    materials !== undefined
  ) {
    // If materials array is provided, REPLACE all materials (not update)
    if (Array.isArray(materials)) {
      // Create new materials array with tracking info
      const newMaterials = materials
        .map((material) => {
          if (!material || !material.materialCode) return null;

          // Check if this material already exists to preserve addedBy/addedAt
          const existingMaterial = work.materials?.find(
            (existing) => existing.materialCode === material.materialCode
          );

          return {
            ...material,
            addedBy:
              material.addedBy || existingMaterial?.addedBy || currentUser._id,
            addedAt:
              material.addedAt || existingMaterial?.addedAt || new Date(),
            workType: workTypeName,
            siteType: phase.replace('Site', ''),
            updatedAt: new Date(),
          };
        })
        .filter(Boolean); // Remove null entries

      // REPLACE all materials with the new array
      work.materials = newMaterials;

    } else if (typeof materials === 'object' && materials.materialCode) {
      // Single material object - update or add
      if (!Array.isArray(work.materials)) {
        work.materials = [];
      }

      const existingIndex = work.materials.findIndex(
        (existing) => existing.materialCode === materials.materialCode
      );

      const trackedMaterial = {
        ...materials,
        addedBy: materials.addedBy || currentUser._id,
        addedAt: materials.addedAt || new Date(),
        workType: workTypeName,
        siteType: phase.replace('Site', ''),
      };

      if (existingIndex > -1) {
        // Update existing material
        const originalMaterial = work.materials[existingIndex];
        work.materials[existingIndex] = {
          ...originalMaterial,
          ...materials,
          addedBy:
            materials.addedBy || originalMaterial.addedBy || currentUser._id,
          addedAt: materials.addedAt || originalMaterial.addedAt || new Date(),
          updatedAt: new Date(),
        };
      } else {
        // Add new material
        work.materials.push(trackedMaterial);
      }
    } else if (materials === null) {
      // If materials is explicitly null, clear all materials
      work.materials = [];
    }
  }

  // Auto-set start/end times based on status
  if (updates?.status === 'in-progress' && !work.startTime) {
    work.startTime = new Date();
  }

  if (updates?.status === 'completed' && !work.endTime) {
    work.endTime = new Date();
  }

  // Special handling for transportation work
  if (subPhase === 'transportationWork') {
    if (updates?.status === 'loading') {
      work.startTime = new Date();
    } else if (updates?.status === 'completed') {
      work.endTime = new Date();
    }
  }

  // Handle attachments
  if (uploadedAttachments.length > 0) {
    if (!Array.isArray(work.attachments)) {
      work.attachments = [];
    }
    work.attachments = [...work.attachments, ...uploadedAttachments];
  }

  return site;
};

const commonPhaseUpdate = (
  site,
  subPhase,
  updates,
  currentUser,
  uploadedAttachments,
  siteType,
  workType
) => {
  // Add attachments
  const attachmentField = 'addAttachments';
  if (uploadedAttachments.length > 0) {
    site[subPhase] = site[subPhase] || {};
    const existing = Array.isArray(site[subPhase][attachmentField])
      ? site[subPhase][attachmentField]
      : [];
    site[subPhase][attachmentField] = [...existing, ...uploadedAttachments];
  }

  const { materials, ...otherUpdates } = updates || {};

  Object.assign(site[subPhase], otherUpdates);

  if (materials !== undefined) {
    if (!Array.isArray(site[subPhase].materials)) {
      site[subPhase].materials = [];
    }

    if (Array.isArray(materials)) {
      const trackedMaterials = materials.map((material) => ({
        ...material,
        addedBy: currentUser._id,
        addedAt: new Date(),
        workType: workType,
        siteType: siteType.replace('Site', ''),
      }));
      site[subPhase].materials = trackedMaterials;
    } else if (typeof materials === 'object' && materials.materialCode) {
      const trackedMaterial = {
        ...materials,
        addedBy: currentUser._id,
        addedAt: new Date(),
        workType: workType,
        siteType: siteType.replace('Site', ''),
      };

      const existingIndex = site[subPhase].materials.findIndex(
        (material) => material.materialCode === materials.materialCode
      );

      if (existingIndex > -1) {
        const originalMaterial = site[subPhase].materials[existingIndex];
        site[subPhase].materials[existingIndex] = {
          ...originalMaterial,
          ...materials,
          addedBy: materials.addedBy || originalMaterial.addedBy,
          addedAt: materials.addedAt || originalMaterial.addedAt,
          updatedAt: new Date(),
        };
      } else {
        site[subPhase].materials.push(trackedMaterial);
      }
    }
  }

  // Auto-set status
  if (!site[subPhase].status) {
    const hasProgress =
      (otherUpdates && Object.keys(otherUpdates).length > 0) ||
      (materials && (Array.isArray(materials) ? materials.length > 0 : true));

    if (hasProgress && site[subPhase].status === 'not-started') {
      site[subPhase].status = 'in-progress';
    }
  }

  // Auto-set times
  if (updates?.status === 'in-progress' && !site[subPhase].startTime) {
    site[subPhase].startTime = new Date();
  }
  if (updates?.status === 'completed' && !site[subPhase].endTime) {
    site[subPhase].endTime = new Date();
  }

  if (subPhase === 'transportationWork') {
    if (updates?.status === 'loading') {
      site[subPhase].startTime = new Date();
    } else if (updates?.status === 'completed') {
      site[subPhase].endTime = new Date();
    }
  }

  return site;
};

// ========== STATUS UPDATE HELPERS ==========
const updateCOWSiteStatus = (activity, siteType) => {
  const site = activity[siteType];
  if (!site?.workTypes) return;

  const workStatuses = site.workTypes
    .map((workType) => site[`${workType}Work`]?.status)
    .filter(Boolean);

  if (workStatuses.length === 0) {
    site.siteStatus = 'not-started';
  } else if (workStatuses.every((status) => status === 'completed')) {
    site.siteStatus = 'completed';
  } else if (
    workStatuses.some(
      (status) => status === 'in-progress' || status === 'completed'
    )
  ) {
    site.siteStatus = 'in-progress';
  } else {
    site.siteStatus = 'not-started';
  }
};

const updateCOWOverallStatus = (activity) => {
  const sites = [activity.sourceSite, activity.destinationSite].filter(Boolean);

  if (sites.length === 0) {
    activity.overallStatus = 'planned';
    return;
  }

  const allCompleted = sites.every((site) => site.siteStatus === 'completed');
  const anyInProgress = sites.some((site) => site.siteStatus === 'in-progress');
  const anyStarted = sites.some((site) => site.siteStatus !== 'not-started');

  if (allCompleted) {
    activity.overallStatus = 'completed';
  } else if (anyInProgress || anyStarted) {
    activity.overallStatus = 'in-progress';
  } else {
    activity.overallStatus = 'planned';
  }
};


const getIdStr = (v) => {
  if (!v) return null;
  if (typeof v === 'string') return v;
  if (v._id) return String(v._id);
  return String(v);
};


// ========== UPDATE PHASE FUNCTION ==========
const updatePhase = async (req, res) => {
  const { activityType, activityId } = req.params;
  const { phase, subPhase, updates, inventoryLocation, inventoryLocationName } =
    req.body;
  const currentUser = req.user;
  

  const uploadedAttachments = Array.isArray(req.files)
    ? req.files.map((file) => `/uploads/attachments/${file.filename}`)
    : [];

  const Model = getModel(activityType);
  let activity = req.activity;

  try {
    if (!activity) {
      activity = await Model.findById(activityId);

      if (!activity || activity.isDeleted) {
        return res.status(404).json({ message: 'Activity not found' });
      }
    }
    const beforeSnapshot = activity.toObject({ depopulate: true });

    // Handle different activity types
    if (activityType === 'dismantling') {
      if (!phase) throw new Error('Phase is required for dismantling');
      dismantlingPhaseHandler(
        activity,
        phase,
        updates,
        currentUser,
        uploadedAttachments
      );

      // Update dismantling status
      if (phase === 'survey' && updates?.status === 'completed') {
        if (activity.dismantling?.status === 'completed') {
          if (activity.dispatch?.status === 'completed') {
            activity.status = 'completed';
          } else {
            activity.status = 'dispatching';
          }
        } else {
          activity.status = 'dismantling';
        }
      } else if (phase === 'dismantling' && updates?.status === 'completed') {
        if (activity.dispatch?.status === 'completed') {
          activity.status = 'completed';
        } else {
          activity.status = 'dispatching';
        }
      } else if (phase === 'dispatch' && updates?.status === 'completed') {
        activity.status = 'completed';
      } else if (updates?.status === 'in-progress') {
        if (phase === 'survey') activity.status = 'surveying';
        else if (phase === 'dismantling') activity.status = 'dismantling';
        else if (phase === 'dispatch') activity.status = 'dispatching';
      }
    } else if (activityType === 'relocation') {
      if (!phase || !subPhase)
        throw new Error('Phase and subPhase are required for relocation');
      relocationPhaseHandler(
        activity,
        phase,
        subPhase,
        updates,
        currentUser,
        uploadedAttachments
      );

      // Update relocation overall status
      const sourceCompleted = activity.sourceSite?.siteStatus === 'completed';
      const destCompleted =
        activity.destinationSite?.siteStatus === 'completed';

      if (sourceCompleted && destCompleted) {
        activity.overallStatus = 'completed';
      } else if (
        activity.sourceSite?.siteStatus === 'in-progress' ||
        activity.destinationSite?.siteStatus === 'in-progress'
      ) {
        activity.overallStatus = 'active';
      } else {
        activity.overallStatus = 'draft';
      }
    } else if (activityType === 'cow') {
      if (!phase || !subPhase)
        throw new Error('Phase and subPhase are required for COW');
      cowPhaseHandler(
        activity,
        phase,
        subPhase,
        updates,
        currentUser,
        uploadedAttachments
      );

      // Update COW status
      updateCOWSiteStatus(activity, phase);
      updateCOWOverallStatus(activity);
    } else {
      throw new Error('Invalid activity type');
    }

    // Update audit fields
    activity.updatedBy = currentUser._id;
    activity.updatedAt = new Date();

    await activity.save();

   

    const afterSnapshot = activity.toObject({ depopulate: true });
 
    let inventorySync = null;

    try {
       inventorySync = await handleInventoryAfterPhaseUpdate({
        activityType,
    activity,
    phase,
         subPhase,
     updates,
    beforeSnapshot,
    afterSnapshot,
    currentUser,
    inventoryLocation,
    inventoryLocationName,
      });
    
     
    } catch (syncErr) {
      // if you want strict behavior: throw syncErr;
      // if you want activity save to succeed but sync to fail:
      inventorySync = { synced: false, error: syncErr.message };
    }

    // Populate fields for response
    const populateFields = getPopulateFields(activityType);
    await activity.populate(populateFields);

    res.json({
      success: true,
      message: 'Phase updated successfully',
      data: activity,
      autoUpdated: {
        completionPercentage: activity.completionPercentage || 0,
        overallStatus: activity.status || activity.overallStatus,
      },
      inventorySync,
    });
  } catch (err) {
    console.error('updatePhase error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ========== EXPORTS ==========
module.exports = {
  getActivities,
  checkAssignmentOrGlobal,
  updatePhase,
};
