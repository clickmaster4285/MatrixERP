// components/shared-components/project/project-details/ProjectHeroHeader.jsx
'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
   Calendar,
   Clock,
   User,
   Phone,
   Mail,
   ChevronRight
} from 'lucide-react';
import { projectUtils } from '@/hooks/useProjects'; // Import from your hook
import ProjectSelector from '../ProjectSelector';

const ProjectHeroHeader = ({ project, progressData }) => {
   const router = useRouter();

   // Safe date formatting
   const formatDateSafe = (dateString) => {
      if (!dateString) return 'Not set';
      try {
         const date = new Date(dateString);
         if (isNaN(date.getTime())) return 'Invalid date';
         return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
         });
      } catch (error) {
         return 'Invalid date';
      }
   };

   return (
      <div className="bg-gray-500 rounded-md text-white">
         <div className="p-4">
            {/* Header with Back button and Project Selector */}
            <div className="flex justify-between items-center mb-6">
               <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/10"
               >
                  <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
                  Back to Projects
               </Button>

               {/* Project Selector Dropdown - placed at top right */}
               <div className="hidden sm:block">
                  <ProjectSelector
                     currentProjectId={project?._id}
                     currentProjectName={project?.name}
                  />
               </div>
            </div>

            {!project ? (
               <div className="text-center py-8">
                  <p className="text-white">Loading project...</p>
               </div>
            ) : (
               <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                  <div className="flex-1">
                     {/* Project title with badge and selector on mobile */}
                     <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                        <div className="flex items-center gap-3">
                           <h3 className="text-3xl lg:text-4xl font-bold">{project.name}</h3>
                           <Badge className={`text-sm px-3 py-1 ${project.status === 'active' ? 'bg-emerald-500' :
                              project.status === 'planning' ? 'bg-amber-500' :
                                 project.status === 'completed' ? 'bg-green-500' :
                                    'bg-slate-500'
                              }`}>
                              {project.status?.charAt(0).toUpperCase() + project.status?.slice(1)}
                           </Badge>
                        </div>

                        {/* Project Selector for mobile - inline with title */}
                        <div className="sm:hidden mt-2">
                           <ProjectSelector
                              currentProjectId={project._id}
                              currentProjectName={project.name}
                              variant="inline"
                           />
                        </div>
                     </div>

                     <p className="text-sky-100 text-lg mb-4 max-w-3xl">
                        {project.description || 'No description provided for this project.'}
                     </p>

                     <div className="flex flex-wrap gap-6 text-sm text-white/90">
                        <div className="flex items-center gap-2">
                           <Calendar className="h-4 w-4 text-teal-400" />
                           <span>Start: {formatDateSafe(project.timeline?.startDate)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <Clock className="h-4 w-4 text-cyan-400" />
                           <span>End: {formatDateSafe(project.timeline?.endDate)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <Calendar className="h-4 w-4 text-purple-400" />
                           <span>Created: {formatDateSafe(project.createdAt)}</span>
                        </div>
                     </div>
                  </div>

                  {/* Project Manager Card */}
                  <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                     <CardContent>
                        {project.manager ? (
                           <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-full border border-gray-50 flex items-center justify-center text-gray-700 font-semibold text-xl">
                                    {project.manager.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'PM'}
                                 </div>
                                 <div>
                                    <div className="flex space-x-2">
                                       <h4 className="font-semibold text-white">{project.manager.name}</h4>
                                       <p className="text-white/80 text-sm capitalize">({project.manager.role})</p>
                                    </div>
                                    {project.manager.phone && (
                                       <a
                                          href={`tel:${project.manager.phone}`}
                                          className="flex items-center gap-2 text-white/90 hover:text-white underline underline-offset-2 decoration-green-500 transition-colors"
                                       >
                                          {project.manager.phone}
                                       </a>
                                    )}
                                 </div>
                              </div>
                           </div>
                        ) : (
                           <div className="text-center py-4">
                              <User className="h-8 w-8 text-white/50 mx-auto mb-2" />
                              <p className="text-white/80">No manager assigned</p>
                           </div>
                        )}
                     </CardContent>
                  </Card>
               </div>
            )}
         </div>
      </div>
   );
};

export default ProjectHeroHeader;