const mongoose = require('mongoose');
const { ACTIVITY_CONFIGS } = require('./activityUtils');

// ======= CONFIGURATIONS & CONSTANTS =======
const ROLE_MAPPINGS = {
  // Relocation roles
  relocation: {
    civilWork: 'Civil Engineer',
    telecomWork: 'Telecom Engineer',
    surveyWork: 'Surveyor',
    dismantlingWork: 'Dismantling Supervisor',
    storeOperatorWork: 'Store Operator',
  },
  // COW roles
  cow: {
    surveyWork: 'Surveyor',
    inventoryWork: 'Inventory Manager',
    transportationWork: 'Transport Coordinator',
    installationWork: 'Installation Technician',
    teamMember: 'Team Member',
  },
  dismantling: {
  surveyWork: 'Surveyor',
  dismantlingWork: 'Dismantling Crew',
  storeWork: 'Store Manager',
},
};

// ======= UTILITY FUNCTIONS =======
const createMaterialEntry = (material, addedBy, workType, siteType) => ({
  ...material,
  addedBy: material.addedBy || addedBy,
  addedAt: material.addedAt || new Date(),
  workType,
  siteType,
  updatedAt: new Date(),
});

const populateUserInfo = (material) => {
  const materialObj = { ...(material.toObject?.() || material) };

if (material.addedBy && typeof material.addedBy === 'object') {
  materialObj.addedById = material.addedBy._id;
  materialObj.addedByName = material.addedBy.name || 'Unknown';
  materialObj.addedByRole = material.addedBy.role || 'Unknown';
} else {
  materialObj.addedById = material.addedBy || null;
  materialObj.addedByName = 'Unknown';
  materialObj.addedByRole = 'Unknown';
}


  return materialObj;
};

const isUserInArray = (array, userId) => {
  if (!array || !userId) return false;
  return array.some(
    (item) => (item?._id?.toString() || item?.toString()) === userId.toString()
  );
};

// ======= PHASE & ROLE HELPERS =======
exports.getCurrentPhase = (activity, activityType) => {
  if (activityType === 'dismantling') {
    const phases = {
      'dispatch.completed': 'Completed',
      'dismantling.completed': 'Dispatching',
      'survey.completed': 'Dismantling',
      'survey.in-progress': 'Surveying',
    };

    const key = Object.keys(phases).find((key) => {
      const [phase, status] = key.split('.');
      return activity[phase]?.status === status;
    });

    return key ? phases[key] : 'Planned';
  }
  return activity.overallStatus || 'Draft';
};

exports.getRelocationRole = (workType) =>
  ROLE_MAPPINGS.relocation[workType] || 'Team Member';
exports.getCOWRole = (workTypeKey) =>
  ROLE_MAPPINGS.cow[workTypeKey] || 'Worker';
exports.getCOWPhase = (activity) => activity.overallStatus || 'planned';
exports.getDismantlingRole = (workTypeKey) =>
  ROLE_MAPPINGS.dismantling?.[workTypeKey] || 'Team Member';


// ======= DISMANTLING HELPERS =======
exports.getAssignedByInfo = (activity) => {
  const sources = [
    { field: activity.assignment?.assignedBy, name: 'assignment.assignedBy' },
    {
      field: activity.assignActivityTasks?.assignedBy,
      name: 'assignActivityTasks.assignedBy',
    },
    { field: activity.createdBy, name: 'createdBy' },
  ];

  const source = sources.find((s) => s.field);
  return {
    id: source?.field?._id,
    name:
      source?.field?.name ||
      (source?.name === 'createdBy' ? 'System' : 'Unknown'),
  };
};

exports.getDismantlingMaterialLists = (activity) => {
  const materialLists = {};
  const mappings = [
    {
      field: 'survey',
      label: 'Survey',
      role: 'Surveyor',
      teamName: 'Survey Team',
    },
    {
      field: 'dismantling',
      label: 'Dismantling',
      role: 'Dismantling Crew',
      teamName: 'Dismantling Team',
    },
      {
      field: 'dispatch',
      label: 'Dispatch',
      role: 'Store Manager',
      teamName: 'Dispatch Team',
    },
  ];

  mappings.forEach(({ field, label, role, teamName }) => {
    const materials = activity[field]?.materials;
    if (materials?.length > 0) {
      materialLists[`${field}Materials`] = {
        workType: label,
    materials: materials.map((material) => {
  const m = populateUserInfo(material);

  // Only fallback if user was NOT populated
  if (m.addedByName === 'Unknown') {
    m.addedByName = teamName;
    m.addedByRole = role;
  }

  return m;
}),

      };
    }
  });

  return materialLists;
};

