const InventoryAllocationRequest = require('../models/InventoryAllocationRequest.model');


const { getModel } = require('../helpers/activityUtils');


const getMaterialsFromActivity = ({
  activityType,
  activityDoc,
  phase,
  subPhase,
}) => {
  if (!activityDoc) return [];

  // relocation & cow (phase + subPhase)
  if (activityType === 'relocation' || activityType === 'cow') {
    const arr = activityDoc?.[phase]?.[subPhase]?.materials;
    return Array.isArray(arr) ? arr : [];
  }

  // dismantling (if you ever want later, add mapping here)
  return [];
};

const normalizeMaterials = (materials = []) => {
  const merged = new Map();

  for (const m of materials) {
    const raw = m?.materialCode || m?.materialId;
    if (!raw) continue;

    const materialCode = String(raw).toUpperCase().trim();
    const condition = String(m?.condition || 'good')
      .toLowerCase()
      .trim();
    const key = `${materialCode}__${condition}`;

    const prev = merged.get(key) || {
      materialCode,
      name: m?.name || m?.materialName || materialCode,
      quantity: 0,
      unit: m?.unit || 'pcs',
      condition,
      notes: m?.notes || '',
    };

    prev.quantity += Number(m?.quantity || 1);
    merged.set(key, prev);
  }

  return Array.from(merged.values()).filter(
    (x) => x.materialCode && Number(x.quantity) > 0
  );
};

/**
 * Creates/updates the SAME pending request for (activityId+type+phase+subPhase).
 * If request already approved/rejected => creates a new version (v2, v3...)
 */
exports.upsertInventoryAllocationRequestFromPhase = async ({
  activityType,
  activityId,
  activityName,
  phase,
  subPhase,
  activityDoc,
  userId,
  siteId,
}) => {
  // Only for TE/Civil requests
  const allowedSubPhases = new Set(['civilWork', 'telecomWork']);
  if (!allowedSubPhases.has(subPhase)) {
    return { createdOrUpdated: false, reason: 'Not a request subPhase' };
  }

  const extracted = getMaterialsFromActivity({
    activityType,
    activityDoc,
    phase,
    subPhase,
  });

  const materials = normalizeMaterials(extracted);

  // If no materials, do nothing (or you can auto-cancel pending request if you want)
  if (!materials.length) {
    return { createdOrUpdated: false, reason: 'No materials to request' };
  }

  const baseKey = `${activityId}_${activityType}_${phase}_${subPhase}`;
  const existing = await InventoryAllocationRequest.findOne({
    requestKey: baseKey,
  });

  // Update pending
  if (existing && existing.status === 'pending') {
    existing.materials = materials;
    existing.activityName = activityName || existing.activityName;
    existing.siteId = siteId || existing.siteId;
    existing.requestedBy = userId;
    existing.requestedAt = new Date();
    await existing.save();

    return {
      createdOrUpdated: true,
      mode: 'updated',
      requestId: existing._id,
      requestKey: existing.requestKey,
      count: materials.length,
    };
  }

  // If exists but not pending => create version key
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
    materials,
    status: 'pending',
    requestedBy: userId,
    requestedAt: new Date(),
  });

  return {
    createdOrUpdated: true,
    mode: 'created',
    requestId: doc._id,
    requestKey: doc.requestKey,
    count: materials.length,
  };
};




exports.applyApprovedMaterialsToActivity = async ({
  activityType,
  activityId,
  phase,
  subPhase,
  materials,
  userId,
}) => {
  const Model = getModel(activityType);

  // push into activity.<phase>.<subPhase>.materials
  const path = `${phase}.${subPhase}.materials`;

  const payload = (materials || []).map((m) => ({
    materialCode: String(m.materialCode || '')
      .toUpperCase()
      .trim(),
    name: m.name || m.materialName || '',
    quantity: Number(m.quantity || 1),
    unit: m.unit || 'pcs',
    condition: (m.condition || 'good').toLowerCase().trim(),
    notes: m.notes || '',
    approvedBy: userId, // optional extra fields
    approvedAt: new Date(), // optional
  }));

  await Model.updateOne(
    { _id: activityId, isDeleted: { $ne: true } },
    {
      $push: {
        [path]: { $each: payload },
      },
      $set: {
        updatedBy: userId,
        updatedAt: new Date(),
      },
    }
  );
};
