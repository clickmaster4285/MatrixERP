import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

// Get all COW activities with filters
export const useGetCOWActivities = (filters = {}) => {
   return useQuery({
      queryKey: ['cow-activities', filters],
      queryFn: async () => {
         const params = new URLSearchParams();

         // Add pagination if not provided
         if (!filters.page) params.append('page', '1');
         if (!filters.limit) params.append('limit', '10');

         // Add sort parameters if provided
         if (filters.sortBy) params.append('sortBy', filters.sortBy);
         if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

         // Add other filters
         Object.keys(filters).forEach(key => {
            if (
               filters[key] !== null &&
               filters[key] !== undefined &&
               filters[key] !== '' &&
               key !== 'sortBy' &&
               key !== 'sortOrder'
            ) {
               params.append(key, filters[key]);
            }
         });

         const { data } = await api.get(`/cow-activities?${params.toString()}`);
         return data;
      },
      keepPreviousData: true,
   });
};

// Get single COW activity
export const useGetCOWActivity = (activityId) => {
   return useQuery({
      queryKey: ['cow-activity', activityId],
      queryFn: async () => {
         const { data } = await api.get(`/cow-activities/${activityId}`);
         return data?.data || null;
      },
      enabled: !!activityId,
      retry: 1,
   });
};

// Create COW activity
export const useCreateCOWActivity = () => {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async (payload) => {
         const { data } = await api.post('/cow-activities', payload);
         return data;
      },
      onSuccess: () => {
         queryClient.invalidateQueries(['cow-activities']);
      },
      onError: (error) => {
         console.error('Create COW Activity Error:', error);
      },
   });
};

// Update COW activity (basic info)
export const useUpdateCOWActivity = () => {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async ({ activityId, data }) => {
         const { data: response } = await api.put(`/cow-activities/${activityId}`, data);
         return response;
      },
      onSuccess: (data, variables) => {
         queryClient.invalidateQueries(['cow-activity', variables.activityId]);
         queryClient.invalidateQueries(['cow-activities']);
      },
      onError: (error) => {
         console.error('Update COW Activity Error:', error);
      },
   });
};

// Soft delete COW activity
export const useDeleteCOWActivity = () => {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async (activityId) => {
         const { data } = await api.delete(`/cow-activities/${activityId}`);
         return data;
      },
      onSuccess: () => {
         queryClient.invalidateQueries(['cow-activities']);
      },
      onError: (error) => {
         console.error('Delete COW Activity Error:', error);
      },
   });
};

// Helper function to format activity data for form
export const formatActivityForForm = (activity) => {
   if (!activity) return null;

   return {
      // Basic info
      activityName: activity.activityName || '',
      siteId: activity.siteId?._id || activity.siteId || '',
      purpose: activity.purpose || '',
      description: activity.description || '',
      plannedStartDate: activity.plannedStartDate ? new Date(activity.plannedStartDate).toISOString().split('T')[0] : '',
      plannedEndDate: activity.plannedEndDate ? new Date(activity.plannedEndDate).toISOString().split('T')[0] : '',
      notes: activity.notes || '',
      overallStatus: activity.overallStatus || 'planned',

      // Team members
      teamMembers: (activity.teamMembers || []).map(member => ({
         userId: member.userId?._id || member.userId,
         role: member.role || 'worker',
      })),

      // Source site
      sourceSite: {
         location: activity.sourceSite?.location || {
            name: '',
            address: { street: '', city: '', state: '' },
            type: 'source',
         },
         workTypes: activity.sourceSite?.workTypes || [],
         // Work type configurations
         ...(activity.sourceSite?.workTypes?.reduce((acc, workType) => {
            const workKey = `${workType}Work`;
            acc[workKey] = activity.sourceSite?.[workKey] || {};
            return acc;
         }, {}) || {}),
      },

      // Destination site
      destinationSite: {
         location: activity.destinationSite?.location || {
            name: '',
            address: { street: '', city: '', state: '' },
            type: 'destination',
         },
         workTypes: activity.destinationSite?.workTypes || [],
         // Work type configurations
         ...(activity.destinationSite?.workTypes?.reduce((acc, workType) => {
            const workKey = `${workType}Work`;
            acc[workKey] = activity.destinationSite?.[workKey] || {};
            return acc;
         }, {}) || {}),
      },
   };
};

// Helper function to prepare create/update payload
export const prepareActivityPayload = (formData, isUpdate = false) => {
   const payload = {
      activityName: formData.activityName,
      siteId: formData.siteId,
      purpose: formData.purpose,
      description: formData.description,
      plannedStartDate: formData.plannedStartDate,
      plannedEndDate: formData.plannedEndDate,
      notes: formData.notes,
      teamMembers: formData.teamMembers || [],
   };

   // Only include status in update
   if (isUpdate) {
      payload.overallStatus = formData.overallStatus;
   }

   // Source site
   if (formData.sourceSite) {
      payload.sourceSite = {
         location: formData.sourceSite.location,
         workTypes: formData.sourceSite.workTypes,
         ...(formData.sourceSite.workTypes?.reduce((acc, workType) => {
            const workKey = `${workType}Work`;
            if (formData.sourceSite[workKey]) {
               acc[workKey] = formData.sourceSite[workKey];
            }
            return acc;
         }, {}) || {}),
      };
   }

   // Destination site
   if (formData.destinationSite) {
      payload.destinationSite = {
         location: formData.destinationSite.location,
         workTypes: formData.destinationSite.workTypes,
         ...(formData.destinationSite.workTypes?.reduce((acc, workType) => {
            const workKey = `${workType}Work`;
            if (formData.destinationSite[workKey]) {
               acc[workKey] = formData.destinationSite[workKey];
            }
            return acc;
         }, {}) || {}),
      };
   }

   return payload;
};

// Add Missing Inventory Materials (with receipts)
export const useAddMissingInventoryMaterials = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      activityId,
      siteType, // "source" | "destination"
      materials = [], // array
      receipts = [], // File[]
    }) => {
        
        console.log("materials" , materials)
      if (!activityId) throw new Error('activityId is required');
      if (!siteType) throw new Error('siteType is required');

      const formData = new FormData();
      formData.append('siteType', siteType);

      // IMPORTANT: send as JSON string (like Postman)
      formData.append('materials', JSON.stringify(materials));

      // multiple receipts supported
      (receipts || []).forEach((file) => {
        if (file) formData.append('receipts', file);
      });
        
        

      const { data } = await api.post(
        `/cow-activities/${activityId}/missing-materials`,
        formData
       
      );
console.log("data" , data)
      return data;
    },

    onSuccess: (data, variables) => {
      
      queryClient.invalidateQueries(['cow-activity', variables.activityId]);
      queryClient.invalidateQueries(['cow-activities']);
      queryClient.invalidateQueries(['inventory']);
    },

    onError: (error) => {
      console.error('Add Missing Inventory Materials Error:', error);
    },
  });
};
