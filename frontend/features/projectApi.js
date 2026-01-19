// features/projectApi.js
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

// Query key factory
export const projectQueryKeys = {
   all: ['projects'],
   lists: () => [...projectQueryKeys.all, 'list'],
   list: (filters) => [...projectQueryKeys.lists(), { filters }],
   details: () => [...projectQueryKeys.all, 'detail'],
   detail: (id) => [...projectQueryKeys.details(), id],
   analytics: (id) => [...projectQueryKeys.detail(id), 'analytics'],
   progress: (id) => [...projectQueryKeys.detail(id), 'progress'],
   summary: (id) => [...projectQueryKeys.detail(id), 'summary'],
};

// Get all projects with enhanced caching
export const useGetProjects = (filters = {}) => {
   return useQuery({
      queryKey: projectQueryKeys.list(filters), // This includes filters in cache key
      queryFn: async () => {
         const { data } = await api.get('/project/all', {
            params: {
               page: filters.page || 1,
               limit: filters.limit || 10,
               status: filters.status || '',
               manager: filters.manager || '',
               search: filters.search || '',
               sortBy: '-createdAt'
            }
         });
         return data;
      },
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 10,
      // Enable refetch when filters change
      refetchOnWindowFocus: false,
   });
};

// Get single project with all details
export const useGetProject = (projectId) => {
   return useQuery({
      queryKey: projectQueryKeys.detail(projectId),
      queryFn: async () => {
         const { data } = await api.get(`/project/${projectId}`);
         return data;
      },
      enabled: !!projectId,
      staleTime: 1000 * 60 * 2, // 2 minutes
      cacheTime: 1000 * 60 * 5, // 5 minutes
   });
};

// Create project with optimistic updates
export const useCreateProject = () => {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async (projectData) => {
         const { data } = await api.post('/project/create', projectData);
         return data;
      },
      onMutate: async (newProject) => {
         await queryClient.cancelQueries(projectQueryKeys.lists());

         const previousProjects = queryClient.getQueryData(projectQueryKeys.lists());

         queryClient.setQueryData(projectQueryKeys.lists(), (old = []) => {
            return [...old, { ...newProject, _id: 'temp-id' }];
         });

         return { previousProjects };
      },
      onError: (err, newProject, context) => {
         queryClient.setQueryData(projectQueryKeys.lists(), context.previousProjects);
      },
      onSettled: () => {
         queryClient.invalidateQueries(projectQueryKeys.lists());
      },
   });
};

// Update project with optimistic updates
export const useUpdateProject = () => {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async ({ id, data }) => {  // Change parameter names to match usage
         const { data: responseData } = await api.put(`/project/${id}`, data);
         return responseData;
      },
      onMutate: async ({ id, data }) => {  // Update parameter names here too
         await queryClient.cancelQueries(projectQueryKeys.detail(id));
         await queryClient.cancelQueries(projectQueryKeys.lists());

         const previousProject = queryClient.getQueryData(projectQueryKeys.detail(id));
         const previousProjects = queryClient.getQueryData(projectQueryKeys.lists());

         // Update project detail
         if (previousProject) {
            queryClient.setQueryData(projectQueryKeys.detail(id), {
               ...previousProject,
               data: { ...previousProject.data, ...data }
            });
         }

         // Update project list
         queryClient.setQueryData(projectQueryKeys.lists(), (old = []) => {
            return old.map(project =>
               project._id === id ? { ...project, ...data } : project
            );
         });

         return { previousProject, previousProjects };
      },
      onError: (err, variables, context) => {
         if (context?.previousProject) {
            queryClient.setQueryData(projectQueryKeys.detail(variables.id), context.previousProject);
         }
         if (context?.previousProjects) {
            queryClient.setQueryData(projectQueryKeys.lists(), context.previousProjects);
         }
      },
      onSettled: (data, error, variables) => {
         queryClient.invalidateQueries(projectQueryKeys.detail(variables.id));
         queryClient.invalidateQueries(projectQueryKeys.lists());
      },
   });
};

// Delete project with optimistic updates
export const useDeleteProject = () => {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: async (projectId) => {
         const { data } = await api.delete(`/project/${projectId}`);
         return data;
      },
      onMutate: async (projectId) => {
         await queryClient.cancelQueries(projectQueryKeys.lists());

         const previousProjects = queryClient.getQueryData(projectQueryKeys.lists());

         queryClient.setQueryData(projectQueryKeys.lists(), (old = []) => {
            return old.filter(project => project._id !== projectId);
         });

         return { previousProjects };
      },
      onError: (err, projectId, context) => {
         queryClient.setQueryData(projectQueryKeys.lists(), context.previousProjects);
      },
      onSettled: () => {
         queryClient.invalidateQueries(projectQueryKeys.lists());
      },
   });
};