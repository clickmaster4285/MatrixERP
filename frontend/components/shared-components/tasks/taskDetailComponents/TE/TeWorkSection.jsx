'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { MaterialsSection } from '../TaskDetailHelpers';

export function TeWorkSection({ task }) {
  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
         TE Materials
        </CardTitle>
      </CardHeader>
      <CardContent>
        <MaterialsSection
          materials={task.materials || []}
          type="general"
          task={task}
        />
      </CardContent>
    </Card>
  );
}
