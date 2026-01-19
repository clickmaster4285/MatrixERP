// controllers/inventoryRequests.controller.js
const mongoose = require('mongoose');
const Inventory = require('../models/Inventory.model');
const InventoryAllocationRequest = require('../models/InventoryAllocationRequest.model');
const {
  applyApprovedMaterialsToActivity,
} = require("../helpers/inventoryAllocationRequest.helper");

const COWActivity = require('../models/COWActivity.model'); // adjust path


const normalizeCode = (v) =>
  String(v || '')
    .toUpperCase()
    .trim();

const normalizeCondition = (v) => {
  const c = String(v || 'good')
    .toLowerCase()
    .trim();
  return ['excellent', 'good', 'fair', 'poor', 'scrap'].includes(c)
    ? c
    : 'good';
};

const normalizeUnit = (v) =>
  String(v || 'pcs')
    .toLowerCase()
    .trim() || 'pcs';

const ensureObjectId = (id, name = 'id') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error(`${name} must be a valid ObjectId`);
    err.statusCode = 400;
    throw err;
  }
  return id;
};

const mergeMaterials = (materials = []) => {
  const merged = new Map();

  for (const m of materials) {
    const raw = m?.materialCode || m?.materialId;
    if (!raw) continue;

    const code = normalizeCode(raw);
    const condition = normalizeCondition(m?.condition);
    const key = `${code}__${condition}`;

    const prev = merged.get(key) || {
      materialCode: code,
      name: m?.name || m?.materialName || code,
      unit: normalizeUnit(m?.unit),
      condition,
      notes: String(m?.notes || ''),
      quantity: 0,
    };

    prev.quantity += Number(m?.quantity || 1);
    merged.set(key, prev);
  }

  return Array.from(merged.values()).filter(
    (x) => x.materialCode && Number(x.quantity) > 0
  );
};


exports.upsertAllocationRequest = async (req, res) => {
  try {
    const {
      activityId,
      activityType,
      activityName,
      phase, // sourceSite/destinationSite
      subPhase, // civilWork/telecomWork/etc
      materials,
      siteId, // optional
    } = req.body;

    if (
      !activityId ||
      !activityType ||
      !phase ||
      !subPhase ||
      !Array.isArray(materials)
    ) {
      return res.status(400).json({
        success: false,
        message:
          'activityId, activityType, phase, subPhase, and materials[] are required',
      });
    }

    ensureObjectId(activityId, 'activityId');
    if (siteId) ensureObjectId(siteId, 'siteId');

    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const normalizedMaterials = mergeMaterials(materials);
    if (!normalizedMaterials.length) {
      return res.status(400).json({
        success: false,
        message: 'materials[] must contain at least one valid item',
      });
    }

    const baseKey = `${activityId}_${activityType}_${phase}_${subPhase}`;

    const existing = await InventoryAllocationRequest.findOne({
      requestKey: baseKey,
    });

    // ✅ Update if pending
    if (existing && existing.status === 'pending') {
      existing.materials = normalizedMaterials;
      existing.activityName = activityName || existing.activityName;
      existing.siteId = siteId || existing.siteId;

      // treat this as "last updated by"
      existing.requestedBy = userId;
      existing.requestedAt = new Date();

      await existing.save();

      return res.status(200).json({
        success: true,
        message: 'Allocation request updated (pending)',
        data: existing,
      });
    }

    // ✅ If already approved/rejected/cancelled: create a version key
    let requestKey = baseKey;
    if (existing && existing.status !== 'pending') {
      const siblings = await InventoryAllocationRequest.countDocuments({
        requestKey: new RegExp(`^${baseKey}_v\\d+$`),
      });
      requestKey = `${baseKey}_v${siblings + 2}`; // v2, v3...
    }

    const doc = await InventoryAllocationRequest.create({
      requestKey,
      activityId,
      activityType,
      activityName: activityName || '',
      phase,
      subPhase,
      siteId: siteId || undefined,

      materials: normalizedMaterials,

      status: 'pending',
      requestedBy: userId,
      requestedAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: 'Allocation request created',
      data: doc,
    });
  } catch (error) {
    const code = error.statusCode || 500;
    return res.status(code).json({
      success: false,
      message: code === 500 ? 'Server error' : error.message,
      error: code === 500 ? error.message : undefined,
    });
  }
};


