// controllers/dasIbsActivity.controller.js
const mongoose = require('mongoose');
const asyncHandler = require('../middlewares/asyncHandler.middleware');
const { DasIbsAtivity, Site, User } = require('../models'); // from models/index.js

// ---------- helpers ----------
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const pickAllowed = (obj = {}, allowed = []) => {
  const out = {};
  for (const key of allowed) {
    if (obj[key] !== undefined) out[key] = obj[key];
  }
  return out;
};

const ensureUsersExist = async (userIds = []) => {
  const ids = (userIds || []).map(String);
  if (!ids.length) return { ok: true, missing: [] };

  const found = await User.find({ _id: { $in: ids } })
    .select('_id')
    .lean();
  const foundSet = new Set(found.map((u) => String(u._id)));
  const missing = ids.filter((id) => !foundSet.has(String(id)));

  return { ok: missing.length === 0, missing };
};

// ---------- CREATE ----------
exports.createDasIbsActivity = asyncHandler(async (req, res) => {
  const { site, siteType, assignment } = req.body || {};

  const authUserId = req.user?.id; // already fixed 👍

  if (!authUserId || !isValidObjectId(authUserId)) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
  }

  // 1) validate required basics
  if (!site || !isValidObjectId(site)) {
    return res.status(400).json({ success: false, message: 'Invalid site id' });
  }

  if (!siteType || !['DAS', 'IBS'].includes(siteType)) {
    return res
      .status(400)
      .json({ success: false, message: 'Invalid siteType' });
  }

  // 2) validate site exists
  const siteDoc = await Site.findById(site).select('_id isDeleted').lean();
  if (!siteDoc || siteDoc.isDeleted) {
    return res.status(404).json({ success: false, message: 'Site not found' });
  }

  // 3) validate assignment block (ONLY assignedTo)
  if (
    !assignment ||
    !Array.isArray(assignment.assignedTo) ||
    assignment.assignedTo.length === 0
  ) {
    return res.status(400).json({
      success: false,
      message: 'assignedTo must be a non-empty array',
    });
  }

  for (const u of assignment.assignedTo) {
    if (!isValidObjectId(u)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid assignedTo user id found' });
    }
  }

  // 4) validate assignedTo users exist
  const { ok: assignedToOk, missing } = await ensureUsersExist(
    assignment.assignedTo
  );

  if (!assignedToOk) {
    return res.status(404).json({
      success: false,
      message: 'Some assignedTo users not found',
      missingUsers: missing,
    });
  }

  // 5) build payload (only allowed fields)
  const payload = pickAllowed(req.body, [
    'site',
    'siteType',
    'sourceSite',
    'destinationSite',
    'surveyMeasurements',
    'preWalkTest',
    'documents',
    'notes',
    'overallStatus',
    'completionPercentage',
  ]);

  // 🔒 SERVER-CONTROLLED FIELDS
  payload.assignment = {
    assignedTo: assignment.assignedTo,
    assignedBy: authUserId,
    assignedDate: new Date(),
    status: 'assigned',
  };

  payload.createdBy = authUserId;
  payload.updatedBy = authUserId;

  const doc = await DasIbsAtivity.create(payload);

  return res.status(201).json({
    success: true,
    message: 'Das/Ibs activity created',
    data: doc,
  });
});

// ---------- GET ALL (with basic filters) ----------
exports.getDasIbsActivities = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search = '',
    siteType,
    overallStatus,
    site,
    includeDeleted,
  } = req.query;

  const q = {};

  // soft delete filter comes from pre-find middleware, but allow override
  const query = DasIbsAtivity.find(q).setOptions({
    includeDeleted: String(includeDeleted) === 'true',
  });

  if (site && isValidObjectId(site)) query.where({ site });

  if (siteType && ['DAS', 'IBS'].includes(siteType)) query.where({ siteType });

  if (overallStatus) query.where({ overallStatus });

  if (search) {
    // keep it light (no new fields), search by notes only
    query.where({ notes: { $regex: String(search), $options: 'i' } });
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [total, data] = await Promise.all([
    DasIbsAtivity.countDocuments(query.getFilter()),
    query
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('site', 'name siteId region project siteManager')
      .populate('assignment.assignedTo', 'name email role')
      .populate('assignment.assignedBy', 'name email role')
      .lean(),
  ]);

  return res.json({
    success: true,
    count: data.length,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum) || 1,
    data,
  });
});

