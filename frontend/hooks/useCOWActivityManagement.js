import { useState, useCallback, useMemo } from 'react';
import {
   useGetCOWActivities,
   useGetCOWActivity,
   useCreateCOWActivity,
   useUpdateCOWActivity,
   useDeleteCOWActivity,
   formatActivityForForm,
   prepareActivityPayload,
   useAddMissingInventoryMaterials
} from '@/features/cowActivityApi';
import { useGetSites } from '@/features/siteApi';
import { useUsers } from '@/features/userApi';

export const useCOWActivityManagement = () => {
   const [filters, setFilters] = useState({});
   const [selectedActivity, setSelectedActivity] = useState(null);

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

   // API hooks
   const {
      data: activitiesData,
      isLoading: isLoadingActivities,
      error: activitiesError,
      refetch: refetchActivities,
   } = useGetCOWActivities(filters);

   const createCOWActivityMutation = useCreateCOWActivity();
   const updateCOWActivityMutation = useUpdateCOWActivity();
   const deleteCOWActivityMutation = useDeleteCOWActivity();
   const addMissingInventoryMaterialsMutation = useAddMissingInventoryMaterials();

   // Calculate activity progress - MOVE THIS BEFORE formattedActivities useMemo
   const calculateActivityProgress = useCallback((activity) => {
      let totalWorkItems = 0;
      let completedWorkItems = 0;

      const sites = [];
      if (activity.sourceSite) sites.push(activity.sourceSite);
      if (activity.destinationSite) sites.push(activity.destinationSite);

      sites.forEach(site => {
         const workTypes = site.workTypes || [];
         totalWorkItems += workTypes.length;

         workTypes.forEach(workType => {
            const work = site[`${workType}Work`];
            if (work && work.status === 'completed') {
               completedWorkItems++;
            }
         });
      });

      if (totalWorkItems === 0) return 0;
      return Math.round((completedWorkItems / totalWorkItems) * 100);
   }, []);

   // Format users for dropdown
   const formattedUsers = useMemo(() => {
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
         value: user._id,
         label: user.name || user.fullName || user.email || 'Unknown User',
         email: user.email,
         role: user.role,
      }));
   }, [usersData]);

   // Format sites for dropdown
   const formattedSites = useMemo(() => {
      const sites = sitesData?.data || sitesData;

      if (!sites) return [];

      if (Array.isArray(sites)) {
         return sites.map((site) => ({
            value: site._id,
            label: site.name || site.siteId || `Site ${site._id?.slice(-6)}`,
            location: site.location || site.address || {},
            status: site.status,
         }));
      }

      if (sites.sites && Array.isArray(sites.sites)) {
         return sites.sites.map((site) => ({
            value: site._id,
            label: site.name || site.siteId || `Site ${site._id?.slice(-6)}`,
            location: site.location || site.address || {},
            status: site.status,
         }));
      }

      return [];
   }, [sitesData]);

   // Format activities for display - NOW calculateActivityProgress is defined
   const formattedActivities = useMemo(() => {
      const activities = activitiesData?.data?.items || activitiesData?.data || [];

      return activities.map((activity) => {
         // Get source location from address - FIXED PATH
         const sourceAddress = activity.sourceSite?.location?.address;
         const sourceCity = sourceAddress?.city ||
            sourceAddress?.street ||
            'Not specified';

         // Get destination location from address - FIXED PATH
         const destinationAddress = activity.destinationSite?.location?.address;
         const destinationCity = destinationAddress?.city ||
            destinationAddress?.street ||
            'Not specified';

         // Format full address for tooltips
         const formatFullAddress = (address) => {
            if (!address) return 'Address not specified';
            const parts = [];
            if (address.street) parts.push(address.street);
            if (address.city) parts.push(address.city);
            if (address.state) parts.push(address.state);
            return parts.join(', ');
         };

         return {
            _id: activity._id,
            activityName: activity.activityName,
            siteName: activity.siteId?.name || 'Unknown Site',
            purpose: activity.purpose,
            overallStatus: activity.overallStatus,
            plannedStartDate: activity.plannedStartDate,
            plannedEndDate: activity.plannedEndDate,
            actualStartDate: activity.actualStartDate,
            actualEndDate: activity.actualEndDate,
            createdBy: activity.createdBy?.name || 'Unknown',
            createdAt: activity.createdAt,

            // Location data
            sourceLocation: sourceCity,
            destinationLocation: destinationCity,
            sourceFullAddress: formatFullAddress(sourceAddress),
            destinationFullAddress: formatFullAddress(destinationAddress),

            // Full site objects
            sourceSite: activity.sourceSite,
            destinationSite: activity.destinationSite,

            // Progress
            progress: calculateActivityProgress(activity),

            // Additional data
            description: activity.description || '',
            teamMembers: activity.teamMembers || [],
            notes: activity.notes || '',
            siteId: activity.siteId,

            // Work types
            sourceWorkTypes: activity.sourceSite?.workTypes || [],
            destinationWorkTypes: activity.destinationSite?.workTypes || [],
            allWorkTypes: [
               ...(activity.sourceSite?.workTypes || []),
               ...(activity.destinationSite?.workTypes || [])
            ]
         };
      });
   }, [activitiesData, calculateActivityProgress]); // Don't forget to add calculateActivityProgress as a dependency

   // Get status color
   const getStatusColor = useCallback((status) => {
      const colors = {
         planned: 'bg-sky-100 text-sky-800',
         'in-progress': 'bg-yellow-100 text-yellow-800',
         completed: 'bg-green-100 text-green-800',
         cancelled: 'bg-red-100 text-red-800',
         'on-hold': 'bg-gray-100 text-gray-800',
      };
      return colors[status] || 'bg-gray-100 text-gray-800';
   }, []);

   // Get work status color
   const getWorkStatusColor = useCallback((status) => {
      const colors = {
         'not-started': 'bg-gray-100 text-gray-800',
         'in-progress': 'bg-yellow-100 text-yellow-800',
         completed: 'bg-green-100 text-green-800',
         loading: 'bg-sky-100 text-sky-800',
         'in-transit': 'bg-indigo-100 text-indigo-800',
         unloading: 'bg-purple-100 text-purple-800',
      };
      return colors[status] || 'bg-gray-100 text-gray-800';
   }, []);

   // Get site work types
   const getSiteWorkTypes = useCallback((site) => {
      if (!site || !site.workTypes) return [];
      return site.workTypes.map((type) => {
         const labels = {
            survey: 'Survey',
            inventory: 'Inventory',
            transportation: 'Transportation',
            installation: 'Installation',
            integration: 'Integration',
         };
         return labels[type] || type;
      });
   }, []);

   // Check if site has specific work type
   const hasWorkType = useCallback((site, workType) => {
      return site?.workTypes?.includes(workType) || false;
   }, []);

   // Get assigned users for a specific work type
   const getAssignedUsers = useCallback((site, workType) => {
      if (!site || !workType) return [];

      const workField = `${workType}Work`;
      const assignedUsers = site[workField]?.assignedUsers || [];

      return assignedUsers.map(user => ({
         userId: user.userId?._id || user.userId,
         name: user.userId?.name || 'Unknown',
         role: user.role,
         assignedDate: user.assignedDate,
      }));
   }, []);

   // Get materials for a specific work type
   const getMaterials = useCallback((site, workType) => {
      if (!site || !workType) return [];

      const workField = `${workType}Work`;
      return site[workField]?.materials || [];
   }, []);

   // Filter handlers
   const updateFilters = useCallback((newFilters) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
   }, []);

   const clearFilters = useCallback(() => {
      setFilters({});
   }, []);

   // Activity selection
   const selectActivity = useCallback((activity) => {
      setSelectedActivity(activity);
   }, []);

   const clearSelectedActivity = useCallback(() => {
      setSelectedActivity(null);
   }, []);

   // Create activity
   const createActivity = useCallback(async (formData) => {
      const payload = prepareActivityPayload(formData, false);
      return await createCOWActivityMutation.mutateAsync(payload);
   }, [createCOWActivityMutation]);

   // Update activity
   const updateActivity = useCallback(async (activityId, formData) => {
      const payload = prepareActivityPayload(formData, true);
      return await updateCOWActivityMutation.mutateAsync({
         activityId,
         data: payload,
      });
   }, [updateCOWActivityMutation]);

   // Delete activity
   const deleteActivity = useCallback(async (activityId) => {
      return await deleteCOWActivityMutation.mutateAsync(activityId);
   }, [deleteCOWActivityMutation]);

   // Add Missing Inventory Materials (with receipts)
   const addMissingInventoryMaterials = useCallback(
      async ({ activityId, siteType, materials, receipts }) => {
         return await addMissingInventoryMaterialsMutation.mutateAsync({
            activityId,
            siteType,
            materials,
            receipts,
         });
      },
      [addMissingInventoryMaterialsMutation]
   );



   // Get work type details
   const getWorkTypeDetails = useCallback((workType) => {
      const details = {
         survey: {
            title: 'Survey Work',
            icon: '📋',
            description: 'Site survey and assessment',
            fields: ['status', 'assignedUsers', 'materials', 'notes', 'attachments'],
         },
         inventory: {
            title: 'Inventory Work',
            icon: '📦',
            description: 'Material inventory and tracking',
            fields: ['status', 'assignedUsers', 'materials', 'notes', 'attachments'],
         },
         transportation: {
            title: 'Transportation Work',
            icon: '🚚',
            description: 'Material transportation',
            fields: ['status', 'assignedUsers', 'materials', 'notes', 'attachments', 'vehicleNumber', 'driverName', 'driverContact'],
         },
         installation: {
            title: 'Installation Work',
            icon: '🔧',
            description: 'Equipment installation',
            fields: ['status', 'assignedUsers', 'materials', 'notes', 'attachments', 'equipmentInstalled'],
         },
      };
      return details[workType] || { title: workType, icon: '📄', description: '', fields: [] };
   }, []);

   return {
      // Data
      activities: formattedActivities,
      selectedActivity,
      sites: formattedSites,
      users: formattedUsers,

      // Pagination
      pagination: activitiesData?.data?.pagination,

      // Loading states
      isLoading: isLoadingActivities || isLoadingSites || isLoadingUsers,
      isCreating: createCOWActivityMutation.isLoading,
      isUpdating: updateCOWActivityMutation.isLoading,
      isDeleting: deleteCOWActivityMutation.isLoading,
      isAddingMissing: addMissingInventoryMaterialsMutation.isLoading,

      // Errors
      error: activitiesError || sitesError || usersError,

      // Filters
      filters,
      updateFilters,
      clearFilters,

      // Selection
      selectActivity,
      clearSelectedActivity,

      // Actions
      createActivity,
      updateActivity,
      deleteActivity,
      refetchActivities,
      addMissingInventoryMaterials,


      // Utilities
      getStatusColor,
      getWorkStatusColor,
      getSiteWorkTypes,
      hasWorkType,
      getAssignedUsers,
      getMaterials,
      getWorkTypeDetails,
      calculateActivityProgress,

      // Form helpers
      formatActivityForForm,
      prepareActivityPayload,

      // Query hooks for components
      useGetCOWActivity,
   };
};

// Export individual hooks for component use
export {
   useGetCOWActivities,
   useGetCOWActivity,
   useCreateCOWActivity,
   useUpdateCOWActivity,
   useDeleteCOWActivity,
};