// ======= MATERIAL LISTS HELPERS =======
const processMaterials = (site, siteLabel, workTypeKey, targetObject) => {
  const work = site?.[workTypeKey];
  if (!work?.materials?.length) return;

  const workTypeLabel = workTypeKey.replace('Work', '');
  const listKey = `${siteLabel}_${workTypeLabel}`;

  targetObject[listKey] = {
    site: siteLabel,
    workType: workTypeLabel,
    materials: work.materials.map(populateUserInfo),
  };
};

exports.getAllMaterialLists = (activity, config = {}) => {
  const { sites = ['sourceSite', 'destinationSite'], workTypes = [] } = config;
  const materialLists = {};

  sites.forEach((siteName) => {
    const site = activity[siteName];
    if (!site || site.siteRequired === false) return;

    const siteLabel = siteName.replace('Site', '').toLowerCase();
    workTypes.forEach((workType) => {
      processMaterials(site, siteLabel, workType, materialLists);
    });
  });

  return materialLists;
};

exports.getAvailableMaterialListsForRole = (userRole, allMaterialLists) => {
  if (!userRole || !allMaterialLists) return [];

  // Define which roles can see which material lists
  const rolePermissions = {
    'Civil Engineer': ['source_civil', 'destination_civil'],
    'Telecom Engineer': ['source_telecom', 'destination_telecom'],
    Surveyor: ['source_survey', 'destination_survey'],
    'Dismantling Supervisor': ['source_dismantling', 'destination_dismantling'],
    'Store Operator': ['source_storeoperator', 'destination_storeoperator'],
    // For COW roles
    Surveyor: ['source_survey', 'destination_survey'],
    'Inventory Manager': ['source_inventory', 'destination_inventory'],
    'Transport Coordinator': [],
    'Installation Technician': [],
    'Team Member': [], // Team members typically see all lists
    // Dismantling roles
    'Team Leader': Object.keys(allMaterialLists),
    Surveyor: ['surveyMaterials', 'dismantlingMaterials'],
    'Dismantling Crew': ['dismantlingMaterials'],
    'Store Manager': [],
  };

  // Default to all lists for roles not specified
  return rolePermissions[userRole] || Object.keys(allMaterialLists);
};

exports.getAllCOWMaterialLists = (activity) => {
  const config = {
    sites: ['sourceSite', 'destinationSite'],
    workTypes: ['surveyWork', 'inventoryWork'], // Only these two work types have materials
  };

  const materialLists = {};

  config.sites.forEach((siteName) => {
    const site = activity[siteName];
    if (!site) return;

    const siteLabel = siteName.replace('Site', '').toLowerCase();
    config.workTypes.forEach((workType) => {
      if (site.workTypes?.includes(workType.replace('Work', ''))) {
        processMaterials(site, siteLabel, workType, materialLists);
      }
    });
  });

  return materialLists;
};

// ======= TASK CREATION HELPERS =======
const createBaseTask = (activity, type, siteType, workTypeKey, userId) => {
  const roleGetters = {
    relocation: exports.getRelocationRole,
    cow: exports.getCOWRole,
    dismantling: exports.getDismantlingRole,
  };

  const getRole = roleGetters[type];
  const workType = workTypeKey?.replace('Work', '') || '';

  return {
    _id: `${activity._id}_${siteType || 'task'}_${workTypeKey || 'general'}`,
    parentActivityId: activity._id,
    activityType: type,
    myRole: getRole ? getRole(workTypeKey) : 'Unknown',
    siteType: siteType?.replace('Site', '') || '',
    workType,
    assignedBy: activity.createdBy?.name || 'Unknown',
    assignedById: activity.createdBy?._id,
    updatedAt: activity.updatedAt,
    createdAt: activity.createdAt,
  };
};

