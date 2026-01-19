// services/activityInventorySync.service.js
const Inventory = require('../models/Inventory.model');

/* ---------------- helpers ---------------- */
const normalizeCode = (v) => String(v || '').toUpperCase().trim();

const normalizeCondition = (v) => {
  const c = String(v || 'good').toLowerCase().trim();
  if (['excellent', 'good', 'fair', 'poor', 'scrap'].includes(c)) return c;
  return 'good';
};

const normalizeUnit = (v) => String(v || 'pcs').toLowerCase().trim() || 'pcs';

const normalizeCategory = (v) =>
  String(v || 'others').toLowerCase().trim() || 'others';

const toPlainObject = (obj) => {
  if (!obj || typeof obj !== 'object') return {};
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch {
    return {};
  }
};

const ensureArray = (v) => (Array.isArray(v) ? v : []);

const toIdStr = (v) => {
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (v._id) return String(v._id);
  return String(v);
};

const pickQty = (m) =>
  Number(
    m?.quantity ??
      m?.qty ??
      m?.quantityDismantled ??
      m?.quantityMeasured ??
      m?.quantityFound ??
      0
  ) || 0;

const ensureBreakdown = (inv) => {
  inv.conditionBreakdown = inv.conditionBreakdown || {};
  for (const k of ['excellent', 'good', 'fair', 'poor', 'scrap']) {
    inv.conditionBreakdown[k] = Number(inv.conditionBreakdown[k] || 0);
  }
};

const clampNonNeg = (n) => Math.max(0, Number(n || 0));

/**
 * ✅ Location rules:
 * - Never overwrite location with empty string.
 * - If request provides inventoryLocation/name => set it.
 * - Else if item has none => default to global.
 * - Else keep existing.
 */
const applyInventoryLocation = (inv, inventoryLocation, inventoryLocationName) => {
  const invLoc = String(inventoryLocation || '').trim();
  const invLocName = String(inventoryLocationName || '').trim();

  if (invLoc) inv.location = invLoc;
  else if (!inv.location) inv.location = 'global';

  if (invLocName) inv.locationName = invLocName;
  else if (!inv.locationName) inv.locationName = 'Global Store';
};

const resolveHumanLocation = (activityDoc, activityType, phase) => {
  if (!activityDoc) return '';

  if (activityType === 'dismantling') {
    const loc0 = Array.isArray(activityDoc?.location)
      ? activityDoc.location[0]
      : null;
    if (!loc0) return '';
    return [loc0.address, loc0.city, loc0.state].filter(Boolean).join(', ');
  }

  const phaseObj = phase ? activityDoc?.[phase] : null;
  if (!phaseObj) return '';

  const addr = phaseObj?.address || phaseObj?.location?.address || null;
  if (!addr || typeof addr !== 'object') return '';

  const street = addr.street || addr.address || addr.line1 || '';
  return [street, addr.city, addr.state].filter(Boolean).join(', ');
};

/* ---------------- extract materials for context ---------------- */
const getMaterialsForContext = ({ activityType, activity, phase, subPhase }) => {
  if (!activity) return [];

  if (activityType === 'dismantling') {
    // ✅ Only sync after STORE (dispatch)
    if (phase === 'dispatch' || phase === 'store')
      return ensureArray(activity?.dispatch?.materials);
    return [];
  }

  if (activityType === 'relocation' || activityType === 'cow') {
    const siteObj = activity?.[phase];
    if (!siteObj || !subPhase) return [];

    const block = siteObj?.[subPhase];
    if (block && Array.isArray(block.materials)) return ensureArray(block.materials);

    if (subPhase === 'preWalkTest' && Array.isArray(siteObj?.preWalkTest?.materials)) {
      return ensureArray(siteObj.preWalkTest.materials);
    }

    return [];
  }

  return [];
};

