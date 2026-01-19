// components/shared-components/project/ProjectDetails.jsx
'use client';

import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamic imports
const ProjectHeroHeader = dynamic(() => import('./header/ProjectHeroHeader'), {
  loading: () => <div className="h-20 bg-linear-to-r from-slate-100 to-slate-50 animate-pulse rounded-xl" />
});

const ProjectDetailsTabs = dynamic(() => import('./tabs/ProjectDetailsTabs'), {
  loading: () => <div className="h-96 bg-slate-100 animate-pulse rounded-xl" />
});

// Hooks
import { useProjectData, useProjectProgress } from '@/hooks/useProjects';

// UI Components
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertCircle, ChevronRight } from 'lucide-react';

const ProjectDetailsContent = () => {
  const { id } = useParams();
  const router = useRouter();
  const { project, isLoading, error } = useProjectData(id);
  const progressData = useProjectProgress(project);

  if (isLoading) {
    return <ProjectDetailsSkeleton />;
  }

  if (error || !project) {
    return (
      <div className="min-h-screen p-6 bg-linear-to-b from-slate-50 to-white">
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {error ? 'Error Loading Project' : 'Project Not Found'}
          </h2>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            {error?.message || 'The project you\'re looking for doesn\'t exist.'}
          </p>
          <Button onClick={() => router.back()} className="gap-2">
            <ChevronRight className="h-4 w-4 rotate-180" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-white">
      {/* Hero Header */}
      <ProjectHeroHeader project={project} progressData={progressData} />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <ProjectDetailsTabs
          project={project}
          progressData={progressData}
          projectId={id}
        />
      </div>
    </div>
  );
};

// Wrapper with Suspense
const ProjectDetails = () => {
  return (
    <Suspense fallback={<ProjectDetailsSkeleton />}>
      <ProjectDetailsContent />
    </Suspense>
  );
};

const ProjectDetailsSkeleton = () => {
  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-white">
      {/* Header Skeleton */}
      <div className="bg-linear-to-r from-sky-500 to-emerald-500 h-64">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-32 mb-6 bg-white/20" />
          <div className="flex flex-col lg:flex-row justify-between gap-6">
            <div className="space-y-4">
              <Skeleton className="h-10 w-64 bg-white/20" />
              <Skeleton className="h-6 w-96 bg-white/20" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-32 bg-white/20" />
                <Skeleton className="h-4 w-32 bg-white/20" />
                <Skeleton className="h-4 w-32 bg-white/20" />
              </div>
            </div>
            <Skeleton className="h-48 w-80 bg-white/20" />
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-96 w-full bg-slate-200 rounded-xl" />
      </div>
    </div>
  );
};

export default ProjectDetails;