exports.getAllocationRequests = async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20, search = '' } = req.query;

    const q = {};
    if (status) q.status = status;

    if (search) {
      const r = new RegExp(String(search), 'i');
      q.$or = [
        { activityType: r },
        { activityName: r },
        { phase: r },
        { subPhase: r },
        { requestKey: r },
      ];
    }

    const numericPage = Math.max(1, parseInt(page, 10) || 1);
    const numericLimit = Math.max(1, parseInt(limit, 10) || 20);
    const skip = (numericPage - 1) * numericLimit;

    const [items, total] = await Promise.all([
      InventoryAllocationRequest.find(q)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(numericLimit)
        .populate('requestedBy', 'name email')
        .populate('reviewedBy', 'name email')
        .lean(),
      InventoryAllocationRequest.countDocuments(q),
    ]);

    return res.status(200).json({
      success: true,
      total,
      pagination: {
        page: numericPage,
        limit: numericLimit,
        pages: Math.ceil(total / numericLimit) || 1,
      },
      data: items,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};


exports.approveAllocationRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const reviewerId = req.user?.id || req.user?._id;
    if (!reviewerId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const request = await InventoryAllocationRequest.findById(requestId);
    if (!request) {
      return res
        .status(404)
        .json({ success: false, message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Request is already ${request.status}`,
      });
    }

    const results = [];
    const errors = [];

    // 1) ✅ Allocate from inventory (available -> allocated)
    for (const m of request.materials || []) {
      try {
        const code = String(m.materialCode || '')
          .toUpperCase()
          .trim();
        const qty = Number(m.quantity);

        if (!code) throw new Error('materialCode missing');
        if (!Number.isFinite(qty) || qty <= 0)
          throw new Error('quantity must be > 0');

        const condition = String(m.condition || 'good')
          .toLowerCase()
          .trim();

        const item = await Inventory.findOne({
          materialCode: code,
          isDeleted: false,
        });
        if (!item) throw new Error(`Material ${code} not found`);

        item.conditionBreakdown = item.conditionBreakdown || {
          excellent: 0,
          good: 0,
          fair: 0,
          poor: 0,
          scrap: 0,
        };

        if ((item.availableQuantity || 0) < qty) {
          throw new Error(
            `Insufficient stock. Available: ${item.availableQuantity}, Requested: ${qty}`
          );
        }

        item.availableQuantity = Math.max(
          0,
          (item.availableQuantity || 0) - qty
        );

        if (item.conditionBreakdown[condition] === undefined) {
          item.conditionBreakdown.good = Math.max(
            0,
            (item.conditionBreakdown.good || 0) - qty
          );
        } else {
          item.conditionBreakdown[condition] = Math.max(
            0,
            (item.conditionBreakdown[condition] || 0) - qty
          );
        }

        item.allocatedQuantity = (item.allocatedQuantity || 0) + qty;

        item.activityAllocations = Array.isArray(item.activityAllocations)
          ? item.activityAllocations
          : [];

        const alloc = item.activityAllocations.find(
          (a) =>
            String(a.activityId) === String(request.activityId) &&
            a.activityType === request.activityType &&
            (a.status === 'allocated' || a.status === 'in-use')
        );

        if (alloc) {
          alloc.quantity = (alloc.quantity || 0) + qty;
          alloc.status = 'allocated';
          alloc.allocatedDate = alloc.allocatedDate || new Date();
          alloc.phase = request.phase;
          alloc.subPhase = request.subPhase;
        } else {
          item.activityAllocations.push({
            activityId: request.activityId,
            activityType: request.activityType,
            quantity: qty,
            allocatedDate: new Date(),
            status: 'allocated',
            phase: request.phase,
            subPhase: request.subPhase,
          });
        }

        item.updatedBy = reviewerId;
        item.lastUpdatedAt = new Date();
        await item.save();

        results.push({
          materialCode: code,
          success: true,
          allocatedQuantity: qty,
        });
      } catch (e) {
        errors.push({ materialCode: m.materialCode, error: e.message });
      }
    }

    // If any allocation failed, don't approve request, don't touch activity
    if (errors.length) {
      return res.status(400).json({
        success: false,
        message: 'Some materials could not be allocated',
        results,
        errors,
      });
    }

    // =========================================================
    // ✅ 2) THIS IS THE EXACT PLACE YOU CALL IT
    // =========================================================
    await applyApprovedMaterialsToActivity({
      activityType: request.activityType,
      activityId: request.activityId,
      phase: request.phase,
      subPhase: request.subPhase,
      materials: request.materials,
      userId: reviewerId,
    });

    // 3) Mark request approved
    request.status = 'approved';
    request.reviewedBy = reviewerId;
    request.reviewedAt = new Date();
    await request.save();

    return res.status(200).json({
      success: true,
      message:
        'Request approved, inventory allocated, activity materials updated',
      request,
      results,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};


exports.rejectAllocationRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { decisionNote = '' } = req.body;

    ensureObjectId(requestId, 'requestId');

    const reviewerId = req.user?.id || req.user?._id;
    if (!reviewerId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const request = await InventoryAllocationRequest.findById(requestId);
    if (!request) {
      return res
        .status(404)
        .json({ success: false, message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Request is already ${request.status}`,
      });
    }

    request.status = 'rejected';
    request.reviewedBy = reviewerId;
    request.reviewedAt = new Date();
    request.decisionNote = String(decisionNote || '');

    await request.save();

    return res.status(200).json({
      success: true,
      message: 'Request rejected',
      data: request,
    });
  } catch (error) {
    const code = error.statusCode || 500;
    return res.status(code).json({
      success: false,
      message: code === 500 ? 'Server error' : error.message,
      error: code === 500 ? error.message : undefined,
    });
  }
};

