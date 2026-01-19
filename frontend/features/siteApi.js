import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

// Get all sites
export const useGetSites = (filters = {}) => {
   return useQuery({
      queryKey: ['sites', filters],
      queryFn: async () => {
         const { data } = await api.get('/sites/all', { params: filters });
         return data;
      },
   });
};

// Get site by ID
export const useGetSiteById = (siteId) => {
   return useQuery({
      queryKey: ['site', siteId],
      queryFn: async () => {
         if (!siteId) return null;
         const { data } = await api.get(`/sites/${siteId}`);
         return data;
      },
      enabled: !!siteId,
   });
};

// Create site
export const useCreateSite = () => {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async (siteData) => {
         const { data } = await api.post('/sites/create', siteData);
         return data;
      },
      onSuccess: (data) => {
         queryClient.invalidateQueries(['sites']);
         queryClient.invalidateQueries(['project-sites', data.data.project]);
      },
   });
};

// Update site
export const useUpdateSite = () => {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async ({ siteId, updateData }) => {
         const { data } = await api.patch(`/sites/${siteId}`, updateData);
         return data;
      },
      onSuccess: (data, variables) => {
         queryClient.invalidateQueries(['sites']);
         queryClient.invalidateQueries(['site', variables.siteId]);
         queryClient.invalidateQueries(['my-sites']);
         if (data.data?.project) {
            queryClient.invalidateQueries(['project-sites', data.data.project._id || data.data.project]);
         }
      },
   });
};

// Delete site
export const useDeleteSite = () => {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async (siteId) => {
         const { data } = await api.delete(`/sites/${siteId}`);
         return data;
      },
      onSuccess: (data, variables) => {
         queryClient.invalidateQueries(['sites']);
         queryClient.invalidateQueries(['my-sites']);
         // Note: We can't invalidate specific site query as it's deleted
         queryClient.removeQueries(['site', variables]);

         // If we know the project ID, we can invalidate that too
         // You might need to pass projectId in variables
         if (variables.projectId) {
            queryClient.invalidateQueries(['project-sites', variables.projectId]);
         }
      },
   });
};