// features/dismantlingActivityApi.js
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

// ✅ GET /dismantling  (list with filters)
export const useGetDismantlingActivities = (filters = {}) => {
  return useQuery({
    queryKey: ['dismantling', filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      Object.keys(filters).forEach((key) => {
        const value = filters[key];
        if (
          value !== null &&
          value !== undefined &&
          value !== '' &&
          !(typeof value === 'number' && Number.isNaN(value))
        ) {
          params.append(key, value);
        }
      });

      const queryString = params.toString();
      const url = queryString ? `/dismantling?${queryString}` : '/dismantling';

      const { data } = await api.get(url);
      return data; // { success, count, pagination, data: [...] }
    },
    keepPreviousData: true,
  });
};

// ✅ GET /dismantling/:id
export const useGetDismantlingActivity = (activityId) => {
  return useQuery({
    queryKey: ['dismantling-activity', activityId],
    queryFn: async () => {
      const { data } = await api.get(`/dismantling/${activityId}`);
      return data; // { success, data: {...} }
    },
    enabled: !!activityId,
  });
};

// ✅ POST /dismantling/create
export const useCreateDismantlingActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/dismantling/create', payload, {
        headers: { 'Content-Type': 'application/json' },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dismantling']);
    },
  });
};

// ✅ PUT /dismantling/:id
export const useUpdateDismantlingActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ activityId, data }) => {
      const isFormData =
        typeof FormData !== 'undefined' && data instanceof FormData;

      const config = isFormData
        ? {
            // let axios send multipart with boundary
            headers: { 'Content-Type': 'multipart/form-data' },
          }
        : undefined; // for normal JSON, let your api defaults work

      const res = await api.put(`/dismantling/${activityId}`, data, config);
      return res.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries([
        'dismantling-activity',
        variables.activityId,
      ]);
      queryClient.invalidateQueries(['dismantling']);
    },
    onError: (error) => {
      console.error('❌ Dismantling Update Error:', error);
    },
  });
};


// ✅ DELETE /dismantling/:id  (soft delete)
export const useDeleteDismantlingActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activityId) => {
      const { data } = await api.delete(`/dismantling/${activityId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dismantling']);
    },
  });
};

// ✅ Convenience: GET /dismantling?site=:siteId
export const useGetSiteDismantlingActivities = (siteId, filters = {}) => {
  return useQuery({
    queryKey: ['site-dismantling', siteId, filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (siteId) {
        params.append('site', siteId);
      }

      Object.keys(filters).forEach((key) => {
        const value = filters[key];
        if (
          value !== null &&
          value !== undefined &&
          value !== '' &&
          key !== 'site'
        ) {
          params.append(key, value);
        }
      });

      const { data } = await api.get(`/dismantling?${params.toString()}`);
      return data; // { success, count, pagination, data: [...] }
    },
    enabled: !!siteId,
    keepPreviousData: true,
  });
};
