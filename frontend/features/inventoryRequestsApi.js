import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';


export const useGetInventoryRequests = (filters = {}) => {
  return useQuery({
    queryKey: ['inventory-requests', filters],
    queryFn: async () => {
      const { data } = await api.get('/request/get', {
        params: filters,
      });
      return data;
    },
  });
};

export const useApproveInventoryRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId }) => {
      const { data } = await api.post(
        `/request/${requestId}/approve`
      );
      return data;
    },
    onSuccess: (data, variables) => {
      // list refresh
      queryClient.invalidateQueries(['inventory-requests']);
      // refresh request detail
      queryClient.invalidateQueries(['inventory-request', variables.requestId]);
      // refresh inventory overview (because quantities changed)
      queryClient.invalidateQueries(['inventory-overview']);
      queryClient.invalidateQueries(['inventory']);
    },
  });
};

export const useRejectInventoryRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, reason }) => {
      const { data } = await api.post(
        `/request/${requestId}/reject`,
        {
          reason,
        }
      );
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['inventory-requests']);
      queryClient.invalidateQueries(['inventory-request', variables.requestId]);
    },
  });
};

export const useDirectAllocateSurveyMaterials = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      activityType,
      activityId,
      phase,
      subPhase = 'surveyWork',
      materials,
    }) => {
      const { data } = await api.post('/request/direct-allocate-survey', {
        activityType,
        activityId,
        phase,
        subPhase,
        materials,
      });
      return data;
    },
    onSuccess: () => {
      // Refresh everything that might have changed
      queryClient.invalidateQueries(['inventory-overview']);
      queryClient.invalidateQueries(['inventory']);
      queryClient.invalidateQueries(['inventory-requests']); // just in case
      // You may also want to invalidate activity/task-specific queries
    },
    onError: (error) => {
      console.error('Direct allocation failed:', error);
      // Optional: throw or handle globally via toast
    },
  });
};

export const useUpsertAllocationRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      activityId,
      activityType,
      activityName,
      phase, // "sourceSite" | "destinationSite"
      subPhase, // "inventoryWork" | "surveyWork" | ...
      materials, // [{ materialCode, name/materialName, quantity, unit, condition }]
      siteId, // optional
    }) => {
      const payload = {
        activityId,
        activityType,
        activityName: activityName || '',
        phase,
        subPhase,
        materials: Array.isArray(materials) ? materials : [],
        ...(siteId ? { siteId } : {}),
      };

      const { data } = await api.post('/request/upsert', payload);
      return data;
    },

    onSuccess: (data) => {
      queryClient.invalidateQueries(['inventory-requests']);
      queryClient.invalidateQueries(['inventory-overview']);
      queryClient.invalidateQueries(['inventory']);
     
    },

    onError: (error) => {
      console.error('Upsert allocation request failed:', error);
    },
  });
};

