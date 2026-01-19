'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  useGetVendors,
  useGetVendorById,
  useGetVendorDropdown,
  useCreateVendor,
  useUpdateVendor,
  useDeleteVendor,
} from '@/features/vendorApi';

export const useVendorManagement = ({
  initialFilters = {},
  initialVendorId = null,
  autoLoadDropdown = true,
  initialIncludeDeleted = false,
} = {}) => {
  // -----------------------
  // Local State
  // -----------------------
  const [filters, setFilters] = useState({
    search: '',
    type: undefined,
    page: 1,
    limit: 20,
    includeDeleted: initialIncludeDeleted ? 'true' : 'false',
    ...initialFilters,
  });

  const [selectedVendorId, setSelectedVendorId] = useState(initialVendorId);

  // -----------------------
  // QUERIES
  // -----------------------
  const {
    data: vendorsRaw,
    isLoading: vendorsLoading,
    error: vendorsError,
  } = useGetVendors(filters);

  const {
    data: vendorDetailRaw,
    isLoading: vendorDetailLoading,
    error: vendorDetailError,
  } = useGetVendorById(selectedVendorId, {
    includeDeleted: filters?.includeDeleted,
  });

  const {
    data: dropdownRaw,
    isLoading: dropdownLoading,
    error: dropdownError,
  } = useGetVendorDropdown(undefined, {
    enabled: !!autoLoadDropdown,
  });

  // -----------------------
  // MUTATIONS
  // -----------------------
  const createVendorMutation = useCreateVendor();
  const updateVendorMutation = useUpdateVendor();
  const deleteVendorMutation = useDeleteVendor();

  // -----------------------
  // ADAPTERS (defensive)
  // -----------------------
  const vendors = useMemo(() => {
    if (!vendorsRaw) return [];

    // expected: { success, data: [...], pagination }
    if (Array.isArray(vendorsRaw?.data)) return vendorsRaw.data;

    // { data: { data: [...] } } (if wrapped)
    if (Array.isArray(vendorsRaw?.data?.data)) return vendorsRaw.data.data;

    // array direct
    if (Array.isArray(vendorsRaw)) return vendorsRaw;

    return [];
  }, [vendorsRaw]);

  const pagination = useMemo(() => {
    return vendorsRaw?.pagination || vendorsRaw?.data?.pagination || {};
  }, [vendorsRaw]);

  const currentVendor = useMemo(() => {
    if (!vendorDetailRaw) return null;

    if (vendorDetailRaw?.data && typeof vendorDetailRaw.data === 'object') {
      return vendorDetailRaw.data;
    }
    if (vendorDetailRaw && typeof vendorDetailRaw === 'object') {
      return vendorDetailRaw;
    }
    return null;
  }, [vendorDetailRaw]);

  const vendorDropdown = useMemo(() => {
    if (!dropdownRaw) return [];

    if (Array.isArray(dropdownRaw?.data)) return dropdownRaw.data;
    if (Array.isArray(dropdownRaw?.data?.data)) return dropdownRaw.data.data;
    if (Array.isArray(dropdownRaw)) return dropdownRaw;

    return [];
  }, [dropdownRaw]);

  // -----------------------
  // CORE OPERATIONS
  // -----------------------
  const createVendor = useCallback(
    async (vendorData) => {
      return await createVendorMutation.mutateAsync(vendorData);
    },
    [createVendorMutation]
  );

  const updateVendor = useCallback(
    async (vendorId, updateData) => {
      return await updateVendorMutation.mutateAsync({
        vendorId,
        updateData,
      });
    },
    [updateVendorMutation]
  );

  const deleteVendor = useCallback(
    async (vendorId) => {
      return await deleteVendorMutation.mutateAsync(vendorId);
    },
    [deleteVendorMutation]
  );

  // -----------------------
  // CONVENIENCE HELPERS
  // -----------------------
  const setSearch = useCallback((search) => {
    setFilters((prev) => ({ ...prev, search: search || '', page: 1 }));
  }, []);

  const setType = useCallback((type) => {
    setFilters((prev) => ({ ...prev, type: type || undefined, page: 1 }));
  }, []);

  const setPage = useCallback((page) => {
    setFilters((prev) => ({ ...prev, page: Number(page) || 1 }));
  }, []);

  const setLimit = useCallback((limit) => {
    setFilters((prev) => ({ ...prev, limit: Number(limit) || 20, page: 1 }));
  }, []);

  const toggleIncludeDeleted = useCallback((value) => {
    const v = value ? 'true' : 'false';
    setFilters((prev) => ({ ...prev, includeDeleted: v, page: 1 }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      type: undefined,
      page: 1,
      limit: 20,
      includeDeleted: initialIncludeDeleted ? 'true' : 'false',
      ...initialFilters,
    });
  }, [initialFilters, initialIncludeDeleted]);

  // -----------------------
  // EXPORT API
  // -----------------------
  return {
    // Data
    vendors,
    pagination,
    currentVendor,
    vendorDropdown,

    // Core operations
    createVendor,
    updateVendor,
    deleteVendor,

    // Loading / error
    isLoading:
      vendorsLoading ||
      vendorDetailLoading ||
      (autoLoadDropdown && dropdownLoading),
    listLoading: vendorsLoading,
    detailLoading: vendorDetailLoading,
    dropdownLoading: autoLoadDropdown ? dropdownLoading : false,

    listError: vendorsError,
    detailError: vendorDetailError,
    dropdownError: autoLoadDropdown ? dropdownError : null,

    // Mutation states
    isCreating: createVendorMutation.isLoading,
    isUpdating: updateVendorMutation.isLoading,
    isDeleting: deleteVendorMutation.isLoading,

    createError: createVendorMutation.error,
    updateError: updateVendorMutation.error,
    deleteError: deleteVendorMutation.error,

    // Selection
    selectedVendorId,
    selectVendor: setSelectedVendorId,

    // Filters
    filters,
    updateFilters: setFilters,
    setSearch,
    setType,
    setPage,
    setLimit,
    toggleIncludeDeleted,
    resetFilters,
  };
};
