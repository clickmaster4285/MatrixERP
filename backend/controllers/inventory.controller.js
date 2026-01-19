// controllers/inventory.controller.js
const Inventory = require('../models/Inventory.model');
const Vendor = require('../models/vendor.model');
const mongoose = require('mongoose');

// ---------- helpers ----------
const normalizeCode = (v) =>
  String(v || '')
    .toUpperCase()
    .trim();

const normalizeCondition = (v) => {
  const c = String(v || 'good')
    .toLowerCase()
    .trim();
  if (['excellent', 'good', 'fair', 'poor', 'scrap'].includes(c)) return c;
  return 'good';
};

const normalizeUnit = (v) =>
  String(v || 'pcs')
    .toLowerCase()
    .trim() || 'pcs';

const normalizeCategory = (v) =>
  String(v || 'others')
    .toLowerCase()
    .trim() || 'others';

const toPlainObject = (obj) => {
  if (!obj || typeof obj !== 'object') return {};
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch {
    return {};
  }
};



exports.handleActivityMaterials = async (req, res) => {
  try {
    const {
      activityId,
      activityType,
      activityName,
      materials,
      operation, // add | remove
      location, // ✅ NOW REQUIRED (or default global)
      locationName,
      phase,
      subPhase,
    } = req.body;

    if (!activityId || !activityType || !Array.isArray(materials)) {
      return res.status(400).json({
        success: false,
        message: 'activityId, activityType, and materials[] are required',
      });
    }

    const op = String(operation || '')
      .toLowerCase()
      .trim();
    if (!['add', 'remove'].includes(op)) {
      return res.status(400).json({
        success: false,
        message: "operation must be 'add' or 'remove'",
      });
    }

    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: user not found in request',
      });
    }

    const resolvedLocation = String(location || 'global');
    const resolvedLocationName = String(locationName || resolvedLocation);

    const results = [];
    const errors = [];

    for (const material of materials) {
      try {
        const code = normalizeCode(
          material?.materialCode || material?.materialId
        );
        if (!code) throw new Error('materialCode/materialId is required');

        const qty = Number(material?.quantity);
        if (!Number.isFinite(qty) || qty <= 0)
          throw new Error('quantity must be > 0');

        const condition = normalizeCondition(material?.condition);
        const unit = normalizeUnit(material?.unit);

        let item = await Inventory.findOne({
          materialCode: code,
          location: resolvedLocation,
          isDeleted: false,
        });

        if (!item) {
          if (op === 'remove')
            throw new Error(`Material ${code} not found in this location`);

          item = new Inventory({
            materialCode: code,
            materialName: material?.name || material?.materialName || code,
            category: material?.category || 'others',
            location: resolvedLocation,
            locationName: resolvedLocationName,
            unit,

            totalQuantity: 0,
            availableQuantity: 0,
            allocatedQuantity: 0,
            conditionBreakdown: {
              excellent: 0,
              good: 0,
              fair: 0,
              poor: 0,
              scrap: 0,
            },

            activityAllocations: [],
            sourceHistory: [],

            sourceActivity: { activityId, activityType, activityName },

            createdBy: userId,
            updatedBy: userId,
            lastUpdatedAt: new Date(),
          });
        }

        if (op === 'add') {
          item.totalQuantity += qty;
          item.availableQuantity += qty;
          item.conditionBreakdown[condition] =
            (item.conditionBreakdown[condition] || 0) + qty;

          item.sourceHistory.push({
            activityId,
            activityType,
            activityName,
            phase,
            subPhase,
            quantity: qty,
            condition,
            unit,
            location: resolvedLocation,
            addedBy: userId,
            addedAt: new Date(),
          });

          item.sourceActivity = { activityId, activityType, activityName };
        }

        if (op === 'remove') {
          if (item.availableQuantity < qty) {
            throw new Error(
              `Insufficient quantity. Available: ${item.availableQuantity}, Requested: ${qty}`
            );
          }

          item.availableQuantity -= qty;
          item.allocatedQuantity += qty;
          item.conditionBreakdown[condition] = Math.max(
            0,
            (item.conditionBreakdown[condition] || 0) - qty
          );

          item.activityAllocations.push({
            activityId,
            activityType,
            quantity: qty,
            allocatedDate: new Date(),
            status: 'in-use',
          });
        }

        item.updatedBy = userId;
        item.lastUpdatedAt = new Date();

        await item.save();

        results.push({
          materialCode: code,
          success: true,
          operation: op,
          location: item.location,
          totalQuantity: item.totalQuantity,
          availableQuantity: item.availableQuantity,
        });
      } catch (e) {
        errors.push({
          materialCode:
            material?.materialCode || material?.materialId || 'UNKNOWN',
          error: e.message,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `${op === 'add' ? 'Added' : 'Removed'} ${
        results.length
      } materials`,
      results,
      errors: errors.length ? errors : undefined,
    });
  } catch (error) {
    console.error('handleActivityMaterials error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};


exports.allocateActivityMaterials = async (req, res) => {
  try {
    const { activityId, activityType, activityName, materials } = req.body;

    if (!activityId || !activityType || !Array.isArray(materials)) {
      return res.status(400).json({
        success: false,
        message: 'activityId, activityType, and materials[] are required',
      });
    }

    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: user not found in request',
      });
    }

    const results = [];
    const errors = [];

    // Merge duplicates by (code + condition)
    const merged = new Map();
    for (const m of materials) {
      const raw = m?.materialCode || m?.materialId;
      if (!raw) continue;

      const code = String(raw).toUpperCase().trim();
      const condition = String(m?.condition || 'good').toLowerCase().trim();
      const key = `${code}__${condition}`;

      const prev = merged.get(key) || {
        ...m,
        materialCode: code,
        condition,
        quantity: 0,
      };
      prev.quantity += Number(m?.quantity || 1);
      merged.set(key, prev);
    }

    const normalizedMaterials = Array.from(merged.values());

    for (const material of normalizedMaterials) {
      try {
        const rawCode = material?.materialCode || material?.materialId;
        if (!rawCode) throw new Error('materialCode/materialId is required');

        const code = String(rawCode).toUpperCase().trim();

        const qty = Number(material?.quantity);
        if (!Number.isFinite(qty) || qty <= 0) {
          throw new Error('quantity must be > 0');
        }

        const condition = String(material?.condition || 'good')
          .toLowerCase()
          .trim();

        // Find inventory item by code only (NO location)
        const item = await Inventory.findOne({
          materialCode: code,
          isDeleted: false,
        });

        if (!item) {
          throw new Error(`Material ${code} not found`);
        }

        // Ensure breakdown exists
        item.conditionBreakdown = item.conditionBreakdown || {
          excellent: 0,
          good: 0,
          fair: 0,
          poor: 0,
          scrap: 0,
        };

        // Must have enough available
        if ((item.availableQuantity || 0) < qty) {
          throw new Error(
            `Insufficient quantity. Available: ${item.availableQuantity}, Requested: ${qty}`
          );
        }

        // Decrease available + condition bucket
        item.availableQuantity = Math.max(0, (item.availableQuantity || 0) - qty);

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

        // Increase allocated
        item.allocatedQuantity = (item.allocatedQuantity || 0) + qty;

        // Upsert allocation entry
        item.activityAllocations = Array.isArray(item.activityAllocations)
          ? item.activityAllocations
          : [];

        const existingAlloc = item.activityAllocations.find(
          (a) =>
            String(a.activityId) === String(activityId) &&
            a.activityType === activityType &&
            (a.status === 'allocated' || a.status === 'in-use')
        );

        if (existingAlloc) {
          existingAlloc.quantity = (existingAlloc.quantity || 0) + qty;
          existingAlloc.status = 'allocated';
          existingAlloc.allocatedDate = existingAlloc.allocatedDate || new Date();
        } else {
          item.activityAllocations.push({
            activityId,
            activityType,
            quantity: qty,
            allocatedDate: new Date(),
            status: 'allocated',
          });
        }

        // Audit
        item.updatedBy = userId;
        item.lastUpdatedAt = new Date();

        await item.save();

        results.push({
          materialCode: code,
          success: true,
          allocatedQuantity: qty,
          availableQuantity: item.availableQuantity,
          totalAllocated: item.allocatedQuantity,
        });
      } catch (e) {
        errors.push({
          materialCode: material?.materialCode || material?.materialId || 'UNKNOWN',
          error: e.message,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Allocated ${results.length} materials`,
      results,
      errors: errors.length ? errors : undefined,
    });
  } catch (error) {
    console.error('allocateActivityMaterials error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};


exports.returnActivityMaterials = async (req, res) => {
  try {
    const { activityId, activityType, materials } = req.body; // ✅ removed location

    if (!activityId || !activityType || !Array.isArray(materials)) {
      return res.status(400).json({
        success: false,
        message: 'activityId, activityType, and materials array are required',
      });
    }

    const results = [];

    // ✅ normalize + merge duplicates (same code+condition)
    const merged = new Map();

    for (const m of materials) {
      const raw = m.materialCode || m.materialId;
      if (!raw) continue;

      const code = String(raw).toUpperCase().trim();
      const condition = (m.condition || 'good').toLowerCase().trim();
      const key = `${code}__${condition}`;

      const prev = merged.get(key) || {
        ...m,
        materialCode: code,
        condition,
        quantity: 0,
      };

      prev.quantity += Number(m.quantity || 1);
      merged.set(key, prev);
    }

    const normalizedMaterials = Array.from(merged.values());

    for (const material of normalizedMaterials) {
      try {
        const rawCode = material.materialCode || material.materialId;
        if (!rawCode) {
          throw new Error(
            'materialCode or materialId is required in each material'
          );
        }

        const code = String(rawCode).toUpperCase().trim();

        // ✅ Find inventory item (NO location filter)
        const inventoryItem = await Inventory.findOne({
          materialCode: code,
        });

        if (!inventoryItem) {
          throw new Error(`Material ${code} not found`);
        }

        // ✅ Find allocation for this activity
        const allocation = (inventoryItem.activityAllocations || []).find(
          (alloc) =>
            alloc.activityId &&
            String(alloc.activityId) === String(activityId) && // safer than .equals sometimes
            alloc.activityType === activityType &&
            (alloc.status === 'in-use' || alloc.status === 'allocated')
        );

        if (!allocation) {
          throw new Error(
            `No active allocation found for material ${code} and activity ${activityId}`
          );
        }

        const returnQuantity = Number(material.quantity || allocation.quantity);
        const returnCondition = (material.condition || 'good')
          .toLowerCase()
          .trim();

        if (returnQuantity <= 0) {
          throw new Error('return quantity must be > 0');
        }

        // Validate return quantity doesn't exceed allocated
        if (returnQuantity > allocation.quantity) {
          throw new Error(
            `Return quantity (${returnQuantity}) exceeds allocated quantity (${allocation.quantity})`
          );
        }

        // Update allocation status
        if (returnQuantity === allocation.quantity) {
          allocation.status = 'returned';
        } else {
          allocation.quantity -= returnQuantity;
          allocation.status = 'allocated'; // still has some allocated
        }

        allocation.returnCondition = returnCondition;
        allocation.returnDate = new Date();
        allocation.returnedQuantity = returnQuantity;

        // ✅ Make sure breakdown exists (prevents crash)
        inventoryItem.conditionBreakdown = inventoryItem.conditionBreakdown || {
          excellent: 0,
          good: 0,
          fair: 0,
          poor: 0,
          scrap: 0,
        };

        // Update inventory quantities
        inventoryItem.allocatedQuantity = Math.max(
          0,
          (inventoryItem.allocatedQuantity || 0) - returnQuantity
        );

        if (returnCondition === 'scrap') {
          inventoryItem.conditionBreakdown.scrap =
            (inventoryItem.conditionBreakdown.scrap || 0) + returnQuantity;
        } else {
          inventoryItem.availableQuantity =
            (inventoryItem.availableQuantity || 0) + returnQuantity;

          if (inventoryItem.conditionBreakdown[returnCondition] === undefined) {
            inventoryItem.conditionBreakdown.good =
              (inventoryItem.conditionBreakdown.good || 0) + returnQuantity;
          } else {
            inventoryItem.conditionBreakdown[returnCondition] =
              (inventoryItem.conditionBreakdown[returnCondition] || 0) +
              returnQuantity;
          }
        }

        // Audit
        inventoryItem.updatedBy = req.user.id;
        inventoryItem.lastUpdatedAt = new Date();

        await inventoryItem.save();

        results.push({
          materialCode: code,
          success: true,
          returnedQuantity: returnQuantity,
          returnCondition,
          availableQuantity: inventoryItem.availableQuantity,
          allocatedQuantity: inventoryItem.allocatedQuantity,
        });
      } catch (error) {
        results.push({
          materialCode: material?.materialCode,
          success: false,
          error: error.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Materials returned from activity successfully',
      results,
    });
  } catch (error) {
    console.error('Return materials error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};


exports.getInventoryOverview = async (req, res) => {
  try {
    const {
      search = '',
      category,
      vendor,
      location,
      status = 'all', // all | available | inUse | allocated | zero
      page = 1,
      limit = 20,
    } = req.query;

    const numericPage = parseInt(page, 10) || 1;
    const numericLimit = parseInt(limit, 10) || 20;
    const skip = (numericPage - 1) * numericLimit;

    const query = { isDeleted: false };

    if (category) query.category = category;
    if (vendor) query.vendor = vendor;
    if (location) query.location = location;

    if (search) {
      const r = new RegExp(search, 'i');
      query.$or = [
        { materialCode: { $regex: r } },
        { materialName: { $regex: r } },
        { locationName: { $regex: r } },
      ];
    }

    if (status === 'available') query.availableQuantity = { $gt: 0 };
    if (status === 'inUse') query.allocatedQuantity = { $gt: 0 };
    if (status === 'allocated')
      query['activityAllocations.status'] = 'allocated';
    if (status === 'zero') {
      query.availableQuantity = 0;
      query.allocatedQuantity = 0;
    }

    const [items, total] = await Promise.all([
      Inventory.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(numericLimit)
        .lean(),
      Inventory.countDocuments(query),
    ]);

    const mapped = items.map((it) => {
      const allocs = Array.isArray(it.activityAllocations)
        ? it.activityAllocations
        : [];

      const inUseQty = allocs
        .filter((a) => a.status === 'in-use')
        .reduce((s, a) => s + (a.quantity || 0), 0);

      const allocatedQty = allocs
        .filter((a) => a.status === 'allocated')
        .reduce((s, a) => s + (a.quantity || 0), 0);

      return {
        ...it,
        summary: {
          totalQuantity: it.totalQuantity || 0,
          availableQuantity: it.availableQuantity || 0,
          allocatedQuantity: it.allocatedQuantity || 0,
          inUseQty,
          reservedQty: allocatedQty,
          allocationsCount: allocs.length,
        },
      };
    });

    const totals = mapped.reduce(
      (acc, it) => {
        acc.totalQuantity += it.totalQuantity || 0;
        acc.availableQuantity += it.availableQuantity || 0;
        acc.allocatedQuantity += it.allocatedQuantity || 0;
        acc.inUseQty += it.summary?.inUseQty || 0;
        acc.reservedQty += it.summary?.reservedQty || 0;
        return acc;
      },
      {
        totalQuantity: 0,
        availableQuantity: 0,
        allocatedQuantity: 0,
        inUseQty: 0,
        reservedQty: 0,
      }
    );

    return res.status(200).json({
      success: true,
      count: mapped.length,
      total,
      pagination: {
        page: numericPage,
        limit: numericLimit,
        pages: Math.ceil(total / numericLimit) || 1,
      },
      totals,
      data: mapped,
    });
  } catch (error) {
    console.error('getInventoryOverview error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

const mapToObject = (val) => {
  if (!val) return {};
  if (val instanceof Map) return Object.fromEntries(val.entries());
  if (typeof val.toObject === 'function') return val.toObject();
  if (typeof val === 'object') return { ...val };
  return {};
};

// Normalize specs to Map<String>
const normalizeSpecifications = (specs) => {
  const obj = mapToObject(specs);
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    out[k] = String(v);
  }
  return out;
};

// Validate vendor id
const validateVendorId = async (vendorId) => {
  if (!vendorId) return null;

  if (!mongoose.Types.ObjectId.isValid(vendorId)) {
    throw new Error('vendor must be a valid Vendor _id');
  }

  const vendor = await Vendor.findOne({ _id: vendorId, isDeleted: false })
    .select('_id')
    .lean();

  if (!vendor) throw new Error('Vendor not found or deleted');
  return vendor._id;
};

exports.manualBulkAddToInventory = async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'items array is required',
      });
    }

    const results = [];
    const errors = [];

    for (const item of items) {
      try {
        const {
          updateExisting,
          materialCode,
          materialName,
          category,
          location,
          locationName,
          quantity,
          condition,
          unit,
          pricePerUnit,
          vendor,
          specifications,
        } = item;

        if (!materialCode || !materialName || !location || quantity == null) {
          throw new Error(
            'materialCode, materialName, location, quantity are required'
          );
        }

        // ✅ correct required check (optional: only require on create)
        if (pricePerUnit == null && !updateExisting) {
          throw new Error('pricePerUnit is required');
        }

        const qty = Number(quantity);
        if (!Number.isFinite(qty) || qty <= 0) {
          throw new Error('quantity must be > 0');
        }

        const code = String(materialCode).toUpperCase().trim();
        const cond = String(condition || 'good').toLowerCase();
        const allowed = ['excellent', 'good', 'fair', 'poor', 'scrap'];
        const finalCondition = allowed.includes(cond) ? cond : 'good';

        const vendorId = vendor ? await validateVendorId(vendor) : null;
        const specs = normalizeSpecifications(specifications);

        const existing = await Inventory.findOne({
          materialCode: code,
          location,
          isDeleted: false,
        });

        // ✅ if exists, either update (when updateExisting true) OR skip
        if (existing) {
          if (!updateExisting) {
            results.push({
              materialCode: code,
              location,
              skipped: true,
              reason: 'Already exists (send updateExisting:true to increase quantity)',
              existingId: existing._id,
            });
            continue;
          }

          // Ensure conditionBreakdown exists
          if (!existing.conditionBreakdown) {
            existing.conditionBreakdown = {
              excellent: 0,
              good: 0,
              fair: 0,
              poor: 0,
              scrap: 0,
            };
          }

          // ✅ increment quantities
          existing.totalQuantity = Number(existing.totalQuantity || 0) + qty;
          existing.availableQuantity = Number(existing.availableQuantity || 0) + qty;

          // ✅ increment breakdown for the chosen condition
          existing.conditionBreakdown[finalCondition] =
            Number(existing.conditionBreakdown[finalCondition] || 0) + qty;

          // Optional: update some meta fields (only if you want)
          if (locationName) existing.locationName = locationName;
          if (unit) existing.unit = unit;

          // Optional: only overwrite pricePerUnit if a valid value is provided
          if (pricePerUnit != null && pricePerUnit !== '') {
            existing.pricePerUnit = pricePerUnit;
          }

          // Optional: vendor/specs update (choose behavior)
          if (vendorId) existing.vendor = vendorId;
          if (specs && Object.keys(specs).length) existing.specifications = specs;

          existing.updatedBy = req.user.id;
          existing.lastUpdatedAt = new Date();

          await existing.save();

          results.push({
            materialCode: code,
            location,
            updated: true,
            id: existing._id,
            addedQuantity: qty,
            newTotals: {
              totalQuantity: existing.totalQuantity,
              availableQuantity: existing.availableQuantity,
            },
          });
          continue;
        }

        // ✅ create new if not exists
        const breakdown = {
          excellent: 0,
          good: 0,
          fair: 0,
          poor: 0,
          scrap: 0,
        };
        breakdown[finalCondition] = qty;

        const doc = await Inventory.create({
          materialCode: code,
          materialName,
          category: category || 'others',
          location,
          locationName,
          unit: unit || 'piece',
          pricePerUnit: pricePerUnit ?? '',
          vendor: vendorId || undefined,
          specifications: specs,

          totalQuantity: qty,
          availableQuantity: qty,
          allocatedQuantity: 0,
          conditionBreakdown: breakdown,

          createdBy: req.user.id,
          updatedBy: req.user.id,
          lastUpdatedAt: new Date(),
        });

        results.push({
          materialCode: code,
          location,
          id: doc._id,
          created: true,
        });
      } catch (err) {
        errors.push({ item, error: err.message });
      }
    }

    if (errors.length) {
      return res.status(400).json({
        success: false,
        message: `Some items failed`,
        results,
        errors,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Bulk add completed',
      results,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};


exports.manualBulkUpdateInventory = async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'items array is required',
      });
    }

    const results = [];
    const errors = [];

    for (const item of items) {
      try {
        const {
          id,
          materialCode,
          location,
          addQuantity,
          setQuantity,
          condition,
          unit,
          vendor,
          specifications,
          locationName,
          materialName,
          category,
        } = item;

        let inventory;

        if (id) {
          if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error('Invalid inventory id');
          }
          inventory = await Inventory.findById(id);
        } else {
          if (!materialCode || !location) {
            throw new Error('Provide id OR (materialCode + location)');
          }
          inventory = await Inventory.findOne({
            materialCode: materialCode.toUpperCase().trim(),
            location,
          });
        }

        if (!inventory) throw new Error('Inventory item not found');

        const vendorId = vendor ? await validateVendorId(vendor) : null;
        const specs = normalizeSpecifications(specifications);

        if (unit !== undefined) inventory.unit = unit;
        if (locationName !== undefined) inventory.locationName = locationName;
        if (materialName !== undefined) inventory.materialName = materialName;
        if (category !== undefined) inventory.category = category;
        if (vendorId) inventory.vendor = vendorId;

        if (specifications) {
          const current = mapToObject(inventory.specifications);
          inventory.specifications = { ...current, ...specs };
        }

        if (addQuantity !== undefined && setQuantity !== undefined) {
          throw new Error('Use either addQuantity OR setQuantity');
        }

        const cond = (condition || 'good').toLowerCase();
        const allowed = ['excellent', 'good', 'fair', 'poor', 'scrap'];
        const bucket = allowed.includes(cond) ? cond : 'good';

        if (addQuantity !== undefined) {
          const qty = Number(addQuantity);
          if (!Number.isFinite(qty) || qty <= 0) {
            throw new Error('addQuantity must be > 0');
          }

          inventory.totalQuantity += qty;
          inventory.availableQuantity += qty;
          inventory.conditionBreakdown[bucket] += qty;
        }

        if (setQuantity !== undefined) {
          const qty = Number(setQuantity);
          if (!Number.isFinite(qty) || qty < 0) {
            throw new Error('setQuantity must be >= 0');
          }

          if ((inventory.allocatedQuantity || 0) > qty) {
            throw new Error('setQuantity below allocatedQuantity');
          }

          inventory.totalQuantity = qty;
          inventory.availableQuantity =
            qty - (inventory.allocatedQuantity || 0);

          inventory.conditionBreakdown = {
            excellent: 0,
            good: 0,
            fair: 0,
            poor: 0,
            scrap: 0,
          };
          inventory.conditionBreakdown[bucket] = qty;
        }

        inventory.updatedBy = req.user.id;
        inventory.lastUpdatedAt = new Date();

        await inventory.save();

        results.push({
          success: true,
          id: inventory._id,
          materialCode: inventory.materialCode,
          location: inventory.location,
        });
      } catch (err) {
        errors.push({ item, error: err.message });
      }
    }

    if (errors.length) {
      return res.status(400).json({
        success: false,
        message: 'Some items failed',
        results,
        errors,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Bulk update completed',
      results,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

//------------------------------------------------------------

exports.updateInventoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      addQuantity,
      setQuantity,
      condition,
      pricePerUnit,
      specifications,
      vendor,
      unit,
      materialName,
      category,
      locationName,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid inventory id' });
    }

    const inventory = await Inventory.findById(id);
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory not found' });
    }

    const specs = normalizeSpecifications(specifications);

    if (specifications) {
      const current = mapToObject(inventory.specifications);
      inventory.specifications = { ...current, ...specs };
    }

    if (addQuantity !== undefined) {
      const qty = Number(addQuantity);
      if (qty <= 0) throw new Error('addQuantity must be > 0');

      const bucket = (condition || 'good').toLowerCase();
      inventory.totalQuantity += qty;
      inventory.availableQuantity += qty;
      inventory.conditionBreakdown[bucket] += qty;
    }

    if (setQuantity !== undefined) {
      inventory.totalQuantity = setQuantity;
      inventory.availableQuantity =
        setQuantity - (inventory.allocatedQuantity || 0);
    }

    if (vendor) inventory.vendor = vendor;
    if (unit) inventory.unit = unit;
    if (materialName) inventory.materialName = materialName;
    if (category) inventory.category = category;
    if (locationName) inventory.locationName = locationName;
    if (pricePerUnit) inventory.pricePerUnit = pricePerUnit;

    inventory.updatedBy = req.user.id;
    inventory.lastUpdatedAt = new Date();

    await inventory.save();

    res.json({
      success: true,
      id: inventory._id,
      materialCode: inventory.materialCode,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getAvailableMaterials = async (req, res) => {
  try {
    const { location, category, minQuantity } = req.query;

    const query = {
      isDeleted: false,
      availableQuantity: { $gt: 0 },
    };

    if (location) query.location = location;
    if (category) query.category = category;
    if (minQuantity)
      query.availableQuantity = { $gte: parseInt(minQuantity, 10) };

    const availableMaterials = await Inventory.find(query)
      .select(
        'materialCode materialName category vendor specifications availableQuantity unit conditionBreakdown location locationName'
      )
      .sort({ category: 1, materialName: 1 })
      .lean();

    const data = availableMaterials.map((m) => ({
      ...m,
      vendor: m.vendor || null,
      specifications: m.specifications || {},
    }));

    res.status(200).json({
      success: true,
      data,
      count: data.length,
      totalAvailable: data.reduce(
        (sum, item) => sum + (item.availableQuantity || 0),
        0
      ),
    });
  } catch (error) {
    console.error('Get available materials error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

exports.getActivityAllocations = async (req, res) => {
  try {
    const {
      activityId, // optional now
      activityType, // optional
      status, // optional: allocated | in-use | returned | scrapped
      location, // optional
    } = req.query;

    const query = { isDeleted: false };

    // Optional filter by inventory location (string)
    if (location) query.location = location;

    // If activityId is provided, filter allocations for that activity
    if (activityId) {
      query['activityAllocations.activityId'] = activityId;
    }

    // If activityType is provided, filter by allocation activityType
    if (activityType) {
      query['activityAllocations.activityType'] = activityType;
    }

    // If status is provided, filter by allocation status
    if (status) {
      query['activityAllocations.status'] = status;
    }

    const inventoryItems = await Inventory.find(query)
      .select(
        'materialCode materialName vendor specifications location locationName activityAllocations unit'
      )
      .lean();

    const allocations = [];

    inventoryItems.forEach((item) => {
      const allocs = Array.isArray(item.activityAllocations)
        ? item.activityAllocations
        : [];

      const filtered = allocs.filter((alloc) => {
        if (
          activityId &&
          (!alloc.activityId || alloc.activityId.toString() !== activityId)
        )
          return false;
        if (activityType && alloc.activityType !== activityType) return false;
        if (status && alloc.status !== status) return false;
        return true;
      });

      filtered.forEach((alloc) => {
        allocations.push({
          materialCode: item.materialCode,
          materialName: item.materialName,
          vendor: item.vendor || null,
          specifications: item.specifications || {},
          location: item.location,
          locationName: item.locationName,
          unit: item.unit,

          activityId: alloc.activityId,
          activityType: alloc.activityType,
          quantity: alloc.quantity,
          status: alloc.status,
          allocatedDate: alloc.allocatedDate,
          expectedReturnDate: alloc.expectedReturnDate,
          movedToUseDate: alloc.movedToUseDate,
          returnCondition: alloc.returnCondition,
          returnDate: alloc.returnDate,
          returnedQuantity: alloc.returnedQuantity,
        });
      });
    });

    res.status(200).json({
      success: true,
      data: allocations,
      count: allocations.length,
    });
  } catch (error) {
    console.error('Get activity allocations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

exports.softDeleteInventoryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid inventory id' });
    }

    const inventory = await Inventory.findOne({ _id: id, isDeleted: false });
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory not found or already deleted',
      });
    }

    // Optional safety: don’t delete if anything allocated/in-use
    const hasActive =
      (inventory.allocatedQuantity || 0) > 0 ||
      (Array.isArray(inventory.activityAllocations) &&
        inventory.activityAllocations.some(
          (a) => a.status === 'in-use' || a.status === 'allocated'
        ));

    if (hasActive) {
      return res.status(400).json({
        success: false,
        message:
          'Cannot delete inventory item with active allocations (allocated/in-use). Return materials first.',
      });
    }

    inventory.isDeleted = true;
    inventory.updatedBy = req.user.id;
    inventory.lastUpdatedAt = new Date();

    await inventory.save();

    return res.status(200).json({
      success: true,
      message: 'Inventory item soft-deleted',
      id: inventory._id,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: 'Server error', error: err.message });
  }
};


// controllers/inventoryController.js
exports.getInventoryDropdown = async (req, res) => {
  const { location } = req.query;
  const q = (req.query.q || '').trim();

  const filter = { isDeleted: false };
  if (location) filter.location = location;

  if (q) {
    filter.$or = [
      { materialName: { $regex: q, $options: 'i' } },
      { materialCode: { $regex: q, $options: 'i' } },
    ];
  }

  const list = await Inventory.find(filter)
    .select(
      [
        'materialCode',
        'materialName',
        'category',
        'unit',
        'location',
        'locationName',
        'pricePerUnit',
        'vendor',
        'specifications',

        // ✅ add these
        'totalQuantity',
        'availableQuantity',
        'allocatedQuantity',
        'conditionBreakdown',
      ].join(' ')
    )
    .sort({ materialName: 1 })
    .lean();

  res.json({ success: true, data: list });
};
