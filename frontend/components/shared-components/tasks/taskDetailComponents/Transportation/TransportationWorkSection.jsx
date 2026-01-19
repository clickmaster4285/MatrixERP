// components/shared-components/tasks/taskDetailComponents/Transportation/TransportationWorkSection.jsx
'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StatusBadge } from '../TaskDetailHelpers';
import { TaskAttachmentsCard } from '../TaskAttachmentCard';
import { useUploadTaskAttachments } from '@/features/taskApi';
import { Truck, User, Phone } from 'lucide-react';

export function TransportationWorkSection({ task }) {
   const { mutate: uploadAttachments } = useUploadTaskAttachments();

   const transportationWork = task.workData || {};

   return (
      <div className="space-y-4">
         {/* Transportation Status */}
         <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
               <div>
                  <h4 className="font-medium flex items-center gap-2">
                     <Truck className="h-4 w-4 text-blue-600" />
                     Transportation Status
                  </h4>
                  <div className="flex flex-wrap items-center gap-4 mt-2">
                     <StatusBadge status={transportationWork.status || 'not-started'} />
                     {transportationWork.startTime && (
                        <span className="text-sm">
                           Loading: {new Date(transportationWork.startTime).toLocaleString()}
                        </span>
                     )}
                     {transportationWork.endTime && (
                        <span className="text-sm">
                           Delivered: {new Date(transportationWork.endTime).toLocaleString()}
                        </span>
                     )}
                  </div>
               </div>
            </div>
         </div>

         {/* Vehicle & Driver Info */}
         {(transportationWork.vehicleNumber || transportationWork.driverName || transportationWork.driverContact) && (
            <Card className="border shadow-sm">
               <CardHeader>
                  <CardTitle className="text-lg font-semibold">Transportation Details</CardTitle>
               </CardHeader>
               <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {transportationWork.vehicleNumber && (
                        <div className="space-y-3">
                           <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                 <Truck className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                 <p className="text-sm font-medium">Vehicle Details</p>
                                 <p className="text-lg font-semibold">{transportationWork.vehicleNumber}</p>
                              </div>
                           </div>
                        </div>
                     )}

                     {(transportationWork.driverName || transportationWork.driverContact) && (
                        <div className="space-y-3">
                           <div className="flex items-center gap-3">
                              <div className="p-2 bg-green-100 rounded-lg">
                                 <User className="h-5 w-5 text-green-600" />
                              </div>
                              <div>
                                 <p className="text-sm font-medium">Driver</p>
                                 {transportationWork.driverName && (
                                    <p className="text-lg font-semibold">{transportationWork.driverName}</p>
                                 )}
                                 {transportationWork.driverContact && (
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                       <Phone className="h-3 w-3" />
                                       {transportationWork.driverContact}
                                    </div>
                                 )}
                              </div>
                           </div>
                        </div>
                     )}
                  </div>
               </CardContent>
            </Card>
         )}

         {/* Notes */}
         {transportationWork.notes && (
            <Card className="border shadow-sm">
               <CardHeader>
                  <CardTitle className="text-lg font-semibold">Transportation Notes</CardTitle>
               </CardHeader>
               <CardContent>
                  <p className="text-sm">{transportationWork.notes}</p>
               </CardContent>
            </Card>
         )}

         {/* Attachments */}
         <Card className="border shadow-sm">
            <CardHeader>
               <CardTitle className="text-lg font-semibold">Transportation Attachments</CardTitle>
            </CardHeader>
            <CardContent>
               <TaskAttachmentsCard
                  title="Transportation Documentation"
                  attachments={transportationWork.attachments || []}
                  activityId={task.parentActivityId}
                  activityType={task.activityType}
                  attachmentTarget={`${task.siteType === 'destination' ? 'destinationSite' : 'sourceSite'}.transportationWork`}
                  uploadFn={(id, formData) =>
                     uploadAttachments({
                        activityType: task.activityType,
                        activityId: id,
                        formData,
                     })
                  }
               />
            </CardContent>
         </Card>
      </div>
   );
}