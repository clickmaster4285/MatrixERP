// hooks/useProjects.js
'use client';

import { useState, useCallback, useMemo } from 'react';
import { format, differenceInDays } from 'date-fns';
import {
   useGetProjects,
   useGetProject,
   useCreateProject,
   useUpdateProject,
   useDeleteProject
} from '@/features/projectApi';
import { useUsers } from '@/features/userApi';
import { useDebounce } from '@/hooks/useDebounce';

// = CONSTANTS ===
const DEFAULT_FILTERS = {
   search: '',
   status: 'all',
   manager: 'all',
   page: 1,
   limit: 10
};

const STATUS_CONFIG = {
   planning: {
      class: 'bg-sky-50 text-sky-700 border-sky-200',
      label: 'Planning'
   },
   active: {
      class: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      label: 'Active'
   },
   completed: {
      class: 'bg-green-50 text-green-700 border-green-200',
      label: 'Completed'
   },
   cancelled: {
      class: 'bg-slate-100 text-slate-700 border-slate-200',
      label: 'Cancelled'
   },
   'on-hold': {
      class: 'bg-amber-50 text-amber-700 border-amber-200',
      label: 'On Hold'
   },
};

// === UTILITY FUNCTIONS ===
export const projectUtils = {
   // Calculate progress percentage based on activities
   calculateProgress: (activities = []) => {
      if (!activities?.length) return 0;
      const completed = activities.filter(a => a.status === 'completed').length;
      return Math.round((completed / activities.length) * 100);
   },

   // Get days remaining until end date (SAFE for hydration)
   getDaysRemaining: (endDate) => {
      if (!endDate) return null;
      try {
         const end = new Date(endDate);
         const today = new Date();
         today.setHours(0, 0, 0, 0);
         const diffTime = end.getTime() - today.getTime();
         return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      } catch (error) {
         return null;
      }
   },

   // Format date for display (SAFE for hydration)
   formatDate: (value) => {
      if (!value) return 'Not set';
      try {
         const d = new Date(value);
         if (isNaN(d.getTime())) return 'Invalid date';
         return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
         });
      } catch (error) {
         return 'Invalid date';
      }
   },

   // Get project status configuration
   getStatusConfig: (status) => {
      return STATUS_CONFIG[status] || {
         class: 'bg-slate-100 text-slate-700 border-slate-200',
         label: status
      };
   },

   // Get progress bar color based on percentage
   getProgressColor: (progress) => {
      if (progress === 100) return 'from-green-500 to-emerald-600';
      if (progress >= 70) return 'from-sky-500 to-cyan-600';
      if (progress >= 40) return 'from-amber-500 to-orange-500';
      return 'from-sky-500 to-cyan-500';
   },

   // Extract activities from site data
   extractActivities: (site) => {
      if (!site) return [];
      const activities = [];

      // Dismantling activities
      site.activities?.dismantling?.activities?.forEach(activity => {
         activities.push({
            ...activity,
            _id: activity._id,
            activityType: { name: 'Dismantling', type: 'dismantling' },
            siteName: site.name,
            siteId: site.siteId,
            siteIdInternal: site._id,
            status: activity.status || activity.overallStatus || 'pending',
            notes: activity.notes || '',
            assignment: activity.assignment,
            location: activity.location?.[0] || {},
            timeline: activity.timeline,
            completionPercentage: activity.completionPercentage || 0,
            createdAt: activity.createdAt,
            updatedAt: activity.updatedAt
         });
      });

      // COW activities
      site.activities?.cow?.activities?.forEach(activity => {
         activities.push({
            ...activity,
            _id: activity._id,
            activityType: { name: 'COW Activity', type: 'cow' },
            siteName: site.name,
            siteId: site.siteId,
            siteIdInternal: site._id,
            status: activity.overallStatus || 'planned',
            notes: activity.notes || '',
            plannedStartDate: activity.plannedStartDate,
            plannedEndDate: activity.plannedEndDate,
            createdAt: activity.createdAt,
            updatedAt: activity.updatedAt
         });
      });

      // Relocation activities
      site.activities?.relocation?.activities?.forEach(activity => {
         activities.push({
            ...activity,
            _id: activity._id,
            activityType: { name: 'Relocation', type: 'relocation' },
            siteName: site.name,
            siteId: site.siteId,
            siteIdInternal: site._id,
            status: activity.overallStatus || 'draft',
            notes: activity.notes || '',
            relocationType: activity.relocationType,
            createdAt: activity.createdAt,
            updatedAt: activity.updatedAt
         });
      });

      return activities;
   },

   // Filter projects based on criteria
   filterProjects: (projects, filters) => {
      if (!projects || !Array.isArray(projects)) return [];

      return projects.filter(project => {
         // Search filter
         if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            const matchesSearch =
               project.name?.toLowerCase().includes(searchLower) ||
               project.description?.toLowerCase().includes(searchLower);
            if (!matchesSearch) return false;
         }

         // Status filter
         if (filters.status !== 'all' && project.status !== filters.status) {
            return false;
         }

         // Manager filter
         if (filters.manager !== 'all' && project.manager?._id !== filters.manager) {
            return false;
         }

         return true;
      });
   },

   // Calculate project statistics
   calculateStats: (projects) => {
      if (!projects || !Array.isArray(projects)) {
         return {
            totalProjects: 0,
            totalSites: 0,
            totalActivities: 0,
            avgProgress: 0,
            projectsByStatus: {},
            projectsWithSites: 0,
            projectsWithoutSites: 0,
            projectsWithNearDeadline: 0,
            completedProjects: 0,
            activeProjects: 0,
         };
      }

      const totalProjects = projects.length;
      const totalSites = projects.reduce((sum, project) =>
         sum + (project.statistics?.siteCount || 0), 0
      );
      const totalActivities = projects.reduce((sum, project) =>
         sum + (project.statistics?.totalActivities || 0), 0
      );

      const projectsByStatus = projects.reduce((acc, project) => {
         const status = project.status || 'unknown';
         acc[status] = (acc[status] || 0) + 1;
         return acc;
      }, {});

      const avgProgress = totalProjects > 0
         ? Math.round(projects.reduce((sum, project) =>
            sum + (project.statistics?.progress || 0), 0) / totalProjects
         )
         : 0;

      // Projects with near deadline
      const now = new Date();
      const projectsWithNearDeadline = projects.filter(p => {
         if (!p.timeline?.endDate) return false;
         try {
            const endDate = new Date(p.timeline.endDate);
            const diffDays = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
            return diffDays >= 0 && diffDays <= 7;
         } catch (error) {
            return false;
         }
      }).length;

      return {
         totalProjects,
         totalSites,
         totalActivities,
         avgProgress,
         projectsByStatus,
         projectsWithSites: projects.filter(p => (p.statistics?.siteCount || 0) > 0).length,
         projectsWithoutSites: projects.filter(p => (p.statistics?.siteCount || 0) === 0).length,
         projectsWithNearDeadline,
         completedProjects: projectsByStatus.completed || 0,
         activeProjects: projectsByStatus.active || 0,
      };
   }
};

