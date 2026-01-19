'use client';

import { Label } from '@/components/ui/label';
import { MaterialCard } from './MaterialCard';

export function MaterialsDetailsSection({
  mode,
  selectedMaterials,
  formData,
  setFormData,
  MATERIALS_LIST,
  onRemove,
}) {
  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">
        Material Details {mode === 'dismantling' ? '(Dismantling Fields)' : ''}
      </Label>

      {selectedMaterials.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-secondary/20 py-8 px-4 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            No materials selected
          </p>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm">
            Select one or more materials above to enter details.
          </p>
        </div>
      ) : (
        selectedMaterials.map((materialId) => {
          const material = MATERIALS_LIST.find((m) => m.id === materialId);
          const f = formData[materialId] || {};

          return (
            <MaterialCard
              key={materialId}
              mode={mode}
              materialId={materialId}
              material={material}
              f={f}
              setFormData={setFormData}
              onRemove={onRemove}
            />
          );
        })
      )}
    </div>
  );
}
