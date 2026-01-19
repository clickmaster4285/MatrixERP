'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  useGetDismantlingActivities,
  useGetDismantlingActivity,
  useCreateDismantlingActivity,
  useUpdateDismantlingActivity,
  useDeleteDismantlingActivity,
} from '@/features/dismantlingApi';

export const useDismantlingManagement = ({
  initialFilters = {},
  initialSiteId = null,
} = {}) => {
  // Local UI state
  const [filters, setFilters] = useState(initialFilters);
  const [selectedActivityId, setSelectedActivityId] = useState(null);
  const [siteId, setSiteId] = useState(initialSiteId);

  // ---------- QUERIES ----------

  // Main list (optionally filtered by site)
  const {
    data: listRaw,
    isLoading: listLoading,
    error: listError,
  } = useGetDismantlingActivities({
    ...filters,
    ...(siteId ? { site: siteId } : {}),
  });

  // Single activity details
  const {
    data: detailRaw,
    isLoading: detailLoading,
    error: detailError,
  } = useGetDismantlingActivity(selectedActivityId || undefined);

  // ---------- MUTATIONS ----------

  const createMutation = useCreateDismantlingActivity();
  const updateMutation = useUpdateDismantlingActivity();
  const deleteMutation = useDeleteDismantlingActivity();

  // ---------- ADAPTERS ----------

  const activities = useMemo(() => {
    // listRaw shape from backend: { success, count, pagination, data: [ ... ] }
    if (!listRaw) return [];
    if (Array.isArray(listRaw.data)) return listRaw.data;
    // fallback if you ever change structure
    if (Array.isArray(listRaw.activities)) return listRaw.activities;
    return [];
  }, [listRaw]);

  const pagination = useMemo(() => {
    return listRaw?.pagination || {};
  }, [listRaw]);

  const currentActivity = useMemo(() => {
    // detailRaw: { success, data: { ...activity } }
    if (detailRaw?.data && typeof detailRaw.data === 'object') {
      return detailRaw.data;
    }
    return null;
  }, [detailRaw]);

  // ---------- CORE OPERATIONS ----------

  const createDismantling = useCallback(
    async (payload) => {
      return await createMutation.mutateAsync(payload);
    },
    [createMutation]
  );

  const updateDismantling = useCallback(
    async (activityId, data) => {
      return await updateMutation.mutateAsync({ activityId, data });
    },
    [updateMutation]
  );

  const deleteDismantling = useCallback(
    async (activityId) => {
      return await deleteMutation.mutateAsync(activityId);
    },
    [deleteMutation]
  );

  // ---------- EXPORT API ----------

  return {
    // Data
    activities,
    pagination,
    currentActivity,

    // Core operations
    createDismantling,
    updateDismantling,
    deleteDismantling,

    // Loading / error
    isLoading: listLoading || detailLoading,
    isCreating: createMutation.isLoading,
    isUpdating: updateMutation.isLoading,
    isDeleting: deleteMutation.isLoading,
    listError,
    detailError,

    // Selection & filters
    selectedActivityId,
    selectActivity: setSelectedActivityId,
    filters,
    updateFilters: setFilters,

    // Site scope (optional)
    siteId,
    setSiteId,
  };
};