// ---------- GET BY ID ----------
exports.getDasIbsActivityById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ success: false, message: 'Invalid id' });
  }

  const doc = await DasIbsAtivity.findById(id)
    .populate('site', 'name siteId region project siteManager')
    .populate('assignment.assignedTo', 'name email role')
    .populate('assignment.assignedBy', 'name email role')
    .lean();

  if (!doc) {
    return res
      .status(404)
      .json({ success: false, message: 'Activity not found' });
  }

  return res.json({ success: true, data: doc });
});

// ---------- UPDATE (partial) ----------
exports.updateDasIbsActivity = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const authUserId = req.user?.id;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ success: false, message: 'Invalid id' });
  }

  const updates = pickAllowed(req.body, [
    'sourceSite',
    'destinationSite',

    'surveyMeasurements',
    'preWalkTest',
    'documents',
    'notes',
    'overallStatus',
    'completionPercentage',
  ]);

  updates.updatedBy = authUserId;

  const doc = await DasIbsAtivity.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!doc) {
    return res
      .status(404)
      .json({ success: false, message: 'Activity not found' });
  }

  return res.json({ success: true, message: 'Updated', data: doc });
});

// ---------- SOFT DELETE ----------
exports.softDeleteDasIbsActivity = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const authUserId = req.user?.id;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ success: false, message: 'Invalid id' });
  }

  const doc = await DasIbsAtivity.findByIdAndUpdate(
    id,
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: authUserId,
        updatedBy: authUserId,
      },
    },
    { new: true }
  );

  if (!doc) {
    return res
      .status(404)
      .json({ success: false, message: 'Activity not found' });
  }

  return res.json({ success: true, message: 'Deleted', data: doc });
});

// ---------- RESTORE ----------
exports.restoreDasIbsActivity = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const authUserId = req.user?.id;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ success: false, message: 'Invalid id' });
  }

  const doc = await DasIbsAtivity.findByIdAndUpdate(
    id,
    {
      $set: {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        updatedBy: authUserId,
      },
    },
    { new: true }
  ).setOptions({ includeDeleted: true });

  if (!doc) {
    return res
      .status(404)
      .json({ success: false, message: 'Activity not found' });
  }

  return res.json({ success: true, message: 'Restored', data: doc });
});

const normalizeAssignedUsers = (assignedUsers = []) => {
  return assignedUsers.map((u) => ({
    userId: u.userId,
    role: u.role,
    assignedDate: u.assignedDate ? new Date(u.assignedDate) : new Date(),
  }));
};

