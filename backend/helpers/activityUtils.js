const RelocationActivity = require('../models/RelocationActivity.model');
const DismantlingActivity = require('../models/dismantlingActivity.model');
const COWActivity = require('../models/COWActivity.model');

// ========== CONFIGURATIONS ==========
exports.ACTIVITY_CONFIGS = {
   dismantling: {
      userQueryFields: [
         'assignment.assignedTo',
         'assignActivityTasks.assignSurveyTo',
         'assignActivityTasks.assignDismantlingTo',
         'assignActivityTasks.assignStoreTo',
         'createdBy'
      ],
      statusField: 'status',
      populateConfig: {
         common: [
            { path: 'createdBy', select: 'name email' },
            { path: 'site', select: 'siteId name siteManager project region' }
         ],
         specific: [
            { path: 'assignment.assignedTo', select: 'name email' },
            { path: 'assignment.assignedBy', select: 'name' },
            { path: 'assignActivityTasks.assignSurveyTo', select: 'name email' },
            { path: 'assignActivityTasks.assignDismantlingTo', select: 'name email' },
            { path: 'assignActivityTasks.assignStoreTo', select: 'name email' },
            { path: 'assignActivityTasks.assignedBy', select: 'name' },
            { path: 'survey.conductedBy', select: 'name' },
            { path: 'dismantling.conductedBy', select: 'name' },
            { path: 'dispatch.conductedBy', select: 'name' },
            { path: 'survey.materials.addedBy', select: 'name role email' },
            { path: 'dismantling.materials.addedBy', select: 'name role email' },
            { path: 'dispatch.materials.addedBy', select: 'name role email' },
         ]
      },
      workTypes: [],
      sites: []
   },

   relocation: {
      statusField: 'overallStatus',
      workTypes: ['civilWork', 'telecomWork', 'surveyWork', 'dismantlingWork', 'storeOperatorWork'],
      sites: ['sourceSite', 'destinationSite'],
      populateConfig: {
         common: [
            { path: 'createdBy', select: 'name email' },
            { path: 'siteId', select: 'siteId name siteManager project region' }
         ],
      }
   },

   cow: {
      statusField: 'overallStatus',
      workTypes: ['surveyWork', 'inventoryWork', 'transportationWork', 'installationWork'],
      sites: ['sourceSite', 'destinationSite'],
      populateConfig: {
         common: [
            { path: 'createdBy', select: 'name email' },
            { path: 'siteId', select: 'siteId name region' },
            { path: 'teamMembers.userId', select: 'name email role' },
            { path: 'updatedBy', select: 'name email' }
         ],
      }
   }
};

// ========== MODEL & POPULATE HELPERS ==========
exports.getModel = (type) => {
   const models = {
      'dismantling': DismantlingActivity,
      'relocation': RelocationActivity,
      'cow': COWActivity
   };

   const model = models[type];
   if (!model) throw new Error(`Invalid activity type: ${type}`);
   return model;
};

exports.getPopulateFields = (type) => {
   const config = exports.ACTIVITY_CONFIGS[type];
   if (!config) return [{ path: 'createdBy', select: 'name email' }];

   const populateFields = [...config.populateConfig.common];

   if (type === 'relocation') {
      config.sites.forEach(site => {
         config.workTypes.forEach(workType => {
            populateFields.push(
               { path: `${site}.${workType}.assignedUsers.userId`, select: 'name email' },
               { path: `${site}.${workType}.materials.addedBy`, select: 'name role' }
            );
         });
      });
   } else if (type === 'cow') {
      config.sites.forEach(site => {
         config.workTypes.forEach(workType => {
            // Only populate materials for surveyWork and inventoryWork
            if (workType === 'surveyWork' || workType === 'inventoryWork') {
               populateFields.push(
                  { path: `${site}.${workType}.materials.addedBy`, select: 'name role' }
               );
            }
            // Always populate assignedUsers for all work types
            populateFields.push(
               { path: `${site}.${workType}.assignedUsers.userId`, select: 'name email role' }
            );
         });
      });
   }

   if (type === 'dismantling') {
      populateFields.push(...config.populateConfig.specific);
   }

   return populateFields;
};

// ========== QUERY BUILDERS ==========
exports.buildUserQuery = (type, userId, baseQuery) => {
   const config = exports.ACTIVITY_CONFIGS[type];
   if (!config) return baseQuery;

   const queryConditions = [{ createdBy: userId }];

   if (type === 'dismantling') {
      config.userQueryFields.slice(1).forEach(field => {
         queryConditions.push({ [field]: userId });
      });
   } else if (type === 'relocation' || type === 'cow') {
      config.sites.forEach(site => {
         config.workTypes.forEach(workType => {
            queryConditions.push({
               [`${site}.${workType}.assignedUsers.userId`]: userId
            });
         });
      });
   }

   if (type === 'cow') {
      queryConditions.push({ 'teamMembers.userId': userId });
   }

   return { ...baseQuery, $or: queryConditions };
};