import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

// ===================== GET ALL =====================
// GET /vendors?search=&type=&includeDeleted=&page=&limit=
export const useGetVendors = (filters = {}) => {
  return useQuery({
    queryKey: ['vendors', filters],
    queryFn: async () => {
      const { data } = await api.get('/vendors', { params: filters });
      return data;
    },
    keepPreviousData: true,
  });
};

// ===================== GET ONE =====================
// GET /vendors/:id?includeDeleted=true|false
export const useGetVendorById = (vendorId, params = {}) => {
  return useQuery({
    queryKey: ['vendor', vendorId, params],
    queryFn: async () => {
      if (!vendorId) return null;
      const { data } = await api.get(`/vendors/${vendorId}`, { params });
      return data;
    },
    enabled: !!vendorId,
  });
};

// ===================== DROPDOWN =====================
// GET /vendors/dropdown
export const useGetVendorDropdown = () => {
  return useQuery({
    queryKey: ['vendors-dropdown'],
    queryFn: async () => {
      const { data } = await api.get('/vendors/dropdown');
      return data;
    },
  });
};

// ===================== CREATE =====================
// POST /vendors
export const useCreateVendor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vendorData) => {
      
      const { data } = await api.post('/vendors/add', vendorData);
     
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['vendors']);
      queryClient.invalidateQueries(['vendors-dropdown']);
    },
  });
};

// ===================== UPDATE =====================
// PATCH /vendors/:id
export const useUpdateVendor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ vendorId, updateData }) => {
     
      const { data } = await api.put(`/vendors/${vendorId}`, updateData);
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries(['vendors']);
      queryClient.invalidateQueries(['vendors-dropdown']);
      queryClient.invalidateQueries(['vendor', variables.vendorId]);
    },
  });
};

// ===================== DELETE (SOFT) =====================
// DELETE /vendors/:id
export const useDeleteVendor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vendorId) => {
      const { data } = await api.delete(`/vendors/${vendorId}`);
      return data;
    },
    onSuccess: (_data, vendorId) => {
      queryClient.invalidateQueries(['vendors']);
      queryClient.invalidateQueries(['vendors-dropdown']);
      queryClient.removeQueries(['vendor', vendorId]);
    },
  });
};
