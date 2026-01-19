'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { X } from 'lucide-react';

import { ConditionSelect } from './ConditionSelect';

const DEFAULT_BREAKDOWN = {
  excellent: 0,
  good: 0,
  fair: 0,
  poor: 0,
  scrap: 0,
};

const makeBreakdownFromSingle = (conditionKey, qty) => {
  const key = String(conditionKey || 'good').toLowerCase().trim();
  const n = Math.max(0, Number(qty) || 0);

  return {
    ...DEFAULT_BREAKDOWN,
    [Object.prototype.hasOwnProperty.call(DEFAULT_BREAKDOWN, key) ? key : 'good']: n,
  };
};

const inferConditionFromBreakdown = (breakdown) => {
  const b = breakdown || DEFAULT_BREAKDOWN;

  const weights = {
    excellent: 5,
    good: 4,
    fair: 3,
    poor: 2,
    scrap: 1,
  };

  const total =
    Number(b.excellent || 0) +
    Number(b.good || 0) +
    Number(b.fair || 0) +
    Number(b.poor || 0) +
    Number(b.scrap || 0);

  // if nothing entered, default
  if (total <= 0) return 'good';

  const weightedSum =
    Number(b.excellent || 0) * weights.excellent +
    Number(b.good || 0) * weights.good +
    Number(b.fair || 0) * weights.fair +
    Number(b.poor || 0) * weights.poor +
    Number(b.scrap || 0) * weights.scrap;

  const avg = weightedSum / total;

  // map back to condition (nearest bucket)
  if (avg >= 4.5) return 'excellent';
  if (avg >= 3.5) return 'good';
  if (avg >= 2.5) return 'fair';
  if (avg >= 1.5) return 'poor';
  return 'scrap';
};

