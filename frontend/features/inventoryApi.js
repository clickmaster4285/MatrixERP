import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';



export const useHandleActivityMaterials = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/activity-materials', payload);
      return data;
    },
    onSuccess: (_data, variables) => {
      // refresh overview + available list + allocations after changes
      queryClient.invalidateQueries(['inventory-overview']);
      queryClient.invalidateQueries(['inventory-available']);
      queryClient.invalidateQueries(['inventory-allocations']);

      // if you use location-based queries in UI
      if (variables?.location) {
        queryClient.invalidateQueries([
          'inventory-available',
          { location: variables.location },
        ]);
        queryClient.invalidateQueries([
          'inventory-overview',
          { location: variables.location },
        ]);
        queryClient.invalidateQueries([
          'inventory-allocations',
          { location: variables.location },
        ]);
      }

      // if you use activity-based allocations screen
      if (variables?.activityId || variables?.activityType) {
        queryClient.invalidateQueries([
          'inventory-allocations',
          {
            activityId: variables.activityId,
            activityType: variables.activityType,
          },
        ]);
      }
    },
  });
};


export const useAddMaterialsToActivity = () => {
  const base = useHandleActivityMaterials();

  return {
    ...base,
    mutate: (payload, options) =>
      base.mutate({ ...payload, operation: 'add' }, options),
    mutateAsync: (payload, options) =>
      base.mutateAsync({ ...payload, operation: 'add' }, options),
  };
};

export const useRemoveMaterialsFromActivity = () => {
  const base = useHandleActivityMaterials();

  return {
    ...base,
    mutate: (payload, options) =>
      base.mutate({ ...payload, operation: 'remove' }, options),
    mutateAsync: (payload, options) =>
      base.mutateAsync({ ...payload, operation: 'remove' }, options),
  };
};

export const useReturnActivityMaterials = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/return-materials', payload);
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries(['inventory-overview']);
      queryClient.invalidateQueries(['inventory-available']);
      queryClient.invalidateQueries(['inventory-allocations']);

      if (variables?.location) {
        queryClient.invalidateQueries([
          'inventory-available',
          { location: variables.location },
        ]);
        queryClient.invalidateQueries([
          'inventory-overview',
          { location: variables.location },
        ]);
        queryClient.invalidateQueries([
          'inventory-allocations',
          { location: variables.location },
        ]);
      }

      if (variables?.activityId || variables?.activityType) {
        queryClient.invalidateQueries([
          'inventory-allocations',
          {
            activityId: variables.activityId,
            activityType: variables.activityType,
          },
        ]);
      }
    },
  });
};


export const useGetInventoryOverview = (filters = {}) => {
  return useQuery({
    queryKey: ['inventory-overview', filters],
    queryFn: async () => {
      const { data } = await api.get('/inventory/overview', {
        params: filters,
      });
      return data;
    },
    keepPreviousData: true,
  });
};

//manual add to inventory
export const useManualBulkAddToInventory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/inventory/manual-add', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['inventory-overview']);
      queryClient.invalidateQueries(['inventory-available']);
      queryClient.invalidateQueries(['inventory-allocations']);
    },
  });
};


export const useGetAvailableMaterials = (filters = {}) => {
  return useQuery({
    queryKey: ['inventory-available', filters],
    queryFn: async () => {
      const { data } = await api.get('/inventory/available', {
        params: filters,
      });
      return data;
    },
  });
};


export const useGetActivityAllocations = (filters = {}) => {
  return useQuery({
    queryKey: ['inventory-allocations', filters],
    queryFn: async () => {
      const { data } = await api.get('/inventory/allocations', {
        params: filters,
      });
      return data;
    },
    keepPreviousData: true,
  });
};

//-------------UPDATE--------------------------
export const useUpdateInventoryById = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }) => {
 
      if (!id) throw new Error('Inventory id is required');
      const { data } = await api.put(`/inventory/update/${id}`, payload);
      return data;
    },
    onSuccess: (_data, variables) => {
      // Refresh all inventory-related data
      queryClient.invalidateQueries(['inventory-overview']);
      queryClient.invalidateQueries(['inventory-available']);
      queryClient.invalidateQueries(['inventory-allocations']);

      // If location was involved, refresh scoped queries
      if (variables?.location) {
        queryClient.invalidateQueries([
          'inventory-overview',
          { location: variables.location },
        ]);
        queryClient.invalidateQueries([
          'inventory-available',
          { location: variables.location },
        ]);
      }
    },
  });
};


export const useManualBulkUpdateInventory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.put(
        '/inventory/manual-update',
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['inventory-overview']);
      queryClient.invalidateQueries(['inventory-available']);
      queryClient.invalidateQueries(['inventory-allocations']);
    },
  });
};


//-------------SOFT DELETE--------------------------
export const useSoftDeleteInventoryById = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }) => {
      if (!id) throw new Error('Inventory id is required');
      const { data } = await api.delete(`/inventory/delete/${id}`);
      return data;
    },
    onSuccess: (_data, variables) => {
      // refresh inventory lists
      queryClient.invalidateQueries(['inventory-overview']);
      queryClient.invalidateQueries(['inventory-available']);
      queryClient.invalidateQueries(['inventory-allocations']);

      // optional: refresh location-scoped lists if you pass location from UI
      if (variables?.location) {
        queryClient.invalidateQueries(['inventory-overview', { location: variables.location }]);
        queryClient.invalidateQueries(['inventory-available', { location: variables.location }]);
        queryClient.invalidateQueries(['inventory-allocations', { location: variables.location }]);
      }
    },
  });
};



// ✅ Inventory dropdown (fetch ALL items for Browse Materials)
export const useGetInventoryDropdown = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: ['inventory-dropdown', filters],
    queryFn: async () => {
      const { data } = await api.get('/inventory/dropdown', {
        params: filters, // { location, q } etc (optional)
      });
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 min
    keepPreviousData: true,
    ...options,
  });
};
