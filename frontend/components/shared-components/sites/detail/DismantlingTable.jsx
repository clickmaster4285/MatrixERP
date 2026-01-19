// components/shared-components/sites/detail/DismantlingTable.jsx
'use client';

import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { HardHat } from 'lucide-react';

const DismantlingTable = ({ activities, formatDate }) => {
   if (activities.length === 0) {
      return (
         <div className="text-center py-12">
            <HardHat className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
               No Dismantling Activities
            </h3>
            <p className="text-gray-600">
               This site doesn't have any dismantling activities yet.
            </p>
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
      <div className="overflow-x-auto">
         <Table>
            <TableHeader>
               <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
               </TableRow>
            </TableHeader>
            <TableBody>
               {activities.map((activity) => (
                  <TableRow key={activity._id}>
                     <TableCell className="font-medium">
                        {activity.dismantlingType}
                     </TableCell>
                     <TableCell>
                        {activity.location?.[0]?.city || 'N/A'}
                     </TableCell>
                     <TableCell>
                        {activity.assignment?.assignedTo
                           ?.map(user => user.name)
                           .join(', ') || 'Unassigned'}
                     </TableCell>
                     <TableCell>
                        <div className="flex items-center gap-2">
                           <Progress value={activity.completionPercentage || 0} className="h-2 w-24" />
                           <span>{activity.completionPercentage || 0}%</span>
                        </div>
                     </TableCell>
                     <TableCell>
                        <Badge className={getStatusColor(activity.status)}>
                           {activity.status}
                        </Badge>
                     </TableCell>
                     <TableCell>
                        {formatDate(activity.updatedAt)}
                     </TableCell>
                  </TableRow>
               ))}
            </TableBody>
         </Table>
      </div>
   );
};

export default DismantlingTable;