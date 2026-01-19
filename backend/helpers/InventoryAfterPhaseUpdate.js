// helpers/handleInventoryAfterPhaseUpdate.js
// (keep your filename same if different)

const { syncSurveyMaterialsToInventory } = require('./activityInventorySync');
const {
  upsertInventoryAllocationRequestFromPhase,
} = require('./inventoryAllocationRequest.helper');

// ✅ CHANGE 1: ONLY add to inventory when DISPATCH is being updated (store)
// (remove survey + dismantling from here)
const ADD_DISMANTLING_PHASES = new Set(['dispatch']);

// ✅ keep same
const MINUS_AFTER_APPROVE_SUBPHASES = new Set(['civilWork', 'teWork' , 'telecomWork']); // request -> minus on approve

module.exports.handleInventoryAfterPhaseUpdate = async ({
  activityType,
  activity,
  phase,
  subPhase,
  beforeSnapshot,
  afterSnapshot,
  currentUser,
  inventoryLocation,
  inventoryLocationName,
}) => {
  // ---------------------------
  // 1) DISMANTLING: DISPATCH = ADD inventory (store)
  // ---------------------------
  if (activityType === 'dismantling') {
    if (ADD_DISMANTLING_PHASES.has(String(phase || '').trim())) {
      // optional: only when dispatch is in-progress/completed (your choice)
      // const st = String(afterSnapshot?.dispatch?.status || '').toLowerCase();
      // if (!['in-progress', 'completed', 'received'].includes(st)) {
      //   return { synced: false, mode: 'skip', message: 'Dispatch status not eligible' };
      // }

      return await syncSurveyMaterialsToInventory({
        activityType,
        activityId: activity._id,
        activityName: `Dismantling - ${activity.dismantlingType || 'N/A'}`,
        phase, // ✅ "dispatch"
        subPhase, // not used in dismantling, but ok
        beforeActivityDoc: beforeSnapshot,
        afterActivityDoc: afterSnapshot,
        userId: currentUser?.id || currentUser?._id,
        inventoryLocation,
        inventoryLocationName,
        activityDoc: activity, // ✅ saved doc
      });
    }

    return { synced: false, mode: 'skip', message: 'No inventory action' };
  }

  // ---------------------------
  // 2) RELOCATION: STORE OPERATOR = ADD inventory
  // ---------------------------
  if (activityType === 'relocation') {
    // ✅ CHANGE 2: add on storeOperatorWork (instead of surveyWork)
    if (subPhase === 'storeOperatorWork') {
      return await syncSurveyMaterialsToInventory({
        activityType,
        activityId: activity._id,
        activityName: 'relocation',
        phase, // sourceSite / destinationSite
        subPhase, // "storeOperatorWork"
        beforeActivityDoc: beforeSnapshot,
        afterActivityDoc: afterSnapshot,
        userId: currentUser?.id || currentUser?._id,
        inventoryLocation,
        inventoryLocationName,
        activityDoc: activity,
      });
    }

    // ✅ keep request flow
    if (MINUS_AFTER_APPROVE_SUBPHASES.has(subPhase)) {
      const requestResult = await upsertInventoryAllocationRequestFromPhase({
        activityType,
        activityId: activity._id,
        activityName: 'relocation',
        phase,
        subPhase,
        activityDoc: activity,
        userId: currentUser?.id || currentUser?._id,
        siteId: activity?.siteId?._id || activity?.siteId,
      });

      return {
        synced: false,
        mode: 'request',
        message: `Inventory request ${requestResult?.mode || 'updated'}`,
        requestId: requestResult?.requestId,
        requestKey: requestResult?.requestKey,
        requestedMaterialsCount: requestResult?.count || 0,
        createdOrUpdated: Boolean(requestResult?.createdOrUpdated),
      };
    }

    return { synced: false, mode: 'skip', message: 'No inventory action' };
  }

  // ---------------------------
  // 3) COW: INVENTORY WORK = ADD inventory
  // ---------------------------
  if (activityType === 'cow') {
    // ✅ CHANGE 3: add on inventoryWork (instead of surveyWork)
    if (subPhase === 'inventoryWork') {
      return await syncSurveyMaterialsToInventory({
        activityType,
        activityId: activity._id,
        activityName: 'cow',
        phase, // sourceSite / destinationSite
        subPhase, // "inventoryWork"
        beforeActivityDoc: beforeSnapshot,
        afterActivityDoc: afterSnapshot,
        userId: currentUser?.id || currentUser?._id,
        inventoryLocation,
        inventoryLocationName,
        activityDoc: activity,
      });
    }

    // ✅ keep request flow
    if (MINUS_AFTER_APPROVE_SUBPHASES.has(subPhase)) {
      const requestResult = await upsertInventoryAllocationRequestFromPhase({
        activityType,
        activityId: activity._id,
        activityName: 'cow',
        phase,
        subPhase,
        activityDoc: activity,
        userId: currentUser?.id || currentUser?._id,
        siteId: activity?.siteId?._id || activity?.siteId, // if exists in your cow doc, else remove
      });

      return {
        synced: false,
        mode: 'request',
        message: `Inventory request ${requestResult?.mode || 'updated'}`,
        requestId: requestResult?.requestId,
        requestKey: requestResult?.requestKey,
        requestedMaterialsCount: requestResult?.count || 0,
        createdOrUpdated: Boolean(requestResult?.createdOrUpdated),
      };
    }

    return { synced: false, mode: 'skip', message: 'No inventory action' };
  }

  return { synced: false, mode: 'skip', message: 'No inventory action' };
};
