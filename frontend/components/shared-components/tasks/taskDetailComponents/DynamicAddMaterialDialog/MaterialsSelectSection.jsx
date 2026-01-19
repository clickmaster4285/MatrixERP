'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Search } from 'lucide-react';

export function MaterialsSelectSection({
  filteredMaterials,
  selectedMaterials,
  materialsSearch,
  setMaterialsSearch,
  onToggle,
}) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium mb-1 block">Select Materials</Label>

      <div className="mb-2 flex items-center gap-2">
        <div className="relative w-full">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Search className="w-3 h-3" />
          </span>
          <Input
            type="text"
            placeholder="Search materials..."
            value={materialsSearch}
            onChange={(e) => setMaterialsSearch(e.target.value)}
            className="pl-7 h-8 text-xs"
          />
        </div>
      </div>

      <div className="space-y-2 max-h-[180px] overflow-y-auto bg-secondary/30 border rounded-lg p-3">
        {filteredMaterials.map((material, index) => {
          const isSelected = selectedMaterials.includes(material.id);
          const displayId = `M-${String(index + 1).padStart(2, '0')}`;

          return (
            <div
              key={material.id}
              className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-primary/15 border border-primary/50'
                  : 'hover:bg-secondary'
              }`}
              onClick={() => onToggle(material.id)}
            >
              <Checkbox checked={isSelected} className="pointer-events-none" />
              <div className="flex flex-col">
                <span className="text-[11px] text-muted-foreground">
                  {displayId}
                </span>
                <span className="text-sm font-medium">{material.name}</span>
              </div>
            </div>
          );
        })}

        {filteredMaterials.length === 0 && (
          <div className="text-xs text-muted-foreground text-center py-4">
            No materials match your search.
          </div>
        )}
      </div>
    </div>
  );
}
