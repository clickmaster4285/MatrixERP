// components/shared-components/project/project-details/ActivityCard.jsx
'use client';

import {
   CheckCircle,
   Clock,
   AlertCircle,
   User,
   MapPin,
   Calendar,
   FileText,
   Building,
   Hammer,
   Truck,
   Move
} from 'lucide-react';
import { format } from 'date-fns';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const ActivityCard = ({ activity, showSiteInfo = true }) => {
   const getActivityIcon = (type) => {
      switch (type) {
         case 'dismantling':
            return <Hammer className="h-4 w-4 text-amber-500" />;
         case 'cow':
            return <Truck className="h-4 w-4 text-sky-500" />;
         case 'relocation':
            return <Move className="h-4 w-4 text-purple-500" />;
         default:
            return <AlertCircle className="h-4 w-4 text-slate-400" />;
      }
   };

   const getStatusIcon = (status) => {
      switch (status) {
         case 'completed':
            return <CheckCircle className="h-4 w-4 text-green-500" />;
         case 'in-progress':
            return <Clock className="h-4 w-4 text-sky-500" />;
         case 'planned':
            return <Clock className="h-4 w-4 text-amber-500" />;
         default:
            return <AlertCircle className="h-4 w-4 text-slate-400" />;
      }
   };

   const getStatusColor = (status) => {
      switch (status) {
         case 'completed':
            return 'bg-green-100 text-green-700 border-green-200';
         case 'in-progress':
            return 'bg-sky-100 text-sky-700 border-sky-200';
         case 'planned':
            return 'bg-amber-100 text-amber-700 border-amber-200';
         case 'pending':
            return 'bg-slate-100 text-slate-700 border-slate-200';
         case 'draft':
            return 'bg-gray-100 text-gray-700 border-gray-200';
         case 'not-started':
            return 'bg-gray-100 text-gray-700 border-gray-200';
         default:
            return 'bg-slate-100 text-slate-700 border-slate-200';
      }
   };

   const getActivityTitle = () => {
      if (activity.activityType?.type === 'dismantling') {
         return activity.dismantlingType || 'Dismantling Activity';
      } else if (activity.activityType?.type === 'cow') {
         return activity.activityName || 'COW Activity';
      } else if (activity.activityType?.type === 'relocation') {
         return `Relocation - ${activity.relocationType || 'B2S'}`;
      }
      return activity.activityType?.name || 'Activity';
   };

   const status = activity.status || activity.overallStatus || 'pending';

   return (
      <Card className="hover:shadow-sm transition-shadow">
         <CardContent className="p-4">
            <div className="space-y-3">
               {/* Header */}
               <div className="flex items-start justify-between">
                  <div className="space-y-1">
                     <div className="flex items-center gap-2">
                        {getActivityIcon(activity.activityType?.type)}
                        <h4 className="font-medium text-slate-900">
                           {getActivityTitle()}
                        </h4>
                        <Badge className={`text-xs ${getStatusColor(status)}`}>
                           {status?.charAt(0).toUpperCase() + status?.slice(1)}
                        </Badge>
                     </div>
                     {activity.notes && (
                        <p className="text-sm text-slate-600 line-clamp-2">{activity.notes}</p>
                     )}
                     {activity.description && (
                        <p className="text-sm text-slate-500 line-clamp-1">{activity.description}</p>
                     )}
                  </div>
               </div>

               {/* Details Grid */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  {showSiteInfo && activity.siteName && (
                     <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-slate-400" />
                        <span className="font-medium truncate">{activity.siteName}</span>
                     </div>
                  )}

                  {activity.assignment?.assignedTo?.[0]?.name && (
                     <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-400" />
                        <span className="truncate">{activity.assignment.assignedTo[0].name}</span>
                     </div>
                  )}

                  {activity.location?.address && (
                     <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        <span className="truncate">{activity.location.address}</span>
                     </div>
                  )}

                  {activity.createdAt && (
                     <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span>{format(new Date(activity.createdAt), 'MMM dd')}</span>
                     </div>
                  )}
               </div>

               {/* Additional Details based on activity type */}
               {activity.activityType?.type === 'dismantling' && activity.completionPercentage !== undefined && (
                  <div className="pt-2 border-t border-slate-100">
                     <div className="flex items-center gap-2 text-xs text-slate-600">
                        <span>Progress: {activity.completionPercentage}%</span>
                        {activity.timeline?.plannedStartDate && (
                           <>
                              <span className="text-slate-300">•</span>
                              <span>Planned: {format(new Date(activity.timeline.plannedStartDate), 'MMM dd')}</span>
                           </>
                        )}
                     </div>
                  </div>
               )}

               {activity.activityType?.type === 'cow' && (
                  <div className="pt-2 border-t border-slate-100">
                     <div className="flex items-center gap-2 text-xs text-slate-600">
                        {activity.plannedStartDate && (
                           <span>Start: {format(new Date(activity.plannedStartDate), 'MMM dd')}</span>
                        )}
                        {activity.plannedEndDate && (
                           <>
                              <span className="text-slate-300">•</span>
                              <span>End: {format(new Date(activity.plannedEndDate), 'MMM dd')}</span>
                           </>
                        )}
                     </div>
                  </div>
               )}
            </div>
         </CardContent>
      </Card>
   );
};

export default ActivityCard;