exports.createDismantlingTask = (
  activity,
  userRole,
  assignmentSource,
  phase,
  currentUserId
) => {
  const assignmentMappings = {
    'assignment.assignedTo': {
      field: 'assignment.assignedTo',
      role: 'Team Leader',
      workTypeKey: 'teamLead',
    },
    'assignActivityTasks.assignSurveyTo': {
      field: 'assignActivityTasks.assignSurveyTo',
      role: 'Surveyor',
      workTypeKey: 'surveyWork',
    },
    'assignActivityTasks.assignDismantlingTo': {
      field: 'assignActivityTasks.assignDismantlingTo',
      role: 'Dismantling Crew',
      workTypeKey: 'dismantlingWork',
    },
    'assignActivityTasks.assignStoreTo': {
      field: 'assignActivityTasks.assignStoreTo',
      role: 'Store Manager',
      workTypeKey: 'storeWork',
    },
  };

  const mapping = assignmentMappings[userRole];
  const specificPhaseTeamMembers = [];

  // ✅ FIX 1: safely read nested "a.b.c" field
  const getNested = (obj, path) => {
    if (!obj || !path) return undefined;
    return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), obj);
  };

  if (mapping) {
    const assignmentArray = getNested(activity, mapping.field); // ✅ instead of activity[mapping.field]
    if (Array.isArray(assignmentArray) && assignmentArray.length > 0) {
      assignmentArray.forEach((user) => {
        if (user?._id && user._id.toString() !== currentUserId.toString()) {
          specificPhaseTeamMembers.push({
            userId: user._id,
            name: user.name || 'Unknown',
            email: user.email,
            role: mapping.role,
            assignedIn: mapping.field,
          });
        }
      });
    }
  }

  // ✅ FIX 2: pass workTypeKey so task id becomes unique (surveyWork/dismantlingWork/storeWork)
  const taskData = createBaseTask(
    activity,
    'dismantling',
    null,
    mapping?.workTypeKey || null,
    currentUserId
  );

  const assignedByInfo = exports.getAssignedByInfo(activity);
  const materialLists = exports.getDismantlingMaterialLists(activity);

  return {
    ...taskData,
    title: `${activity.dismantlingType || 'Dismantling'} - ${
      activity.location?.[0]?.city || 'Unknown Location'
    }`,
    site: activity.site || activity._id || 'N/A',
    status: activity.status || 'planned',
    completion: activity.completionPercentage || 0,
    phase: exports.getCurrentPhase(activity, 'dismantling'),
    myRole: mapping?.role || userRole,
    assignedIn: assignmentSource,
    assignedBy: assignedByInfo.name,
    assignedById: assignedByInfo.id,
    otherTeamMembers: specificPhaseTeamMembers,
    dismantlingType: activity.dismantlingType,
    location: activity.location?.[0] || null,
    survey: {
      status: activity.survey?.status || 'pending',
      conductedBy: activity.survey?.conductedBy?.name || 'Not assigned',
      surveyDate: activity.survey?.surveyDate,
     materials: activity.survey?.materials?.map(populateUserInfo) || [],
      addAttachments: Array.isArray(activity.survey?.addAttachments)
        ? activity.survey.addAttachments
        : [],
    },
    dismantling: {
      status: activity.dismantling?.status || 'pending',
      addAttachments: Array.isArray(activity.dismantling?.addAttachments)
        ? activity.dismantling.addAttachments
        : [],
    },
    dispatch: {
      status: activity.dispatch?.status || 'pending',
      addAttachments: Array.isArray(activity.dispatch?.addAttachments)
        ? activity.dispatch.addAttachments
        : [],
    },
    materialLists,
    availableMaterialLists: Object.keys(materialLists),
    canStartDismantling: activity.survey?.status === 'completed',
    needsSurvey: activity.survey?.status !== 'completed',
    ...(phase && {
      currentPhase: phase,
      phaseStatus: activity[phase]?.status || 'pending',
    }),
  };
};

