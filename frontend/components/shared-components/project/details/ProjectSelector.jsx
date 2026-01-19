// components/shared-components/project/project-details/ProjectSelector.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Search, Building, Check } from 'lucide-react';
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuTrigger,
   DropdownMenuItem,
   DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGetProjects } from '@/features/projectApi';
import { Skeleton } from '@/components/ui/skeleton';

const ProjectSelector = ({ currentProjectId, currentProjectName, variant = 'default' }) => {
   const [isOpen, setIsOpen] = useState(false);
   const [searchQuery, setSearchQuery] = useState('');
   const router = useRouter();

   // Fetch all projects with minimal data
   const { data: projectsResponse, isLoading } = useGetProjects({
      page: 1,
      limit: 50,
   });

   // Extract projects from response
   const allProjects = projectsResponse?.data || projectsResponse?.projects || [];

   // Filter projects based on search
   const filteredProjects = allProjects.filter(project =>
      project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project._id?.toLowerCase().includes(searchQuery.toLowerCase())
   );

   const handleProjectSelect = (projectId) => {
      if (projectId === currentProjectId) return;
      router.push(`/admin/project/${projectId}`);
      setIsOpen(false);
   };

   const getStatusColor = (status) => {
      switch (status) {
         case 'active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
         case 'planning': return 'bg-amber-100 text-amber-700 border-amber-200';
         case 'completed': return 'bg-green-100 text-green-700 border-green-200';
         default: return 'bg-slate-100 text-slate-700 border-slate-200';
      }
   };

   if (isLoading) {
      return variant === 'inline' ? (
         <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg">
            <Skeleton className="h-4 w-24 bg-white/20" />
            <ChevronDown className="h-3 w-3 text-white/60" />
         </div>
      ) : (
         <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg">
            <Skeleton className="h-4 w-32 bg-white/20" />
            <ChevronDown className="h-4 w-4 text-white/60" />
         </div>
      );
   }

   return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
         <DropdownMenuTrigger asChild>
            {variant === 'inline' ? (
               <Button
                  variant="ghost"
                  size="sm"
                  className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 hover:text-white px-3 py-1.5 h-auto"
               >
                  <div className="flex items-center gap-2">
                     <span className="font-medium text-sm truncate max-w-[120px]">
                        Switch Project
                     </span>
                     <ChevronDown className="h-3 w-3 text-white/60" />
                  </div>
               </Button>
            ) : (
               <Button
                  variant="ghost"
                  className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 hover:text-white px-4 py-2 h-auto"
               >
                  <div className="flex items-center gap-3">
                     <div className="p-1.5 bg-white/20 rounded">
                        <Building className="h-3.5 w-3.5" />
                     </div>
                     <div className="text-left">
                        <div className="font-medium text-sm truncate max-w-[150px]">
                           {currentProjectName}
                        </div>
                        <div className="text-xs text-white/70 truncate">
                           Switch Project
                        </div>
                     </div>
                     <ChevronDown className="h-4 w-4 text-white/60" />
                  </div>
               </Button>
            )}
         </DropdownMenuTrigger>

         <DropdownMenuContent
            align="end"
            className="w-[350px] p-0 bg-white border-slate-200 shadow-lg"
            sideOffset={8}
         >
            {/* Search Bar */}
            <div className="p-3 border-b border-slate-100">
               <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                     placeholder="Search projects..."
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="pl-10 border-slate-200"
                  />
               </div>
            </div>

            <ScrollArea className="max-h-[400px]">
               <div className="p-2">
                  {filteredProjects.length > 0 ? (
                     filteredProjects.map(project => (
                        <DropdownMenuItem
                           key={project._id}
                           className={`flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-slate-50 ${project._id === currentProjectId ? 'bg-sky-50 border border-sky-100' : ''
                              }`}
                           onClick={() => handleProjectSelect(project._id)}
                        >
                           <div className="flex items-center gap-3 flex-1">
                              <div className="p-2 rounded-lg" style={{
                                 backgroundColor: project._id === currentProjectId ? '#f0f9ff' : '#f8fafc',
                              }}>
                                 <Building className="h-4 w-4" style={{
                                    color: project._id === currentProjectId ? '#0284c7' : '#64748b'
                                 }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                 <div className="font-medium text-slate-900 truncate">
                                    {project.name}
                                 </div>
                                 <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                                    <Badge className={`text-xs ${getStatusColor(project.status)}`}>
                                       {project.status}
                                    </Badge>
                                    <span className="truncate">
                                       ID: {project._id?.slice(-8)}
                                    </span>
                                 </div>
                              </div>
                           </div>
                           {project._id === currentProjectId && (
                              <Check className="h-4 w-4 text-sky-600 shrink-0" />
                           )}
                        </DropdownMenuItem>
                     ))
                  ) : (
                     <div className="py-8 text-center">
                        <Building className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-600">No projects found</p>
                        <p className="text-slate-500 text-sm mt-1">
                           {searchQuery ? 'Try a different search' : 'No projects available'}
                        </p>
                     </div>
                  )}
               </div>
            </ScrollArea>

            {/* Footer */}
            <div className="p-3 border-t border-slate-100 bg-slate-50">
               <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">
                     {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
                  </span>
                  <Button
                     variant="ghost"
                     size="sm"
                     onClick={() => router.push('/admin/project')}
                     className="text-sky-600 hover:text-sky-700 hover:bg-sky-50"
                  >
                     View All Projects
                  </Button>
               </div>
            </div>
         </DropdownMenuContent>
      </DropdownMenu>
   );
};

export default ProjectSelector;