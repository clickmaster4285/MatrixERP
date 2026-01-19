// features/relocationApi.js
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

// Get all relocation activities with filters
export const useGetRelocationActivities = (filters = {}) => {
   return useQuery({
      queryKey: ['relocation-activities', filters],
      queryFn: async () => {
         const params = new URLSearchParams();

         // Add pagination if not provided
         if (!filters.page) params.append('page', '1');
         if (!filters.limit) params.append('limit', '10');

         Object.keys(filters).forEach(key => {
            if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
               params.append(key, filters[key]);
            }
         });

         const { data } = await api.get(`/relocation-activities?${params.toString()}`);
         return data;
      },
      keepPreviousData: true,
   });
};

// Get single relocation activity
export const useGetRelocationActivity = (activityId) => {
   return useQuery({
      queryKey: ['relocation-activity', activityId],
      queryFn: async () => {
         const { data } = await api.get(`/relocation-activities/${activityId}`);
         return data?.data || null;
      },
      enabled: !!activityId,
      retry: 1,
   });
};

// Create relocation activity
export const useCreateRelocationActivity = () => {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async (payload) => {
         const { data } = await api.post('/relocation-activities', payload);
         return data;
      },
      onSuccess: () => {
         queryClient.invalidateQueries(['relocation-activities']);
      },
   });
};

// Update relocation activity (handles all types of updates)
export const useUpdateRelocationActivity = () => {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async ({ activityId, data, updateType }) => {
         let url = `/relocation-activities/${activityId}`;

         // Add updateType as query param if provided
         if (updateType) {
            url += `?updateType=${updateType}`;
         }

         const { data: response } = await api.put(url, data);
         return response;
      },
      onSuccess: (data, variables) => {
         queryClient.invalidateQueries(['relocation-activity', variables.activityId]);
         queryClient.invalidateQueries(['relocation-activities']);
      },
   });
};

// Delete relocation activity (soft delete)
export const useDeleteRelocationActivity = () => {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async ({ activityId, deletionReason }) => {
         const { data } = await api.delete(`/relocation-activities/${activityId}`, {
            data: { deletionReason }
         });
         return data;
      },
      onSuccess: () => {
         queryClient.invalidateQueries(['relocation-activities']);
      },
   });
};