// === CUSTOM HOOKS ===
// Main hook for project management (list view) with debounced search
export const useProjects = () => {
   const { data: users = [] } = useUsers();
   const createProjectMutation = useCreateProject();
   const updateProjectMutation = useUpdateProject();
   const deleteProjectMutation = useDeleteProject();

   // State management
   const [modalState, setModalState] = useState({
      open: false,
      mode: 'create',
      project: null
   });
   const [filters, setFilters] = useState(DEFAULT_FILTERS);
   
   // Debounced search to prevent too many re-renders
   const debouncedSearch = useDebounce(filters.search, 300);

   const { data: projectsResponse, isLoading, error, refetch } = useGetProjects(filters);
   
   // Memoized data transformations
   const projects = useMemo(() => {
      if (!projectsResponse || !projectsResponse.success) return [];
      return projectsResponse.data || [];
   }, [projectsResponse]);

   const managers = useMemo(() =>
      users.filter(user =>
         ['admin', 'manager', 'project-manager'].includes(user.role)
      ), [users]);

   // Filter projects with debounced search
   const filteredProjects = useMemo(() =>
      projectUtils.filterProjects(projects, { ...filters, search: debouncedSearch }),
      [projects, filters, debouncedSearch]
   );

   // Calculate statistics
   const stats = useMemo(() =>
      projectUtils.calculateStats(projects),
      [projects]
   );

   // Modal handlers
   const openCreateModal = useCallback(() =>
      setModalState({ open: true, mode: 'create', project: null }), []);

   const openEditModal = useCallback((project) =>
      setModalState({ open: true, mode: 'edit', project }), []);

   const closeModal = useCallback(() =>
      setModalState({ open: false, mode: 'create', project: null }), []);

   // CRUD operations
   const createProject = useCallback(async (projectData) => {
      try {
         const formattedData = {
            name: projectData.name,
            description: projectData.description,
            manager: projectData.manager,
            timeline: {
               startDate: projectData.timeline.startDate,
               endDate: projectData.timeline.endDate
            }
         };

         await createProjectMutation.mutateAsync(formattedData);
         closeModal();
         refetch();
         return { success: true };
      } catch (error) {
         return {
            success: false,
            error: error.response?.data?.message || 'Failed to create project'
         };
      }
   }, [createProjectMutation, closeModal, refetch]);

   const updateProject = useCallback(async (projectId, updateData) => {
      try {
         const formattedData = {
            name: updateData.name,
            description: updateData.description,
            manager: updateData.manager,
            status: updateData.status,
            timeline: {
               startDate: updateData.timeline.startDate,
               endDate: updateData.timeline.endDate
            }
         };

         await updateProjectMutation.mutateAsync({
            id: projectId,
            data: formattedData
         });
         closeModal();
         refetch();
         return { success: true };
      } catch (error) {
         return {
            success: false,
            error: error.response?.data?.message || 'Failed to update project'
         };
      }
   }, [updateProjectMutation, closeModal, refetch]);

   const deleteProject = useCallback(async (projectId, projectName) => {
      if (!confirm(`Are you sure you want to delete project "${projectName}"? This will also delete all associated sites and activities.`)) {
         return { success: false, cancelled: true };
      }

      try {
         await deleteProjectMutation.mutateAsync(projectId);
         refetch();
         return { success: true };
      } catch (error) {
         return {
            success: false,
            error: error.response?.data?.message || 'Failed to delete project'
         };
      }
   }, [deleteProjectMutation, refetch]);

   // Filter utilities
   const updateFilter = useCallback((key, value) => {
      setFilters(prev => {
         const newFilters = { ...prev, [key]: value };
         // When changing search/status/manager, reset to page 1
         if (['search', 'status', 'manager'].includes(key) && key !== 'page') {
            newFilters.page = 1;
         }
         return newFilters;
      });
   }, []);

   const resetFilters = useCallback(() => {
      setFilters(DEFAULT_FILTERS);
   }, []);

   // Generic filter function for any data type
   const filterData = useCallback((data, customFilters = {}) => {
      if (!data) return [];

      const mergedFilters = { ...filters, ...customFilters };

      return data.filter(item => {
         // Search filter (using filters.search directly since we don't debounce here)
         if (mergedFilters.search) {
            const searchLower = mergedFilters.search.toLowerCase();
            const matchesSearch =
               item.name?.toLowerCase().includes(searchLower) ||
               item.description?.toLowerCase().includes(searchLower) ||
               item.siteId?.toLowerCase().includes(searchLower) ||
               item.siteName?.toLowerCase().includes(searchLower) ||
               item.activityType?.name?.toLowerCase().includes(searchLower) ||
               item.dismantlingType?.toLowerCase().includes(searchLower) ||
               item.activityName?.toLowerCase().includes(searchLower) ||
               item.relocationType?.toLowerCase().includes(searchLower);
            if (!matchesSearch) return false;
         }

         // Status filter
         if (mergedFilters.status !== 'all' && item.status !== mergedFilters.status) {
            return false;
         }

         // Manager filter
         if (mergedFilters.manager !== 'all' && item.manager?._id !== mergedFilters.manager) {
            return false;
         }

         // Activity type filter
         if (mergedFilters.activityType !== 'all' &&
            item.activityType?.name !== mergedFilters.activityType &&
            item.activityType?.type !== mergedFilters.activityType) {
            return false;
         }

         // Activity status filter
         if (mergedFilters.activityStatus !== 'all') {
            const itemStatus = item.status || item.overallStatus;
            if (itemStatus !== mergedFilters.activityStatus) {
               return false;
            }
         }

         // Date range filter
         if (mergedFilters.dateRange?.start && item.createdAt) {
            const itemDate = new Date(item.createdAt);
            const startDate = new Date(mergedFilters.dateRange.start);
            const endDate = mergedFilters.dateRange.end ?
               new Date(mergedFilters.dateRange.end) : new Date();

            if (itemDate < startDate || itemDate > endDate) {
               return false;
            }
         }

         return true;
      });
   }, [filters]);

   return {
      // Data
      projects: filteredProjects,
      allProjects: projects,
      managers,
      stats,
      pagination: projectsResponse?.pagination || {},

      // State
      modalState,
      filters,

      // Actions
      setFilters,
      updateFilter,
      resetFilters,
      openCreateModal,
      openEditModal,
      closeModal,
      createProject,
      updateProject,
      deleteProject,

      // Filter utilities
      filterData,

      // Loading states
      isLoading,
      isCreating: createProjectMutation.isLoading,
      isUpdating: updateProjectMutation.isLoading,
      isDeleting: deleteProjectMutation.isLoading,

      // Error
      error,
      refetch
   };
};

