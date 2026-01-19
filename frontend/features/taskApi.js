// features/taskApi.js
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export const useGetMyTasks = (filters = {}) => {
  const {
    activityType = 'all',
    status = 'all',
    page = 1,
    limit = 20,
    search = '',
    ...otherFilters
  } = filters;

  return useQuery({
    queryKey: ['my-tasks', filters],
    queryFn: async () => {
      // Build query params
      const params = {
        page,
        limit,
      };

      // Only add activityType if not 'all'
      if (activityType && activityType !== 'all') {
        params.activityType = activityType;
      }

      // Only add status if not 'all'
      if (status && status !== 'all') {
        params.status = status;
      }

      // Add search if provided
      if (search) {
        params.search = search;
      }

      // Add other filters
      Object.keys(otherFilters).forEach(key => {
        if (otherFilters[key] !== undefined && otherFilters[key] !== '') {
          params[key] = otherFilters[key];
        }
      });

      const response = await api.get('/tasks/', { params });
      return response.data;
    },
  });
};

export const useUpdatePhase = () => {
  const queryClient = useQueryClient();
  return {
    mutate: async ({ activityType, activityId, phase, subPhase, updates }) => {
     
      const { data } = await api.patch(
        `/tasks/${activityType}/${activityId}/phase`,
        { phase, subPhase, updates }
      );
      await queryClient.refetchQueries();
    //  console.log("data from useUpdatePhase:", data);
      return data;
    },
  };
};

export const useUploadTaskAttachments = () => {
  const queryClient = useQueryClient();

  return {
    mutate: async ({ activityType, activityId, formData }) => {
      const { data } = await api.patch(
        `/tasks/${activityType}/${activityId}/phase`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // refresh tasks list after upload
      await queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      return data;
    },
  };
};