/* ---------------- relocation/cow apply (allocate style) ---------------- */
const applyActivityMaterialsAllocate = async ({
  userId,
  activityId,
  activityType,
  activityName,
  phase,
  subPhase,
  materials,
  activityLocation,
  operation,
  inventoryLocation,
  inventoryLocationName,
}) => {
  operation = String(operation || '').toLowerCase().trim();
  if (!['add', 'remove'].includes(operation)) {
    return {
      results: [],
      errors: [{ materialCode: 'UNKNOWN', error: `Invalid operation: ${operation}` }],
    };
  }

  const results = [];
  const errors = [];
  const actLoc = String(activityLocation || '');
  const safeSubPhase = subPhase ? String(subPhase) : '';

  for (const material of ensureArray(materials)) {
    try {
      const code = normalizeCode(material?.materialCode || material?.materialId);
      if (!code) throw new Error('materialCode/materialId is required');

      const quantity = Number(material?.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0)
        throw new Error('quantity must be > 0');

      const condition = normalizeCondition(material?.condition);
      const unit = normalizeUnit(material?.unit);

      let inventoryItem = await Inventory.findOne({ materialCode: code, isDeleted: false });

      if (!inventoryItem) {
        if (operation === 'remove') throw new Error(`Material ${code} not found`);

        inventoryItem = new Inventory({
          materialCode: code,
          materialName: material?.name || material?.materialName || code,
          category: normalizeCategory(material?.category),

          location: String(inventoryLocation || '').trim() || 'global',
          locationName: String(inventoryLocationName || '').trim() || 'Global Store',

          unit,
          vendor: material?.vendor || undefined,
          specifications: toPlainObject(material?.specifications),
          totalQuantity: 0,
          availableQuantity: 0,
          allocatedQuantity: 0,
          conditionBreakdown: { excellent: 0, good: 0, fair: 0, poor: 0, scrap: 0 },
          activityAllocations: [],
          sourceHistory: [],
          sourceActivity: { activityId, activityType, activityName },
          createdBy: userId,
          updatedBy: userId,
          lastUpdatedAt: new Date(),
        });
      } else {
        applyInventoryLocation(inventoryItem, inventoryLocation, inventoryLocationName);

        if (!inventoryItem.vendor && material?.vendor) inventoryItem.vendor = material.vendor;

        if (material?.specifications && typeof material.specifications === 'object') {
          const currentSpecs = toPlainObject(inventoryItem.specifications);
          inventoryItem.specifications = {
            ...currentSpecs,
            ...toPlainObject(material.specifications),
          };
        }

        if (!inventoryItem.unit) inventoryItem.unit = unit;
        if (!Array.isArray(inventoryItem.activityAllocations)) inventoryItem.activityAllocations = [];
        if (!Array.isArray(inventoryItem.sourceHistory)) inventoryItem.sourceHistory = [];
      }

      ensureBreakdown(inventoryItem);

      if (operation === 'add') {
        inventoryItem.totalQuantity = clampNonNeg(inventoryItem.totalQuantity + quantity);
        inventoryItem.availableQuantity = clampNonNeg(inventoryItem.availableQuantity + quantity);
        inventoryItem.conditionBreakdown[condition] = clampNonNeg(
          inventoryItem.conditionBreakdown[condition] + quantity
        );

        inventoryItem.sourceHistory.push({
          activityId,
          activityType,
          activityName,
          phase,
          subPhase: safeSubPhase,
          quantity,
          condition,
          unit,
          activityLocation: actLoc,
          addedBy: userId,
          addedAt: new Date(),
        });
      }

      if (operation === 'remove') {
        if ((inventoryItem.availableQuantity || 0) < quantity) {
          throw new Error(
            `Insufficient quantity. Available: ${inventoryItem.availableQuantity}, Requested: ${quantity}`
          );
        }

        inventoryItem.availableQuantity = clampNonNeg(inventoryItem.availableQuantity - quantity);
        inventoryItem.allocatedQuantity = clampNonNeg(inventoryItem.allocatedQuantity + quantity);
        inventoryItem.conditionBreakdown[condition] = clampNonNeg(
          inventoryItem.conditionBreakdown[condition] - quantity
        );

        inventoryItem.activityAllocations.push({
          activityId,
          activityType,
          quantity,
          allocatedDate: new Date(),
          status: 'in-use',
        });
      }

      inventoryItem.updatedBy = userId;
      inventoryItem.lastUpdatedAt = new Date();
      await inventoryItem.save();

      results.push({
        materialCode: code,
        success: true,
        operation,
        totalQuantity: inventoryItem.totalQuantity,
        availableQuantity: inventoryItem.availableQuantity,
        allocatedQuantity: inventoryItem.allocatedQuantity,
        conditionBreakdown: inventoryItem.conditionBreakdown,
        location: inventoryItem.location,
        locationName: inventoryItem.locationName,
      });
    } catch (err) {
      errors.push({
        materialCode: normalizeCode(material?.materialCode || material?.materialId) || 'UNKNOWN',
        error: err.message,
      });
    }
  }

  return { results, errors };
};

