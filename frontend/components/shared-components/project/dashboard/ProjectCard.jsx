// components/shared-components/project/ProjectCard.jsx
'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
   MoreVertical,
   Edit,
   Trash2,
   Calendar,
   Clock,
   MapPin,
   Building,
   Activity,
   ArrowUpRight,
   Wrench,
   Crown,
   Truck,
   CircleDot
} from 'lucide-react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useRouter, usePathname } from 'next/navigation';
import { projectUtils } from '@/hooks/useProjects';
import { cn } from '@/lib/utils';

// Activity Indicator Component (Reusable)
const ActivityIndicator = ({ type, count }) => {
   const config = {
      dismantling: {
         icon: <Wrench className="h-3 w-3" />,
         color: 'bg-sky-500',
         bgColor: 'bg-sky-50',
         borderColor: 'border-sky-200',
         label: 'Dismantling'
      },
      cow: {
         icon: <Crown className="h-3 w-3" />,
         color: 'bg-emerald-500',
         bgColor: 'bg-emerald-50',
         borderColor: 'border-emerald-200',
         label: 'COW'
      },
      relocation: {
         icon: <Truck className="h-3 w-3" />,
         color: 'bg-purple-500',
         bgColor: 'bg-purple-50',
         borderColor: 'border-purple-200',
         label: 'Relocation'
      }
   };

   const { icon, color, bgColor, borderColor, label } = config[type] || config.dismantling;

   return (
      <div className={cn(
         "flex items-center gap-1.5 px-2 py-1 rounded-lg border",
         bgColor,
         borderColor
      )}>
         <div className={cn("w-1.5 h-1.5 rounded-full", color)} />
         {icon}
         <span className="text-xs font-semibold">{count || 0}</span>
         <span className="text-xs text-slate-600">{label}</span>
      </div>
   );
};

// Site Status Badge Component (Reusable)
const SiteStatusBadge = ({ status }) => {
   const getStatusColor = (status) => {
      switch (status) {
         case 'completed': return 'bg-green-500';
         case 'in-progress': return 'bg-amber-500';
         case 'planned': return 'bg-blue-500';
         default: return 'bg-slate-400';
      }
   };

   return (
      <div className="flex items-center gap-2">
         <div className={cn("w-1.5 h-1.5 rounded-full", getStatusColor(status))} />
         <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 capitalize bg-white">
            {status}
         </Badge>
      </div>
   );
};

