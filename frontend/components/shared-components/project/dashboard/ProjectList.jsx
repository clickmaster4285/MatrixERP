// components/shared-components/project/ProjectList.jsx
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { FolderPlus } from 'lucide-react';
import ProjectCard from './ProjectCard';

export default function ProjectList({
  projects = [],
  onDeleteProject,
  onEditProject,
  onUpdateProgress,
  managers = []
}) {
  if (!projects || projects.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <Card className="text-center py-16 border-slate-200 shadow-sm max-w-md w-full bg-white/50 backdrop-blur-sm">
          <CardContent className="space-y-4">
            <div className="text-slate-300 mb-2">
              <FolderPlus className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">
              No projects found
            </h3>
            <p className="text-slate-500">
              Get started by creating your first project or adjust your search filters.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6 auto-rows-fr">
      {projects.map((project) => (
        <ProjectCard
          key={project._id}
          project={project}
          managers={managers}
          onEdit={onEditProject}
          onDelete={onDeleteProject}
          onUpdateProgress={onUpdateProgress}
        />
      ))}
    </div>
  );
}