/* ---------------- DISMANTLING SNAPSHOT SYNC ---------------- */
const snapshotSyncDismantlingDispatch = async ({
  userId,
  activityId,
  activityName,
  phase,
  materials,
  activityLocation,
  inventoryLocation,
  inventoryLocationName,
}) => {
  const actLoc = String(activityLocation || '');
  const safePhase = String(phase || 'dispatch');

  const desired = new Map();
  const metaByKey = new Map();

  for (const m of ensureArray(materials)) {
    const code = normalizeCode(m?.materialCode || m?.materialId);
    const qty = clampNonNeg(pickQty(m));
    const condition = normalizeCondition(
      m?.condition || m?.conditionAfterDismantling || m?.conditionBeforeDismantling
    );
    const unit = normalizeUnit(m?.unit);

    if (!code) continue;

    const k = `${code}__${condition}__${unit}`;
    desired.set(k, qty);

    metaByKey.set(k, {
      materialCode: code,
      materialName: m?.name || m?.materialName || code,
      category: normalizeCategory(m?.category),
      condition,
      unit,
      vendor: m?.vendor,
      specifications: toPlainObject(m?.specifications),
    });
  }

  const relatedInventory = await Inventory.find({
    isDeleted: false,
    sourceHistory: { $elemMatch: { activityId, activityType: 'dismantling', phase: safePhase } },
  });

  const handledKeys = new Set();
  const results = [];
  const errors = [];

  for (const inv of relatedInventory) {
    try {
      applyInventoryLocation(inv, inventoryLocation, inventoryLocationName);
      ensureBreakdown(inv);

      const code = normalizeCode(inv.materialCode);
      if (!code) continue;

      let changed = false;
      const newHistory = [];

      for (const h of ensureArray(inv.sourceHistory)) {
        if (
          toIdStr(h?.activityId) !== toIdStr(activityId) ||
          String(h?.activityType || '') !== 'dismantling' ||
          String(h?.phase || '') !== safePhase
        ) {
          newHistory.push(h);
          continue;
        }

        const hCondition = normalizeCondition(h?.condition);
        const hUnit = normalizeUnit(h?.unit);
        const k = `${code}__${hCondition}__${hUnit}`;

        const desiredQty = desired.has(k) ? desired.get(k) : 0;
        const prevQty = clampNonNeg(h?.quantity);
        const delta = desiredQty - prevQty;

        if (delta !== 0) {
          inv.totalQuantity = clampNonNeg(inv.totalQuantity + delta);
          inv.availableQuantity = clampNonNeg(inv.availableQuantity + delta);
          inv.conditionBreakdown[hCondition] = clampNonNeg(
            (inv.conditionBreakdown[hCondition] || 0) + delta
          );
          changed = true;
        }

        handledKeys.add(k);

        if (desiredQty === 0) {
          changed = true;
          continue;
        }

        newHistory.push({
          ...h,
          activityName,
          quantity: desiredQty,
          activityLocation: actLoc,
          addedBy: userId,
          addedAt: new Date(),
          condition: hCondition,
          unit: hUnit,
        });
      }

      inv.sourceHistory = newHistory;

      if (changed) {
        inv.updatedBy = userId;
        inv.lastUpdatedAt = new Date();
        await inv.save();
      }

      results.push({
        materialCode: inv.materialCode,
        success: true,
        updated: changed,
        totalQuantity: inv.totalQuantity,
        availableQuantity: inv.availableQuantity,
        conditionBreakdown: inv.conditionBreakdown,
        location: inv.location,
        locationName: inv.locationName,
      });
    } catch (e) {
      errors.push({ materialCode: inv.materialCode || 'UNKNOWN', error: e.message });
    }
  }

  for (const [k, desiredQty] of desired.entries()) {
    if (handledKeys.has(k)) continue;
    if (desiredQty <= 0) continue;

    const meta = metaByKey.get(k) || {};
    const code = meta.materialCode;
    const condition = meta.condition;
    const unit = meta.unit;

    try {
      let inv = await Inventory.findOne({ materialCode: code, isDeleted: false });

      if (!inv) {
        inv = new Inventory({
          materialCode: code,
          materialName: meta.materialName || code,
          category: meta.category || 'others',
          location: String(inventoryLocation || '').trim() || 'global',
          locationName: String(inventoryLocationName || '').trim() || 'Global Store',
          unit,
          vendor: meta.vendor || undefined,
          specifications: meta.specifications || {},
          totalQuantity: 0,
          availableQuantity: 0,
          allocatedQuantity: 0,
          conditionBreakdown: { excellent: 0, good: 0, fair: 0, poor: 0, scrap: 0 },
          activityAllocations: [],
          sourceHistory: [],
          sourceActivity: { activityId, activityType: 'dismantling', activityName },
          createdBy: userId,
          updatedBy: userId,
          lastUpdatedAt: new Date(),
        });
      } else {
        applyInventoryLocation(inv, inventoryLocation, inventoryLocationName);
        ensureBreakdown(inv);
        if (!inv.unit) inv.unit = unit;
        if (!inv.vendor && meta.vendor) inv.vendor = meta.vendor;

        if (meta.specifications && typeof meta.specifications === 'object') {
          const cur = toPlainObject(inv.specifications);
          inv.specifications = { ...cur, ...meta.specifications };
        }
      }

      inv.totalQuantity = clampNonNeg(inv.totalQuantity + desiredQty);
      inv.availableQuantity = clampNonNeg(inv.availableQuantity + desiredQty);
      inv.conditionBreakdown[condition] = clampNonNeg(
        (inv.conditionBreakdown[condition] || 0) + desiredQty
      );

      inv.sourceHistory.push({
        activityId,
        activityType: 'dismantling',
        activityName,
        phase: safePhase,
        subPhase: '',
        quantity: desiredQty,
        condition,
        unit,
        activityLocation: actLoc,
        addedBy: userId,
        addedAt: new Date(),
      });

      inv.updatedBy = userId;
      inv.lastUpdatedAt = new Date();
      await inv.save();

      results.push({
        materialCode: code,
        success: true,
        createdOrExtended: true,
        totalQuantity: inv.totalQuantity,
        availableQuantity: inv.availableQuantity,
        conditionBreakdown: inv.conditionBreakdown,
        location: inv.location,
        locationName: inv.locationName,
      });
    } catch (e) {
      errors.push({ materialCode: meta?.materialCode || 'UNKNOWN', error: e.message });
    }
  }

  return { results, errors };
};

