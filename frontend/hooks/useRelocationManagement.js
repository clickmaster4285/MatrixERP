// hooks/useRelocationManagement.js
import { useState, useCallback } from 'react';
import {
  useGetRelocationActivities,
  useGetRelocationActivity,
  useCreateRelocationActivity,
  useUpdateRelocationActivity,
  useDeleteRelocationActivity,
} from '@/features/relocationApi';
import { useGetSites } from '@/features/siteApi';
import { useUsers } from '@/features/userApi';

export const useRelocationManagement = () => {
  const [filters, setFilters] = useState({});

  // Fetch all sites
  const {
    data: sitesData,
    isLoading: isLoadingSites,
    error: sitesError,
  } = useGetSites();

  // Fetch all users
  const {
    data: usersData,
    isLoading: isLoadingUsers,
    error: usersError,
  } = useUsers();

  // Format users
  const formattedUsers = (() => {
    if (!usersData) return [];

    let raw = [];
    if (Array.isArray(usersData?.data?.users)) {
      raw = usersData.data.users;
    } else if (Array.isArray(usersData?.users)) {
      raw = usersData.users;
    } else if (Array.isArray(usersData?.data)) {
      raw = usersData.data;
    } else if (Array.isArray(usersData)) {
      raw = usersData;
    } else {
      raw = [];
    }

    return raw.map((user) => ({
      _id: user._id,
      name: user.name || user.fullName || user.email || 'Unknown User',
      email: user.email,
      role: user.role,
    }));
  })();

  // Format sites
  const formattedSites = useCallback(() => {
    const sites = sitesData?.data || sitesData;

    if (!sites) return [];

    if (Array.isArray(sites)) {
      return sites.map((site) => ({
        _id: site._id,
        name: site.name || site.siteId || `Site ${site._id?.slice(-6)}`,
        location: site.location || site.address || {},
        status: site.status,
      }));
    }

    if (sites.sites && Array.isArray(sites.sites)) {
      return sites.sites.map((site) => ({
        _id: site._id,
        name: site.name || site.siteId || `Site ${site._id?.slice(-6)}`,
        location: site.location || site.address || {},
        status: site.status,
      }));
    }

    return [];
  }, [sitesData]);

  // API hooks
  const {
    data: activitiesData,
    isLoading: isLoadingActivities,
    error: activitiesError,
    refetch: refetchActivities,
  } = useGetRelocationActivities(filters);

  // Single activity hook - to be used as a hook in components
  const useGetRelocationActivityQuery = useGetRelocationActivity;

  const createRelocationMutation = useCreateRelocationActivity();
  const updateRelocationMutation = useUpdateRelocationActivity();
  const deleteRelocationMutation = useDeleteRelocationActivity();

  // Filters
  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Status utilities
  const getStatusColor = useCallback((status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      active: 'bg-sky-100 text-sky-800',
      completed: 'bg-green-100 text-green-800',
      'not-started': 'bg-gray-100 text-gray-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }, []);

  // Get assigned users for a specific work type
  const getAssignedUsers = useCallback((site, workType) => {
    if (!site || !workType) return [];

    const workField = `${workType}Work`;
    return site[workField]?.assignedUsers || [];
  }, []);

  const getSiteWorkTypes = useCallback((site) => {
    if (!site || !site.workTypes) return [];
    return site.workTypes.map((type) => {
      const labels = {
        civil: 'Civil Work',
        telecom: 'Telecom Work',
        survey: 'Survey',
        dismantling: 'Dismantling',
        storeOperator: 'Store Operator',
      };
      return labels[type] || type;
    });
  }, []);

  const hasWorkType = useCallback((site, workType) => {
    return site?.workTypes?.includes(workType) || false;
  }, []);

  return {
    // Data
    activities: activitiesData?.data?.items || activitiesData?.data || [],
    pagination: activitiesData?.data?.pagination,

    // Sites and Users
    sites: formattedSites(),
    users: formattedUsers,
    isLoadingFormData: isLoadingSites || isLoadingUsers,
    formDataError: sitesError || usersError,

    // Loading
    isLoadingActivities,
    isCreating: createRelocationMutation.isLoading,
    isUpdating: updateRelocationMutation.isLoading,
    isDeleting: deleteRelocationMutation.isLoading,

    // Errors
    activitiesError,

    // Mutations
    createRelocation: createRelocationMutation.mutateAsync,
    updateRelocation: updateRelocationMutation.mutateAsync,
    deleteRelocation: deleteRelocationMutation.mutateAsync,

    // Queries
    useGetRelocationActivityQuery,
    refetchActivities,

    // Filters
    filters,
    updateFilters,
    clearFilters,

    // Utilities
    getStatusColor,
    getSiteWorkTypes,
    hasWorkType,
    getAssignedUsers,
  };
};