'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ClipboardCheck, CheckCircle2 } from 'lucide-react';

import { useDismantlingManagement } from '@/hooks/useDismantlingManagement';
import { SurveyAttachmentsCard } from '../tabComponents/SurveyTabComponents/SurveyAttachmentsCard';
import { SurveyMaterialsDialog } from '../tabComponents/SurveyTabComponents/SurveyMaterialsDialog';
import { SurveyAssignmentCard } from '../tabComponents/SurveyTabComponents/SurveyAssignmentCard.jsx.jsx';




export function SurveyTab({
  canViewSurvey,
  activity,
  setActivity,
  users,
  findUserById,
}) {
  const [surveyDialogOpen, setSurveyDialogOpen] = useState(false);
  const { updateDismantling, isUpdating } = useDismantlingManagement();

  const survey = activity?.survey || {};
  const materials = Array.isArray(survey.materials) ? survey.materials : [];

  const isInProgress = survey.status === 'in-progress';
  const isDismantlingCompleted = activity?.dismantling?.status === 'completed';

  const formatDate = (value, fallback = 'Not set') => {
    if (!value) return fallback;
    try {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return typeof value === 'string' && value.includes('T')
          ? value.slice(0, 10)
          : value;
      }
      return date.toISOString().slice(0, 10);
    } catch {
      return fallback;
    }
  };

  const handleSurveySave = async (formValues) => {
    if (!activity?._id) return;

    if (isDismantlingCompleted) {
      toast.error(
        'Survey cannot be modified because dismantling is completed.'
      );
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const surveyDate = formValues.surveyDate || today;

    const status = formValues.status || 'in-progress';

    const materials = Array.isArray(formValues.materials)
      ? formValues.materials
      : [];

    const payload = {
      survey: {
        surveyDate,
        materials,
        report: formValues.report?.trim() || 'Survey updated.',
        status,
      },
      timeline: {
        ...(activity.timeline || {}),
        ...(status === 'completed' ? { surveyCompletionDate: surveyDate } : {}),
      },
      notes: activity.notes || '',
    };

    try {
      await updateDismantling(activity._id, payload);

      setActivity((prev) => ({
        ...prev,
        survey: payload.survey,
        timeline: payload.timeline,
        notes: payload.notes,
      }));

      toast.success('Survey saved successfully');
      setSurveyDialogOpen(false);
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || 'Failed to save survey';
      toast.error(msg);
    }
  };

  const handleMarkCompleted = async () => {
    if (!activity?._id) return;

    if (isDismantlingCompleted) {
      toast.error(
        'Survey cannot be modified because dismantling is completed.'
      );
      return;
    }

    const prevSurvey = activity.survey || {};
    const materials = Array.isArray(prevSurvey.materials)
      ? prevSurvey.materials
      : [];

    const today = new Date().toISOString().slice(0, 10);
    const surveyDate = prevSurvey.surveyDate || today;

    const payload = {
      survey: {
        surveyDate,
        materials,
        report: prevSurvey.report || 'Survey marked as completed.',
        status: 'completed',
      },
      timeline: {
        ...(activity.timeline || {}),
        surveyCompletionDate: surveyDate,
      },
      notes: activity.notes || 'Survey marked as completed from Survey tab.',
    };

    try {
      await updateDismantling(activity._id, payload);

      setActivity((prev) => [
        // OOPS, bug - correction below
      ]);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to mark survey as completed';
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-6">
      <SurveyMaterialsDialog
        open={surveyDialogOpen}
        onOpenChange={(open) => {
          if (isDismantlingCompleted) {
            toast.error(
              'Survey cannot be modified because dismantling is completed.'
            );
            return;
          }
          setSurveyDialogOpen(open);
        }}
        initialSurvey={survey}
        onSave={handleSurveySave}
        isSaving={isUpdating}
      />

      {/* Layout: left col (details + attachments), right col (materials) */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* LEFT COLUMN */}
        <div className="w-full lg:w-1/2 space-y-4">
          {/* NEW: SURVEY ASSIGNMENT CARD */}
          {canViewSurvey && (
            <SurveyAssignmentCard
              activity={activity}
              setActivity={setActivity}
              users={users}
            />
          )}

          {/* SURVEY SUMMARY CARD */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4" />
                  Survey Details
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Survey date, status and report for this dismantling activity.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {survey?.status && (
                  <Badge
                    variant={
                      survey.status === 'completed'
                        ? 'completed'
                        : survey.status === 'in-progress'
                        ? 'inProgress'
                        : 'pending'
                    }
                    className="text-xs"
                  >
                    Status: {survey.status}
                  </Badge>
                )}

                {isInProgress && !isDismantlingCompleted && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleMarkCompleted}
                    disabled={isUpdating}
                    className="gap-1"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {isUpdating ? 'Updating...' : 'Mark as Completed'}
                  </Button>
                )}

                {/* {!isDismantlingCompleted && (
                  <Button
                    size="sm"
                    onClick={() => setSurveyDialogOpen(true)}
                    disabled={isUpdating}
                  >
                    {survey?.status === 'pending'
                      ? 'Add Survey'
                      : 'Edit Survey'}
                  </Button>
                )} */}
              </div>
            </CardHeader>

            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                    Survey Date
                  </p>
                  <p className="mt-1">
                    {survey?.surveyDate
                      ? formatDate(survey.surveyDate)
                      : 'Not set'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                    Status
                  </p>
                  <p className="mt-1 capitalize">
                    {survey?.status ? survey.status : 'in-progress (default)'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                    Total Materials
                  </p>
                  <p className="mt-1">{materials.length}</p>
                </div>
              </div>

              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                  Survey Report
                </p>
                <p className="mt-1 text-sm whitespace-pre-wrap">
                  {survey?.report || 'No report added yet.'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* ATTACHMENTS CARD UNDER DETAILS */}
          <SurveyAttachmentsCard
            activity={activity}
            setActivity={setActivity}
          />
        </div>

        {/* RIGHT COLUMN: MATERIALS LIST CARD */}
        <Card className="w-full lg:w-1/2">
          <CardHeader>
            <CardTitle className="text-base">
              Survey Materials ({materials.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {materials.length > 0 ? (
              materials.map((m) => (
                <div
                  key={m.materialId}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-2 border border-border rounded-md px-3 py-2 text-sm"
                >
                  <div>
                    <div className="font-medium">{m.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Qty: {m.quantity} · Condition: {m.condition} · Est. Value:
                      PKR {m.estimatedValue}
                    </div>
                    {m.notes ? (
                      <div className="text-xs mt-1">Notes: {m.notes}</div>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={m.canBeReused ? 'default' : 'destructive'}>
                      {m.canBeReused ? 'Reusable' : 'Scrap'}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">
                No materials added yet. Use &quot;Add Survey&quot; to add survey
                materials.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
