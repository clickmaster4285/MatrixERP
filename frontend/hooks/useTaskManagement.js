// hooks/useTaskManagement.js
'use client';

import { useState, useMemo, useCallback } from 'react';
import { useGetMyTasks } from '../features/taskApi';

// Helper to safely parse dates
const toDateOrNull = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

export const useTaskManagement = ({ initialFilters = {} } = {}) => {
  // ---------- FILTER STATE ----------
  const [filters, setFilters] = useState({
    activityType: 'all',
    status: 'all',
    page: 1,
    limit: 20,
    search: '',
    ...initialFilters
  });

  // ---------- QUERIES ----------
  const {
    data: tasksResponse,
    isLoading: tasksLoading,
    error: tasksError,
    refetch: refetchTasks,
  } = useGetMyTasks(filters);
  // ---------- DATA NORMALIZATION ----------
  const allTasks = useMemo(() => {
    if (!tasksResponse?.success || !tasksResponse?.data) {
      return [];
    }

    // Ensure data is an array
    const data = tasksResponse.data;
    return Array.isArray(data) ? data : [];
  }, [tasksResponse]);

  // Backend pagination info
  const pagination = useMemo(() => {
    if (!tasksResponse) return null;
    return {
      count: tasksResponse.count || 0,
      total: tasksResponse.total || 0,
      page: tasksResponse.page || 1,
      totalPages: tasksResponse.totalPages || 1,
      limit: tasksResponse.limit || 20,
    };
  }, [tasksResponse]);

  // ---------- PERFORMANCE METRICS ----------
  const performance = useMemo(() => {
    const totalTasks = allTasks.length;

    // Count by status - using actual status values from backend
    const completedTasks = allTasks.filter(task => {
      const status = task.status?.toLowerCase();
      return status === 'completed' ||
        status === 'dispatched' || // Add if you have dispatched status
        (task.completion === 100); // Or check completion percentage
    }).length;

    const inProgressTasks = allTasks.filter(task => {
      const status = task.status?.toLowerCase();
      return status === 'in-progress' ||
        status === 'in_progress' ||
        status === 'dismantling' || // From your data
        status === 'surveying' || // From phase
        (task.completion && task.completion > 0 && task.completion < 100);
    }).length;

    const pendingTasks = allTasks.filter(task => {
      const status = task.status?.toLowerCase();
      return status === 'pending' ||
        status === 'draft' ||
        status === 'planned' || // From your data
        (!task.completion || task.completion === 0);
    }).length;

    // Count by activity type
    const dismantlingTasks = allTasks.filter(task =>
      task.activityType === 'dismantling'
    ).length;

    const relocationTasks = allTasks.filter(task =>
      task.activityType === 'relocation'
    ).length;

    // Count by role (myRole field from backend)
    const byTaskType = {};
    allTasks.forEach(task => {
      // Use the myRole field that comes from backend's getMyRole function
      const role = task.myRole?.toLowerCase() || 'assigned';
      if (!byTaskType[role]) {
        byTaskType[role] = {
          total: 0,
          completed: 0,
          inProgress: 0,
          pending: 0
        };
      }

      byTaskType[role].total += 1;

      // Categorize by actual status
      const status = task.status?.toLowerCase();
      const completion = task.completion || 0;

      if (status === 'completed' || completion === 100) {
        byTaskType[role].completed += 1;
      } else if (
        status === 'in-progress' ||
        status === 'in_progress' ||
        status === 'dismantling' ||
        completion > 0
      ) {
        byTaskType[role].inProgress += 1;
      } else {
        byTaskType[role].pending += 1;
      }
    });

    // Calculate completion rate (using completion percentage from backend)
    const totalCompletion = allTasks.reduce((sum, task) => sum + (task.completion || 0), 0);
    const averageCompletion = totalTasks > 0
      ? Math.round(totalCompletion / totalTasks)
      : 0;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      dismantlingTasks,
      relocationTasks,
      completionRate: averageCompletion, // Using average completion %
      byTaskType,

      // Additional stats from backend data
      averageCompletion,
      totalCompletion,

      // Status breakdown for debugging
      statusBreakdown: {
        draft: allTasks.filter(t => t.status === 'draft').length,
        planned: allTasks.filter(t => t.status === 'planned').length,
        dismantling: allTasks.filter(t => t.status === 'dismantling').length,
        completed: allTasks.filter(t => t.status === 'completed').length,
      }
    };
  }, [allTasks]);

  // ---------- FILTERED TASKS ----------
  const filteredTasks = useMemo(() => {
    if (!allTasks.length) return [];

    const { status, activityType, search } = filters;

    return allTasks.filter((task) => {
      // Activity type filter
      if (activityType && activityType !== 'all' && task.activityType !== activityType) {
        return false;
      }

      // Status filter - map frontend filter to backend status values
      if (status && status !== 'all') {
        const taskStatus = task.status?.toLowerCase();
        const filterStatus = status.toLowerCase();

        switch (filterStatus) {
          case 'completed':
            if (taskStatus !== 'completed' && task.completion !== 100) {
              return false;
            }
            break;

          case 'in-progress':
            // Accept various in-progress statuses
            const isInProgress =
              taskStatus === 'in-progress' ||
              taskStatus === 'in_progress' ||
              taskStatus === 'dismantling' ||
              (task.completion && task.completion > 0 && task.completion < 100);

            if (!isInProgress) {
              return false;
            }
            break;

          case 'pending':
            // Accept pending/draft/planned
            const isPending =
              taskStatus === 'pending' ||
              taskStatus === 'draft' ||
              taskStatus === 'planned' ||
              (!task.completion || task.completion === 0);

            if (!isPending) {
              return false;
            }
            break;

          default:
            // Exact match for other statuses
            if (taskStatus !== filterStatus) {
              return false;
            }
        }
      }

      // Search filter
      if (search && search.trim().length > 0) {
        const query = search.trim().toLowerCase();
        const searchableText = [
          task.title,
          task.siteId,
          task.siteName,
          task.siteOperator,
          task.activityType,
          task.status,
          task.myRole,
          task.phase,
          task.dismantlingType, // For dismantling tasks
          task.relocationType, // For relocation tasks
          task.location?.city, // From dismantling tasks
          task.location?.state, // From dismantling tasks
          task.sourceSite?.address?.city, // From relocation tasks
          task.destinationSite?.address?.city, // From relocation tasks
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableText.includes(query);
      }

      return true;
    });
  }, [allTasks, filters]);

  // ---------- TASK STATISTICS ----------
  const { overdueTasks, dueTodayTasks, byStatus, byModule, byRole } = useMemo(() => {
    const overdue = [];
    const today = [];
    const upcoming = [];

    const statusMap = {};
    const moduleMap = {};
    const roleMap = {};

    allTasks.forEach((task) => {
      // Status counts - use actual status from backend
      const statusKey = task.status || 'unknown';
      statusMap[statusKey] = (statusMap[statusKey] || 0) + 1;

      // Module counts - use activityType from backend
      const moduleKey = task.activityType || 'unknown';
      moduleMap[moduleKey] = (moduleMap[moduleKey] || 0) + 1;

      // Role counts - use myRole from backend
      const roleKey = task.myRole || 'unknown';
      roleMap[roleKey] = (roleMap[roleKey] || 0) + 1;

      // Date-based classification
      // Use dueDate if available, otherwise use updatedAt
      const dueDate = toDateOrNull(task.dueDate) ||
        toDateOrNull(task.updatedAt) ||
        toDateOrNull(task.createdAt);

      if (!dueDate) return;

      const now = new Date();
      const isCompleted = task.status?.toLowerCase() === 'completed' ||
        task.completion === 100;

      if (!isCompleted && dueDate < now) {
        overdue.push(task);
      } else if (!isCompleted) {
        const dueDay = new Date(dueDate).toDateString();
        const todayStr = now.toDateString();

        if (dueDay === todayStr) {
          today.push(task);
        } else if (dueDate > now) {
          upcoming.push(task);
        }
      }
    });

    return {
      overdueTasks: overdue,
      dueTodayTasks: today,
      upcomingTasks: upcoming,
      byStatus: statusMap,
      byModule: moduleMap,
      byRole: roleMap,
    };
  }, [allTasks]);

  // ---------- TASK GROUPING ----------
  const tasksByPhase = useMemo(() => {
    const groups = {};
    allTasks.forEach(task => {
      // Use phase field from backend
      const phase = task.phase || 'Unassigned';
      if (!groups[phase]) groups[phase] = [];
      groups[phase].push(task);
    });
    return groups;
  }, [allTasks]);

  // ---------- ADDITIONAL HELPER STATS ----------
  const taskStats = useMemo(() => {
    // Dismantling task stats
    const dismantlingTasks = allTasks.filter(t => t.activityType === 'dismantling');
    const relocationTasks = allTasks.filter(t => t.activityType === 'relocation');

    return {
      // Dismantling stats
      dismantling: {
        total: dismantlingTasks.length,
        needsSurvey: dismantlingTasks.filter(t => t.needsSurvey).length,
        canStartDismantling: dismantlingTasks.filter(t => t.canStartDismantling).length,
        surveyCompleted: dismantlingTasks.filter(t => t.survey?.status === 'completed').length,
        byType: {
          B2S: dismantlingTasks.filter(t => t.dismantlingType === 'B2S').length,
          // Add other dismantling types as needed
        }
      },

      // Relocation stats
      relocation: {
        total: relocationTasks.length,
        byType: {
          OMO: relocationTasks.filter(t => t.relocationType === 'OMO').length,
          // Add other relocation types as needed
        }
      },

      // Site stats
      sites: {
        uniqueSites: [...new Set(allTasks.map(t => t.siteId))].length,
        siteOperators: [...new Set(allTasks.map(t => t.siteOperator))].filter(Boolean).length,
      }
    };
  }, [allTasks]);

  // ---------- FILTER UPDATERS ----------
  const updateFilters = useCallback((updater) => {
    setFilters(prev => {
      const newFilters = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };

      // Reset to page 1 when filters change (except page itself)
      if (updater.page === undefined) {
        const { page: oldPage, ...oldWithoutPage } = prev;
        const { page: newPage, ...newWithoutPage } = newFilters;

        if (JSON.stringify(oldWithoutPage) !== JSON.stringify(newWithoutPage)) {
          return { ...newFilters, page: 1 };
        }
      }

      return newFilters;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      activityType: 'all',
      status: 'all',
      page: 1,
      limit: 20,
      search: '',
      ...initialFilters
    });
  }, [initialFilters]);

  const goToPage = useCallback((pageNumber) => {
    updateFilters({ page: pageNumber });
  }, [updateFilters]);

  // ---------- EXPORT ----------
  return {
    // Data
    tasksResponse,
    allTasks,
    tasks: filteredTasks,

    // Pagination
    pagination,
    goToPage,

    // Performance & Statistics
    performance,
    taskStats,

    // Statistics for filters
    overdueTasks,
    dueTodayTasks,
    upcomingTasks: [], // Not used currently
    byStatus,
    byModule,
    byRole,
    tasksByPhase,

    // Filters
    filters,
    updateFilters,
    resetFilters,

    // Loading states
    isLoading: tasksLoading,
    tasksLoading,
    performanceLoading: tasksLoading,

    // Error states
    error: tasksError,
    tasksError,

    // Refetch
    refetchTasks,
  };
};