const ProjectCard = ({
   project,
   onEdit,
   onDelete,
   managers = []
}) => {
   const router = useRouter();
   const pathname = usePathname();

   const manager = typeof project.manager === 'object'
      ? project.manager
      : managers.find(m => m._id === project.manager);

   // Use utility functions
   const statistics = project.statistics || {};
   const progress = statistics.progress || 0;
   const siteCount = statistics.siteCount || 0;
   const daysRemaining = projectUtils.getDaysRemaining(project.timeline?.endDate);
   const isOverdue = daysRemaining < 0 && !['completed', 'cancelled'].includes(project.status);
   const statusConfig = projectUtils.getStatusConfig(project.status);
   const progressColor = projectUtils.getProgressColor(progress);

   // Handler for card click
   const handleCardClick = (e) => {
      if (e.target.closest('[role="menuitem"]') || e.target.closest('[data-state="open"]')) {
         return;
      }
      const basePath = pathname.split('/').slice(0, -1).join('/');
      router.push(`${basePath}/project/${project._id}`);
   };

   // Get first 3 sites for display
   const displaySites = project.sites?.slice(0, 3) || [];

   return (
      <Card
         className={cn(
            "group hover:shadow-xl transition-all duration-300 bg-white",
            "border border-slate-200 hover:border-sky-300",
            "flex flex-col relative overflow-hidden",
            siteCount === 0 ? "opacity-95" : "",
            "hover:translate-y-0.5 cursor-pointer"
         )}
         onClick={handleCardClick}
      >
         {/* Progress indicator on left */}
         <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-linear-to-b ${progressColor}`} />

         <CardHeader className="pb-4 space-y-4 pl-5">
            {/* Header with title and actions */}
            <div className="flex items-start justify-between gap-3">
               <div className="flex-1 min-w-0 space-y-2">
                  <h3 className="text-lg font-bold text-slate-900 leading-tight line-clamp-1 group-hover:text-sky-700 transition-colors">
                     {project.name}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed line-clamp-2">
                     {project.description || 'No description provided for this project.'}
                  </p>
               </div>

               <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                     <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-70 group-hover:opacity-100 transition-all hover:bg-sky-50 hover:text-sky-700"
                     >
                        <MoreVertical className="h-4 w-4" />
                     </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
                     <DropdownMenuItem
                        className="flex items-center gap-3 cursor-pointer py-2.5"
                        onClick={() => onEdit?.(project)}
                     >
                        <Edit className="h-4 w-4" />
                        <span>Edit Project</span>
                     </DropdownMenuItem>
                     <DropdownMenuItem
                        className="flex items-center gap-3 cursor-pointer py-2.5 text-red-600 focus:text-red-600"
                        onClick={() => onDelete?.(project._id, project.name)}
                     >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete Project</span>
                     </DropdownMenuItem>
                  </DropdownMenuContent>
               </DropdownMenu>
            </div>

            {/* Status and Sites Count */}
            <div className="flex items-center justify-between">
               <Badge variant="outline" className={`${statusConfig.class} px-3 py-1 font-medium`}>
                  {statusConfig.label}
               </Badge>
               <div className="flex items-center gap-1 text-slate-700">
                  <MapPin className="h-3.5 w-3.5 text-sky-600" />
                  <span className="text-sm font-semibold">{siteCount}</span>
                  <span className="text-xs text-slate-500">Sites</span>
               </div>
            </div>
         </CardHeader>

         <CardContent className="pt-0 pb-6 flex-1 flex flex-col justify-between space-y-6 pl-5" onClick={(e) => e.stopPropagation()}>
            {/* Progress Bar */}
            <div className="space-y-2">
               <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5">
                     <CircleDot className="h-3.5 w-3.5 text-sky-600" />
                     <span className="font-semibold text-slate-800">Progress</span>
                  </div>
                  <span className={`font-bold ${progress === 100 ? 'text-green-600' :
                     progress >= 70 ? 'text-sky-600' :
                        progress >= 40 ? 'text-amber-600' : 'text-slate-600'
                     }`}>
                     {progress}%
                  </span>
               </div>
               <Progress
                  value={progress}
                  className={cn(
                     "h-2.5 rounded-full",
                     "transition-all duration-1000 ease-out"
                  )}
               />
            </div>

            {/* Activity Type Breakdown */}
            <div className="space-y-2">
               <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5">
                     <Activity className="h-3.5 w-3.5 text-sky-600" />
                     <span className="font-semibold text-slate-800">Activities</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-800">
                     {statistics.totalActivities || 0} total
                  </span>
               </div>
               <div className="grid grid-cols-3 gap-2">
                  <ActivityIndicator type="dismantling" count={statistics.totalDismantling || 0} />
                  <ActivityIndicator type="cow" count={statistics.totalCow || 0} />
                  <ActivityIndicator type="relocation" count={statistics.totalRelocation || 0} />
               </div>
            </div>

            {/* Timeline Boxes */}
            <div className="grid grid-cols-2 gap-2">
               <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-2">
                  <Calendar className="h-4 w-4 text-sky-600" />
                  <div className="flex-1 min-w-0">
                     <div className="text-[10px] text-sky-600 font-medium">Start</div>
                     <div className="text-xs font-semibold text-slate-800 truncate">
                        {projectUtils.formatDate(project.timeline?.startDate)}
                     </div>
                  </div>
               </div>
               <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-2">
                  <Clock className={`h-4 w-4 ${isOverdue ? 'text-red-500' :
                     daysRemaining !== null && daysRemaining <= 7 ? 'text-amber-500' : 'text-purple-500'
                     }`} />
                  <div className="flex-1 min-w-0">
                     <div className={`text-[10px] font-medium ${isOverdue ? 'text-red-500' :
                        daysRemaining !== null && daysRemaining <= 7 ? 'text-amber-500' : 'text-purple-500'
                        }`}>
                        {isOverdue ? 'Overdue' : 'Ends'}
                     </div>
                     <div className="text-xs font-semibold text-slate-800 truncate">
                        {isOverdue ? `${Math.abs(daysRemaining)}d` :
                           daysRemaining !== null ? `${daysRemaining}d left` : projectUtils.formatDate(project.timeline?.endDate)}
                     </div>
                  </div>
               </div>
            </div>

            {/* Manager and Sites Section */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
               <div className="flex items-center gap-2">
                  <UserAvatar user={manager} size="sm" showFallback={!!manager?.name} />
                  <div className="flex-1 min-w-0">
                     <p className="text-xs font-semibold text-slate-900 truncate">
                        {manager?.name || 'Unassigned'}
                     </p>
                     <p className="text-[10px] text-slate-500">Project Manager</p>
                  </div>
               </div>

               {/* Project Sites Preview */}
               {displaySites.length > 0 ? (
                  <div className="space-y-1.5">
                     <div className="flex items-center gap-1 text-xs font-medium text-slate-700">
                        <Building className="h-3 w-3" />
                        <span>Project Sites</span>
                     </div>
                     <div className="flex flex-col gap-1">
                        {displaySites.map((site, index) => (
                           <div
                              key={site._id || index}
                              className="flex items-center justify-between p-1.5 bg-slate-50 rounded border border-slate-200"
                           >
                              <span className="text-xs text-slate-800 truncate flex-1">
                                 {site.name || `Site ${index + 1}`}
                              </span>
                              <SiteStatusBadge status={site.overallStatus} />
                           </div>
                        ))}
                        {siteCount > 3 && (
                           <div className="text-center pt-1">
                              <span className="text-xs text-slate-500 font-medium">
                                 +{siteCount - 3} more sites
                              </span>
                           </div>
                        )}
                     </div>
                  </div>
               ) : (
                  <div className="flex flex-col items-center justify-center p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700">
                     <Building className="h-4 w-4 mb-1 opacity-60" />
                     <span className="text-xs font-medium">No sites added yet</span>
                     <span className="text-[10px] text-amber-600">Click to add sites</span>
                  </div>
               )}
            </div>

            {/* View Details Button */}
            <div className="pt-2 border-t border-slate-100">
               <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-7 text-xs text-sky-600 hover:text-sky-700 hover:bg-sky-50"
               >
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  View Details
               </Button>
            </div>
         </CardContent>
      </Card>
   );
};

export default ProjectCard;