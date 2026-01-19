'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wrench } from 'lucide-react';
import { StatusBadge, MaterialsSection } from '../TaskDetailHelpers';
import { TaskAttachmentsCard } from '../TaskAttachmentCard';
import { useUploadTaskAttachments } from '@/features/taskApi';


export function DismantlingWorkSection({ task }) {
const { mutate: uploadAttachments } = useUploadTaskAttachments();
  return (
    <div className="space-y-4">
      {task.dismantling && (
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Dismantling Status</h4>
              <div className="flex flex-wrap items-center gap-4 mt-2">
                <StatusBadge status={task.dismantling?.status} />
                <span className="text-sm">
                  Can Start: {task.canStartDismantling ? 'Yes' : 'No'}
                </span>
                <span className="text-sm text-muted-foreground">
                  Prerequisite: {task.survey?.status || 'Survey required'}
                </span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Wrench className="h-4 w-4" />
              Update Progress
            </Button>
          </div>
        </div>
      )}

      <Card className="border shadow-sm">
       
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Dismantling Materials
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MaterialsSection
            materials={
              task.survey?.materials ||
              task?.allMaterialLists?.source_survey?.materials
            }
            type="survey"
            task={task}
          />
        </CardContent>
        <CardContent>
          <MaterialsSection
            materials={
              task.materialLists?.dismantlingMaterials?.materials ||
              task?.allMaterialLists?.source_dismantling?.materials
            }
            type="dismantling"
            task={task}
          />
        </CardContent>
        <CardContent>
          <TaskAttachmentsCard
            title="Dismantling Attachments"
            description="Upload dismantling photos and view existing attachments."
            attachments={task?.dismantling?.addAttachments || []}
            activityId={task?.parentActivityId}
            activityType="dismantling"
            attachmentTarget="dismantling"
            uploadFn={(id, formData) =>
              uploadAttachments({
                activityType: 'dismantling',
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
