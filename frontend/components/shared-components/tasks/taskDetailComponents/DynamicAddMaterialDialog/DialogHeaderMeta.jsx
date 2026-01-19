'use client';

import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ClipboardCheck, Wrench, Truck } from 'lucide-react';

export function DialogHeaderMeta({ task, mode, resolved }) {
  const dialogMeta = (() => {
    if (mode === 'survey')
      return { title: 'Survey Work', icon: ClipboardCheck };
    if (mode === 'dismantling')
      return { title: 'Dismantling Work', icon: Wrench };
    return { title: 'Store / Dispatch', icon: Truck };
  })();

  const Icon = dialogMeta.icon;

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-lg">
          <Icon className="h-5 w-5" />
          {dialogMeta.title}
        </DialogTitle>
      </DialogHeader>

      <div className="text-xs text-muted-foreground mb-2 space-y-1">
        <div>
          Activity Type:{' '}
          <span className="font-medium capitalize">{task.activityType}</span>
        </div>

        {task.activityType === 'dismantling' && (
          <div>
            Phase:{' '}
            <span className="font-medium capitalize">{resolved?.phase}</span>
          </div>
        )}

        {task.activityType === 'relocation' && (
          <div>
            Site:{' '}
            <span className="font-medium capitalize">
              {task.siteType} ({resolved?.subPhase})
            </span>
          </div>
        )}
      </div>
    </>
  );
}
