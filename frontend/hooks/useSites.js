// hooks/useSites.js
'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  useGetSites,
  useGetSiteById,
  useCreateSite,
  useUpdateSite,
} from '../features/siteApi';

export const useSiteManagement = ({
  initialFilters = {},
  projectId: initialProjectId = null,
} = {}) => {
  const [filters, setFilters] = useState(initialFilters);
  const [selectedSiteId, setSelectedSiteId] = useState(null);
  const [projectId, setProjectId] = useState(initialProjectId);

  // All sites (with filters)
  const {
    data: sitesRaw,
    isLoading: sitesLoading,
    error: sitesError,
  } = useGetSites(filters);


  const {
    data: siteDetailResponse,
    isLoading: siteDetailLoading,
    error: siteDetailError,
  } = useGetSiteById(selectedSiteId || undefined);

  const createSiteMutation = useCreateSite();
  const updateSiteMutation = useUpdateSite();

  // Extract activities from the site detail
  const activities = useMemo(() => {
    if (!siteDetailResponse?.data?.activities) {
      return {
        dismantling: { count: 0, activities: [] },
        cow: { count: 0, activities: [] },
        relocation: { count: 0, activities: [] },
      };
    }
    return siteDetailResponse.data.activities;
  }, [siteDetailResponse]);

  // Extract the main site data (without activities for backward compatibility)
  const currentSite = useMemo(() => {
    if (siteDetailResponse?.data) {
      // Return the site data without activities if needed elsewhere
      const { activities, ...siteData } = siteDetailResponse.data;
      return siteData;
    }
    return null;
  }, [siteDetailResponse]);

  // Helper to get the full site with activities
  const currentSiteWithActivities = useMemo(() => {
    return siteDetailResponse?.data || null;
  }, [siteDetailResponse]);

  const allSites = useMemo(() => {
    if (!sitesRaw) return [];

    if (sitesRaw?.data?.sites && Array.isArray(sitesRaw.data.sites)) {
      return sitesRaw.data.sites;
    }
    if (sitesRaw?.sites && Array.isArray(sitesRaw.sites)) {
      return sitesRaw.sites;
    }
    if (Array.isArray(sitesRaw)) {
      return sitesRaw;
    }

    return [];
  }, [sitesRaw]);


  const pagination = useMemo(() => {
    return sitesRaw?.data?.pagination || sitesRaw?.pagination || {};
  }, [sitesRaw]);

  const analytics = useMemo(() => {
    return sitesRaw?.data?.analytics || sitesRaw?.analytics || {};
  }, [sitesRaw]);

  const createSite = useCallback(
    async (siteData) => {
      const payload = {
        ...siteData,
      };

      if (projectId && !payload.project) {
        payload.project = projectId;
      }

      return await createSiteMutation.mutateAsync(payload);
    },
    [createSiteMutation, projectId]
  );

  const updateSite = useCallback(
    async (siteId, updateData) => {
      return await updateSiteMutation.mutateAsync({
        siteId,
        updateData,
      });
    },
    [updateSiteMutation]
  );

  // Helper function to get activities summary
  const getActivitiesSummary = useCallback(() => {
    if (!activities) return {};

    return {
      totalActivities:
        (activities.dismantling?.count || 0) +
        (activities.cow?.count || 0) +
        (activities.relocation?.count || 0),
      byType: {
        dismantling: activities.dismantling?.count || 0,
        cow: activities.cow?.count || 0,
        relocation: activities.relocation?.count || 0,
      },
      // Get latest activity
      latestActivity: () => {
        const allActivities = [
          ...(activities.dismantling?.activities || []),
          ...(activities.cow?.activities || []),
          ...(activities.relocation?.activities || []),
        ];

        return allActivities.sort((a, b) =>
          new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
        )[0] || null;
      }
    };
  }, [activities]);

  return {
    // Data
    allSites,
    currentSite, // Site data without activities (for backward compatibility)
    currentSiteWithActivities, // Full site data with activities
    activities, // Just the activities object
    activitiesSummary: getActivitiesSummary(), // Summary of activities

    pagination,
    analytics,

    // Core operations
    createSite,
    updateSite,

    // Convenience operations
    updateSiteStatus: useCallback(
      async (siteId, status) => {
        return updateSite(siteId, { overallStatus: status });
      },
      [updateSite]
    ),
    updateSiteLocation: useCallback(
      async (siteId, { city, address, latitude, longitude }) => {
        const location = {};
        if (city !== undefined) location.city = city;
        if (address !== undefined) location.address = address;
        if (latitude !== undefined && longitude !== undefined) {
          location.coordinates = { lat: latitude, lng: longitude };
        }

        return updateSite(siteId, { location });
      },
      [updateSite]
    ),
    linkSiteToProject: useCallback(
      async (siteId, newProjectId) => {
        return updateSite(siteId, { project: newProjectId });
      },
      [updateSite]
    ),

    // Loading / error states
    isLoading: sitesLoading || siteDetailLoading,
    isCreating: createSiteMutation.isLoading,
    isUpdating: updateSiteMutation.isLoading,
    listError: sitesError,
    detailError: siteDetailError,

    // Selection & filters
    selectedSiteId,
    selectSite: setSelectedSiteId,
    filters,
    updateFilters: setFilters,

    // Project scope (useful for project detail pages)
    projectId,
    setProjectId,
  };
};