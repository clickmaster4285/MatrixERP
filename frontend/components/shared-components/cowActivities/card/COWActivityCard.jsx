'use client';

import { useState } from 'react';
import {
   MapPin,
   Users,
   Calendar,
   ChevronRight,
   MoreVertical,
   Eye,
   Edit,
   Trash2,
   ClipboardCheck,
   Package,
   Wrench,
   Truck,
   ArrowRightLeft,
   BarChart3,
   Navigation,
   Pin,
   Building,
   Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const getPurposeColor = (purpose) => {
   switch (purpose) {
      case 'event-coverage': return 'bg-purple-500/10 text-purple-700 border-purple-200';
      case 'disaster-recovery': return 'bg-red-500/10 text-red-700 border-red-200';
      case 'network-expansion': return 'bg-emerald-500/10 text-emerald-700 border-emerald-200';
      case 'maintenance': return 'bg-amber-500/10 text-amber-700 border-amber-200';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200';
   }
};

const getStatusColor = (status) => {
   switch (status) {
      case 'planned': return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'in-progress': return 'bg-amber-500/10 text-amber-700 border-amber-200';
      case 'completed': return 'bg-emerald-500/10 text-emerald-700 border-emerald-200';
      case 'cancelled': return 'bg-red-500/10 text-red-700 border-red-200';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200';
   }
};

const getWorkTypeIcon = (type) => {
   const icons = {
      survey: ClipboardCheck,
      inventory: Package,
      transportation: Truck,
      installation: Wrench
   };
   return icons[type] || ClipboardCheck;
};

const formatDate = (dateString) => {
   if (!dateString) return '—';
   try {
      return new Date(dateString).toLocaleDateString('en-US', {
         month: 'short',
         day: 'numeric',
         year: 'numeric'
      });
   } catch {
      return '—';
   }
};

const COWActivityCard = ({
   activity,
   onView,
   onEdit,
   onDelete,
   users = [],
}) => {
   const [isHovered, setIsHovered] = useState(false);

   // Helper function to format location
   const formatLocation = (location, fullAddress = '') => {
      if (!location || location === 'Not specified') {
         return (
            <div className="flex items-center gap-1.5 text-gray-500">
               <Pin className="w-3.5 h-3.5 opacity-60" />
               <span>Not specified</span>
            </div>
         );
      }

      return (
         <Tooltip>
            <TooltipTrigger asChild>
               <div className="flex items-center gap-1.5 group cursor-help">
                  <MapPin className="w-3.5 h-3.5 text-sky-600" />
                  <span className="truncate font-medium">{location}</span>
               </div>
            </TooltipTrigger>
            <TooltipContent>
               {fullAddress || location}
            </TooltipContent>
         </Tooltip>
      );
   };

   const formatWorkStatus = (site, workType) => {
      if (!site || !workType) return 'not-started';
      const work = site[`${workType}Work`];
      return work?.status || 'not-started';
   };

   const getWorkStatusColor = (status) => {
      const colors = {
         'not-started': 'bg-gray-100 text-gray-600',
         'in-progress': 'bg-amber-100 text-amber-700',
         completed: 'bg-emerald-100 text-emerald-700',
      };
      return colors[status] || 'bg-gray-100 text-gray-600';
   };

   const sourceLocation = activity.sourceLocation || 'Not specified';
   const destinationLocation = activity.destinationLocation || 'Not specified';
   const progress = activity.progress || 0;
   const plannedStartDate = formatDate(activity.plannedStartDate);
   const assignedCount = activity.teamMembers?.length || 0;

   const getWorkTypes = () => {
      const allTypes = [...(activity.sourceWorkTypes || []), ...(activity.destinationWorkTypes || [])];
      const uniqueTypes = [...new Set(allTypes)];

      return uniqueTypes.map(type => ({
         type,
         label: type.charAt(0).toUpperCase() + type.slice(1),
         Icon: getWorkTypeIcon(type),
         // Get status from either source or destination
         sourceStatus: activity.sourceSite ? formatWorkStatus(activity.sourceSite, type) : null,
         destinationStatus: activity.destinationSite ? formatWorkStatus(activity.destinationSite, type) : null
      }));
   };

   const allWorkTypes = getWorkTypes();
   const hasSource = activity.sourceSite;
   const hasDestination = activity.destinationSite;

   return (
      <TooltipProvider>
         <div
            className="group relative bg-white rounded-xl border border-gray-200 hover:border-sky-300 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden hover:-translate-y-0.5"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => onView && onView(activity._id)}
         >
            {/* Gradient accent border on hover */}
            <div className={`absolute inset-0 bg-linear-to-r from-sky-500/0 via-sky-400/0 to-blue-500/0 transition-all duration-500 group-hover:from-sky-500/5 group-hover:via-sky-400/5 group-hover:to-blue-500/5`} />

            <div className="relative p-5">
               {/* Header with badges and actions */}
               <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                     <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className={`${getPurposeColor(activity.purpose)} px-2.5 py-0.5 text-xs font-medium`}>
                           {activity.purpose.replace('-', ' ')}
                        </Badge>
                        <Badge variant="outline" className={`${getStatusColor(activity.overallStatus)} px-2.5 py-0.5 text-xs font-medium`}>
                           {activity.overallStatus}
                        </Badge>
                     </div>
                     <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-gray-500 shrink-0" />
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-sky-600 transition-colors truncate">
                           {activity.activityName}
                        </h3>
                     </div>
                     {activity.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{activity.description}</p>
                     )}
                  </div>

                  <div onClick={(e) => e.stopPropagation()}>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <Button variant="ghost" size="icon" className={`h-8 w-8 rounded-full transition-all ${isHovered ? 'bg-gray-100 opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>
                              <MoreVertical className="w-4 h-4" />
                           </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                           <DropdownMenuItem onClick={() => onView && onView(activity._id)} className="cursor-pointer">
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                           </DropdownMenuItem>
                           <DropdownMenuItem onClick={() => onEdit && onEdit(activity._id)} className="cursor-pointer">
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Activity
                           </DropdownMenuItem>
                           <DropdownMenuSeparator />
                           <DropdownMenuItem
                              onClick={() => onDelete && onDelete(activity._id)}
                              className="text-red-600 cursor-pointer focus:text-red-600"
                           >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Activity
                           </DropdownMenuItem>
                        </DropdownMenuContent>
                     </DropdownMenu>
                  </div>
               </div>

               {/* Route Section - Improved Design */}
               <div className="mb-5">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                     <Navigation className="w-4 h-4 shrink-0" />
                     <span className="font-medium">Route</span>
                  </div>
                  <div className="relative bg-linear-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                     <div className="flex items-center">
                        {/* Source */}
                        <div className="flex-1">
                           <div className="flex flex-col items-center">
                              <div className="w-8 h-8 rounded-full bg-sky-100 border-2 border-sky-200 flex items-center justify-center mb-2">
                                 <Building className="w-3.5 h-3.5 text-sky-600" />
                              </div>
                              <div className="text-xs text-gray-500 font-medium mb-1">Source</div>
                              <div className="text-sm font-medium text-gray-800 truncate max-w-full px-2">
                                 {formatLocation(sourceLocation, activity.sourceFullAddress)}
                              </div>
                           </div>
                        </div>

                        {/* Arrow */}
                        <div className="px-4">
                           <div className="w-8 h-0.5 bg-linear-to-r from-sky-300 to-blue-300"></div>
                           <ChevronRight className="w-4 h-4 text-sky-500 mx-auto -mt-3" />
                        </div>

                        {/* Destination */}
                        <div className="flex-1">
                           <div className="flex flex-col items-center">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 border-2 border-emerald-200 flex items-center justify-center mb-2">
                                 <Globe className="w-3.5 h-3.5 text-emerald-600" />
                              </div>
                              <div className="text-xs text-gray-500 font-medium mb-1">Destination</div>
                              <div className="text-sm font-medium text-gray-800 truncate max-w-full px-2">
                                 {formatLocation(destinationLocation, activity.destinationFullAddress)}
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* Progress bar below route */}
                     {progress > 0 && (
                        <div className="mt-4 pt-3 border-t border-gray-100">
                           <div className="flex justify-between text-xs mb-1.5">
                              <span className="text-gray-600">Progress</span>
                              <span className="font-semibold text-sky-600">{progress}%</span>
                           </div>
                           <Progress value={progress} className="h-2" />
                        </div>
                     )}
                  </div>
               </div>

               {/* Work Types Section */}
               {allWorkTypes.length > 0 && (
                  <div className="mb-4">
                     <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <ClipboardCheck className="w-4 h-4 shrink-0" />
                        <span className="font-medium">Work Types</span>
                     </div>
                     <div className="flex flex-wrap gap-2">
                        {allWorkTypes.slice(0, 4).map(({ type, label, Icon, sourceStatus, destinationStatus }) => (
                           <Tooltip key={type}>
                              <TooltipTrigger asChild>
                                 <Badge
                                    variant="secondary"
                                    className="gap-1.5 px-3 py-1.5 hover:bg-gray-100 transition-colors"
                                 >
                                    <Icon className="w-3.5 h-3.5" />
                                    <span>{label}</span>
                                    {(sourceStatus === 'completed' || destinationStatus === 'completed') && (
                                       <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    )}
                                 </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                 <div className="space-y-1">
                                    <div className="font-medium">{label}</div>
                                    {hasSource && sourceStatus && (
                                       <div className="flex items-center justify-between">
                                          <span>Source:</span>
                                          <Badge className={`ml-2 ${getWorkStatusColor(sourceStatus)}`}>
                                             {sourceStatus}
                                          </Badge>
                                       </div>
                                    )}
                                    {hasDestination && destinationStatus && (
                                       <div className="flex items-center justify-between">
                                          <span>Destination:</span>
                                          <Badge className={`ml-2 ${getWorkStatusColor(destinationStatus)}`}>
                                             {destinationStatus}
                                          </Badge>
                                       </div>
                                    )}
                                 </div>
                              </TooltipContent>
                           </Tooltip>
                        ))}
                        {allWorkTypes.length > 4 && (
                           <Badge variant="outline" className="px-3 py-1.5">
                              +{allWorkTypes.length - 4} more
                           </Badge>
                        )}
                     </div>
                  </div>
               )}

               {/* Team Members */}
               {assignedCount > 0 && (
                  <div className="mb-4">
                     <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Users className="w-4 h-4 shrink-0" />
                        <span className="font-medium">Team</span>
                        <Badge variant="outline" className="ml-1 bg-sky-50 text-sky-700 border-sky-200">
                           {assignedCount}
                        </Badge>
                     </div>
                     <div className="bg-linear-to-r from-sky-50 to-blue-50 rounded-lg p-3 border border-sky-100">
                        <div className="flex items-center gap-2">
                           <div className="flex -space-x-2">
                              {[...Array(Math.min(3, assignedCount))].map((_, i) => (
                                 <div
                                    key={i}
                                    className="w-6 h-6 rounded-full bg-sky-500 border-2 border-white flex items-center justify-center text-xs font-medium text-white"
                                 >
                                    {String.fromCharCode(65 + i)}
                                 </div>
                              ))}
                           </div>
                           <p className="text-sm text-sky-800">
                              {assignedCount} team member{assignedCount !== 1 ? 's' : ''} assigned
                           </p>
                        </div>
                     </div>
                  </div>
               )}

               {/* Footer */}
               <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                     <Calendar className="w-4 h-4" />
                     <span>Starts {plannedStartDate}</span>
                  </div>
                  <Button
                     variant="ghost"
                     size="sm"
                     className="group-hover:text-sky-600 group-hover:bg-sky-50"
                     onClick={(e) => {
                        e.stopPropagation();
                        onView && onView(activity._id);
                     }}
                  >
                     Details
                     <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
               </div>
            </div>

            {/* Hover effect indicator */}
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-sky-500 to-blue-500 transform transition-transform duration-300 ${isHovered ? 'translate-y-0' : 'translate-y-full'}`} />
         </div>
      </TooltipProvider>
   );
};

export default COWActivityCard;