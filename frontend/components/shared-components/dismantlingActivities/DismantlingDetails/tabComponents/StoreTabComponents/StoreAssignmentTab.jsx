// components/dismantling/tabs/StoreAssignmentTab.jsx
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

export function StoreAssignmentTab({
  activity,
  setActivity,
  users = [], // pass from parent if needed
}) {
  const { updateDismantling, isUpdating } = useDismantlingManagement();
  const { user } = useAuth();

  // yyyy-mm-dd normalizer
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
  // - assignActivityTasks.assignStoreTo[0]
  // - storeDueDate (if you add it in backend)
  const initialUserId = activity?.assignActivityTasks?.assignStoreTo?.[0] || '';

  const initialDueDate = activity?.assignActivityTasks?.storeDueDate
    ? normalizeDate(activity.assignActivityTasks.storeDueDate)
    : '';

  const [assignForm, setAssignForm] = useState({
    userId: initialUserId,
    dueDate: initialDueDate,
  });

  useEffect(() => {
    const updatedUserId =
      activity?.assignActivityTasks?.assignStoreTo?.[0] || '';

    const updatedDueDate = activity?.assignActivityTasks?.storeDueDate
      ? normalizeDate(activity.assignActivityTasks.storeDueDate)
      : '';

    setAssignForm({
      userId: updatedUserId,
      dueDate: updatedDueDate,
    });
  }, [
    activity?._id,
    activity?.assignActivityTasks?.assignStoreTo,
    activity?.assignActivityTasks?.storeDueDate,
  ]);

  const handleSaveAssignment = async () => {
    if (!activity?._id) return;

    if (!assignForm.userId) {
      toast.error('Please select a team member');
      return;
    }

    if (!assignForm.dueDate) {
      toast.error('Please select a dispatch due date');
      return;
    }

    const selectedUser = users.find((u) => u._id === assignForm.userId);
    const now = new Date().toISOString();

    const payload = {
      // Assignment block for "store/dispatch" work
      assignActivityTasks: {
        ...(activity.assignActivityTasks || {}),
        assignStoreTo: [assignForm.userId],
        assignedStoreDate: now,
        storeDueDate: assignForm.dueDate, // you can add this field to schema
        assignedBy: user?._id || activity.assignActivityTasks?.assignedBy,
      },
      notes:
        activity.notes ||
        `Dispatch assigned to ${selectedUser?.name || 'selected user'}.`,
    };

    try {
      const updated = await updateDismantling(activity._id, payload);
      const updatedActivity = updated?.data || updated;

      setActivity((prev) => ({
        ...prev,
        assignActivityTasks:
          updatedActivity?.assignActivityTasks || payload.assignActivityTasks,
        notes: updatedActivity?.notes || payload.notes,
      }));

      toast.success('Dispatch assignment saved');
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to save dispatch assignment';
      toast.error(msg);
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
    if (user && a._id === user._id) return -1;
    if (user && b._id === user._id) return 1;
    return (a.name || '').localeCompare(b.name || '');
  });

  return (
    <Card className="w-full mb-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4" />
            Store Assignment
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Assign responsibility for store and set a due date.
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

          {/* Dispatch Due Date */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
               Due Date
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