/* ---------------- SNAPSHOT SYNC FOR RELOCATION/COW (FIX: no double-add) ----------------
   For relocation/cow store inventory phase, materials list is FINAL truth.
   We store the contribution in Inventory.sourceHistory for:
     {activityId, activityType, phase, subPhase}
   Then adjust totals by delta to match snapshot exactly.
*/
const snapshotSyncByActivityPhaseSubPhase = async ({
  userId,
  activityId,
  activityType,
  activityName,
  phase,
  subPhase,
  materials,
  activityLocation,
  inventoryLocation,
  inventoryLocationName,
}) => {
  const actLoc = String(activityLocation || '');
  const safePhase = String(phase || '');
  const safeSubPhase = String(subPhase || '');

  const desired = new Map();
  const metaByKey = new Map();

  for (const m of ensureArray(materials)) {
    const code = normalizeCode(m?.materialCode || m?.materialId);
    if (!code) continue;

    const qty = clampNonNeg(pickQty(m));
    const condition = normalizeCondition(m?.condition);
    const unit = normalizeUnit(m?.unit);

    const k = `${code}__${condition}__${unit}`;
    desired.set(k, qty);

    metaByKey.set(k, {
      materialCode: code,
      materialName: m?.name || m?.materialName || code,
      category: normalizeCategory(m?.category),
      condition,
      unit,
      vendor: m?.vendor,
      specifications: toPlainObject(m?.specifications),
    });
  }

  const relatedInventory = await Inventory.find({
    isDeleted: false,
    sourceHistory: {
      $elemMatch: {
        activityId,
        activityType,
        phase: safePhase,
        subPhase: safeSubPhase,
      },
    },
  });

  const handledKeys = new Set();
  const results = [];
  const errors = [];

  // update existing history entries (delta-based)
  for (const inv of relatedInventory) {
    try {
      applyInventoryLocation(inv, inventoryLocation, inventoryLocationName);
      ensureBreakdown(inv);

      const code = normalizeCode(inv.materialCode);
      if (!code) continue;

      let changed = false;
      const newHistory = [];

      for (const h of ensureArray(inv.sourceHistory)) {
        if (
          toIdStr(h?.activityId) !== toIdStr(activityId) ||
          String(h?.activityType || '') !== String(activityType) ||
          String(h?.phase || '') !== safePhase ||
          String(h?.subPhase || '') !== safeSubPhase
        ) {
          newHistory.push(h);
          continue;
        }

        const hCondition = normalizeCondition(h?.condition);
        const hUnit = normalizeUnit(h?.unit);
        const k = `${code}__${hCondition}__${hUnit}`;

        const desiredQty = desired.has(k) ? desired.get(k) : 0;
        const prevQty = clampNonNeg(h?.quantity);
        const delta = desiredQty - prevQty;

        if (delta !== 0) {
          inv.totalQuantity = clampNonNeg(inv.totalQuantity + delta);
          inv.availableQuantity = clampNonNeg(inv.availableQuantity + delta);
          inv.conditionBreakdown[hCondition] = clampNonNeg(
            (inv.conditionBreakdown[hCondition] || 0) + delta
          );
          changed = true;
        }

        handledKeys.add(k);

        if (desiredQty === 0) {
          changed = true;
          continue;
        }

        newHistory.push({
          ...h,
          activityName,
          quantity: desiredQty,
          activityLocation: actLoc,
          addedBy: userId,
          addedAt: new Date(),
          condition: hCondition,
          unit: hUnit,
        });
      }

      inv.sourceHistory = newHistory;

      if (changed) {
        inv.updatedBy = userId;
        inv.lastUpdatedAt = new Date();
        await inv.save();
      }

      results.push({
        materialCode: inv.materialCode,
        success: true,
        updated: changed,
        totalQuantity: inv.totalQuantity,
        availableQuantity: inv.availableQuantity,
        conditionBreakdown: inv.conditionBreakdown,
        location: inv.location,
        locationName: inv.locationName,
      });
    } catch (e) {
      errors.push({ materialCode: inv.materialCode || 'UNKNOWN', error: e.message });
    }
  }

  // add missing keys
  for (const [k, desiredQty] of desired.entries()) {
    if (handledKeys.has(k)) continue;
    if (desiredQty <= 0) continue;

    const meta = metaByKey.get(k) || {};
    const code = meta.materialCode;
    const condition = meta.condition;
    const unit = meta.unit;

    try {
      let inv = await Inventory.findOne({ materialCode: code, isDeleted: false });

      if (!inv) {
        inv = new Inventory({
          materialCode: code,
          materialName: meta.materialName || code,
          category: meta.category || 'others',
          location: String(inventoryLocation || '').trim() || 'global',
          locationName: String(inventoryLocationName || '').trim() || 'Global Store',
          unit,
          vendor: meta.vendor || undefined,
          specifications: meta.specifications || {},
          totalQuantity: 0,
          availableQuantity: 0,
          allocatedQuantity: 0,
          conditionBreakdown: { excellent: 0, good: 0, fair: 0, poor: 0, scrap: 0 },
          activityAllocations: [],
          sourceHistory: [],
          createdBy: userId,
          updatedBy: userId,
          lastUpdatedAt: new Date(),
        });
      } else {
        applyInventoryLocation(inv, inventoryLocation, inventoryLocationName);
        ensureBreakdown(inv);
        if (!inv.unit) inv.unit = unit;
        if (!inv.vendor && meta.vendor) inv.vendor = meta.vendor;

        if (meta.specifications && typeof meta.specifications === 'object') {
          const cur = toPlainObject(inv.specifications);
          inv.specifications = { ...cur, ...meta.specifications };
        }
      }

      inv.totalQuantity = clampNonNeg(inv.totalQuantity + desiredQty);
      inv.availableQuantity = clampNonNeg(inv.availableQuantity + desiredQty);
      inv.conditionBreakdown[condition] = clampNonNeg(
        (inv.conditionBreakdown[condition] || 0) + desiredQty
      );

      inv.sourceHistory.push({
        activityId,
        activityType,
        activityName,
        phase: safePhase,
        subPhase: safeSubPhase,
        quantity: desiredQty,
        condition,
        unit,
        activityLocation: actLoc,
        addedBy: userId,
        addedAt: new Date(),
      });

      inv.updatedBy = userId;
      inv.lastUpdatedAt = new Date();
      await inv.save();

      results.push({
        materialCode: code,
        success: true,
        createdOrExtended: true,
        totalQuantity: inv.totalQuantity,
        availableQuantity: inv.availableQuantity,
        conditionBreakdown: inv.conditionBreakdown,
        location: inv.location,
        locationName: inv.locationName,
      });
    } catch (e) {
      errors.push({ materialCode: code || 'UNKNOWN', error: e.message });
    }
  }

  return { results, errors };
};