// Hook for single project data and detailed analysis
export const useProjectData = (projectId) => {
   const { data, isLoading, error } = useGetProject(projectId);

   const project = useMemo(() => {
      if (!data?.data) return null;

      const projectData = data.data;

      // Extract and flatten all activities across all sites
      const allActivities = projectData.sites?.flatMap(site =>
         projectUtils.extractActivities(site)
      ) || [];

      // Calculate detailed statistics
      const statistics = {
         totalSites: projectData.sites?.length || 0,
         totalActivities: allActivities.length,
         completedActivities: allActivities.filter(a =>
            a.status === 'completed' || a.overallStatus === 'completed'
         ).length,
         pendingActivities: allActivities.filter(a =>
            ['pending', 'planned', 'draft', 'not-started'].includes(a.status || a.overallStatus)
         ).length,
         inProgressActivities: allActivities.filter(a =>
            a.status === 'in-progress' || a.overallStatus === 'in-progress'
         ).length,
         activitiesByStatus: allActivities.reduce((acc, activity) => {
            const status = activity.status || activity.overallStatus || 'unknown';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
         }, {}),
         activitiesByType: allActivities.reduce((acc, activity) => {
            const type = activity.activityType?.name || 'Unknown';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
         }, {}),
         ...(projectData.statistics || {})
      };

      // Calculate site progress for each site
      const enhancedSites = projectData.sites?.map(site => {
         const siteActivities = allActivities.filter(a => a.siteIdInternal === site._id);
         const completedActivities = siteActivities.filter(a =>
            a.status === 'completed' || a.overallStatus === 'completed'
         ).length;
         const totalSiteActivities = siteActivities.length;

         return {
            ...site,
            activities: siteActivities,
            activityCount: totalSiteActivities,
            completedActivities,
            progress: totalSiteActivities > 0
               ? Math.round((completedActivities / totalSiteActivities) * 100)
               : 0
         };
      }) || [];

      // Calculate overall project progress
      const totalActivities = allActivities.length;
      const completedAllActivities = allActivities.filter(a =>
         a.status === 'completed' || a.overallStatus === 'completed'
      ).length;

      const overallProgress = totalActivities > 0
         ? Math.round((completedAllActivities / totalActivities) * 100)
         : projectData.statistics?.progress || 0;

      return {
         ...projectData,
         allActivities,
         statistics: {
            ...statistics,
            overallProgress
         },
         sites: enhancedSites,
         progress: { overall: overallProgress },
         timeline: projectData.timeline,
         activitySummary: {
            total: allActivities.length,
            dismantling: statistics.totalDismantling || 0,
            cow: statistics.totalCow || 0,
            relocation: statistics.totalRelocation || 0
         }
      };
   }, [data]);

   return {
      project,
      isLoading,
      error,
      isError: !!error
   };
};

