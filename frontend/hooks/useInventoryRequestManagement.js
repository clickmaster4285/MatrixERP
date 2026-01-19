'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  useGetInventoryRequests,

  useApproveInventoryRequest,
  useRejectInventoryRequest,
} from '@/features/inventoryRequestsApi';

export const useInventoryRequestManagement = ({
  initialFilters = {},
  initialRequestId = null,
  autoSelectFirst = true,
} = {}) => {
  // -----------------------
  // Local State
  // -----------------------
  const [filters, setFilters] = useState({
    status: 'pending', // pending | approved | rejected | all
    search: '',
    page: 1,
    limit: 20,
    ...initialFilters,
  });

  const [selectedRequestId, setSelectedRequestId] = useState(initialRequestId);

  // -----------------------
  // QUERIES
  // -----------------------
  const {
    data: requestsRaw,
    isLoading: requestsLoading,
    error: requestsError,
  } = useGetInventoryRequests(filters);



  // -----------------------
  // MUTATIONS
  // -----------------------
  const approveMutation = useApproveInventoryRequest();
  const rejectMutation = useRejectInventoryRequest();

  // -----------------------
  // ADAPTERS (defensive)
  // -----------------------
  const requests = useMemo(() => {
    if (!requestsRaw) return [];

    // { data: [...] }
    if (Array.isArray(requestsRaw?.data)) return requestsRaw.data;

    // { data: { data: [...] } } (sometimes)
    if (Array.isArray(requestsRaw?.data?.data)) return requestsRaw.data.data;

    // { requests: [...] }
    if (Array.isArray(requestsRaw?.requests)) return requestsRaw.requests;

    // raw array
    if (Array.isArray(requestsRaw)) return requestsRaw;

    return [];
  }, [requestsRaw]);

  const pagination = useMemo(() => {
    return requestsRaw?.data?.pagination || requestsRaw?.pagination || {};
  }, [requestsRaw]);

  const totals = useMemo(() => {
    return requestsRaw?.data?.totals || requestsRaw?.totals || {};
  }, [requestsRaw]);



  // -----------------------
  // Auto-select first (optional)
  // -----------------------
  useMemo(() => {
    if (!autoSelectFirst) return;
    if (selectedRequestId) return;
    if (!requests?.length) return;

    setSelectedRequestId(requests[0]._id);
  }, [autoSelectFirst, selectedRequestId, requests]);

  // -----------------------
  // Filters helpers
  // -----------------------
  const updateFilters = useCallback((next) => {
    setFilters((prev) => {
      if (typeof next === 'function') return next(prev);
      return { ...prev, ...next };
    });
  }, []);

  const setStatus = useCallback(
    (status) => {
      updateFilters({ status, page: 1 });
    },
    [updateFilters]
  );

  const setSearch = useCallback(
    (search) => {
      updateFilters({ search, page: 1 });
    },
    [updateFilters]
  );

  const setPage = useCallback(
    (page) => {
      updateFilters({ page });
    },
    [updateFilters]
  );

  const setLimit = useCallback(
    (limit) => {
      updateFilters({ limit, page: 1 });
    },
    [updateFilters]
  );

  const resetFilters = useCallback(() => {
    setFilters({
      status: 'pending',
      search: '',
      page: 1,
      limit: 20,
      ...initialFilters,
    });
  }, [initialFilters]);

  // -----------------------
  // Core operations
  // -----------------------
  const selectRequest = useCallback((id) => {
    setSelectedRequestId(id);
  }, []);

  const approveRequest = useCallback(
    async (requestId) => {
      const id = requestId || selectedRequestId;
      if (!id) throw new Error('No requestId provided to approve');

      return await approveMutation.mutateAsync({ requestId: id });
    },
    [approveMutation, selectedRequestId]
  );

  const rejectRequest = useCallback(
    async ({ requestId, reason }) => {
      const id = requestId || selectedRequestId;
      if (!id) throw new Error('No requestId provided to reject');

      return await rejectMutation.mutateAsync({
        requestId: id,
        reason: reason || '',
      });
    },
    [rejectMutation, selectedRequestId]
  );

  // -----------------------
  // Computed stats (for UI)
  // -----------------------
  const counts = useMemo(() => {
    const pending = requests.filter(
      (r) => String(r.status).toLowerCase() === 'pending'
    ).length;
    const approved = requests.filter(
      (r) => String(r.status).toLowerCase() === 'approved'
    ).length;
    const rejected = requests.filter(
      (r) => String(r.status).toLowerCase() === 'rejected'
    ).length;

    return { pending, approved, rejected, total: requests.length };
  }, [requests]);

  // -----------------------
  // Export API
  // -----------------------
  return {
    // Data
    requests,
   
    pagination,
    totals,
    counts,

    // Filters / selection
    filters,
    updateFilters,
    setStatus,
    setSearch,
    setPage,
    setLimit,
    resetFilters,
    selectedRequestId,
    selectRequest,

    // Mutations
    approveRequest,
    rejectRequest,

    // Loading / Errors
    isLoading: requestsLoading ,
    listLoading: requestsLoading,
   

    isApproving: approveMutation.isLoading,
    isRejecting: rejectMutation.isLoading,

    listError: requestsError,

  };
};