/* ---------------- diff old vs new (kept for other uses if needed) ---------------- */
const toMaterialKey = (m) => {
  const code = normalizeCode(m?.materialCode || m?.materialId);
  const condition = normalizeCondition(
    m?.condition || m?.conditionAfterDismantling || m?.conditionBeforeDismantling
  );
  const unit = normalizeUnit(m?.unit);
  return `${code}__${condition}__${unit}`;
};

const diffMaterials = (beforeArr = [], afterArr = []) => {
  const beforeMap = new Map();
  const afterMap = new Map();

  for (const m of ensureArray(beforeArr)) {
    const key = toMaterialKey(m);
    beforeMap.set(key, (beforeMap.get(key) || 0) + pickQty(m));
  }

  for (const m of ensureArray(afterArr)) {
    const key = toMaterialKey(m);
    afterMap.set(key, (afterMap.get(key) || 0) + pickQty(m));
  }

  const additions = [];
  const removals = [];
  const keys = new Set([...beforeMap.keys(), ...afterMap.keys()]);

  for (const key of keys) {
    const oldQty = beforeMap.get(key) || 0;
    const newQty = afterMap.get(key) || 0;
    const delta = newQty - oldQty;
    if (delta === 0) continue;

    const rep =
      ensureArray(afterArr).find((x) => toMaterialKey(x) === key) ||
      ensureArray(beforeArr).find((x) => toMaterialKey(x) === key);

    if (!rep) continue;

    const code = normalizeCode(rep.materialCode || rep.materialId);
    if (!code) continue;

    const condition = normalizeCondition(
      rep?.condition || rep?.conditionAfterDismantling || rep?.conditionBeforeDismantling
    );

    const base = {
      materialCode: code,
      name: rep.name || rep.materialName || code,
      condition,
      unit: normalizeUnit(rep.unit),
      category: normalizeCategory(rep.category),
      vendor: rep.vendor,
      specifications: toPlainObject(rep.specifications),
      notes: rep.notes,
    };

    if (delta > 0) additions.push({ ...base, quantity: delta });
    if (delta < 0) removals.push({ ...base, quantity: Math.abs(delta) });
  }

  return { additions, removals };
};

