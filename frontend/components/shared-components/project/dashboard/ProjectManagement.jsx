// components/shared-components/project/ProjectManagement.jsx
'use client';

import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { useProjects } from '@/hooks/useProjects';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useCallback } from 'react';

// Dynamic imports for better performance
const ProjectHeader = dynamic(() => import('../details/header/ProjectHeader'), {
  loading: () => <div className="h-10 bg-muted/50 rounded animate-pulse" />
});

const ProjectStats = dynamic(() => import('./ProjectStats'), {
  loading: () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-20 bg-muted/50 rounded animate-pulse"></div>
      ))}
    </div>
  )
});

const ProjectFilters = dynamic(() => import('./ProjectFilters'), {
  loading: () => <div className="h-16 bg-muted/50 rounded animate-pulse" />
});

const ProjectList = dynamic(() => import('./ProjectList'), {
  loading: () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-48 bg-muted/50 rounded animate-pulse"></div>
      ))}
    </div>
  )
});

const ProjectPagination = dynamic(() => import('./ProjectPagination'));
const ProjectModal = dynamic(() => import('../create-edit/ProjectModal'));

const ProjectManagement = () => {
  const {
    projects,
    managers,
    stats,
    pagination,
    modalState,
    filters,
    isLoading,
    error,
    setFilters,
    openCreateModal,
    openEditModal,
    closeModal,
    createProject,
    updateProject,
    deleteProject,
    resetFilters,
    updateFilter
  } = useProjects();

  const handleDeleteProject = async (projectId, projectName) => {
    const result = await deleteProject(projectId, projectName);

    if (result.success) {
      toast.success('Project deleted successfully', {
        description: `${projectName} has been removed.`
      });
    } else if (!result.cancelled) {
      toast.error('Failed to delete project', {
        description: result.error
      });
    }
  };

  const handleCreateProject = async (projectData) => {
    const result = await createProject(projectData);

    if (result.success) {
      toast.success('Project created successfully', {
        description: `${projectData.name} has been added to your projects.`
      });
    } else {
      toast.error('Failed to create project', {
        description: result.error
      });
    }
  };

  const handleUpdateProject = async (projectId, updateData) => {
    const result = await updateProject(projectId, updateData);

    if (result.success) {
      toast.success('Project updated successfully', {
        description: 'Project has been updated successfully.'
      });
    } else {
      toast.error('Failed to update project', {
        description: result.error
      });
    }
  };

  const handleFilterChange = useCallback((key, value) => {
    // For page changes, keep other filters
    if (key === 'page') {
      updateFilter(key, value);
    } else {
      // For other filter changes, reset to page 1
      updateFilter(key, value);
      if (key !== 'limit') {
        updateFilter('page', 1);
      }
    }
  }, [updateFilter]);

  if (error) {
    return (
      <div className="min-h-screen p-6">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Projects</AlertTitle>
          <AlertDescription>
            {error.message || 'Failed to load projects. Please try again.'}
          </AlertDescription>
        </Alert>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-slate-700 mb-4">
            Unable to load projects
          </h2>
          <p className="text-slate-600">Please check your connection and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6">
      <ProjectHeader
        onCreateProject={openCreateModal}
        isLoading={isLoading}
      />

      {!isLoading && (
        <>
          <ProjectStats stats={stats} />

          <ProjectFilters
            search={filters.search}
            status={filters.status}
            manager={filters.manager}
            managers={managers}
            onSearchChange={(value) => handleFilterChange('search', value)}
            onStatusChange={(value) => handleFilterChange('status', value)}
            onManagerChange={(value) => handleFilterChange('manager', value)}
            onReset={resetFilters}
          />

          <ProjectList
            projects={projects}
            managers={managers}
            onEditProject={openEditModal}
            onDeleteProject={handleDeleteProject}
          />

          {pagination.pages > 1 && (
            <ProjectPagination
              pagination={pagination}
              onPageChange={(page) => handleFilterChange('page', page)}
              onLimitChange={(limit) => handleFilterChange('limit', limit)}
            />
          )}
        </>
      )}

      <ProjectModal
        modalState={modalState}
        onClose={closeModal}
        managers={managers}
        onCreateProject={handleCreateProject}
        onUpdateProject={handleUpdateProject}
      />
    </div>
  );
};

export default ProjectManagement;