export function MaterialCard({
  mode,
  materialId,
  material,
  f,
  setFormData,
  onRemove,
  isDismantling,
  phase,
}) {


  // Helper function to update form data
  const updateField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [materialId]: {
        ...prev[materialId],
        [field]: value,
      },
    }));
  };

  // Split-by-condition toggle
  const splitEnabled = !!f.splitByCondition;

  const ensureBreakdown = (prev) => ({
    ...(prev || {}),
    conditionBreakdown: {
      ...DEFAULT_BREAKDOWN,
      ...(prev?.conditionBreakdown || {}),
    },
  });

  // Helper function to update conditionBreakdown
  const updateConditionBreakdown = (condition, value) => {
    setFormData((prev) => {
      const existing = ensureBreakdown(prev[materialId]);
      return {
        ...prev,
        [materialId]: {
          ...existing,
          conditionBreakdown: {
            ...existing.conditionBreakdown,
            [condition]: Math.max(0, parseInt(value, 10) || 0),
          },
        },
      };
    });
  };

  // Calculate total from condition breakdown
  const calculateTotalFromBreakdown = (breakdown) => {
    const b = breakdown || DEFAULT_BREAKDOWN;
    return (
      (b.excellent || 0) +
      (b.good || 0) +
      (b.fair || 0) +
      (b.poor || 0) +
      (b.scrap || 0)
    );
  };

  // Get the current quantity value based on phase
  const getQuantityValue = () => {
    if (isDismantling && phase === 'dismantling') return f.quantityDismantled ?? 1;
    return f.quantity ?? 1;
  };

  // Which condition field is active?
  const getActiveConditionKey = () => {
    if (isDismantling && phase === 'dismantling') return f.conditionAfterDismantling || 'good';
    return f.condition || 'good';
  };

  // Sync breakdown when split is OFF (breakdown becomes single condition bucket)
  const syncBreakdownToSingle = (nextConditionKey, nextQty) => {
    const qty = Number(nextQty ?? getQuantityValue() ?? 0);
    const cond = nextConditionKey ?? getActiveConditionKey();

    setFormData((prev) => {
      const cur = prev[materialId] || {};
      return {
        ...prev,
        [materialId]: {
          ...cur,
          conditionBreakdown: makeBreakdownFromSingle(cond, qty),
        },
      };
    });
  };

  // Validation (only when split is enabled)
  const breakdown = f.conditionBreakdown || DEFAULT_BREAKDOWN;
  const breakdownTotal = calculateTotalFromBreakdown(breakdown);
  const quantityValue = Number(getQuantityValue() || 0);
  const breakdownMismatch = splitEnabled && breakdownTotal !== quantityValue;

  // Toggle split behavior
  const handleToggleSplit = (checked) => {
    const enabled = !!checked;

    setFormData((prev) => {
      const cur = prev[materialId] || {};
      const qty = Number(getQuantityValue() || 0);
      const cond = getActiveConditionKey();

      const next = {
        ...cur,
        splitByCondition: enabled,
      };

      if (enabled) {
        const existing = cur.conditionBreakdown || {};
        const total = calculateTotalFromBreakdown(existing);

        next.conditionBreakdown =
          total > 0
            ? { ...DEFAULT_BREAKDOWN, ...existing }
            : makeBreakdownFromSingle(cond, qty);
      } else {
        // When turning OFF split, collapse into single bucket
        next.conditionBreakdown = makeBreakdownFromSingle(cond, qty);
      }

      return { ...prev, [materialId]: next };
    });
  };

  // ✅ Always keep breakdown in sync when split is OFF
  useEffect(() => {
    if (splitEnabled) return;
    syncBreakdownToSingle(getActiveConditionKey(), getQuantityValue());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [splitEnabled, f.condition, f.quantity, f.quantityDismantled, f.conditionAfterDismantling]);

  // ✅ When split is ON, infer condition from breakdown (dominant bucket)
  useEffect(() => {
    if (!splitEnabled) return;

    const inferred = inferConditionFromBreakdown(f.conditionBreakdown || DEFAULT_BREAKDOWN);

    setFormData((prev) => {
      const cur = prev[materialId] || {};

      if (isDismantling && phase === 'dismantling') {
        if ((cur.conditionAfterDismantling || 'good') === inferred) return prev;
        return {
          ...prev,
          [materialId]: { ...cur, conditionAfterDismantling: inferred },
        };
      }

      if ((cur.condition || 'good') === inferred) return prev;
      return {
        ...prev,
        [materialId]: { ...cur, condition: inferred },
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [splitEnabled, f.conditionBreakdown]);

  // Render condition breakdown fields
  const renderConditionBreakdown = () => {
    if (!splitEnabled) return null;

    const conditions = [
      { key: 'excellent', label: 'Excellent' },
      { key: 'good', label: 'Good' },
      { key: 'fair', label: 'Fair' },
      { key: 'poor', label: 'Poor' },
      { key: 'scrap', label: 'Scrap' },
    ];

    return (
      <div
        className={[
          'space-y-2 rounded-md border p-3',
          breakdownMismatch ? 'border-red-500' : 'border-border',
        ].join(' ')}
      >
        <div className="flex items-center justify-between gap-3">
          <Label className="text-xs">Condition Breakdown</Label>
          <div className="text-xs text-muted-foreground">
            Total:{' '}
            <span className={breakdownMismatch ? 'text-red-600 font-medium' : ''}>
              {breakdownTotal}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {conditions.map((condition) => (
            <div key={condition.key} className="rounded p-2">
              <Label className="text-xs block mb-1">{condition.label}</Label>
              <Input
                type="number"
                min="0"
                value={breakdown[condition.key] || 0}
                onChange={(e) => updateConditionBreakdown(condition.key, e.target.value)}
                className="border-border text-sm h-8"
              />
            </div>
          ))}
        </div>

        {breakdownMismatch && (
          <p className="text-xs text-red-600">
            Condition breakdown total ({breakdownTotal}) must equal quantity ({quantityValue}).
          </p>
        )}
      </div>
    );
  };

  // Render fields based on phase
  const renderFields = () => {
    // DISMANTLING - SURVEY
    if (isDismantling && phase === 'survey') {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id={`split-${materialId}`}
              checked={splitEnabled}
              onCheckedChange={handleToggleSplit}
            />
            <Label htmlFor={`split-${materialId}`} className="text-xs">
              Split by condition
            </Label>
          </div>

          {renderConditionBreakdown()}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Total Quantity</Label>
              <Input
                type="number"
                min="1"
                value={f.quantity ?? 1}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10) || 1;
                  updateField('quantityDismantled', value);
                  updateField('quantity', value);
                  if (!splitEnabled) syncBreakdownToSingle(getActiveConditionKey(), value);
                }}
                className="border-border mt-1"
              />
            </div>

            <ConditionSelect
              materialId={materialId}
              surveyFormData={f}
              setSurveyFormData={(updater) =>
                setFormData((prev) => ({
                  ...prev,
                  [materialId]: updater(prev[materialId] || {}),
                }))
              }
              isDismantling={isDismantling}
              phase={phase}
            />

            <div className="flex items-center gap-2 h-full">
              <Checkbox
                id={`reuse-${materialId}`}
                checked={f.canBeReused ?? true}
                onCheckedChange={(checked) => updateField('canBeReused', !!checked)}
              />
              <Label htmlFor={`reuse-${materialId}`} className="text-xs">
                Can be reused
              </Label>
            </div>

            <div>
              <Label className="text-xs">Unit</Label>
              <Input
                value={f.unit || 'pcs'}
                onChange={(e) => updateField('unit', e.target.value)}
                className="border-border mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea
              value={f.notes || ''}
              onChange={(e) => updateField('notes', e.target.value)}
              className="border-border mt-1"
              placeholder="Additional notes for this material..."
            />
          </div>
        </div>
      );
    }

    // DISMANTLING - DISMANTLING PHASE
    if (isDismantling && phase === 'dismantling') {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id={`split-${materialId}`}
              checked={splitEnabled}
              onCheckedChange={handleToggleSplit}
            />
            <Label htmlFor={`split-${materialId}`} className="text-xs">
              Split by condition
            </Label>
          </div>

          {renderConditionBreakdown()}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Quantity Dismantled</Label>
              <Input
                type="number"
                min="1"
                value={f.quantityDismantled ?? 1}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10) || 1;
                  updateField('quantityDismantled', value);
                  if (!splitEnabled) syncBreakdownToSingle(getActiveConditionKey(), value);
                }}
                className="border-border mt-1"
              />
            </div>

            <div>
              <Label className="text-xs">Condition After Dismantling</Label>
              <select
                value={f.conditionAfterDismantling || 'good'}
                onChange={(e) => {
                  const val = e.target.value;
                  updateField('conditionAfterDismantling', val);
                  if (!splitEnabled) syncBreakdownToSingle(val, getQuantityValue());
                }}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background border-border"
              >
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
                <option value="scrap">Scrap</option>
              </select>
            </div>

            <div className="flex items-center gap-2 h-full">
              <Checkbox
                id={`reuse-${materialId}`}
                checked={f.canBeReused ?? true}
                onCheckedChange={(checked) => updateField('canBeReused', !!checked)}
              />
              <Label htmlFor={`reuse-${materialId}`} className="text-xs">
                Can be reused
              </Label>
            </div>

            <div className="md:col-span-2">
              <Label className="text-xs">Damage Notes</Label>
              <Textarea
                value={f.damageNotes || ''}
                onChange={(e) => updateField('damageNotes', e.target.value)}
                className="border-border mt-1"
                placeholder="Any damage details..."
              />
            </div>
          </div>
        </div>
      );
    }

    // DISMANTLING - DISPATCH
    if (isDismantling && phase === 'dispatch') {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id={`split-${materialId}`}
              checked={splitEnabled}
              onCheckedChange={handleToggleSplit}
            />
            <Label htmlFor={`split-${materialId}`} className="text-xs">
              Split by condition
            </Label>
          </div>

          {renderConditionBreakdown()}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Quantity</Label>
              <Input
                type="number"
                min="1"
                value={f.quantity ?? 1}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10) || 1;
                  updateField('quantity', value);
                  updateField('quantityDismantled', value);
                  if (!splitEnabled) syncBreakdownToSingle(getActiveConditionKey(), value);
                }}
                className="border-border mt-1"
              />
            </div>

            <ConditionSelect
              materialId={materialId}
              surveyFormData={f}
              setSurveyFormData={(updater) =>
                setFormData((prev) => ({
                  ...prev,
                  [materialId]: updater(prev[materialId] || {}),
                }))
              }
              isDismantling={isDismantling}
              phase={phase}
            />

            <div className="flex items-center gap-2 h-full">
              <Checkbox
                id={`reuse-${materialId}`}
                checked={f.canBeReused ?? true}
                onCheckedChange={(checked) => updateField('canBeReused', !!checked)}
              />
              <Label htmlFor={`reuse-${materialId}`} className="text-xs">
                Can be reused
              </Label>
            </div>

            <div>
              <Label className="text-xs">Unit</Label>
              <Input
                value={f.unit || 'pcs'}
                onChange={(e) => updateField('unit', e.target.value)}
                className="border-border mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea
              value={f.notes || ''}
              onChange={(e) => updateField('notes', e.target.value)}
              className="border-border mt-1"
              placeholder="Additional notes for this material..."
            />
          </div>
        </div>
      );
    }

    // NON-DISMANTLING
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id={`split-${materialId}`}
            checked={splitEnabled}
            onCheckedChange={handleToggleSplit}
          />
          <Label htmlFor={`split-${materialId}`} className="text-xs">
            Split by condition
          </Label>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <Label className="text-xs">Quantity</Label>
            <Input
              type="number"
              min="1"
              value={f.quantity ?? 1}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10) || 1;
                updateField('quantity', value);
                if (!splitEnabled) syncBreakdownToSingle(getActiveConditionKey(), value);
              }}
              className="border-border mt-1"
            />
          </div>

          <ConditionSelect
            materialId={materialId}
            surveyFormData={f}
            setSurveyFormData={(updater) =>
              setFormData((prev) => ({
                ...prev,
                [materialId]: updater(prev[materialId] || {}),
              }))
            }
            isDismantling={isDismantling}
            phase={phase}
          />

          <div className="flex items-center gap-2 h-full">
            <Checkbox
              id={`reuse-${materialId}`}
              checked={f.canBeReused ?? true}
              onCheckedChange={(checked) => updateField('canBeReused', !!checked)}
            />
            <Label htmlFor={`reuse-${materialId}`} className="text-xs">
              Can be reused
            </Label>
          </div>

          <div>
            <Label className="text-xs">Unit</Label>
            <Input
              value={f.unit || 'pcs'}
              onChange={(e) => updateField('unit', e.target.value)}
              className="border-border mt-1"
            />
          </div>
        </div>

        {renderConditionBreakdown()}

        <div>
          <Label className="text-xs">Notes</Label>
          <Textarea
            value={f.notes || ''}
            onChange={(e) => updateField('notes', e.target.value)}
            className="border-border mt-1"
            placeholder="Additional notes for this material..."
          />
        </div>
      </div>
    );
  };

  return (
    <div className="bg-secondary/30 border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-medium">{material?.name}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => onRemove(materialId)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {renderFields()}
    </div>
  );
}