const materialsAsAdditions = (arr = []) =>
  ensureArray(arr)
    .map((m) => {
      const code = normalizeCode(m?.materialCode || m?.materialId);
      const qty = pickQty(m);
      if (!code || qty <= 0) return null;

      const condition = normalizeCondition(
        m?.condition || m?.conditionAfterDismantling || m?.conditionBeforeDismantling
      );

      return {
        materialCode: code,
        name: m?.name || m?.materialName || code,
        condition,
        unit: normalizeUnit(m?.unit),
        category: normalizeCategory(m?.category),
        vendor: m?.vendor,
        specifications: toPlainObject(m?.specifications),
        notes: m?.notes,
        quantity: qty,
      };
    })
    .filter(Boolean);

/* ---------------- main SYNC ---------------- */
exports.syncMaterialsToInventory = async ({
  activityType,
  activityId,
  activityName,
  phase,
  subPhase,
  beforeActivityDoc,
  afterActivityDoc,
  userId,
  activityDoc,
  inventoryLocation,
  inventoryLocationName,
}) => {
  const isDismantling =
    activityType === 'dismantling' &&
    ['dispatch', 'store'].includes(String(phase || ''));

  const isRelocationOrCow = ['relocation', 'cow'].includes(String(activityType || ''));

  const isRelocationSync =
    isRelocationOrCow &&
    ['storeOperatorWork', 'inventoryWork'].includes(String(subPhase || ''));

  const shouldSync = isDismantling || isRelocationSync;
  if (!shouldSync) return { synced: false, reason: 'Not a sync context' };

  const beforeDoc = beforeActivityDoc || null;
  const afterDoc = activityDoc || afterActivityDoc || null;

  const docForLoc = afterDoc || beforeDoc || {};
  const activityLocation = resolveHumanLocation(docForLoc, activityType, phase);

  // ✅ DISMANTLING = SNAPSHOT
  if (isDismantling) {
    const mats = ensureArray(
      getMaterialsForContext({
        activityType,
        activity: afterDoc || beforeDoc,
        phase,
        subPhase,
      })
    );

    const snapRes = await snapshotSyncDismantlingDispatch({
      userId,
      activityId,
      activityName,
      phase: 'dispatch',
      materials: mats,
      activityLocation,
      inventoryLocation,
      inventoryLocationName,
    });

    return {
      synced: true,
      mode: 'snapshot',
      activityLocation,
      inventory: { snapshot: snapRes },
    };
  }

  // ✅ RELOCATION/COW = SNAPSHOT (FIXED) — avoids double-add on updates
  if (isRelocationSync) {
    const afterMaterials = ensureArray(
      getMaterialsForContext({
        activityType,
        activity: afterDoc,
        phase,
        subPhase,
      })
    );

    const snapRes = await snapshotSyncByActivityPhaseSubPhase({
      userId,
      activityId,
      activityType,
      activityName,
      phase,
      subPhase,
      materials: afterMaterials,
      activityLocation,
      inventoryLocation,
      inventoryLocationName,
    });

    return {
      synced: true,
      mode: 'snapshot',
      activityLocation,
      inventory: { snapshot: snapRes },
    };
  }

  // fallback (should not reach because shouldSync checked)
  return { synced: false, reason: 'No sync executed' };
};

// alias
exports.syncSurveyMaterialsToInventory = exports.syncMaterialsToInventory;

// export util
exports.resolveHumanLocation = resolveHumanLocation;

// helpers for tests
exports._helpers = {
  normalizeCode,
  normalizeCondition,
  normalizeUnit,
  normalizeCategory,
  toPlainObject,
  ensureArray,
  pickQty,
  getMaterialsForContext,
  diffMaterials,
  materialsAsAdditions,
  snapshotSyncDismantlingDispatch,
  snapshotSyncByActivityPhaseSubPhase,
  applyActivityMaterialsAllocate,
  resolveHumanLocation,
  applyInventoryLocation,
};