// Hook for analyzing project progress and performance
export const useProjectProgress = (project) => {
   const progressData = useMemo(() => {
      if (!project) return null;

      const {
         progress = { overall: 0 },
         statistics = {},
         timeline,
         sites = [],
         allActivities = []
      } = project;

      const overallProgress = progress.overall || project.statistics?.overallProgress || 0;

      // Calculate time-related metrics
      const now = new Date();
      const startDate = new Date(timeline?.startDate || project.createdAt);
      const endDate = new Date(timeline?.endDate || project.updatedAt);

      const totalDays = Math.max(1, differenceInDays(endDate, startDate));
      const elapsedDays = Math.max(0, differenceInDays(now, startDate));
      const remainingDays = Math.max(0, differenceInDays(endDate, now));

      const elapsedPercentage = Math.min(100, Math.round((elapsedDays / totalDays) * 100));
      const progressVsTime = elapsedPercentage > 0
         ? Math.round((overallProgress / elapsedPercentage) * 100)
         : 100;

      const isBehindSchedule = overallProgress < elapsedPercentage - 10;
      const isAheadOfSchedule = overallProgress > elapsedPercentage + 10;
      const isOnTrack = !isBehindSchedule && !isAheadOfSchedule;

      // Calculate site progress
      const siteProgress = sites.map(site => ({
         id: site._id,
         name: site.name,
         siteId: site.siteId,
         status: site.overallStatus,
         progress: site.progress || 0,
         activities: {
            total: site.activityCount || 0,
            completed: site.completedActivities || 0,
            pending: (site.activityCount || 0) - (site.completedActivities || 0)
         }
      }));

      // Calculate activity completion rate
      const completionRate = statistics.totalActivities > 0 ?
         Math.round((statistics.completedActivities / statistics.totalActivities) * 100) : 0;

      // Get health status
      let healthStatus = 'healthy';
      let healthColor = 'green';

      if (completionRate < 30) {
         healthStatus = 'critical';
         healthColor = 'red';
      } else if (completionRate < 60) {
         healthStatus = 'warning';
         healthColor = 'amber';
      } else if (completionRate < 80) {
         healthStatus = 'moderate';
         healthColor = 'blue';
      }

      // Calculate bottleneck detection
      const pendingSites = sites.filter(site =>
         site.overallStatus === 'pending' || site.progress < 30
      );

      const pendingActivities = allActivities.filter(activity =>
         ['pending', 'planned', 'draft', 'not-started'].includes(activity.status || activity.overallStatus)
      );

      return {
         overall: overallProgress,
         time: {
            elapsedDays,
            remainingDays,
            totalDays,
            elapsedPercentage,
            progressVsTime,
            status: {
               isBehindSchedule,
               isAheadOfSchedule,
               isOnTrack
            }
         },
         statistics: {
            ...statistics,
            completionRate,
            health: {
               status: healthStatus,
               color: healthColor,
               score: completionRate
            }
         },
         sites: siteProgress,
         timeline: {
            startDate: format(startDate, 'MMM dd, yyyy'),
            endDate: format(endDate, 'MMM dd, yyyy'),
            formatted: `${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd, yyyy')}`
         },
         bottlenecks: {
            sites: pendingSites.length,
            activities: pendingActivities.length,
            criticalPaths: pendingSites.slice(0, 3).map(site => ({
               site: site.name,
               reason: 'Low progress or pending status',
               priority: 'high'
            }))
         }
      };
   }, [project]);

   return progressData;
};

