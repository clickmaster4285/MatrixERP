'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  useGetInventoryOverview,
  useGetAvailableMaterials,
  useGetActivityAllocations,
  useAddMaterialsToActivity,
  useRemoveMaterialsFromActivity,
  useReturnActivityMaterials,
  useManualBulkAddToInventory,
  useUpdateInventoryById,
  useManualBulkUpdateInventory,
  useSoftDeleteInventoryById,
  useGetInventoryDropdown,
} from '@/features/inventoryApi';

export const useInventoryManagement = ({
  initialOverviewFilters = {},
  initialAvailableFilters = {},
  initialAllocationsFilters = {},

  // optional defaults (handy if you open inventory inside a location or activity screen)
  defaultLocation = null,
  defaultActivity = null, // { activityId, activityType }
} = {}) => {
  // -----------------------
  // Local state
  // -----------------------
  const [overviewFilters, setOverviewFilters] = useState({
    search: '',
    status: 'all',
    page: 1,
    limit: 20,
    location: defaultLocation || undefined,
    ...initialOverviewFilters,
  });

  const [availableFilters, setAvailableFilters] = useState({
    location: defaultLocation || undefined,
    category: undefined,
    minQuantity: undefined,
    ...initialAvailableFilters,
  });

  const [allocationsFilters, setAllocationsFilters] = useState({
    activityId: defaultActivity?.activityId || undefined,
    activityType: defaultActivity?.activityType || undefined,
    status: undefined,
    location: defaultLocation || undefined,
    ...initialAllocationsFilters,
  });

  // ✅ NEW: dropdown filters (optional)
  const [dropdownFilters, setDropdownFilters] = useState({
    location: defaultLocation || undefined,
    // q: '' // if you want server-side search later
  });

  // helpful selections (optional)
  const [selectedInventoryId, setSelectedInventoryId] = useState(null);

  // -----------------------
  // QUERIES
  // -----------------------
  const {
    data: overviewRaw,
    isLoading: overviewLoading,
    error: overviewError,
  } = useGetInventoryOverview(overviewFilters);

  const {
    data: availableRaw,
    isLoading: availableLoading,
    error: availableError,
  } = useGetAvailableMaterials(availableFilters);

  const {
    data: allocationsRaw,
    isLoading: allocationsLoading,
    error: allocationsError,
  } = useGetActivityAllocations(allocationsFilters);

  // ✅ NEW: inventory dropdown (non-paginated)
  const {
    data: dropdownRaw,
    isLoading: dropdownLoading,
    error: dropdownError,
  } = useGetInventoryDropdown(dropdownFilters);

  // -----------------------
  // MUTATIONS
  // -----------------------
  const addMutation = useAddMaterialsToActivity();
  const removeMutation = useRemoveMaterialsFromActivity();
  const returnMutation = useReturnActivityMaterials();
  const bulkAddMutation = useManualBulkAddToInventory();
  const singleUpdateMutation = useUpdateInventoryById();
  const bulkUpdateMutation = useManualBulkUpdateInventory();
  const softDeleteMutation = useSoftDeleteInventoryById();

  // -----------------------
  // ADAPTERS (defensive)
  // -----------------------
  const overviewItems = useMemo(() => {
    if (!overviewRaw) return [];

    if (Array.isArray(overviewRaw?.data)) return overviewRaw.data;
    if (Array.isArray(overviewRaw)) return overviewRaw;
    if (Array.isArray(overviewRaw?.data?.data)) return overviewRaw.data.data;

    return [];
  }, [overviewRaw]);

  const overviewPagination = useMemo(() => {
    return overviewRaw?.pagination || overviewRaw?.data?.pagination || {};
  }, [overviewRaw]);

  const overviewTotals = useMemo(() => {
    return overviewRaw?.totals || overviewRaw?.data?.totals || {};
  }, [overviewRaw]);

  const availableMaterials = useMemo(() => {
    if (!availableRaw) return [];

    if (Array.isArray(availableRaw?.data)) return availableRaw.data;
    if (Array.isArray(availableRaw)) return availableRaw;
    if (Array.isArray(availableRaw?.data?.data)) return availableRaw.data.data;

    return [];
  }, [availableRaw]);

  const totalAvailable = useMemo(() => {
    return (
      availableRaw?.totalAvailable ?? availableRaw?.data?.totalAvailable ?? 0
    );
  }, [availableRaw]);

  const allocations = useMemo(() => {
    if (!allocationsRaw) return [];

    if (Array.isArray(allocationsRaw?.data)) return allocationsRaw.data;
    if (Array.isArray(allocationsRaw)) return allocationsRaw;
    if (Array.isArray(allocationsRaw?.data?.data))
      return allocationsRaw.data.data;

    return [];
  }, [allocationsRaw]);

  // ✅ NEW: dropdown items list adapter
  const dropdownItems = useMemo(() => {
    if (!dropdownRaw) return [];

    // expected: { success, data: [...] }
    if (Array.isArray(dropdownRaw?.data)) return dropdownRaw.data;
    if (Array.isArray(dropdownRaw)) return dropdownRaw;
    if (Array.isArray(dropdownRaw?.data?.data)) return dropdownRaw.data.data;

    return [];
  }, [dropdownRaw]);

  // Selected item (from overview list)
  const selectedInventoryItem = useMemo(() => {
    if (!selectedInventoryId) return null;
    return overviewItems.find((x) => x?._id === selectedInventoryId) || null;
  }, [overviewItems, selectedInventoryId]);

  // -----------------------
  // CORE OPERATIONS
  // -----------------------
  const addMaterialsToActivity = useCallback(
    async ({
      activityId,
      activityType,
      activityName,
      location,
      locationName,
      materials,
    }) => {
      const payload = {
        activityId,
        activityType,
        activityName,
        location,
        locationName,
        materials,
      };
      return await addMutation.mutateAsync(payload);
    },
    [addMutation]
  );

  const removeMaterialsFromActivity = useCallback(
    async ({
      activityId,
      activityType,
      activityName,
      location,
      locationName,
      materials,
    }) => {
      const payload = {
        activityId,
        activityType,
        activityName,
        location,
        locationName,
        materials,
      };
      return await removeMutation.mutateAsync(payload);
    },
    [removeMutation]
  );

  const returnMaterialsToInventory = useCallback(
    async ({ activityId, activityType, location, materials }) => {
      const payload = {
        activityId,
        activityType,
        location,
        materials,
      };
      return await returnMutation.mutateAsync(payload);
    },
    [returnMutation]
  );

  const manualBulkAdd = useCallback(
    async (items) => {
      return await bulkAddMutation.mutateAsync({ items });
    },
    [bulkAddMutation]
  );

  const softDeleteInventory = useCallback(
    async ({ id, location }) => {
      return await softDeleteMutation.mutateAsync({ id, location });
    },
    [softDeleteMutation]
  );

  const updateInventorySingle = useCallback(
    async ({ id, ...payload }) => {
      return await singleUpdateMutation.mutateAsync({ id, ...payload });
    },
    [singleUpdateMutation]
  );

  const manualBulkUpdate = useCallback(
    async (items) => {
      return await bulkUpdateMutation.mutateAsync({ items });
    },
    [bulkUpdateMutation]
  );

  // -----------------------
  // CONVENIENCE HELPERS
  // -----------------------
  const setOverviewSearch = useCallback((search) => {
    setOverviewFilters((prev) => ({ ...prev, search: search || '', page: 1 }));
  }, []);

  const setOverviewPage = useCallback((page) => {
    setOverviewFilters((prev) => ({ ...prev, page: Number(page) || 1 }));
  }, []);

  const setOverviewLimit = useCallback((limit) => {
    setOverviewFilters((prev) => ({
      ...prev,
      limit: Number(limit) || 20,
      page: 1,
    }));
  }, []);

  const resetOverviewFilters = useCallback(() => {
    setOverviewFilters({
      search: '',
      status: 'all',
      page: 1,
      limit: 20,
      location: defaultLocation || undefined,
      ...initialOverviewFilters,
    });
  }, [defaultLocation, initialOverviewFilters]);

  const setLocationScope = useCallback((location, locationName) => {
    setOverviewFilters((prev) => ({
      ...prev,
      location: location || undefined,
      page: 1,
    }));

    setAvailableFilters((prev) => ({
      ...prev,
      location: location || undefined,
    }));

    setAllocationsFilters((prev) => ({
      ...prev,
      location: location || undefined,
    }));

    // ✅ NEW: also scope dropdown list
    setDropdownFilters((prev) => ({
      ...prev,
      location: location || undefined,
    }));

    void locationName;
  }, []);

  const setActivityScope = useCallback(({ activityId, activityType }) => {
    setAllocationsFilters((prev) => ({
      ...prev,
      activityId: activityId || undefined,
      activityType: activityType || undefined,
    }));
  }, []);

  // -----------------------
  // EXPORT API
  // -----------------------
  return {
    // Data
    overviewItems,
    overviewPagination,
    overviewTotals,

    availableMaterials,
    totalAvailable,

    allocations,

    // ✅ NEW: dropdown
    dropdownItems,
    dropdownFilters,
    updateDropdownFilters: setDropdownFilters,
    dropdownLoading,
    dropdownError,

    // Core operations
    addMaterialsToActivity,
    removeMaterialsFromActivity,
    returnMaterialsToInventory,
    manualBulkAdd,
    updateInventorySingle,
    manualBulkUpdate,
    softDeleteInventory,

    // Filters & helpers
    overviewFilters,
    updateOverviewFilters: setOverviewFilters,
    setOverviewSearch,
    setOverviewPage,
    setOverviewLimit,
    resetOverviewFilters,

    availableFilters,
    updateAvailableFilters: setAvailableFilters,

    allocationsFilters,
    updateAllocationsFilters: setAllocationsFilters,

    setLocationScope,
    setActivityScope,

    // Selection
    selectedInventoryId,
    selectInventoryItem: setSelectedInventoryId,
    selectedInventoryItem,

    // Loading / error
    isLoading:
      overviewLoading || availableLoading || allocationsLoading || dropdownLoading,
    overviewLoading,
    availableLoading,
    allocationsLoading,

    listError: overviewError || availableError || dropdownError,
    allocationsError,

    // Mutation states
    isAdding: addMutation.isLoading,
    isRemoving: removeMutation.isLoading,
    isReturning: returnMutation.isLoading,
    isBulkAdding: bulkAddMutation.isLoading,
    isSoftDeleting: softDeleteMutation.isLoading,
    isSingleUpdating: singleUpdateMutation.isLoading,
    isBulkUpdating: bulkUpdateMutation.isLoading,

    addError: addMutation.error,
    removeError: removeMutation.error,
    returnError: returnMutation.error,
    bulkAddError: bulkAddMutation.error,
    singleUpdateError: singleUpdateMutation.error,
    bulkUpdateError: bulkUpdateMutation.error,
    softDeleteError: softDeleteMutation.error,
  };
};
