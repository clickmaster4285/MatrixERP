// components/shared-components/activities/dismantlingActivities/SurveyTabComponents/SurveyAssignmentCard.jsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Users } from 'lucide-react';
import { toast } from 'sonner';

import { useDismantlingManagement } from '@/hooks/useDismantlingManagement';
import { useAuth } from '@/hooks/useAuth';

export function SurveyAssignmentCard({ activity, setActivity, users = [] }) {
  const { updateDismantling, isUpdating } = useDismantlingManagement();
  const { user } = useAuth();

  // Ensure yyyy-mm-dd for the <input type="date" />
  function normalizeDate(value) {
    if (!value) return '';
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) {
        return typeof value === 'string' && value.length >= 10
          ? value.slice(0, 10)
          : '';
      }
      return d.toISOString().slice(0, 10);
    } catch {
      return '';
    }
  }

  // Prefill from existing activity:
  // - assignActivityTasks.assignSurveyTo[0] (if present)
  // - or fallback to survey.conductedBy
  // - surveyDueDate from assignActivityTasks.surveyDueDate
  const initialUserId =
    activity?.assignActivityTasks?.assignSurveyTo?.[0] ||
    activity?.survey?.conductedBy ||
    '';

  const initialDueDate = activity?.assignActivityTasks?.surveyDueDate
    ? normalizeDate(activity.assignActivityTasks.surveyDueDate)
    : '';

  const [assignForm, setAssignForm] = useState({
    userId: initialUserId,
    dueDate: initialDueDate,
  });

  useEffect(() => {
    const updatedUserId =
      activity?.assignActivityTasks?.assignSurveyTo?.[0] ||
      activity?.survey?.conductedBy ||
      '';

    const updatedDueDate = activity?.assignActivityTasks?.surveyDueDate
      ? normalizeDate(activity.assignActivityTasks.surveyDueDate)
      : '';

    setAssignForm({
      userId: updatedUserId,
      dueDate: updatedDueDate,
    });
  }, [
    activity?._id,
    activity?.assignActivityTasks?.assignSurveyTo,
    activity?.assignActivityTasks?.surveyDueDate,
    activity?.survey?.conductedBy,
  ]);

  const handleSaveAssignment = async () => {
    if (!activity?._id) return;

    if (!assignForm.userId) {
      toast.error('Please select a team member');
      return;
    }

    if (!assignForm.dueDate) {
      toast.error('Please select a survey due date');
      return;
    }

    const selectedUser = users.find((u) => u._id === assignForm.userId);

    const now = new Date().toISOString();

    const payload = {
      // Who is responsible for survey
      survey: {
        ...(activity.survey || {}),
        conductedBy: assignForm.userId,
      },

      // Assignment block for survey work
      assignActivityTasks: {
        ...(activity.assignActivityTasks || {}),
        assignSurveyTo: [assignForm.userId],
        assignedSurveyDate: now,
        surveyDueDate: assignForm.dueDate,
        assignedBy: user?._id || activity.assignActivityTasks?.assignedBy,
      },

      notes:
        activity.notes ||
        `Survey assigned to ${selectedUser?.name || 'selected user'}.`,
    };

    try {
      const updated = await updateDismantling(activity._id, payload);
      const updatedActivity = updated?.data || updated;

      setActivity((prev) => ({
        ...prev,
        survey: updatedActivity?.survey || payload.survey,
        assignActivityTasks:
          updatedActivity?.assignActivityTasks || payload.assignActivityTasks,
        notes: updatedActivity?.notes || payload.notes,
      }));

      toast.success('Survey assignment saved');
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to save survey assignment';
      toast.error(msg);
    }
  };

  // Show current user at top and label as "(You)"
  const sortedUsers = [...users].sort((a, b) => {
    if (user && a._id === user._id) return -1;
    if (user && b._id === user._id) return 1;
    return (a.name || '').localeCompare(b.name || '');
  });

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4" />
            Survey Assignment
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Assign survey responsibility and set a due date.
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Assigned To */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Assigned To</Label>
            <Select
              value={assignForm.userId || "enter" } 
              onValueChange={(value) =>
                setAssignForm((prev) => ({
                  ...prev,
                  userId: value,
                }))
              }
            >
              <SelectTrigger className="border-border">
                <SelectValue placeholder="Select member to assign" />
              </SelectTrigger>

              <SelectContent>
                {sortedUsers.map((u) => (
                  <SelectItem key={u._id} value={u._id}>
                    {u.name}
                    {user && u._id === user._id ? ' (You)' : ''}
                    {u.role ? ` — ${u.role}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Survey Due Date */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Survey Due Date
            </Label>
            <Input
              type="date"
              value={assignForm.dueDate || ''}
              onChange={(e) =>
                setAssignForm((prev) => ({
                  ...prev,
                  dueDate: e.target.value,
                }))
              }
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleSaveAssignment}
            disabled={isUpdating}
          >
            {isUpdating ? 'Saving...' : 'Save Assignment'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