// Hook for project filtering functionality with debounce
export const useProjectFilters = (initialFilters = {}) => {
   const [filters, setFilters] = useState({
      search: '',
      status: 'all',
      site: 'all',
      activityType: 'all',
      activityStatus: 'all',
      dateRange: null,
      ...initialFilters
   });

   // Debounce search to prevent rapid re-filters
   const debouncedSearch = useDebounce(filters.search, 300);

   const updateFilter = useCallback((key, value) => {
      setFilters(prev => ({ ...prev, [key]: value }));
   }, []);

   const resetFilters = useCallback(() => {
      setFilters({
         search: '',
         status: 'all',
         site: 'all',
         activityType: 'all',
         activityStatus: 'all',
         dateRange: null
      });
   }, []);

   const filterData = useCallback((data, filterOptions = {}) => {
      if (!data) return [];

      const mergedFilters = { ...filters, ...filterOptions };

      return data.filter(item => {
         // Search filter (using debounced value)
         if (debouncedSearch) {
            const searchLower = debouncedSearch.toLowerCase();
            const matchesSearch =
               item.name?.toLowerCase().includes(searchLower) ||
               item.description?.toLowerCase().includes(searchLower) ||
               item.siteId?.toLowerCase().includes(searchLower) ||
               item.siteName?.toLowerCase().includes(searchLower) ||
               item.activityType?.name?.toLowerCase().includes(searchLower) ||
               item.dismantlingType?.toLowerCase().includes(searchLower) ||
               item.activityName?.toLowerCase().includes(searchLower) ||
               item.relocationType?.toLowerCase().includes(searchLower);
            if (!matchesSearch) return false;
         }

         // Status filter
         if (mergedFilters.status !== 'all' && item.status !== mergedFilters.status) {
            return false;
         }

         // Site filter
         if (mergedFilters.site !== 'all' && item.siteId !== mergedFilters.site) {
            return false;
         }

         // Activity type filter
         if (mergedFilters.activityType !== 'all' &&
            item.activityType?.name !== mergedFilters.activityType &&
            item.activityType?.type !== mergedFilters.activityType) {
            return false;
         }

         // Activity status filter
         if (mergedFilters.activityStatus !== 'all') {
            const itemStatus = item.status || item.overallStatus;
            if (itemStatus !== mergedFilters.activityStatus) {
               return false;
            }
         }

         // Date range filter
         if (mergedFilters.dateRange?.start && item.createdAt) {
            const itemDate = new Date(item.createdAt);
            const startDate = new Date(mergedFilters.dateRange.start);
            const endDate = mergedFilters.dateRange.end ?
               new Date(mergedFilters.dateRange.end) : new Date();

            if (itemDate < startDate || itemDate > endDate) {
               return false;
            }
         }

         return true;
      });
   }, [filters, debouncedSearch]);

   const getFilterOptions = useCallback((data, sites = []) => {
      if (!data) return { sites: [], activityTypes: [], statuses: [] };

      // Get unique sites
      const siteOptions = [...new Set(data.map(item => item.siteId).filter(Boolean))];

      // Get activity types
      const activityTypes = [...new Set(
         data.map(item => item.activityType?.name).filter(Boolean)
      )];

      // Get statuses
      const statuses = [...new Set(
         data.map(item => item.status || item.overallStatus).filter(Boolean)
      )];

      return {
         sites: siteOptions,
         activityTypes,
         statuses,
         siteObjects: sites.map(site => ({
            id: site._id,
            name: site.name,
            siteId: site.siteId
         }))
      };
   }, []);

   return {
      filters,
      updateFilter,
      resetFilters,
      filterData,
      getFilterOptions,
      setFilters
   };
};

// Export all hooks together
export default {
   useProjects,
   useProjectData,
   useProjectProgress,
   useProjectFilters,
   projectUtils
};