exports.assignDasIbsWork = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { assignedBy, dueDate, source, destination, preWalkTest } =
    req.body || {};

  if (!isValidObjectId(id)) {
    return res
      .status(400)
      .json({ success: false, message: 'Invalid activity id' });
  }

  if (!assignedBy || !isValidObjectId(assignedBy)) {
    return res
      .status(400)
      .json({ success: false, message: 'Invalid assignedBy' });
  }

  const activity = await DasIbsAtivity.findById(id);
  if (!activity) {
    return res
      .status(404)
      .json({ success: false, message: 'Activity not found' });
  }

  if (activity.isDeleted) {
    return res
      .status(400)
      .json({ success: false, message: 'Activity is deleted' });
  }

  // validate linked site exists
  const siteExists = await Site.exists({
    _id: activity.site,
    isDeleted: { $ne: true },
  });
  if (!siteExists) {
    return res
      .status(404)
      .json({ success: false, message: 'Linked site not found' });
  }

  const assignedByExists = await User.exists({ _id: assignedBy });
  if (!assignedByExists) {
    return res
      .status(404)
      .json({ success: false, message: 'assignedBy user not found' });
  }

  // collect all user ids used in payload to validate in one query
  const idsToCheck = [];

  const collectUsersFromSide = (side) => {
    if (!side) return;

    const surveyUsers = side.surveyUsers || [];
    const civilUsers = side.civilUsers || [];
    const teUsers = side.teUsers || [];

    for (const a of surveyUsers) if (a?.userId) idsToCheck.push(a.userId);
    for (const a of civilUsers) if (a?.userId) idsToCheck.push(a.userId);
    for (const a of teUsers) if (a?.userId) idsToCheck.push(a.userId);

    if (side.ibsAssignedTo) idsToCheck.push(side.ibsAssignedTo);
  };

  collectUsersFromSide(source);
  collectUsersFromSide(destination);

  // include preWalkTest user validation
  if (preWalkTest?.assignedTo) idsToCheck.push(preWalkTest.assignedTo);

  // validate all userIds are valid ObjectIds
  for (const uid of idsToCheck) {
    if (!isValidObjectId(uid)) {
      return res.status(400).json({
        success: false,
        message: `Invalid user id in payload: ${uid}`,
      });
    }
  }

  const { ok, missing } = await ensureUsersExist(idsToCheck);
  if (!ok) {
    return res.status(404).json({
      success: false,
      message: 'Some users not found',
      missingUsers: missing,
    });
  }

  // helper to ensure nested structure
  const ensureSite = (key) => {
    activity[key] ||= {};
    return activity[key];
  };

  const applyWorkUsers = (siteObj, workKey, usersArr) => {
    if (!usersArr || !usersArr.length) return;

    siteObj[workKey] ||= {};
    siteObj[workKey].assignedUsers = normalizeAssignedUsers(usersArr);
    siteObj[workKey].status = 'in-progress';
  };

  const applyIbs = (siteObj, ibsAssignedTo) => {
    if (!ibsAssignedTo) return;

    siteObj.ibsRequirements ||= {};
    siteObj.ibsRequirements.assignedTo = ibsAssignedTo;
    siteObj.ibsRequirements.assignedBy = assignedBy;
    siteObj.ibsRequirements.assignedDate = new Date();
    siteObj.ibsRequirements.status = 'in-progress';
  };

  // ---- SOURCE ----
  if (source) {
    const src = ensureSite('sourceSite');
    src.siteType = 'survey';

    applyWorkUsers(src, 'surveyWork', source.surveyUsers);
    applyWorkUsers(src, 'civilWork', source.civilUsers);
    applyWorkUsers(src, 'telecomWork', source.teUsers);
    applyIbs(src, source.ibsAssignedTo);
  }

  // ---- DESTINATION ----
  if (destination) {
    const dst = ensureSite('destinationSite');
    dst.siteType =
      activity.siteType === 'DAS' ? 'destination' : 'indoor-building';

    applyWorkUsers(dst, 'surveyWork', destination.surveyUsers);
    applyWorkUsers(dst, 'civilWork', destination.civilUsers);
    applyWorkUsers(dst, 'telecomWork', destination.teUsers);
    applyIbs(dst, destination.ibsAssignedTo);
  }

  // ---- PRE WALK TEST ----
  if (preWalkTest?.assignedTo) {
    activity.preWalkTest ||= {};

    activity.preWalkTest.assignedTo = preWalkTest.assignedTo;
    activity.preWalkTest.assignedBy = assignedBy;
    activity.preWalkTest.assignedDate = new Date();

    if (preWalkTest.testDate)
      activity.preWalkTest.testDate = new Date(preWalkTest.testDate);
    if (preWalkTest.notes !== undefined)
      activity.preWalkTest.notes = preWalkTest.notes;

    activity.preWalkTest.status = preWalkTest.status || 'in-progress';
  }

  // ---- TOP LEVEL ASSIGNMENT ----
  activity.assignment ||= {};
  activity.assignment.assignedBy = assignedBy;

  // union of all assigned people
  const allAssignees = [...new Set(idsToCheck.map(String))];
  if (allAssignees.length) activity.assignment.assignedTo = allAssignees;

  if (dueDate) activity.assignment.dueDate = new Date(dueDate);
  activity.assignment.assignedDate =
    activity.assignment.assignedDate || new Date();

  activity.overallStatus = 'survey-assigned';
  activity.updatedBy = assignedBy;

  await activity.save();

  return res.json({
    success: true,
    message: 'Assigned successfully',
    data: activity,
  });
});
