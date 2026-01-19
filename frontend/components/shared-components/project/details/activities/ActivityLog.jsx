// components/shared-components/project/project-details/ActivityLog.jsx
'use client';

import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const ActivityLog = ({ activities = [] }) => {
   if (activities.length === 0) {
      return (
         <div className="text-center py-8">
            <Clock className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h4 className="font-medium text-slate-700 mb-2">No Activities Yet</h4>
            <p className="text-slate-500">Activities will appear here once added to the project.</p>
         </div>
      );
   }

   const getStatusIcon = (status) => {
      switch (status) {
         case 'completed':
            return <CheckCircle className="h-4 w-4 text-green-500" />;
         case 'in-progress':
            return <Clock className="h-4 w-4 text-sky-500" />;
         default:
            return <AlertCircle className="h-4 w-4 text-amber-500" />;
      }
   };

   const getStatusColor = (status) => {
      switch (status) {
         case 'completed':
            return 'bg-green-100 text-green-700 border-green-200';
         case 'in-progress':
            return 'bg-sky-100 text-sky-700 border-sky-200';
         default:
            return 'bg-amber-100 text-amber-700 border-amber-200';
      }
   };

   return (
      <div className="space-y-4">
         <div className="space-y-3">
            {activities.map((activity, index) => (
               <div key={activity._id || index} className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                     <div className="flex items-center gap-3">
                        {getStatusIcon(activity.status)}
                        <h4 className="font-medium text-slate-900">{activity.title}</h4>
                     </div>
                     <Badge className={`text-xs ${getStatusColor(activity.status)}`}>
                        {activity.status}
                     </Badge>
                  </div>
                  <p className="text-slate-600 text-sm mb-3">{activity.description}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                     <span>Assigned to: {activity.assignedTo || 'Unassigned'}</span>
                     <span>
                        {activity.dueDate ? `Due: ${format(new Date(activity.dueDate), 'MMM dd')}` : 'No due date'}
                     </span>
                  </div>
               </div>
            ))}
         </div>
      </div>
   );
};

export default ActivityLog;