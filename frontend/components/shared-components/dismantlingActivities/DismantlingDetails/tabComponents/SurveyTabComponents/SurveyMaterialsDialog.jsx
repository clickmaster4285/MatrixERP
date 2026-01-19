'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Save, X, Search } from 'lucide-react';

import { MATERIALS_LIST } from '@/utils/InventoryStaticList';

export function SurveyMaterialsDialog({
  open,
  onOpenChange,
  initialSurvey,
  onSave,
  isSaving,
}) {
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [surveyFormData, setSurveyFormData] = useState({});
  const [surveyFields, setSurveyFields] = useState({
    surveyDate: '',
    status: 'in-progress',
    report: '',
  });

  // 🔍 search state for materials list
  const [materialsSearch, setMaterialsSearch] = useState('');

  // Filtered materials based on search
  const filteredMaterials = useMemo(() => {
    const term = materialsSearch.trim().toLowerCase();
    if (!term) return MATERIALS_LIST;
    return MATERIALS_LIST.filter((m) => m.name.toLowerCase().includes(term));
  }, [materialsSearch]);

  // Prefill when editing existing survey
  useEffect(() => {
    if (!open) return;

    const today = new Date().toISOString().slice(0, 10);

    let formStatus = initialSurvey?.status;

    // if nothing set or it's still "pending", show "in-progress" by default in UI
    if (!formStatus || formStatus === 'pending') {
      formStatus = 'in-progress';
    }

    setSurveyFields({
      surveyDate: initialSurvey?.surveyDate || today,
      status: formStatus,
      report: initialSurvey?.report || '',
    });

    if (
      Array.isArray(initialSurvey?.materials) &&
      initialSurvey.materials.length
    ) {
      setSelectedMaterials(initialSurvey.materials.map((m) => m.materialId));
      const mapped = initialSurvey.materials.reduce((acc, m) => {
        acc[m.materialId] = {
          quantity: m.quantity || 1, // default 1
          condition: m.condition || 'good',
          estimatedValue: m.estimatedValue || 0,
          canBeReused: m.canBeReused ?? true,
          notes: m.notes || '',
          photos: m.photos || [],
        };
        return acc;
      }, {});
      setSurveyFormData(mapped);
    } else {
      setSelectedMaterials([]);
      setSurveyFormData({});
    }

    // reset search on open
    setMaterialsSearch('');
  }, [initialSurvey, open]);

  const handleMaterialToggle = (materialId) => {
    setSelectedMaterials((prev) => {
      const exists = prev.includes(materialId);
      if (exists) {
        const updated = prev.filter((id) => id !== materialId);
        return updated;
      } else {
        // adding → default values
        setSurveyFormData((prevData) => ({
          ...prevData,
          [materialId]: {
            quantity: prevData[materialId]?.quantity || 1,
            condition: prevData[materialId]?.condition || 'good',
            estimatedValue: prevData[materialId]?.estimatedValue || 0,
            canBeReused:
              prevData[materialId]?.canBeReused !== undefined
                ? prevData[materialId].canBeReused
                : true,
            notes: prevData[materialId]?.notes || '',
            photos: prevData[materialId]?.photos || [],
          },
        }));
        return [...prev, materialId];
      }
    });

    // when removing material, clean its form data
    setSurveyFormData((prev) => {
      const copy = { ...prev };
      if (copy[materialId] && selectedMaterials.includes(materialId)) {
        delete copy[materialId];
      }
      return copy;
    });
  };

  const handleFieldChange = (field, value) => {
    setSurveyFields((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const buildMaterialsPayload = () => {
    return selectedMaterials.map((materialId) => {
      const materialMeta = MATERIALS_LIST.find((m) => m.id === materialId);
      const form = surveyFormData[materialId] || {};

      return {
        materialId,
        name: materialMeta?.name || 'Unknown',
        quantity: form.quantity || 1,
        condition: form.condition || 'good',
        estimatedValue: form.estimatedValue || 0,
        canBeReused: form.canBeReused ?? true,
        notes: form.notes || '',
        photos: form.photos || [],
      };
    });
  };

  const handleSaveClick = () => {
    const materials = buildMaterialsPayload();

    onSave?.({
      surveyDate: surveyFields.surveyDate,
      status: surveyFields.status || 'in-progress',
      report: surveyFields.report,
      materials,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-card border-border">
        <DialogHeader>
          <DialogTitle>Survey Details &amp; Materials</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Status Field */}
            <div>
              <Label className="text-xs font-medium">Status</Label>
              <Select
                value={surveyFields.status || 'in-progress'}
                onValueChange={(value) => handleFieldChange('status', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {/* no pending option in UI */}
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* MATERIALS SELECTION */}
            <div>
              <Label className="text-sm font-medium mb-3 block">
                Select Materials
              </Label>

              {/* 🔍 Search bar for materials */}
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

                  // auto-generated display id (only for UI, NOT changing payload)
                  const displayId = `M-${String(index + 1).padStart(2, '0')}`;

                  return (
                    <div
                      key={material.id}
                      className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-primary/15 border border-primary/50'
                          : 'hover:bg-secondary'
                      }`}
                      onClick={() => handleMaterialToggle(material.id)}
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
              <Label className="text-sm font-medium">Material Details</Label>

              {selectedMaterials.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-secondary/20 py-8 px-4 text-center">
                  <p className="text-sm font-medium text-muted-foreground">
                    No materials selected
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                    Select one or more materials above to enter quantities,
                    condition, and notes.
                  </p>
                </div>
              ) : (
                selectedMaterials.map((materialId) => {
                  const material = MATERIALS_LIST.find(
                    (m) => m.id === materialId
                  );
                  const form = surveyFormData[materialId] || {};
                  return (
                    <div
                      key={materialId}
                      className="bg-secondary/30 border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{material?.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleMaterialToggle(materialId)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <Label className="text-xs">Quantity</Label>
                          <Input
                            type="number"
                            min="1"
                            value={form.quantity ?? 1}
                            onChange={(e) =>
                              setSurveyFormData((prev) => ({
                                ...prev,
                                [materialId]: {
                                  ...prev[materialId],
                                  quantity: parseInt(e.target.value, 10) || 1,
                                },
                              }))
                            }
                            className="border-border mt-1"
                          />
                        </div>
                        <ConditionSelect
                          materialId={materialId}
                          surveyFormData={surveyFormData}
                          setSurveyFormData={setSurveyFormData}
                        />

                        <div className="flex items-center gap-2 h-full">
                          <Checkbox
                            id={`reuse-${materialId}`}
                            checked={form.canBeReused ?? true}
                            onCheckedChange={(checked) =>
                              setSurveyFormData((prev) => ({
                                ...prev,
                                [materialId]: {
                                  ...prev[materialId],
                                  canBeReused: !!checked,
                                },
                              }))
                            }
                          />
                          <Label
                            htmlFor={`reuse-${materialId}`}
                            className="text-xs"
                          >
                            Can be reused
                          </Label>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Notes</Label>
                        <Textarea
                          value={form.notes || ''}
                          onChange={(e) =>
                            setSurveyFormData((prev) => ({
                              ...prev,
                              [materialId]: {
                                ...prev[materialId],
                                notes: e.target.value,
                              },
                            }))
                          }
                          className="border-border mt-1"
                          placeholder="Additional notes..."
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {/* Survey Report */}
            <div>
              <Label className="text-xs font-medium ">Survey Report</Label>
              <Textarea
                rows={3}
                value={surveyFields.report || ''}
                onChange={(e) => handleFieldChange('report', e.target.value)}
                className="mt-1 bg-secondary/40"
                placeholder="Write survey summary / findings..."
              />
            </div>
          </div>
        </ScrollArea>

        {/* FOOTER ACTIONS */}
        <div className="flex justify-between items-center pt-4 border-t border-border gap-3 flex-col md:flex-row">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>

          <div className="flex gap-2">
            <Button onClick={handleSaveClick} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ConditionSelect({ materialId, surveyFormData, setSurveyFormData }) {
  const form = surveyFormData[materialId] || {};
  return (
    <div>
      <Label className="text-xs">Condition</Label>
      <select
        value={form.condition || ''}
        onChange={(e) =>
          setSurveyFormData((prev) => ({
            ...prev,
            [materialId]: {
              ...prev[materialId],
              condition: e.target.value,
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
  );
}