exports.createRelocationTask = (
  activity,
  siteType,
  workTypeKey,
  assignedUserData,
  currentUserId
) => {
  const site = activity[siteType];
  const work = site?.[workTypeKey];
  if (!site || !work || !work.assignedUsers) return null;

  const specificWorkTeamMembers = work.assignedUsers
    .filter(
      (assignedUser) =>
        assignedUser.userId &&
        assignedUser.userId._id?.toString() !== currentUserId.toString()
    )
    .map((assignedUser) => ({
      userId: assignedUser.userId._id,
      name: assignedUser.userId.name || 'Unknown',
      email: assignedUser.userId.email,
      role: assignedUser.role || exports.getRelocationRole(workTypeKey),
      site: siteType.replace('Site', ''),
      workType: workTypeKey.replace('Work', ''),
      assignedIn: `${siteType}.${workTypeKey}.assignedUsers`,
    }));

  const allMaterialLists = exports.getAllMaterialLists(activity, {
    sites: ACTIVITY_CONFIGS?.relocation?.sites,
    workTypes: ACTIVITY_CONFIGS?.relocation?.workTypes,
  });

  const taskData = createBaseTask(
    activity,
    'relocation',
    siteType,
    workTypeKey,
    currentUserId
  );

  return {
    ...taskData,
    title: `Relocation → ${
      siteType === 'destinationSite' ? 'Destination' : 'Source'
    } Site`,
    site: activity.site || activity.siteId || 'N/A',
    status: activity.overallStatus || 'draft',
    completion: 0,
    phase: activity.overallStatus || 'draft',
    assignedIn: `${siteType}.${workTypeKey}.assignedUsers`,
    siteAddress: site?.address,
    workStatus: work?.status || 'not-started',
    otherTeamMembers: specificWorkTeamMembers,
    allMaterialLists,
    availableMaterialLists: exports.getAvailableMaterialListsForRole(
      taskData.myRole,
      allMaterialLists
    ),
    addAttachments: Array.isArray(work?.addAttachments)
      ? work.addAttachments
      : [],
    relocationType: activity.relocationType,
    sourceSite:
      activity.sourceSite?.siteRequired !== false
        ? {
            address: activity.sourceSite.address,
            siteName: activity.sourceSite.siteName,
            operatorName: activity.sourceSite.operatorName,
          }
        : null,
    destinationSite:
      activity.destinationSite?.siteRequired !== false
        ? {
            address: activity.destinationSite.address,
            siteName: activity.destinationSite.siteName,
            operatorName: activity.destinationSite.operatorName,
          }
        : null,
    materials: work?.materials?.map(populateUserInfo) || [],
    notes: work?.notes || '',
  };
};

exports.createCOWTask = (
  activity,
  siteType,
  workTypeKey,
  assignedUserData,
  currentUserId
) => {
  const site = activity[siteType];
  const work = site?.[workTypeKey];
  if (!site || !work || !work.assignedUsers) return null;

  const specificWorkTeamMembers = work.assignedUsers
    .filter(
      (assignedUser) =>
        assignedUser.userId &&
        assignedUser.userId._id?.toString() !== currentUserId.toString()
    )
    .map((assignedUser) => ({
      userId: assignedUser.userId._id,
      name: assignedUser.userId.name || 'Unknown',
      email: assignedUser.userId.email,
      role: assignedUser.role || exports.getCOWRole(workTypeKey),
      site: siteType,
      workType: workTypeKey.replace('Work', ''),
      assignedIn: `${siteType}.${workTypeKey}.assignedUsers`,
    }));

  const allMaterialLists = exports.getAllCOWMaterialLists(activity);

  const workData = {
    status: work.status || 'not-started',
    notes: work.notes || '',
    attachments: Array.isArray(work.attachments) ? work.attachments : [],
    startTime: work.startTime,
    endTime: work.endTime,
    materials: work.materials?.map(populateUserInfo) || [],
  };

  if (workTypeKey === 'transportationWork') {
    workData.vehicleNumber = work.vehicleNumber || '';
    workData.driverName = work.driverName || '';
    workData.driverContact = work.driverContact || '';
  } else if (workTypeKey === 'installationWork') {
    workData.equipmentInstalled = work.equipmentInstalled || [];
  }

  const taskData = createBaseTask(
    activity,
    'cow',
    siteType,
    workTypeKey,
    currentUserId
  );

  return {
    ...taskData,
    title: `${activity.activityName} - ${
      siteType === 'sourceSite' ? 'Source' : 'Destination'
    } Site`,
    siteId: activity.siteId?._id || 'N/A',
    siteName: activity.siteId?.name || 'Unknown Site',
    status: activity.overallStatus || 'planned',
    completion: 0,
    phase: exports.getCOWPhase(activity),
    assignedIn: `${siteType}.${workTypeKey}.assignedUsers`,
    siteLocation: site.location,
    workStatus: work.status || 'not-started',
    otherTeamMembers: specificWorkTeamMembers,
    allMaterialLists,
    availableMaterialLists: Object.keys(allMaterialLists),
    workData,
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
    actualStartDate: activity.actualStartDate,
    actualEndDate: activity.actualEndDate,
    notes: activity.notes || '',
  };
};
