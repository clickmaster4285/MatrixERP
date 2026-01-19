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

export function DismantlingAssignmentCard({
  activity,
  setActivity,
  users = [],
}) {
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
  // - assignActivityTasks.assignDismantlingTo[0] (if present)
  // - or fallback to dismantling.teamLeader
  const initialUserId =
    activity?.assignActivityTasks?.assignDismantlingTo?.[0] ||
    activity?.dismantling?.teamLeader ||
    '';

  const initialDueDate = activity?.assignActivityTasks?.dismantlingDueDate
    ? normalizeDate(activity.assignActivityTasks.dismantlingDueDate)
    : '';

  const [assignForm, setAssignForm] = useState({
    userId: initialUserId,
    dueDate: initialDueDate,
  });

  useEffect(() => {
    const updatedUserId =
      activity?.assignActivityTasks?.assignDismantlingTo?.[0] ||
      activity?.dismantling?.teamLeader ||
      '';

    const updatedDueDate = activity?.assignActivityTasks?.dismantlingDueDate
      ? normalizeDate(activity.assignActivityTasks.dismantlingDueDate)
      : '';

    setAssignForm({
      userId: updatedUserId,
      dueDate: updatedDueDate,
    });
  }, [
    activity?._id,
    activity?.assignActivityTasks?.assignDismantlingTo,
    activity?.assignActivityTasks?.dismantlingDueDate,
    activity?.dismantling?.teamLeader,
  ]);

  const handleSaveAssignment = async () => {
    if (!activity?._id) return;

    if (!assignForm.userId) {
      toast.error('Please select a team member');
      return;
    }

    if (!assignForm.dueDate) {
      toast.error('Please select a dismantling due date');
      return;
    }

    const selectedUser = users.find((u) => u._id === assignForm.userId);

    const now = new Date().toISOString();

    const payload = {
      // Who is responsible for dismantling
      dismantling: {
        ...(activity.dismantling || {}),
        teamLeader: assignForm.userId,
      },

      // Assignment block for dismantling work
      assignActivityTasks: {
        ...(activity.assignActivityTasks || {}),
        assignDismantlingTo: [assignForm.userId],
        assignedDismantlingDate: now,
        dismantlingDueDate: assignForm.dueDate,
        assignedBy: user?._id || activity.assignActivityTasks?.assignedBy,
      },

      notes:
        activity.notes ||
        `Dismantling assigned to ${selectedUser?.name || 'selected user'}.`,
    };

    try {
      const updated = await updateDismantling(activity._id, payload);
      const updatedActivity = updated?.data || updated;

      setActivity((prev) => ({
        ...prev,
        dismantling: updatedActivity?.dismantling || payload.dismantling,
        assignActivityTasks:
          updatedActivity?.assignActivityTasks || payload.assignActivityTasks,
        notes: updatedActivity?.notes || payload.notes,
      }));

      toast.success('Dismantling assignment saved');
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to save dismantling assignment';
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
            Dismantling Assignment
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Assign dismantling responsibility and set a due date.
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Assigned To */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Assigned To</Label>
            <Select
              value={assignForm.userId || ''}
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

          {/* Dismantling Due Date */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Dismantling Due Date
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
