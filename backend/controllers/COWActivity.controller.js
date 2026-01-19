const COWActivity = require('../models/COWActivity.model');
const mongoose = require('mongoose');

const {
   validateActivityId,
   successResponse,
   errorResponse
} = require('../helpers/cowActivityHelpers');
const Inventory = require('../models/Inventory.model');


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

// Process work data for create/update
const processWorkData = (workType, workData = {}) => {
   if (!workData) return {
      status: 'not-started',
      assignedUsers: [],
      materials: ['surveyWork', 'inventoryWork'].includes(workType) ? [] : undefined,
      notes: '',
      attachments: [],
      startTime: null,
      endTime: null
   };

   // Special handling for transportation work status
   let status = workData.status || 'not-started';
   if (workType === 'transportationWork') {
      if (workData.status && ['loading', 'in-transit', 'unloading'].includes(workData.status)) {
         status = workData.status;
      }
   }

   const baseData = {
      status,
      assignedUsers: workData.assignedUsers ? convertAssignedUsers(workData.assignedUsers) : [],
      notes: workData.notes || '',
      attachments: workData.attachments || [],
      startTime: workData.startTime || null,
      endTime: workData.endTime || null,
      // Work type specific fields
      ...(workType === 'transportationWork' && {
         vehicleNumber: workData.vehicleNumber || '',
         driverName: workData.driverName || '',
         driverContact: workData.driverContact || ''
      })
   };

   // Only add materials field for survey and inventory work
   if (workType === 'surveyWork' || workType === 'inventoryWork') {
      baseData.materials = [];
   }

   return baseData;  // Fixed: Added return statement
};

// Process site data for create/update
const processSiteData = (siteData, siteType) => {
   if (!siteData) return null;

   const workTypes = ['surveyWork', 'inventoryWork', 'transportationWork', 'installationWork'];

   // Initialize work types based on siteData.workTypes array
   const processedWork = {};
   workTypes.forEach(workType => {
      processedWork[workType] = processWorkData(workType, siteData[workType]);
   });

   return {
      location: siteData.location || {},
      workTypes: siteData.workTypes || [],
      siteStatus: 'not-started',
      ...processedWork
   };
};

// ========= CREATE COW ACTIVITY =========
exports.createCOWActivity = async (req, res) => {
   try {
      const {
         activityName,
         siteId,
         purpose,
         description = '',
         plannedStartDate,
         plannedEndDate,
         sourceSite = {},
         destinationSite = {},
         teamMembers = [],
         notes = ''
      } = req.body;

      // Validate required fields
      if (!activityName) {
         return errorResponse(res, 'Activity name is required', null, 400);
      }

      if (!siteId) {
         return errorResponse(res, 'Site ID is required', null, 400);
      }

      if (!purpose) {
         return errorResponse(res, 'Purpose is required', null, 400);
      }

      // Validate purpose
      const validPurposes = ['event-coverage', 'disaster-recovery', 'network-expansion', 'maintenance', 'testing', 'other'];
      if (!validPurposes.includes(purpose)) {
         return errorResponse(res, `Invalid purpose. Must be one of: ${validPurposes.join(', ')}`, null, 400);
      }

      // Process site data
      const processedSourceSite = processSiteData(sourceSite, 'source');
      const processedDestinationSite = processSiteData(destinationSite, 'destination');

      // Process team members
      const processedTeamMembers = convertAssignedUsers(teamMembers);

      // Create activity data
      const activityData = {
         activityName,
         siteId: new mongoose.Types.ObjectId(siteId),
         purpose,
         description,
         plannedStartDate: plannedStartDate ? new Date(plannedStartDate) : null,
         plannedEndDate: plannedEndDate ? new Date(plannedEndDate) : null,
         notes,
         createdBy: req.user._id,
         sourceSite: processedSourceSite,
         destinationSite: processedDestinationSite,
         teamMembers: processedTeamMembers,
         overallStatus: 'planned'
      };

      // Create and save
      const activity = new COWActivity(activityData);
      await activity.save();

      // Populate basic fields for response
      const populatedActivity = await activity.populate([
         { path: 'siteId', select: 'name siteId region' },
         { path: 'createdBy', select: 'name email role' },
         { path: 'teamMembers.userId', select: 'name email role' }
      ]);

      return successResponse(res, 'COW activity created successfully!', populatedActivity, 201);

   } catch (error) {
      console.error('Create COW Activity Error:', error);
      return errorResponse(res, 'Failed to create COW activity', error.message);
   }
};

