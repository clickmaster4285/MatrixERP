// components/shared-components/activities/dismantlingActivities/DismantlingDetails/tabs/DismantledMaterialsCard.jsx
'use client';

import { useState, useEffect, useMemo } from 'react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Save, X, Search, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

import { MATERIALS_LIST } from '@/utils/InventoryStaticList';

export function DismantledMaterialsCard({
  activity,
  surveyMaterials,
  actualMaterials, // from dismantling.materials
  showingDismantled,
  materialsToShow,
  getConditionColor,
  isCompleted,
  isDismantlingModalOpen,
  setIsDismantlingModalOpen,
  dismantlingFormData,
  setDismantlingFormData,
  handleDismantlingSubmit,
  isUpdating,
  WrenchIcon,
  BadgeComponent,
}) {
  const hasSurvey =
    Array.isArray(surveyMaterials) && surveyMaterials.length > 0;

  // ---------- MANUAL MODE STATE (no survey) ----------
  const [manualSelected, setManualSelected] = useState([]);
  const [manualFormData, setManualFormData] = useState({});
  const [materialsSearch, setMaterialsSearch] = useState('');

  // Prefill manual state from existing dismantling.materials
  useEffect(() => {
    if (!isDismantlingModalOpen) return;
    if (hasSurvey) return;

    if (Array.isArray(actualMaterials) && actualMaterials.length > 0) {
      const selectedIds = actualMaterials.map((m) => m.materialId);
      const mapped = actualMaterials.reduce((acc, m) => {
        acc[m.materialId] = {
          quantityDismantled: m.quantityDismantled || 1,
          conditionAfterDismantling: m.conditionAfterDismantling || '',
          damageNotes: m.damageNotes || '',
        };
        return acc;
      }, {});
      setManualSelected(selectedIds);
      setManualFormData(mapped);
    } else {
      setManualSelected([]);
      setManualFormData({});
    }
    setMaterialsSearch('');
  }, [isDismantlingModalOpen, hasSurvey, actualMaterials]);

  // Filtered materials for search (manual mode)
  const filteredMaterials = useMemo(() => {
    const term = materialsSearch.trim().toLowerCase();
    if (!term) return MATERIALS_LIST;
    return MATERIALS_LIST.filter((m) => m.name.toLowerCase().includes(term));
  }, [materialsSearch]);

  const handleManualToggle = (materialId) => {
    setManualSelected((prev) => {
      const exists = prev.includes(materialId);
      if (exists) {
        // remove
        const updated = prev.filter((id) => id !== materialId);
        return updated;
      } else {
        // add with default values
        setManualFormData((prevData) => ({
          ...prevData,
          [materialId]: {
            quantityDismantled:
              prevData[materialId]?.quantityDismantled || 1,
            conditionAfterDismantling:
              prevData[materialId]?.conditionAfterDismantling || '',
            damageNotes: prevData[materialId]?.damageNotes || '',
          },
        }));
        return [...prev, materialId];
      }
    });

    // Clean up form data when removing
    setManualFormData((prev) => {
      const copy = { ...prev };
      if (copy[materialId] && manualSelected.includes(materialId)) {
        delete copy[materialId];
      }
      return copy;
    });
  };

  const buildManualPayload = () => {
    const today = new Date().toISOString().slice(0, 10);

    return manualSelected
      .map((materialId) => {
        const meta = MATERIALS_LIST.find((m) => m.id === materialId);
        const form = manualFormData[materialId] || {};

        const qty = Number(form.quantityDismantled) || 0;
        if (qty <= 0) return null;

        return {
          materialId,
          name: meta?.name || 'Unknown',
          quantityDismantled: qty,
          conditionAfterDismantling: form.conditionAfterDismantling || '',
          damageNotes: form.damageNotes || '',
          dismantlingDate: today,
        };
      })
      .filter(Boolean);
  };

  // ---------- RENDER ----------
  return (
    <div className="bg-card rounded-xl border border-border/50 p-6 shadow-card w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="font-semibold">Dismantled Materials</h4>
          <p className="text-sm text-muted-foreground">
            {materialsToShow.length}{' '}
            {showingDismantled
              ? 'materials dismantled'
              : hasSurvey
                ? 'survey materials (no dismantling recorded yet)'
                : 'materials (dismantling only – no survey)'}
          </p>
        </div>

        <div className="flex gap-3">
          {!isCompleted && (
            <Dialog
              open={isDismantlingModalOpen}
              onOpenChange={setIsDismantlingModalOpen}
            >
              <DialogTrigger asChild>
                <Button className="gap-2 bg-primary">
                  <Plus className="w-4 h-4" />
                  {hasSurvey ? 'Add / Update Dismantling' : 'Add Dismantling'}
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-4xl max-h-[90vh] bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Dismantling Materials</DialogTitle>
                </DialogHeader>

                <ScrollArea className="h-[60vh] pr-4">
                  <div className="space-y-6">
                    {/* MODE 1: SURVEY-BASED MATERIALS */}
                    {hasSurvey ? (
                      <div className="space-y-4">
                        <Label className="text-sm font-medium">
                          Dismantling Against Survey Materials
                        </Label>

                        {surveyMaterials.map((surveyMaterial) => {
                          const existing =
                            activity.dismantling?.materials?.find(
                              (m) => m.materialId === surveyMaterial.materialId
                            );

                          const form =
                            dismantlingFormData[surveyMaterial.materialId] ||
                            {};

                          const existingQty =
                            existing?.quantityDismantled != null
                              ? existing.quantityDismantled
                              : null;

                          const inputQtyRaw =
                            form.quantityDismantled ??
                            existingQty ??
                            surveyMaterial.quantity ??
                            0;

                          const maxQty =
                            Number(surveyMaterial.quantity || 0) || 0;
                          const inputQty =
                            inputQtyRaw > maxQty ? maxQty : inputQtyRaw;

                          const remaining = maxQty - (inputQty || 0);

                          const selectedCondition =
                            form.conditionAfterDismantling ||
                            existing?.conditionAfterDismantling ||
                            surveyMaterial.condition ||
                            '';

                          const damageNotes =
                            form.damageNotes ?? existing?.damageNotes ?? '';

                          return (
                            <div
                              key={surveyMaterial.materialId}
                              className="bg-secondary/30 border rounded-lg p-4 space-y-3"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium">
                                  {surveyMaterial.name}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  Surveyed: {surveyMaterial.quantity} |
                                  Remaining: {remaining < 0 ? 0 : remaining}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {/* Qty Dismantled */}
                                <div>
                                  <Label className="text-xs">
                                    Qty Dismantled
                                  </Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    max={maxQty}
                                    value={
                                      inputQty !== undefined &&
                                        inputQty !== null
                                        ? inputQty
                                        : ''
                                    }
                                    onChange={(e) => {
                                      const raw = parseInt(e.target.value, 10);
                                      const safe =
                                        isNaN(raw) || raw < 0
                                          ? 0
                                          : Math.min(raw, maxQty);

                                      setDismantlingFormData((prev) => ({
                                        ...prev,
                                        [surveyMaterial.materialId]: {
                                          ...prev[surveyMaterial.materialId],
                                          quantityDismantled: safe,
                                        },
                                      }));
                                    }}
                                    className="border-border mt-1"
                                  />
                                </div>

                                {/* Condition After */}
                                <div>
                                  <Label className="text-xs">
                                    Condition After
                                  </Label>
                                  <select
                                    value={selectedCondition}
                                    onChange={(e) =>
                                      setDismantlingFormData((prev) => ({
                                        ...prev,
                                        [surveyMaterial.materialId]: {
                                          ...prev[surveyMaterial.materialId],
                                          conditionAfterDismantling:
                                            e.target.value,
                                        },
                                      }))
                                    }
                                    className="w-full border border-border rounded-md px-3 py-2 mt-1 text-sm bg-background"
                                  >
                                    <option value="">Select</option>
                                    <option value="excellent">Excellent</option>
                                    <option value="good">Good</option>
                                    <option value="fair">Fair</option>
                                    <option value="poor">Poor</option>
                                    <option value="scrap">Scrap</option>
                                  </select>
                                </div>

                                {/* Damage Notes */}
                                <div className="md:col-span-1">
                                  <Label className="text-xs">
                                    Damage Notes
                                  </Label>
                                  <Input
                                    value={damageNotes}
                                    onChange={(e) =>
                                      setDismantlingFormData((prev) => ({
                                        ...prev,
                                        [surveyMaterial.materialId]: {
                                          ...prev[surveyMaterial.materialId],
                                          damageNotes: e.target.value,
                                        },
                                      }))
                                    }
                                    className="border-border mt-1"
                                    placeholder="Any damage..."
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      // MODE 2: NO SURVEY → MANUAL MATERIALS (similar to SurveyMaterialsDialog)
                      <div className="space-y-6">
                        {/* MATERIALS SELECTION */}
                        <div>
                          <Label className="text-sm font-medium mb-3 block">
                            Select Materials
                          </Label>

                          {/* Search bar */}
                          <div className="mb-2 flex items-center gap-2">
                            <div className="relative w-full">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                                <Search className="w-3 h-3" />
                              </span>
                              <Input
                                type="text"
                                placeholder="Search materials..."
                                value={materialsSearch}
                                onChange={(e) =>
                                  setMaterialsSearch(e.target.value)
                                }
                                className="pl-7 h-8 text-xs"
                              />
                            </div>
                          </div>

                          <div className="space-y-2 max-h-[180px] overflow-y-auto bg-secondary/30 border rounded-lg p-3">
                            {filteredMaterials.map((material, index) => {
                              const isSelected = manualSelected.includes(
                                material.id
                              );
                              const displayId = `M-${String(index + 1).padStart(
                                2,
                                '0'
                              )}`;

                              return (
                                <div
                                  key={material.id}
                                  className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${isSelected
                                      ? 'bg-primary/15 border border-primary/50'
                                      : 'hover:bg-secondary'
                                    }`}
                                  onClick={() =>
                                    handleManualToggle(material.id)
                                  }
                                >
                                  <Checkbox
                                    checked={isSelected}
                                    className="pointer-events-none"
                                  />
                                  <div className="flex flex-col">
                                    <span className="text-[11px] text-muted-foreground">
                                      {displayId}
                                    </span>
                                    <span className="text-sm font-medium">
                                      {material.name}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}

                            {filteredMaterials.length === 0 && (
                              <div className="col-span-full text-xs text-muted-foreground text-center py-4">
                                No materials match your search.
                              </div>
                            )}
                          </div>
                        </div>

                        {/* MATERIAL DETAILS */}
                        <div className="space-y-4">
                          <Label className="text-sm font-medium">
                            Dismantling Details
                          </Label>

                          {manualSelected.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-secondary/20 py-8 px-4 text-center">
                              <p className="text-sm font-medium text-muted-foreground">
                                No materials selected
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                                Select one or more materials above to enter
                                quantity, condition, and damage notes.
                              </p>
                            </div>
                          ) : (
                            manualSelected.map((materialId) => {
                              const material = MATERIALS_LIST.find(
                                (m) => m.id === materialId
                              );
                              const form = manualFormData[materialId] || {};

                              return (
                                <div
                                  key={materialId}
                                  className="bg-secondary/30 border rounded-lg p-4 space-y-3"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium">
                                      {material?.name}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() =>
                                        handleManualToggle(materialId)
                                      }
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>

                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    <div>
                                      <Label className="text-xs">
                                        Qty Dismantled
                                      </Label>
                                      <Input
                                        type="number"
                                        min="1"
                                        value={form.quantityDismantled ?? '1'}
                                        onChange={(e) =>
                                          setManualFormData((prev) => ({
                                            ...prev,
                                            [materialId]: {
                                              ...prev[materialId],
                                              quantityDismantled:
                                                parseInt(e.target.value, 10) ||
                                                1,
                                            },
                                          }))
                                        }
                                        className="border-border mt-1"
                                      />
                                    </div>

                                    <div>
                                      <Label className="text-xs">
                                        Condition After
                                      </Label>
                                      <select
                                        value={
                                          form.conditionAfterDismantling || ''
                                        }
                                        onChange={(e) =>
                                          setManualFormData((prev) => ({
                                            ...prev,
                                            [materialId]: {
                                              ...prev[materialId],
                                              conditionAfterDismantling:
                                                e.target.value,
                                            },
                                          }))
                                        }
                                        className="w-full border border-border rounded-md px-3 py-2 mt-1 text-sm bg-background"
                                      >
                                        <option value="">Select</option>
                                        <option value="excellent">
                                          Excellent
                                        </option>
                                        <option value="good">Good</option>
                                        <option value="fair">Fair</option>
                                        <option value="poor">Poor</option>
                                        <option value="scrap">Scrap</option>
                                      </select>
                                    </div>

                                    <div className="md:col-span-1">
                                      <Label className="text-xs">
                                        Damage Notes
                                      </Label>
                                      <Input
                                        rows={2}
                                        value={form.damageNotes || ''}
                                        onChange={(e) =>
                                          setManualFormData((prev) => ({
                                            ...prev,
                                            [materialId]: {
                                              ...prev[materialId],
                                              damageNotes: e.target.value,
                                            },
                                          }))
                                        }
                                        className="border-border mt-1"
                                        placeholder="Any damage..."
                                      />
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* FOOTER */}
                <div className="flex justify-between items-center pt-4 border-t border-border gap-3 flex-col md:flex-row">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDismantlingModalOpen(false)}
                    disabled={isUpdating}
                  >
                    Cancel
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        if (hasSurvey) {
                          // survey-based flow
                          handleDismantlingSubmit();
                        } else {
                          // manual mode flow
                          const manualPayload = buildManualPayload();
                          handleDismantlingSubmit(manualPayload);
                        }
                      }}
                      disabled={isUpdating}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isUpdating ? 'Saving...' : 'Save Record'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Table: show dismantled if exists, otherwise survey materials */}
      {materialsToShow.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow className="border-border/50">
              <TableHead>Material</TableHead>
              <TableHead>
                {showingDismantled ? 'Qty Dismantled' : 'Survey Qty'}
              </TableHead>
              {showingDismantled && <TableHead>Condition After</TableHead>}
              <TableHead>{showingDismantled ? 'Date' : 'Condition'}</TableHead>
              <TableHead>
                {showingDismantled ? 'Damage Notes' : 'Notes / Reuse'}
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {showingDismantled
              ? actualMaterials.map((material) => (
                <TableRow
                  key={material.materialId}
                  className="border-border/50"
                >
                  <TableCell className="font-medium">
                    {material.name}
                  </TableCell>
                  <TableCell>{material.quantityDismantled}</TableCell>
                  <TableCell>
                    {material.conditionAfterDismantling ? (
                      <span
                        className={`capitalize ${getConditionColor(
                          material.conditionAfterDismantling
                        )}`}
                      >
                        {material.conditionAfterDismantling}
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {material.dismantlingDate
                      ? String(material.dismantlingDate).slice(0, 10)
                      : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {material.damageNotes || '-'}
                  </TableCell>
                </TableRow>
              ))
              : surveyMaterials.map((m) => (
                <TableRow key={m.materialId} className="border-border/50">
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell>{m.quantity}</TableCell>
                  <TableCell>
                    {m.condition ? (
                      <span
                        className={`capitalize ${getConditionColor(
                          m.condition
                        )}`}
                      >
                        {m.condition}
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground text-xs">
                      {m.notes || '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {m.canBeReused != null && (
                      <BadgeComponent
                        variant={m.canBeReused ? 'default' : 'destructive'}
                        className="text-[11px]"
                      >
                        {m.canBeReused ? 'Reusable' : 'Scrap'}
                      </BadgeComponent>
                    )}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-12">
          <WrenchIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          {!hasSurvey ? (
            <p className="text-muted-foreground">
              No materials added yet. Use &quot;Add Dismantling&quot; to add
              dismantled items.
            </p>
          ) : (
            <>
              <p className="text-muted-foreground">Complete survey first</p>
              <p className="text-sm text-muted-foreground">
                Survey must be completed before dismantling
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}