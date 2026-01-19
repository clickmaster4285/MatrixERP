// components/shared-components/project/header/ProjectHeader.js
'use client';

import { Button } from '@/components/ui/button';
import { FolderPlus, BarChart3, Users } from 'lucide-react';

const ProjectHeader = ({ onCreateProject }) => {
  return (
    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-3">
          {/* <div className="p-2 bg-primary/10 rounded-lg">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div> */}
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Project Management
            </h1>
            <p className="text-slate-600 text-lg mt-2 max-w-2xl">
              Track and manage all your tower construction projects in one centralized workspace.
              Monitor progress, assign teams, and ensure timely delivery.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-sky-500" />
            <span>Team collaboration</span>
          </div>
          <div className="w-1 h-1 bg-emerald-400 rounded-full"></div>
          <span>Real-time progress tracking</span>
          <div className="w-1 h-1 bg-emerald-400 rounded-full"></div>
          <span>Milestone management</span>
        </div>
      </div>

      <Button
        onClick={onCreateProject}
        className="gap-3 px-6 py-3 h-auto text-base shadow-lg hover:shadow-xl transition-all duration-300"
        size="lg"
      >
        <FolderPlus className="h-5 w-5" />
        New Project
      </Button>
    </div>
  );
};

export default ProjectHeader;