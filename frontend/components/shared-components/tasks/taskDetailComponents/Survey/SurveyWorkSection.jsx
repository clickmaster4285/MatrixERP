// SurveyWorkSection.jsx
'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StatusBadge, MaterialsSection } from '../TaskDetailHelpers';
import { useUploadTaskAttachments } from '@/features/taskApi';
import { TaskAttachmentsCard } from '../TaskAttachmentCard';
import { Button } from '@/components/ui/button';
import { ClipboardList } from 'lucide-react';

export function SurveyWorkSection({ task, onAddSurvey }) {
  const { mutate: uploadAttachments } = useUploadTaskAttachments();

  const isDismantling = task.activityType === 'dismantling';
  const isRelocation = task.activityType === 'relocation';
  const isCOW = task.activityType === 'cow';

  // Get survey data based on activity type
  const getSurveyData = () => {
    if (isDismantling) {
      return {
        status: task.survey?.status,
        conductedBy: task.survey?.conductedBy || task.assignedBy || 'Not started',
        date: task.survey?.date ? new Date(task.survey.date).toLocaleDateString() : null,
        notes: task.survey?.report || task.survey?.notes,
        materials: task.survey?.materials || [],
        attachments: task?.survey?.addAttachments || []
      };
    } else if (isRelocation) {
      // Get materials from allMaterialLists for relocation
      const materialKey = `${task.siteType.toLowerCase()}_survey`;
      const materialsFromLists = task.allMaterialLists?.[materialKey]?.materials || [];

      return {
        status: task.workStatus || task.status,
        conductedBy: task.assignedBy || 'Survey team',
        date: null,
        notes: task.notes,
        materials: materialsFromLists.length > 0 ? materialsFromLists : (task.materials || []),
        attachments: task?.addAttachments || []
      };
    } else if (isCOW) {
      // COW survey data
      const workData = task.workData || {};

      // Try to get materials from allMaterialLists first
      const materialKey = `${task.siteType.toLowerCase()}_survey`;
      const materialsFromLists = task.allMaterialLists?.[materialKey]?.materials || [];

      return {
        status: workData.status || task.workStatus || task.status || 'not-started',
        conductedBy: task.assignedBy || 'Survey team',
        date: workData.startTime ? new Date(workData.startTime).toLocaleDateString() : null,
        notes: workData.notes || task.notes,
        materials: materialsFromLists.length > 0 ? materialsFromLists : (workData.materials || []),
        attachments: workData.attachments || []
      };
    }

    return {
      status: task.status || 'not-started',
      conductedBy: task.assignedBy || 'Not started',
      date: null,
      notes: task.notes,
      materials: [],
      attachments: []
    };
  };

  const surveyData = getSurveyData();
  const hasSurveyInfo = surveyData.status || surveyData.date || surveyData.notes || surveyData.materials.length > 0;

  // Get attachment target based on activity type
  const getAttachmentTarget = () => {
    if (isDismantling) return 'survey';

    if (isRelocation) {
      return `${task.siteType === 'destination' ? 'destinationSite' : 'sourceSite'}.surveyWork`;
    }

    if (isCOW) {
      return `${task.siteType === 'destination' ? 'destinationSite' : 'sourceSite'}.surveyWork`;
    }

    return 'survey';
  };

  return (
    <div className="space-y-4">
      {/* Survey Status / Summary */}
      {/* {hasSurveyInfo && (
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Survey Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Status</p>
                <StatusBadge status={surveyData.status} />
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Conducted By</p>
                <p className="font-medium">{surveyData.conductedBy}</p>
              </div>

              {surveyData.date && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{surveyData.date}</p>
                </div>
              )}
            </div>

          
            {surveyData.notes && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium text-muted-foreground mb-2">Notes</p>
                <p className="text-sm bg-slate-50 p-3 rounded-lg">{surveyData.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )} */}

      {/* Materials for survey */}
      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            Materials &amp; Equipment (Survey)
          </CardTitle>
          {(!surveyData.materials || surveyData.materials.length === 0) && (
            <Button
              onClick={() => {
                if (onAddSurvey) {
                  onAddSurvey();
                } else {
                }
              }}
              size="sm"
              className="gap-2"
            >
              <ClipboardList className="h-4 w-4" />
              {surveyData.status === 'completed' ? 'Update Survey' : 'Add Survey'}
            </Button>
          )}
        </CardHeader>

     

        <CardContent>
          <MaterialsSection
            materials={surveyData.materials}
            type="survey"
            onAddSurvey={onAddSurvey}
            task={task}
          />
        </CardContent>

        <CardContent>
          <TaskAttachmentsCard
            title="Survey Attachments"
            attachments={surveyData.attachments}
            activityId={task.parentActivityId}
            activityType={task.activityType}
            attachmentTarget={getAttachmentTarget()}
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