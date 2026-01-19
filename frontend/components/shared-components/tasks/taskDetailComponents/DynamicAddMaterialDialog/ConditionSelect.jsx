// ConditionSelect.jsx - Updated version
'use client';

import { Label } from '@/components/ui/label';

export function ConditionSelect({
  materialId,
  surveyFormData,
  setSurveyFormData,
  mode, // Add mode prop
}) {
  
  const conditionField = mode === 'dismantling' ? 'conditionAfterDismantling' : 'condition';
  const currentValue = surveyFormData[conditionField] || 'good';
  
  const updateCondition = (value) => {
    setSurveyFormData((prev) => ({
      ...prev,
      [conditionField]: value,
    }));
  };

  return (
    <div>
      <Label className="text-xs">
        {mode === 'dismantling' ? 'Condition After Dismantling' : 'Condition'}
      </Label>
      <select
        value={currentValue}
        onChange={(e) => updateCondition(e.target.value)}
        className="w-full px-3 py-2 text-sm border rounded-md bg-background border-border mt-1"
      >
        <option value="excellent">Excellent</option>
        <option value="good">Good</option>
        <option value="fair">Fair</option>
        <option value="poor">Poor</option>
        <option value="scrap">Scrap</option>
      </select>
    </div>
  );
}