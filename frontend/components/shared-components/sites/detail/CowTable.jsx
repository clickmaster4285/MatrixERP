// components/shared-components/sites/detail/CowTable.jsx
'use client';

import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wrench, Plus } from 'lucide-react';

const CowTable = ({ activities, formatDate, onAddNew }) => {
   if (activities.length === 0) {
      return (
         <div className="text-center py-12">
            <Wrench className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
               No COW Activities
            </h3>
            <p className="text-gray-600 mb-4">
               This site doesn't have any COW activities yet.
            </p>
            {onAddNew && (
               <Button
                  variant="outline"
                  onClick={onAddNew}
                  className="gap-2"
               >
                  <Plus className="h-4 w-4" />
                  Create COW Activity
               </Button>
            )}
         </div>
      );
   }

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
      <div>
         <div className="flex justify-end mb-4">
            {onAddNew && (
               <Button
                  size="sm"
                  variant="outline"
                  onClick={onAddNew}
                  className="gap-2"
               >
                  <Plus className="h-3 w-3" />
                  Add COW Activity
               </Button>
            )}
         </div>
         <div className="overflow-x-auto">
            <Table>
               <TableHeader>
                  <TableRow>
                     <TableHead>Activity Name</TableHead>
                     <TableHead>Purpose</TableHead>
                     <TableHead>Period</TableHead>
                     <TableHead>Source Status</TableHead>
                     <TableHead>Dest Status</TableHead>
                     <TableHead>Overall Status</TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {activities.map((activity) => (
                     <TableRow key={activity._id}>
                        <TableCell className="font-medium">
                           {activity.activityName}
                        </TableCell>
                        <TableCell>{activity.purpose}</TableCell>
                        <TableCell>
                           {formatDate(activity.plannedStartDate)} - {formatDate(activity.plannedEndDate)}
                        </TableCell>
                        <TableCell>
                           <Badge className={getStatusColor(activity.sourceSite?.siteStatus)}>
                              {activity.sourceSite?.siteStatus || 'N/A'}
                           </Badge>
                        </TableCell>
                        <TableCell>
                           <Badge className={getStatusColor(activity.destinationSite?.siteStatus)}>
                              {activity.destinationSite?.siteStatus || 'N/A'}
                           </Badge>
                        </TableCell>
                        <TableCell>
                           <Badge className={getStatusColor(activity.overallStatus)}>
                              {activity.overallStatus}
                           </Badge>
                        </TableCell>
                     </TableRow>
                  ))}
               </TableBody>
            </Table>
         </div>
      </div>
   );
};

export default CowTable;