// components/shared-components/sites/detail/ActivityCard.jsx
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const ActivityCard = ({ activity, type, formatDate }) => {
   const getStatusColor = (status) => {
      switch (status?.toLowerCase()) {
         case 'completed':
            return 'bg-green-100 text-green-800';
         case 'in-progress':
            return 'bg-blue-100 text-blue-800';
         case 'pending':
            return 'bg-yellow-100 text-yellow-800';
         default:
            return 'bg-gray-100 text-gray-800';
      }
   };

   return (
      <Card className="overflow-hidden">
         <CardContent className="p-4">
            {type === 'dismantling' && (
               <>
                  <div className="flex justify-between items-start mb-2">
                     <div>
                        <h4 className="font-medium">{activity.dismantlingType} Dismantling</h4>
                        <p className="text-sm text-gray-600">
                           Location: {activity.location?.[0]?.city || 'N/A'}
                        </p>
                     </div>
                     <Badge className={getStatusColor(activity.status)}>
                        {activity.status}
                     </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                     <div>
                        <span className="text-gray-500">Progress:</span>
                        <div className="flex items-center gap-2">
                           <Progress value={activity.completionPercentage || 0} className="h-2" />
                           <span>{activity.completionPercentage || 0}%</span>
                        </div>
                     </div>
                     <div>
                        <span className="text-gray-500">Last Updated:</span>
                        <p>{formatDate(activity.updatedAt)}</p>
                     </div>
                  </div>
                  {activity.assignment?.assignedTo && (
                     <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-gray-600">
                           Assigned to: {activity.assignment.assignedTo.map(user => user.name).join(', ')}
                        </p>
                     </div>
                  )}
               </>
            )}

            {type === 'cow' && (
               <>
                  <div className="flex justify-between items-start mb-2">
                     <div>
                        <h4 className="font-medium">{activity.activityName}</h4>
                        <p className="text-sm text-gray-600">
                           Purpose: {activity.purpose}
                        </p>
                     </div>
                     <Badge className={getStatusColor(activity.overallStatus)}>
                        {activity.overallStatus}
                     </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                     <div>
                        <span className="text-gray-500">Planned Period:</span>
                        <p>
                           {formatDate(activity.plannedStartDate)} - {formatDate(activity.plannedEndDate)}
                        </p>
                     </div>
                     <div>
                        <span className="text-gray-500">Site Status:</span>
                        <p>
                           Source: {activity.sourceSite?.siteStatus || 'N/A'} |
                           Dest: {activity.destinationSite?.siteStatus || 'N/A'}
                        </p>
                     </div>
                  </div>
               </>
            )}

            {type === 'relocation' && (
               <>
                  <div className="flex justify-between items-start mb-2">
                     <div>
                        <h4 className="font-medium">{activity.relocationType} Relocation</h4>
                        <p className="text-sm text-gray-600">
                           Source: {activity.sourceSite?.address?.city || 'N/A'} →
                           Destination: {activity.destinationSite?.address?.city || 'N/A'}
                        </p>
                     </div>
                     <Badge className={getStatusColor(activity.overallStatus)}>
                        {activity.overallStatus}
                     </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                     <div>
                        <span className="text-gray-500">Source Status:</span>
                        <p>{activity.sourceSite?.siteStatus || 'N/A'}</p>
                     </div>
                     <div>
                        <span className="text-gray-500">Dest Status:</span>
                        <p>{activity.destinationSite?.siteStatus || 'N/A'}</p>
                     </div>
                  </div>
               </>
            )}
         </CardContent>
      </Card>
   );
};

export default ActivityCard;