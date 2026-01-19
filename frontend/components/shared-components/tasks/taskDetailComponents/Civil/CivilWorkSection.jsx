// CivilWorkSection.jsx
'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { MaterialsSection } from '../TaskDetailHelpers';

export function CivilWorkSection({ task }) {
  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Civil Materials
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <MaterialsSection
          materials={task?.allMaterialLists?.source_survey?.materials || []}
          type="survey"
          task={task}
        />
        {/* <MaterialsSection
          materials={task.materials || []}
          type="general"
          task={task}
        /> */}
        <MaterialsSection
          materials={task?.allMaterialLists?.destination_civil?.materials || []}
          type="civil"
          task={task}
        />
      </CardContent>
    </Card>
  );
}