exports.directDeductSurveyMaterials = async (req, res) => {
  try {
    const { activityType, activityId, phase, subPhase, materials } = req.body;
    const userId = req.user?._id;

    // Validation
    if (!activityType || !activityId || !materials?.length) {
      return res.status(400).json({ success: false, message: 'Invalid data: missing required fields' });
    }

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Fetch the COW Activity
    const activity = await COWActivity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ success: false, message: 'COW Activity not found' });
    }

    const results = [];
    const errors = [];
    const materialsToRecord = []; // To save in sourceSite.inventoryWork.materials

    // Process each material
    for (const m of materials) {
      try {
        const code = String(m.materialCode).toUpperCase().trim();
        const qty = Number(m.quantity);
        const condition = String(m.condition || 'good').toLowerCase().trim();

        if (!code || qty <= 0) {
          throw new Error('Invalid material code or quantity');
        }

        // Find in main inventory
        const item = await Inventory.findOne({ materialCode: code, isDeleted: false });
        if (!item) {
          throw new Error('Material not found in inventory');
        }
        if ((item.availableQuantity || 0) < qty) {
          throw new Error('Insufficient stock');
        }

        // === DEDUCT FROM MAIN INVENTORY ===
        item.availableQuantity -= qty;
        item.conditionBreakdown[condition] = (item.conditionBreakdown[condition] || 0) - qty;
        item.allocatedQuantity += qty;

        // Update activity allocation in inventory
        let alloc = item.activityAllocations.find(
          a => String(a.activityId) === String(activityId) && a.activityType === activityType
        );
        if (!alloc) {
          alloc = {
            activityId,
            activityType,
            quantity: 0,
            status: 'allocated',
            phase: phase || 'planned',
            subPhase: subPhase || ''
          };
          item.activityAllocations.push(alloc);
        }
        alloc.quantity += qty;

        item.updatedBy = userId;
        item.lastUpdatedAt = new Date();
        await item.save();

        // === PREPARE MATERIAL RECORD FOR COW ACTIVITY HISTORY ===
        const materialName = item.name?.trim() || code || 'Unknown Material';

        materialsToRecord.push({
          materialCode: code,
          name: materialName,
          quantity: qty,
          unit: item.unit || 'pcs',
          condition: condition,
          conditionBreakdown: { [condition]: qty },
          canBeReused: item.canBeReused ?? true,
          notes: m.notes || '',
          addedBy: userId,
          addedAt: new Date(),
          workType: 'inventory',
          siteType: 'source' // Always source for direct deduction in COW
        });

        results.push({
          materialCode: code,
          name: materialName,
          deducted: qty,
          condition
        });
      } catch (err) {
        errors.push({
          materialCode: m.materialCode,
          error: err.message
        });
      }
    }

    // If any material failed, return partial results
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Some materials failed to deduct',
        results,
        errors
      });
    }

    // === SAVE TO SOURCE SITE INVENTORY WORK ===
    const siteKey = 'sourceSite'; // Fixed: Always source for COW material issuance

    // Ensure inventory work is enabled
    if (!activity[siteKey]?.workTypes?.includes('inventory')) {
      return res.status(400).json({
        success: false,
        message: 'Inventory work is not enabled for the source site'
      });
    }

    // Initialize inventoryWork if missing (shouldn't happen, but safe)
    if (!activity[siteKey].inventoryWork) {
      activity[siteKey].inventoryWork = {
        status: 'not-started',
        assignedUsers: [],
        materials: [],
        notes: '',
        attachments: [],
        startTime: null,
        endTime: null
      };
    }

    // Append materials to history
    activity[siteKey].inventoryWork.materials.push(...materialsToRecord);

    // Optional: Update status to in-progress on first deduction
    if (activity[siteKey].inventoryWork.status === 'not-started' && materialsToRecord.length > 0) {
      activity[siteKey].inventoryWork.status = 'in-progress';
    }

    activity.updatedBy = userId;
    await activity.save();

   
if (String(subPhase || '').toLowerCase() !== 'inventorywork') {
  try {
    await applyApprovedMaterialsToActivity({
      activityType,
      activityId,
      phase,
      subPhase,
      materials,
      userId,
    });
  } catch (applyErr) {
    console.warn(
      'applyApprovedMaterialsToActivity failed (non-critical):',
      applyErr.message
    );
  }
}


    // Success response
    return res.json({
      success: true,
      message: 'Materials successfully deducted from inventory and recorded in source site inventory work',
      results,
      recordedIn: 'sourceSite.inventoryWork.materials'
    });

  } catch (error) {
    console.error('directDeductSurveyMaterials error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};