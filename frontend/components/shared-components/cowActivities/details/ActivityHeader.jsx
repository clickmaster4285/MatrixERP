'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
   ArrowLeft,
   Edit,
   Trash2,
   Calendar,
   Users,
   MapPin,
   TowerControl,
   FileText,
   Printer,
   Share2,
   Download
} from 'lucide-react';
import { formatDate } from '../form-components/utils/formatter';

export const ActivityHeader = ({
   activity,
   onBack,
   onEdit,
   onDelete,
   getStatusColor
}) => {
   return (
      <div className="bg-linear-to-r from-sky-50 to-indigo-50 border-b">
         <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
               <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                     <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Activities
                     </Button>
                     <Badge className={getStatusColor(activity.overallStatus)}>
                        {activity.overallStatus}
                     </Badge>
                  </div>

                  <div className="flex items-start gap-4">
                     <div className="p-3 bg-white rounded-xl shadow-sm">
                        <TowerControl className="h-8 w-8 text-sky-600" />
                     </div>
                     <div className="flex-1">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                           {activity.activityName}
                        </h1>
                        <p className="text-gray-600 mb-4">
                           {activity.description || 'No description provided'}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                           <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>
                                 {activity.plannedStartDate ? formatDate(activity.plannedStartDate) : 'No start date'}
                                 {activity.plannedEndDate && ` → ${formatDate(activity.plannedEndDate)}`}
                              </span>
                           </div>
                           <Separator orientation="vertical" className="h-4" />
                           <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              <span>{activity.teamMembers?.length || 0} team members</span>
                           </div>
                           <Separator orientation="vertical" className="h-4" />
                           <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>{activity.purpose?.replace('-', ' ') || 'Unknown purpose'}</span>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex gap-2">
                     <Button variant="outline" size="sm" onClick={onEdit} className="gap-2">
                        <Edit className="h-4 w-4" />
                        Edit
                     </Button>
                     <Button variant="destructive" size="sm" onClick={onDelete} className="gap-2">
                        <Trash2 className="h-4 w-4" />
                        Delete
                     </Button>
                  </div>
               </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
               <div className="bg-white p-4 rounded-lg border shadow-sm">
                  <div className="text-sm text-gray-600">Site</div>
                  <div className="font-semibold mt-1">
                     {activity.siteId?.name || activity.siteId?.siteId || 'Unknown Site'}
                  </div>
               </div>
               <div className="bg-white p-4 rounded-lg border shadow-sm">
                  <div className="text-sm text-gray-600">Created By</div>
                  <div className="font-semibold mt-1">
                     {activity.createdBy?.name || 'Unknown'}
                  </div>
               </div>
               <div className="bg-white p-4 rounded-lg border shadow-sm">
                  <div className="text-sm text-gray-600">Last Updated</div>
                  <div className="font-semibold mt-1">
                     {activity.updatedAt ? formatDate(activity.updatedAt) : 'Never'}
                  </div>
               </div>
               <div className="bg-white p-4 rounded-lg border shadow-sm">
                  <div className="text-sm text-gray-600">Progress</div>
                  <div className="font-semibold mt-1">
                     {activity.progress || 0}%
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};