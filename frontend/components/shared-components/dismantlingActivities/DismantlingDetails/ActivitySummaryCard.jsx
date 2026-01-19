// components/shared-components/activities/dismantlingActivities/DismantlingDetails/ActivitySummaryCard.jsx
'use client';

import { Users, Calendar } from 'lucide-react';

export function ActivitySummaryCard({ activity }) {
  return (
    <div className="bg-card rounded-xl border border-border/50 p-5 shadow-sm flex flex-col gap-4 ">
      {/* Assignment */}
      <div className="flex items-start gap-2 text-sm mb-5">
        <Users className="w-4 h-4 mt-0.5 text-primary" />

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            Assigned To
          </p>

          <p className="font-medium">
            {(activity.assignment?.assignedTo || [])
              .map((u) => u?.name || u?.fullName || u?.email)
              .filter(Boolean)
              .join(', ') || 'Not assigned'}
          </p>

          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {activity.assignment?.assignedDate
              ? activity.assignment.assignedDate.slice(0, 10)
              : 'No assigned date'}
          </p>
        </div>
      </div>

      {/* Created / Updated */}
      <div className="pt-3 border-t border-border/40 grid grid-cols-2 gap-3 text-xs text-muted-foreground mt-auto mb-5">
        <div>
          <p className="uppercase tracking-wide text-[10px]">Created</p>
          <p className="font-medium text-foreground">
            {activity.createdAt ? activity.createdAt.slice(0, 10) : '—'}
          </p>
        </div>

        <div>
          <p className="uppercase tracking-wide text-[10px]">Last Updated</p>
          <p className="font-medium text-foreground">
            {activity.updatedAt ? activity.updatedAt.slice(0, 10) : '—'}
          </p>
        </div>
      </div>
    </div>
  );
}