// ========= GET ALL COW ACTIVITIES =========
exports.getAllCOWActivities = async (req, res) => {
   try {
      const {
         page = 1,
         limit = 10,
         sortBy = 'createdAt',
         sortOrder = 'desc',
         search,
         purpose,
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

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const limitNum = parseInt(limit);

      // Sorting
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute query
      const [activities, total] = await Promise.all([
         COWActivity.find(query)
            .populate([
               { path: 'siteId', select: 'name siteId region' },
               { path: 'createdBy', select: 'name email' },
               { path: 'updatedBy', select: 'name email' },
               { path: 'teamMembers.userId', select: 'name email role' }
            ])
            .sort(sort)
            .skip(skip)
            .limit(limitNum),
         COWActivity.countDocuments(query)
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

      return successResponse(res, 'COW activities retrieved successfully', response);

   } catch (error) {
      console.error('Error fetching COW activities:', error);
      return errorResponse(res, 'Failed to fetch COW activities', error);
   }
};

// ========= GET BY ID =========
exports.getCOWActivityById = async (req, res) => {
   try {
      const { id } = req.params;

      // Validate ID
      if (!validateActivityId(id)) {
         return errorResponse(res, 'Invalid COW activity ID', null, 400);
      }

      // Find with populated fields
      const activity = await COWActivity.findById(id)
         .populate([
            { path: 'siteId', select: 'name siteId region' },
            { path: 'createdBy', select: 'name email role' },
            { path: 'updatedBy', select: 'name email role' },
            { path: 'teamMembers.userId', select: 'name email role' },
            // Populate assigned users in all work types
            { path: 'sourceSite.surveyWork.assignedUsers.userId', select: 'name email role' },
            { path: 'sourceSite.inventoryWork.assignedUsers.userId', select: 'name email role' },
            { path: 'sourceSite.transportationWork.assignedUsers.userId', select: 'name email role' },
            { path: 'sourceSite.installationWork.assignedUsers.userId', select: 'name email role' },
            { path: 'destinationSite.surveyWork.assignedUsers.userId', select: 'name email role' },
            { path: 'destinationSite.inventoryWork.assignedUsers.userId', select: 'name email role' },
            { path: 'destinationSite.transportationWork.assignedUsers.userId', select: 'name email role' },
            { path: 'destinationSite.installationWork.assignedUsers.userId', select: 'name email role' }
         ]);

      if (!activity) {
         return errorResponse(res, 'COW activity not found', null, 404);
      }

      return successResponse(res, 'COW activity retrieved successfully', activity);

   } catch (error) {
      console.error('Error fetching COW activity:', error);
      return errorResponse(res, 'Failed to fetch COW activity', error);
   }
};

// ========= UPDATE ACTIVITY (BASIC INFO ONLY) =========
exports.updateCOWActivity = async (req, res) => {
   try {
      const { id } = req.params;
      const updateData = req.body;

      // Validate ID
      if (!validateActivityId(id)) {
         return errorResponse(res, 'Invalid COW activity ID', null, 400);
      }

      // Check if activity exists
      const existingActivity = await COWActivity.findById(id);
      if (!existingActivity) {
         return errorResponse(res, 'COW activity not found', null, 404);
      }

      // Prepare update object - only basic fields
      const updateObject = {
         updatedBy: req.user._id,
         updatedAt: new Date()
      };

      // Allowed basic fields to update
      const allowedFields = [
         'activityName',
         'purpose',
         'description',
         'plannedStartDate',
         'plannedEndDate',
         'actualStartDate',
         'actualEndDate',
         'notes',
         'overallStatus'
      ];

      // Copy allowed fields
      allowedFields.forEach(field => {
         if (updateData[field] !== undefined) {
            updateObject[field] = updateData[field];
         }
      });

      // Process team members update
      if (updateData.teamMembers !== undefined) {
         updateObject.teamMembers = convertAssignedUsers(updateData.teamMembers);
      }

      // Process site updates (basic info only)
      const workTypes = ['surveyWork', 'inventoryWork', 'transportationWork', 'installationWork'];

      if (updateData.sourceSite) {
         updateObject.sourceSite = {
            ...existingActivity.sourceSite.toObject(),
            location: updateData.sourceSite.location || existingActivity.sourceSite.location,
            workTypes: updateData.sourceSite.workTypes || existingActivity.sourceSite.workTypes
         };

         // Update work types
         workTypes.forEach(workType => {
            if (updateData.sourceSite[workType]) {
               updateObject.sourceSite[workType] = {
                  ...existingActivity.sourceSite[workType],
                  notes: updateData.sourceSite[workType].notes || existingActivity.sourceSite[workType]?.notes || '',
                  assignedUsers: updateData.sourceSite[workType].assignedUsers
                     ? convertAssignedUsers(updateData.sourceSite[workType].assignedUsers)
                     : existingActivity.sourceSite[workType]?.assignedUsers || [],
                  // Keep existing materials, status, and work-specific fields
                  materials: existingActivity.sourceSite[workType]?.materials || [],
                  status: updateData.sourceSite[workType].status || existingActivity.sourceSite[workType]?.status || 'not-started',
                  startTime: updateData.sourceSite[workType].startTime || existingActivity.sourceSite[workType]?.startTime,
                  endTime: updateData.sourceSite[workType].endTime || existingActivity.sourceSite[workType]?.endTime,
                  attachments: updateData.sourceSite[workType].attachments || existingActivity.sourceSite[workType]?.attachments || [],
                  // Work-specific fields
                  ...(workType === 'transportationWork' && {
                     vehicleNumber: updateData.sourceSite[workType].vehicleNumber || existingActivity.sourceSite[workType]?.vehicleNumber,
                     driverName: updateData.sourceSite[workType].driverName || existingActivity.sourceSite[workType]?.driverName,
                     driverContact: updateData.sourceSite[workType].driverContact || existingActivity.sourceSite[workType]?.driverContact
                  }),
                  ...(workType === 'installationWork' && {
                  })
               };
            }
         });
      }

      if (updateData.destinationSite) {
         updateObject.destinationSite = {
            ...existingActivity.destinationSite.toObject(),
            location: updateData.destinationSite.location || existingActivity.destinationSite.location,
            workTypes: updateData.destinationSite.workTypes || existingActivity.destinationSite.workTypes
         };

         // Update work types
         workTypes.forEach(workType => {
            if (updateData.destinationSite[workType]) {
               updateObject.destinationSite[workType] = {
                  ...existingActivity.destinationSite[workType],
                  notes: updateData.destinationSite[workType].notes || existingActivity.destinationSite[workType]?.notes || '',
                  assignedUsers: updateData.destinationSite[workType].assignedUsers
                     ? convertAssignedUsers(updateData.destinationSite[workType].assignedUsers)
                     : existingActivity.destinationSite[workType]?.assignedUsers || [],
                  // Keep existing materials, status, and work-specific fields
                  materials: existingActivity.destinationSite[workType]?.materials || [],
                  status: updateData.destinationSite[workType].status || existingActivity.destinationSite[workType]?.status || 'not-started',
                  startTime: updateData.destinationSite[workType].startTime || existingActivity.destinationSite[workType]?.startTime,
                  endTime: updateData.destinationSite[workType].endTime || existingActivity.destinationSite[workType]?.endTime,
                  attachments: updateData.destinationSite[workType].attachments || existingActivity.destinationSite[workType]?.attachments || [],
                  // Work-specific fields
                  ...(workType === 'transportationWork' && {
                     vehicleNumber: updateData.destinationSite[workType].vehicleNumber || existingActivity.destinationSite[workType]?.vehicleNumber,
                     driverName: updateData.destinationSite[workType].driverName || existingActivity.destinationSite[workType]?.driverName,
                     driverContact: updateData.destinationSite[workType].driverContact || existingActivity.destinationSite[workType]?.driverContact
                  }),
                  ...(workType === 'installationWork' && {
                  
                  })
               };
            }
         });
      }

      // Perform update
      const updatedActivity = await COWActivity.findByIdAndUpdate(
         id,
         updateObject,
         { new: true, runValidators: true }
      ).populate([
         { path: 'siteId', select: 'name siteId region' },
         { path: 'createdBy', select: 'name email' },
         { path: 'updatedBy', select: 'name email' },
         { path: 'teamMembers.userId', select: 'name email role' }
      ]);

      return successResponse(res, 'COW activity updated successfully', updatedActivity);

   } catch (error) {
      console.error('Error updating COW activity:', error);
      return errorResponse(res, 'Failed to update COW activity', error);
   }
};

// ========= UPDATE WORK PHASE (For updating specific work) =========
exports.updateWorkPhase = async (req, res) => {
   try {
      const { id } = req.params;
      const { siteType, workType, updateData } = req.body; // siteType: 'source' or 'destination'

      // Validate ID
      if (!validateActivityId(id)) {
         return errorResponse(res, 'Invalid COW activity ID', null, 400);
      }

      // Validate required fields
      if (!siteType || !workType) {
         return errorResponse(res, 'Site type and work type are required', null, 400);
      }

      if (!['source', 'destination'].includes(siteType)) {
         return errorResponse(res, 'Site type must be either "source" or "destination"', null, 400);
      }

      // Valid work types
      const validWorkTypes = ['surveyWork', 'inventoryWork', 'transportationWork', 'installationWork'];
      if (!validWorkTypes.includes(workType)) {
         return errorResponse(res, `Invalid work type. Must be one of: ${validWorkTypes.join(', ')}`, null, 400);
      }

      // Find activity
      const activity = await COWActivity.findById(id);
      if (!activity) {
         return errorResponse(res, 'COW activity not found', null, 404);
      }

      // Check if site exists
      const siteKey = `${siteType}Site`;
      if (!activity[siteKey]) {
         return errorResponse(res, `${siteType} site not found in this activity`, null, 404);
      }

      // Check if work type is in site's workTypes
      const simpleWorkType = workType.replace('Work', '');
      if (!activity[siteKey].workTypes.includes(simpleWorkType)) {
         return errorResponse(res, `Work type ${simpleWorkType} is not configured for this site`, null, 400);
      }

      // Prepare update
      const updatePath = `${siteKey}.${workType}`;
      const updateObject = {
         [updatePath]: {
            ...activity[siteKey][workType].toObject(),
            ...updateData
         },
         updatedBy: req.user._id,
         updatedAt: new Date()
      };

      // Handle assigned users
      if (updateData.assignedUsers) {
         updateObject[updatePath].assignedUsers = convertAssignedUsers(updateData.assignedUsers);
      }

      // Handle materials - append new materials
      if (updateData.materials && Array.isArray(updateData.materials)) {
         const newMaterials = updateData.materials.map(material => ({
            ...material,
            addedBy: req.user._id,
            addedAt: new Date(),
            workType: workType,
            siteType: siteType
         }));

         updateObject[updatePath].materials = [
            ...(activity[siteKey][workType].materials || []),
            ...newMaterials
         ];
      }

      // Update activity
      const updatedActivity = await COWActivity.findByIdAndUpdate(
         id,
         { $set: updateObject },
         { new: true, runValidators: true }
      ).populate([
         { path: `${updatePath}.assignedUsers.userId`, select: 'name email role' },
         { path: 'siteId', select: 'name siteId region' }
      ]);

      return successResponse(res, 'Work phase updated successfully', updatedActivity);

   } catch (error) {
      console.error('Error updating work phase:', error);
      return errorResponse(res, 'Failed to update work phase', error);
   }
};

// ========= SOFT DELETE =========
exports.softDeleteCOWActivity = async (req, res) => {
   try {
      const { id } = req.params;

      // Validate ID
      if (!validateActivityId(id)) {
         return errorResponse(res, 'Invalid COW activity ID', null, 400);
      }

      // Find and update
      const updatedActivity = await COWActivity.findByIdAndUpdate(
         id,
         {
            isDeleted: true,
            updatedBy: req.user._id,
            updatedAt: new Date()
         },
         { new: true }
      );

      if (!updatedActivity) {
         return errorResponse(res, 'COW activity not found', null, 404);
      }

      return successResponse(res, 'COW activity deleted successfully', updatedActivity);

   } catch (error) {
      console.error('Error deleting COW activity:', error);
      return errorResponse(res, 'Failed to delete COW activity', error);
   }
};


exports.addMissingInventoryMaterials = async (req, res) => {
  try {
    const { activityId } = req.params;
    const { siteType, materials } = req.body;

    console.log('req.body', req.body);

    if (!activityId) {
      return res
        .status(400)
        .json({ success: false, message: 'activityId required' });
    }

    if (!['source', 'destination'].includes(String(siteType))) {
      return res.status(400).json({
        success: false,
        message: 'siteType must be source or destination',
      });
    }

    const parsedMaterials =
      typeof materials === 'string' ? JSON.parse(materials) : materials;

    if (!Array.isArray(parsedMaterials) || parsedMaterials.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: 'materials[] required' });
    }

    // multer receipt uploads
    const uploadedReceipts = Array.isArray(req.files)
      ? req.files.map((file) => `/uploads/attachments/${file.filename}`)
      : [];

    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // =========================
    // Helpers
    // =========================
    const normalizeCode = (v) => String(v || '').trim().toUpperCase();

    const normalizeUnit = (v) =>
      String(v || 'pcs').trim().toLowerCase() || 'pcs';

    const normalizeCondition = (v) => {
      const c = String(v || 'good').toLowerCase().trim();
      if (['excellent', 'good', 'fair', 'poor', 'scrap'].includes(c)) return c;
      return 'good';
    };

    // =========================
    // 1) Normalize rows (IMPORTANT FIX: DO NOT default takenFrom to own-store)
    // =========================
    const normalized = parsedMaterials
      .map((m) => {
        const code = normalizeCode(m?.materialCode);
        const name = String(m?.name || m?.materialName || '').trim();
        const qty = Number(m?.quantity || 0);

        // ✅ FIX: never default to "own-store"
        // if takenFrom missing/empty -> save as "external" and DO NOT deduct
        const rawTakenFrom = (m?.takenFrom ?? '').toString().trim();
        const takenFromLower = rawTakenFrom.toLowerCase();
        const takenFromToSave = rawTakenFrom || 'external';

        return {
          materialCode: code,
          name,
          quantity: qty,
          unit: normalizeUnit(m?.unit),
          condition: normalizeCondition(m?.condition),
          notes: m?.notes || '',
          canBeReused: Boolean(m?.canBeReused),

          workType: 'inventory',
          siteType,

          // ✅ store fields
          takenFrom: takenFromToSave,
          takenFromCustom: String(m?.takenFromCustom || '').trim(),
          receipts: uploadedReceipts,

          // internal helper (not saved in DB if schema strict, ok)
          __takenFromLower: takenFromLower,

          addedBy: userId,
          addedAt: new Date(),
        };
      })
      .filter((m) => m.materialCode && m.name && m.quantity > 0);

    if (!normalized.length) {
      return res
        .status(400)
        .json({ success: false, message: 'No valid material rows' });
    }

    // =========================
    // 2) Fetch activity
    // =========================
    const doc = await COWActivity.findById(activityId);
    if (!doc || doc.isDeleted) {
      return res
        .status(404)
        .json({ success: false, message: 'COW Activity not found' });
    }

    // =========================
    // 3) Deduct ONLY for takenFrom === "own-store"
    // =========================
    const deductionResults = [];
    const deductionErrors = [];

    // Cache inventory docs by code (reduce DB calls)
    const invCache = new Map();

    for (const m of normalized) {
      const isOwnStore = m.__takenFromLower === 'own-store';

      // ✅ KEY RULE: PTCL / ZONG / ANYTHING ELSE => NO DEDUCTION
      if (!isOwnStore) continue;

      try {
        const code = m.materialCode;
        const qty = Number(m.quantity);
        const condition = String(m.condition || 'good').toLowerCase().trim();

        if (!code || qty <= 0) {
          throw new Error('Invalid material code or quantity');
        }

        // Find inventory item
        let item = invCache.get(code);
        if (!item) {
          item = await Inventory.findOne({ materialCode: code, isDeleted: false });
          if (item) invCache.set(code, item);
        }

        if (!item) throw new Error('Material not found in inventory');
        if ((item.availableQuantity || 0) < qty) throw new Error('Insufficient stock');

        // Ensure conditionBreakdown exists
        if (!item.conditionBreakdown || typeof item.conditionBreakdown !== 'object') {
          item.conditionBreakdown = {
            excellent: 0,
            good: 0,
            fair: 0,
            poor: 0,
            scrap: 0,
          };
        }
        if (typeof item.conditionBreakdown[condition] !== 'number') {
          item.conditionBreakdown[condition] = 0;
        }

        // Optional safety: ensure condition-level available
        if ((item.conditionBreakdown[condition] || 0) < qty) {
          throw new Error(`Insufficient stock in condition "${condition}"`);
        }

        // === DEDUCT ===
        item.availableQuantity -= qty;
        item.conditionBreakdown[condition] -= qty;
        item.allocatedQuantity = Number(item.allocatedQuantity || 0) + qty;

        // Allocation record
        let alloc = Array.isArray(item.activityAllocations)
          ? item.activityAllocations.find(
              (a) =>
                String(a.activityId) === String(activityId) &&
                String(a.activityType) === 'cow'
            )
          : null;

        if (!alloc) {
          if (!Array.isArray(item.activityAllocations)) item.activityAllocations = [];
          alloc = {
            activityId,
            activityType: 'cow',
            quantity: 0,
            status: 'allocated',
            phase: 'inventory',
            subPhase: '',
          };
          item.activityAllocations.push(alloc);
        }
        alloc.quantity = Number(alloc.quantity || 0) + qty;

        item.updatedBy = userId;
        item.lastUpdatedAt = new Date();

        deductionResults.push({
          materialCode: code,
          deducted: qty,
          condition,
        });
      } catch (err) {
        deductionErrors.push({
          materialCode: m.materialCode,
          error: err.message,
        });
      }
    }

    // If any own-store item failed -> don't save anything (keeps consistency)
    if (deductionErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          'Some own-store materials failed to deduct. PTCL/Zong items are NOT deducted.',
        deducted: deductionResults,
        errors: deductionErrors,
      });
    }

    // Save inventory updates (only if we actually deducted something)
    for (const inv of invCache.values()) {
      await inv.save();
    }

    // =========================
    // 4) Push to correct path
    // =========================
    // Remove helper key before saving into activity materials (clean DB)
    const toSaveInActivity = normalized.map(({ __takenFromLower, ...rest }) => rest);

    if (siteType === 'source') {
      if (!doc.sourceSite) doc.sourceSite = {};
      if (!doc.sourceSite.inventoryWork) doc.sourceSite.inventoryWork = {};
      if (!Array.isArray(doc.sourceSite.inventoryWork.materials))
        doc.sourceSite.inventoryWork.materials = [];

      doc.sourceSite.inventoryWork.materials.push(...toSaveInActivity);
      doc.sourceSite.inventoryWork.status = 'in-progress';
      doc.sourceSite.siteStatus = 'in-progress';
    } else {
      if (!doc.destinationSite) doc.destinationSite = {};
      if (!doc.destinationSite.inventoryWork) doc.destinationSite.inventoryWork = {};
      if (!Array.isArray(doc.destinationSite.inventoryWork.materials))
        doc.destinationSite.inventoryWork.materials = [];

      doc.destinationSite.inventoryWork.materials.push(...toSaveInActivity);
      doc.destinationSite.inventoryWork.status = 'in-progress';
      doc.destinationSite.siteStatus = 'in-progress';
    }

    doc.overallStatus = 'in-progress';
    doc.updatedBy = userId;

    await doc.save();

    return res.json({
      success: true,
      message:
        'Missing materials added. Only items with takenFrom="own-store" were deducted from inventory.',
      deductedFromInventory: deductionResults,
      data: doc,
    });
  } catch (err) {
    console.error('addMissingInventoryMaterials error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message,
    });
  }
};
