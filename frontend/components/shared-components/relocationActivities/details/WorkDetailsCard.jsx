import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
   ClipboardCheck,
   Package,
   Hammer,
   Wrench,
   Users,
   FileText,
   Box
} from 'lucide-react';
import { formatDate } from '@/components/shared-components/relocationActivities/form-components/utils/formatters';

const getWorkTypeIcon = (type) => {
   const icons = {
      survey: ClipboardCheck,
      dismantling: Package,
      storeOperator: Package,
      // store_operator: Package,  
      civil: Hammer,
      telecom: Wrench
   };
   return icons[type] || FileText;
};

const getWorkTypeLabel = (type) => {
   const labels = {
      survey: 'Survey',
      dismantling: 'Dismantling',
      storeOperator: 'Store/Operator',
      // store_operator: 'Store/Operator',
      civil: 'Civil',
      telecom: 'Telecom'
   };
   return labels[type] || type;
};

export const WorkDetailsCard = ({ site, siteLabel, siteType }) => {
   if (!site || site.siteRequired === false) return null;

   const workTypes = ['survey', 'dismantling', 'storeOperator', 'civil', 'telecom'];

   return (
      <Card>
         <CardHeader>
            <CardTitle className="text-lg">Work Details - {siteLabel}</CardTitle>
         </CardHeader>
         <CardContent className="space-y-6">
            {workTypes.map((workType) => {
               const workKey = `${workType}Work`;
               const work = site[workKey];
               if (!work) return null;

               const IconComponent = getWorkTypeIcon(workType);

               return (
                  <div key={workKey} className="border rounded-lg p-4 space-y-3">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <IconComponent className="w-5 h-5" />
                           <h4 className="font-medium">
                              {getWorkTypeLabel(workType)} Work
                           </h4>
                        </div>
                        <Badge className={
                           work.status === 'completed' ? 'bg-green-100 text-green-800' :
                              work.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                                 'bg-gray-100 text-gray-800'
                        }>
                           {work.status?.replace('-', ' ') || 'Not Started'}
                        </Badge>
                     </div>

                     {/* Assigned Users */}
                     {work.assignedUsers?.length > 0 && (
                        <div>
                           <div className="flex items-center gap-2 mb-2">
                              <Users className="w-4 h-4" />
                              <h5 className="text-sm font-medium text-gray-700">Assigned Team</h5>
                           </div>
                           <div className="flex flex-wrap gap-2">
                              {work.assignedUsers.map((user, index) => (
                                 <div key={index} className="bg-gray-50 px-3 py-1 rounded-md text-sm">
                                    <span className="font-medium">{user.userId?.name || user.name}</span>
                                    <span className="text-gray-500 ml-2">({user.userId?.role || user.role})</span>
                                    <span className="text-xs text-gray-400 ml-2">
                                       {user.assignedDate ? formatDate(user.assignedDate) : ''}
                                    </span>
                                 </div>
                              ))}
                           </div>
                        </div>
                     )}

                     {/* Materials */}
                     {work.materials?.length > 0 && (
                        <div>
                           <div className="flex items-center gap-2 mb-2">
                              <Box className="w-4 h-4" />
                              <h5 className="text-sm font-medium text-gray-700">Materials</h5>
                           </div>
                           <div className="space-y-2">
                              {work.materials.map((material, index) => (
                                 <div key={index} className="bg-sky-50 p-3 rounded-md">
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                       <div>
                                          <span className="font-medium">Name:</span> {material.name}
                                       </div>
                                       <div>
                                          <span className="font-medium">Code:</span> {material.materialCode}
                                       </div>
                                       <div>
                                          <span className="font-medium">Quantity:</span> {material.quantity} {material.unit}
                                       </div>
                                       <div>
                                          <span className="font-medium">Condition:</span>
                                          <Badge variant="outline" className="ml-2">
                                             {material.condition}
                                          </Badge>
                                       </div>
                                       <div>
                                          <span className="font-medium">Reusable:</span>
                                          {material.canBeReused ? ' Yes' : ' No'}
                                       </div>
                                       <div>
                                          <span className="font-medium">Added By:</span> {material.addedBy}
                                       </div>
                                    </div>
                                    {material.notes && (
                                       <p className="text-sm text-gray-600 mt-2">{material.notes}</p>
                                    )}
                                 </div>
                              ))}
                           </div>
                        </div>
                     )}

                     {/* Notes */}
                     {work.notes && (
                        <div>
                           <h5 className="text-sm font-medium text-gray-700 mb-1">Notes</h5>
                           <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded">{work.notes}</p>
                        </div>
                     )}

                     {/* Attachments */}
                     {work.addAttachments?.length > 0 && (
                        <div>
                           <h5 className="text-sm font-medium text-gray-700 mb-1">Attachments</h5>
                           <div className="flex flex-wrap gap-2">
                              {work.addAttachments.map((attachment, index) => (
                                 <Badge key={index} variant="outline">
                                    {attachment.name || `Attachment ${index + 1}`}
                                 </Badge>
                              ))}
                           </div>
                        </div>
                     )}

                     {/* Survey Specific */}
                     {workType === 'survey' && work.surveyType && (
                        <div>
                           <h5 className="text-sm font-medium text-gray-700 mb-1">Survey Type</h5>
                           <Badge>{work.surveyType}</Badge>
                        </div>
                     )}
                  </div>
               );
            })}
         </CardContent>
      </Card>
   );
};