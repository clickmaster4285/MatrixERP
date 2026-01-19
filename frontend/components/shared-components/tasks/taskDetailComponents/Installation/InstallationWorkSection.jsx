// InstallationWorkSection.jsx
'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StatusBadge } from '../TaskDetailHelpers';
import { TaskAttachmentsCard } from '../TaskAttachmentCard';
import { useUploadTaskAttachments } from '@/features/taskApi';
import { Wrench } from 'lucide-react';

export function InstallationWorkSection({ task }) {
   const { mutate: uploadAttachments } = useUploadTaskAttachments();

   const installationWork = task.workData || {};

   return (
      <div className="space-y-4">
         {/* Installation Status */}
         <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
               <div>
                  <h4 className="font-medium flex items-center gap-2">
                     <Wrench className="h-4 w-4 text-green-600" />
                     Installation Status
                  </h4>
                  <div className="flex flex-wrap items-center gap-4 mt-2">
                     <StatusBadge status={installationWork.status || 'not-started'} />
                     {installationWork.startTime && (
                        <span className="text-sm">
                           Started: {new Date(installationWork.startTime).toLocaleDateString()}
                        </span>
                     )}
                     {installationWork.endTime && (
                        <span className="text-sm">
                           Completed: {new Date(installationWork.endTime).toLocaleDateString()}
                        </span>
                     )}
                  </div>
               </div>
            </div>
         </div>

         {/* Notes */}
         {installationWork.notes && (
            <Card className="border shadow-sm">
               <CardHeader>
                  <CardTitle className="text-lg font-semibold">Installation Notes</CardTitle>
               </CardHeader>
               <CardContent>
                  <p className="text-sm">{installationWork.notes}</p>
               </CardContent>
            </Card>
         )}

         {/* Attachments */}
         <Card className="border shadow-sm">
            <CardHeader>
               <CardTitle className="text-lg font-semibold">Installation Attachments</CardTitle>
            </CardHeader>
            <CardContent>
               <TaskAttachmentsCard
                  title="Installation Documentation"
                  attachments={installationWork.attachments || []}
                  activityId={task.parentActivityId}
                  activityType={task.activityType}
                  attachmentTarget={`${task.siteType === 'destination' ? 'destinationSite' : 'sourceSite'}.installationWork`}
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