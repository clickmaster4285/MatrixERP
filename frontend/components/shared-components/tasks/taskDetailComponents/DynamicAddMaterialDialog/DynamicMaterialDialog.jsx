'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

import { useUpdatePhase } from '@/features/taskApi';
import { MATERIALS_LIST } from '@/utils/InventoryStaticList';

import { DialogHeaderMeta } from './DialogHeaderMeta';
import { WorkFieldsSection } from './WorkFieldsSection';
import { MaterialsSelectSection } from './MaterialsSelectSection';
import { MaterialsDetailsSection } from './MaterialsDetailsSection';
import { DialogFooterActions } from './DialogFooterActions';

import { resolveModule, resolveMode, toDateInputValue } from './taskWorkUtils';

// ========== CONSTANTS & CONFIGURATIONS ==========
const INITIAL_FIELDS = {
  status: 'in-progress',
  report: '',
  surveyType: '',
  notes: '',
  destinationlocation: 'own-store',
  destinationDetails: '',
  receiverName: '',
  vehicleNumber: '',
  driverName: '',
  driverContact: '',
  equipmentInstalled: [],
};

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

// ✅ weighted average (math)
const inferConditionFromBreakdown = (breakdown) => {
  const b = breakdown || DEFAULT_BREAKDOWN;

  const weights = { excellent: 5, good: 4, fair: 3, poor: 2, scrap: 1 };

  const total =
    Number(b.excellent || 0) +
    Number(b.good || 0) +
    Number(b.fair || 0) +
    Number(b.poor || 0) +
    Number(b.scrap || 0);

  if (total <= 0) return 'good';

  const weightedSum =
    Number(b.excellent || 0) * weights.excellent +
    Number(b.good || 0) * weights.good +
    Number(b.fair || 0) * weights.fair +
    Number(b.poor || 0) * weights.poor +
    Number(b.scrap || 0) * weights.scrap;

  const avg = weightedSum / total;

  if (avg >= 4.5) return 'excellent';
  if (avg >= 3.5) return 'good';
  if (avg >= 2.5) return 'fair';
  if (avg >= 1.5) return 'poor';
  return 'scrap';
};

const normalizeConditionPayload = ({ splitByCondition, condition, qty, conditionBreakdown }) => {
  const q = Number(qty || 0);
  const split = !!splitByCondition;

  const normalizedBreakdown = split
    ? { ...DEFAULT_BREAKDOWN, ...(conditionBreakdown || {}) }
    : makeBreakdownFromSingle(condition || 'good', q);

  const normalizedCondition = split
    ? inferConditionFromBreakdown(normalizedBreakdown)
    : (condition || 'good');

  return { normalizedCondition, normalizedBreakdown };
};

// ========== ACTIVITY HANDLERS ==========
const ACTIVITY_HANDLERS = {
  dismantling: {
    // ✅ carryover logic:
    // - dismantling phase: show survey materials if dismantling empty
    // - dispatch/store phase: show dismantling materials if dispatch empty
    getMaterials: (task, resolved) => {
      const phase = resolved?.phase || 'survey';

      const keyByPhase = {
        survey: 'surveyMaterials',
        dismantling: 'dismantlingMaterials',
        dispatch: 'dispatchMaterials',
      };

      const currentKey = keyByPhase[phase] || 'surveyMaterials';
      const current = task?.materialLists?.[currentKey]?.materials;

      if (Array.isArray(current) && current.length > 0) return current;

      if (phase === 'dismantling') {
        const survey = task?.materialLists?.surveyMaterials?.materials;
        if (Array.isArray(survey) && survey.length > 0) return survey;
      }

      if (phase === 'dispatch') {
        const dis = task?.materialLists?.dismantlingMaterials?.materials;
        if (Array.isArray(dis) && dis.length > 0) return dis;
      }

      const phaseMaterials = {
        survey: Array.isArray(task?.survey?.materials) ? task.survey.materials : [],
        dismantling: Array.isArray(task?.dismantling?.materials) ? task.dismantling.materials : [],
        dispatch: Array.isArray(task?.dispatch?.materials) ? task.dispatch.materials : [],
      };

      return phaseMaterials[phase] || phaseMaterials.survey || [];
    },

    buildPayload: (fields, materials, resolved) => {
      const payload = { status: fields.status, materials };

      if (resolved.phase === 'survey') {
        payload.report = fields.report;
        payload.surveyDate = new Date();
      } else if (resolved.phase === 'dismantling' && fields.notes) {
        payload.issuesEncountered = fields.notes;
      } else if (resolved.phase === 'dispatch') {
        payload.destinationlocation = fields.destinationlocation;
        payload.destinationDetails = fields.destinationDetails;
        payload.receiverName = fields.receiverName;
        payload.dispatchDate = new Date();
      }

      return payload;
    },

    mapFormData: (material, formData, mode, task, resolved) => {
      const phase = resolved?.phase || 'survey';

      if (phase === 'survey') {
        const qty = formData.quantity ?? formData.quantityDismantled ?? 1;

        const { normalizedCondition, normalizedBreakdown } = normalizeConditionPayload({
          splitByCondition: formData.splitByCondition,
          condition: formData.condition || 'good',
          qty,
          conditionBreakdown: formData.conditionBreakdown,
        });

        return {
          materialId: material.id,
          name: material.name || 'Unknown',
          quantity: qty,
          unit: formData.unit || 'pcs',
          condition: normalizedCondition,
          conditionBreakdown: normalizedBreakdown,
          splitByCondition: !!formData.splitByCondition,
          canBeReused: formData.canBeReused ?? true,
          notes: formData.notes || '',
        };
      }

      if (phase === 'dismantling') {
        const qty = Number(formData.quantityDismantled ?? formData.quantity ?? 1);

        const { normalizedCondition, normalizedBreakdown } = normalizeConditionPayload({
          splitByCondition: formData.splitByCondition,
          condition: formData.conditionAfterDismantling || 'good',
          qty,
          conditionBreakdown: formData.conditionBreakdown,
        });

        return {
          materialId: material.id,
          name: material.name || 'Unknown',

          // ✅ send both (backend-safe)
          quantityDismantled: qty,
          quantity: qty,

          conditionAfterDismantling: normalizedCondition,
          conditionBreakdown: normalizedBreakdown,
          splitByCondition: !!formData.splitByCondition,
          damageNotes: formData.damageNotes || '',
          dismantlingDate: new Date(),
        };
      }


      if (phase === 'dispatch') {
        const qty = Number(formData.quantity ?? formData.quantityDismantled ?? 1);

        const { normalizedCondition, normalizedBreakdown } = normalizeConditionPayload({
          splitByCondition: formData.splitByCondition,
          condition: formData.condition || 'good',
          qty,
          conditionBreakdown: formData.conditionBreakdown,
        });

        return {
          materialId: material.id,
          name: material.name || 'Unknown',

          // ✅ send both so store backend never defaults to 1
          quantity: qty,
          quantityDismantled: qty,

          condition: normalizedCondition,
          conditionBreakdown: normalizedBreakdown,
          splitByCondition: !!formData.splitByCondition,
          canBeReused: formData.canBeReused ?? true,
          notes: formData.notes || '',
          unit: formData.unit || 'pcs',
        };
      }


      const qty = formData.quantity ?? 1;

      const { normalizedCondition, normalizedBreakdown } = normalizeConditionPayload({
        splitByCondition: formData.splitByCondition,
        condition: formData.condition || 'good',
        qty,
        conditionBreakdown: formData.conditionBreakdown,
      });

      return {
        materialId: material.id,
        name: material.name || 'Unknown',
        quantity: qty,
        unit: formData.unit || 'pcs',
        condition: normalizedCondition,
        conditionBreakdown: normalizedBreakdown,
        splitByCondition: !!formData.splitByCondition,
        canBeReused: formData.canBeReused ?? true,
        notes: formData.notes || '',
      };
    },
  },
  relocation: {
    getMaterials: (task) => {
      const siteKey = String(task?.siteType || '').toLowerCase().trim();
      const rawWork = String(task?.workType || '').trim();
      const workKey = rawWork.toLowerCase(); // storeOperator -> storeoperator

      const all = task?.allMaterialLists || {};
      const fromKey = (k) => {
        const list = all?.[k]?.materials;
        return Array.isArray(list) ? list : null;
      };

      const primaryKey = `${siteKey}_${workKey}`;
      const primary = fromKey(primaryKey);
      if (primary && primary.length) return primary;

      if (workKey === 'storeoperator') {
        const dis = fromKey(`${siteKey}_dismantling`);
        if (dis && dis.length) return dis;

        const survey = fromKey(`${siteKey}_survey`);
        if (survey && survey.length) return survey;
      }

      if (workKey === 'dismantling') {
        const survey = fromKey(`${siteKey}_survey`);
        if (survey && survey.length) return survey;
      }

      const available = Array.isArray(task?.availableMaterialLists)
        ? task.availableMaterialLists
        : [];
      for (const k of available) {
        const found = fromKey(k);
        if (found && found.length) return found;
      }

      if (Array.isArray(task?.materials) && task.materials.length) return task.materials;

      return [];
    },

    buildPayload: (fields, materials, resolved) => {
      const payload = { status: fields.status, materials, notes: fields.notes };
      if (resolved.subPhase === 'surveyWork') payload.surveyType = fields.surveyType;
      return payload;
    },

    mapFormData: (material, formData, mode) => {
      const qty =
        mode === 'dismantling'
          ? (formData.quantityDismantled ?? formData.quantity ?? 1)
          : (formData.quantity ?? 1);

      const { normalizedCondition, normalizedBreakdown } = normalizeConditionPayload({
        splitByCondition: formData.splitByCondition,
        condition: formData.condition || 'good',
        qty,
        conditionBreakdown: formData.conditionBreakdown,
      });

      return {
        materialCode: String(material.id),
        name: material.name || 'Unknown',
        quantity: Number(qty || 1),
        unit: formData.unit || 'pcs',
        condition: normalizedCondition,
        conditionBreakdown: normalizedBreakdown,
        splitByCondition: !!formData.splitByCondition,
        canBeReused: formData.canBeReused ?? true,
        notes: formData.notes || '',
      };
    },
  },




  cow: {
    getMaterials: (task) => {
      // 1) If this work already has materials, show them first
      const direct = Array.isArray(task?.workData?.materials)
        ? task.workData.materials
        : [];
      if (direct.length > 0) return direct;

      const workType = String(task?.workType || '').toLowerCase(); // "survey" | "inventory" | ...
      const siteType = String(task?.siteType || '').toLowerCase(); // "source" | "destination"

      // helper to safely read lists
      const getList = (key) => {
        const list = task?.allMaterialLists?.[key]?.materials;
        return Array.isArray(list) ? list : [];
      };

      // ✅ IMPORTANT: destination survey should show source survey (carry-over)
      if (workType === 'survey' && siteType === 'destination') {
        const sourceSurvey = getList('source_survey');
        if (sourceSurvey.length > 0) return sourceSurvey;

        // optional fallback if someday you add destination_survey
        const destSurvey = getList('destination_survey');
        if (destSurvey.length > 0) return destSurvey;
      }

      // ✅ Your existing rule: inventory should show survey carry-over for both sides
      if (workType === 'inventory') {
        // Prefer matching by site if you ever add destination_survey later
        const key = siteType === 'destination' ? 'destination_survey' : 'source_survey';

        const list = getList(key);
        if (list.length > 0) return list;

        // fallback to source_survey
        const sourceSurvey = getList('source_survey');
        if (sourceSurvey.length > 0) return sourceSurvey;
      }

      return [];
    },

    buildPayload: (fields, materials, resolved) => {
      const payload = { status: fields.status, materials, notes: fields.notes };

      if (fields.status === 'in-progress') payload.startTime = new Date();
      else if (fields.status === 'completed') payload.endTime = new Date();

      if (resolved.subPhase === 'transportationWork') {
        payload.vehicleNumber = fields.vehicleNumber || '';
        payload.driverName = fields.driverName || '';
        payload.driverContact = fields.driverContact || '';
      } else if (resolved.subPhase === 'installationWork') {
        payload.equipmentInstalled = fields.equipmentInstalled || [];
      }

      return payload;
    },

    mapFormData: (material, formData, mode, task) => {
      const existingMaterial = task?.workData?.materials?.find(
        (m) => m.materialCode === String(material.id)
      );

      const qty = formData.quantity ?? existingMaterial?.quantity ?? 1;

      const { normalizedCondition, normalizedBreakdown } = normalizeConditionPayload({
        splitByCondition: formData.splitByCondition,
        condition: formData.condition || existingMaterial?.condition || 'good',
        qty,
        conditionBreakdown:
          formData.conditionBreakdown || existingMaterial?.conditionBreakdown,
      });

      return {
        materialCode: String(material.id),
        name: material.name || existingMaterial?.name || 'Unknown',
        quantity: qty,
        unit: formData.unit || existingMaterial?.unit || 'pcs',
        condition: normalizedCondition,
        conditionBreakdown: normalizedBreakdown,
        splitByCondition: !!formData.splitByCondition,
        canBeReused: formData.canBeReused ?? existingMaterial?.canBeReused ?? true,
        notes: formData.notes || existingMaterial?.notes || '',
      };
    },
  },





};

// ========== UTILITY FUNCTIONS ==========
const getStatusValue = (task, isRelocation, isDismantling, resolved) => {
  if (!task) return 'in-progress';

  if (isRelocation) return task.workStatus === 'completed' ? 'completed' : 'in-progress';

  if (isDismantling) {
    const phaseStatus = task?.[resolved?.phase || 'survey']?.status || task?.status;
    return phaseStatus === 'completed' ? 'completed' : 'in-progress';
  }

  const workDataStatus = task.workData?.status || task.status;
  return workDataStatus === 'completed' ? 'completed' : 'in-progress';
};

const getInitialFields = (task, isDismantling, isRelocation, isCOW, resolved, mode) => {
  const fields = { ...INITIAL_FIELDS };
  if (!task) return fields;

  fields.status = getStatusValue(task, isRelocation, isDismantling, resolved);

  if (isDismantling) {
    const phase = resolved?.phase || 'survey';
    const phaseData = task?.[phase] || {};

    if (phase === 'survey') fields.report = phaseData.report || task?.survey?.report || '';
    else if (phase === 'dispatch') {
      fields.destinationlocation = phaseData.destinationlocation || 'own-store';
      fields.destinationDetails = phaseData.destinationDetails || '';
      fields.receiverName = phaseData.receiverName || '';
    } else if (phase === 'dismantling') fields.notes = phaseData.issuesEncountered || '';
  }

  if (isRelocation) {
    fields.surveyType = task.surveyType || '';
    fields.notes = task.notes || '';
  }

  if (isCOW) {
    const workData = task.workData || {};
    fields.notes = workData.notes || '';

    if (mode === 'transportation') {
      fields.vehicleNumber = workData.vehicleNumber || '';
      fields.driverName = workData.driverName || '';
      fields.driverContact = workData.driverContact || '';
    } else if (mode === 'installation') {
      fields.equipmentInstalled = workData.equipmentInstalled || [];
    }
  }

  return fields;
};

const getExistingMaterials = (task, activityType, resolved, mode) => {
  if (!task) return [];
  const handler = ACTIVITY_HANDLERS[activityType];
  if (!handler) return [];
  return handler.getMaterials(task, resolved, mode);
};

const buildMaterialsPayload = (
  selectedMaterials,
  formData,
  mode,
  activityType,
  task,
  resolved
) => {
  const handler = ACTIVITY_HANDLERS?.[activityType];

  // ✅ MINIMUM FIX: avoid crash + log why
  if (!handler || typeof handler.mapFormData !== 'function') {

    return []; // prevents TypeError
  }

  return selectedMaterials.map((materialId) => {
    const meta = MATERIALS_LIST.find((m) => String(m.id) === String(materialId));
    const materialData = { id: materialId, name: meta?.name || 'Unknown' };

    return handler.mapFormData(
      materialData,
      formData?.[materialId] || {},
      mode,
      task,
      resolved
    );
  });
};


const getDefaultMaterialData = (phase = 'survey', activityType = 'dismantling') => {
  if (activityType === 'dismantling') {
    if (phase === 'survey') {
      return {
        quantity: 1,
        unit: 'pcs',
        condition: 'good',
        conditionBreakdown: { ...DEFAULT_BREAKDOWN },
        splitByCondition: false,
        canBeReused: true,
        notes: '',
      };
    }
    if (phase === 'dismantling') {
      return {
        quantityDismantled: 1,
        conditionAfterDismantling: 'good',
        conditionBreakdown: { ...DEFAULT_BREAKDOWN },
        splitByCondition: false,
        damageNotes: '',
        canBeReused: true,
      };
    }
    if (phase === 'dispatch') {
      return {
        quantity: 1,
        condition: 'good',
        conditionBreakdown: { ...DEFAULT_BREAKDOWN },
        splitByCondition: false,
        canBeReused: true,
        notes: '',
        unit: 'pcs',
      };
    }
  }

  return {
    quantity: 1,
    unit: 'pcs',
    condition: 'good',
    conditionBreakdown: { ...DEFAULT_BREAKDOWN },
    splitByCondition: false,
    canBeReused: true,
    notes: '',
  };
};

// ========== MAIN COMPONENT ==========
export const TaskWorkDialog = ({ open, onOpenChange, task, onUpdated, onClose }) => {


  const { mutate: updatePhase } = useUpdatePhase();
  const [saving, setSaving] = useState(false);

  const isDismantling = task?.activityType === 'dismantling';
  const isRelocation = task?.activityType === 'relocation';
  const isCOW = task?.activityType === 'cow';
  const activityType = task?.activityType;

  const resolved = useMemo(() => resolveModule(task), [task]);
  const mode = useMemo(() => resolveMode(task), [task]);

  const [fields, setFields] = useState(INITIAL_FIELDS);
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [formData, setFormData] = useState({});
  const [materialsSearch, setMaterialsSearch] = useState('');

  const filteredMaterials = useMemo(() => {
    const term = materialsSearch.trim().toLowerCase();
    if (!term) return MATERIALS_LIST;
    return MATERIALS_LIST.filter((m) => m.name.toLowerCase().includes(term));
  }, [materialsSearch]);

  // ========== INITIALIZATION ==========
  useEffect(() => {
    if (!task || !open) return;

    setMaterialsSearch('');

    const initialFields = getInitialFields(
      task,
      isDismantling,
      isRelocation,
      isCOW,
      resolved,
      mode
    );
    setFields(initialFields);

    const existingMaterials = getExistingMaterials(task, activityType, resolved, mode);

    if (existingMaterials && existingMaterials.length > 0) {
      const keys = existingMaterials
        .map((m) => {
          if (isDismantling) return m.materialId || m.id || (m._id ? String(m._id) : null);
          return m.materialId || m.materialCode || m.id || (m._id ? String(m._id) : null);
        })
        .filter(Boolean);

      setSelectedMaterials(keys);

      const mappedData = {};

      existingMaterials.forEach((material) => {
        const key = isDismantling
          ? (material.materialId || material.id || (material._id ? String(material._id) : null))
          : (material.materialId || material.materialCode || material.id || (material._id ? String(material._id) : null));

        if (!key) return;

        const savedBreakdown = material.conditionBreakdown
          ? { ...DEFAULT_BREAKDOWN, ...material.conditionBreakdown }
          : { ...DEFAULT_BREAKDOWN };

        const total =
          Number(savedBreakdown.excellent || 0) +
          Number(savedBreakdown.good || 0) +
          Number(savedBreakdown.fair || 0) +
          Number(savedBreakdown.poor || 0) +
          Number(savedBreakdown.scrap || 0);

        const nonZeroBuckets = Object.values(savedBreakdown).filter((v) => Number(v) > 0).length;

        const inferredSplit =
          typeof material.splitByCondition === 'boolean'
            ? material.splitByCondition
            : (total > 0 && nonZeroBuckets > 1);

        // ✅ IMPORTANT FIX:
        // If dispatch is carrying from dismantling, many items have quantityDismantled but NOT quantity.
        // Dispatch UI reads f.quantity, so we derive quantity from quantityDismantled when quantity is missing.
        const q = Number(material.quantity ?? material.quantityDismantled ?? 1);

        mappedData[key] = {
          // ✅ this is what fixes the "store/dispatch showing 1" issue
          quantity: q,

          // keep this too for dismantling phase UI
          quantityDismantled:
            material.quantityDismantled != null
              ? Number(material.quantityDismantled)
              : (material.quantity != null ? Number(material.quantity) : undefined),

          unit: material.unit || 'pcs',

          condition: material.condition || 'good',
          conditionAfterDismantling:
            material.conditionAfterDismantling || material.condition || 'good',

          conditionBreakdown: savedBreakdown,
          splitByCondition: inferredSplit,

          canBeReused: material.canBeReused ?? true,
          notes: material.notes || '',
          damageNotes: material.damageNotes || '',
          dismantlingDate: material.dismantlingDate
            ? toDateInputValue(material.dismantlingDate)
            : '',
        };
      });

      setFormData(mappedData);
    } else {
      setSelectedMaterials([]);
      setFormData({});
    }
  }, [
    task,
    open,
    isDismantling,
    isRelocation,
    isCOW,
    activityType,
    resolved,
    mode,
  ]);


  // ========== FORM HANDLERS ==========
  const handleFieldChange = (key, value) => setFields((prev) => ({ ...prev, [key]: value }));

  const handleMaterialToggle = (materialId) => {
    setSelectedMaterials((prev) => {
      const exists = prev.includes(materialId);
      const phase = resolved?.phase || 'survey';

      if (exists) {
        setFormData((prevData) => {
          const { [materialId]: _, ...rest } = prevData;
          return rest;
        });
        return prev.filter((id) => id !== materialId);
      }

      const defaultData = getDefaultMaterialData(phase, activityType);
      setFormData((prevData) => ({
        ...prevData,
        [materialId]: prevData[materialId] ? { ...defaultData, ...prevData[materialId] } : defaultData,
      }));

      return [...prev, materialId];
    });
  };

  const safeOnOpenChange = (nextOpen) => {
    if (typeof onOpenChange === 'function') onOpenChange(nextOpen);
  };

  // ========== SAVE HANDLER ==========
  const handleSaveClick = async () => {
    if (!task || !resolved || !activityType) {
      toast.error('Missing task data');
      return;
    }

    const activityId = task.parentActivityId;
    if (!activityId) {
      toast.error('Parent Activity ID missing');
      return;
    }

    try {
      setSaving(true);

      const materials = buildMaterialsPayload(selectedMaterials, formData, mode, activityType, task, resolved);


      if (!materials.length && selectedMaterials.length) {
        toast.error('Mapping missing (mapFormData). Check console log.');
        setSaving(false);
        return;
      }


      const invalidMaterials = materials.filter((m) => {
        if (isDismantling && resolved.phase === 'dismantling') return !m.quantityDismantled || m.quantityDismantled < 1;
        return !m.quantity || m.quantity < 1;
      });

      if (invalidMaterials.length > 0) {
        toast.error('Please ensure all materials have valid quantities (minimum 1)');
        setSaving(false);
        return;
      }

      const handler = ACTIVITY_HANDLERS[activityType];
      if (!handler) throw new Error(`No handler for activity type: ${activityType}`);

      const updates = handler.buildPayload(fields, materials, resolved);

      const payload = {
        activityType,
        activityId,
        phase: resolved.phase,
        ...(resolved.subPhase ? { subPhase: resolved.subPhase } : {}),
        updates,
      };

      await updatePhase(payload);

      onUpdated?.(updates);
      toast.success('Saved successfully');
      safeOnOpenChange(false);
    } catch (err) {
      console.error('❌ Save error:', err);
      toast.error(err?.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-card border-border">
        <DialogHeaderMeta task={task} mode={mode} resolved={resolved} />

        <ScrollArea className="h-[60vh] pr-3">
          <div className="space-y-6">
            <WorkFieldsSection
              task={task}
              resolved={resolved}
              mode={mode}
              fields={fields}
              onFieldChange={handleFieldChange}
              isDismantling={isDismantling}
              isRelocation={isRelocation}
              isCOW={isCOW}
            />

            <MaterialsSelectSection
              filteredMaterials={filteredMaterials}
              selectedMaterials={selectedMaterials}
              materialsSearch={materialsSearch}
              setMaterialsSearch={setMaterialsSearch}
              onToggle={handleMaterialToggle}
              existingMaterialCodes={task?.workData?.materials?.map((m) => m.materialCode) || []}
            />

            <MaterialsDetailsSection
              mode={mode}
              selectedMaterials={selectedMaterials}
              formData={formData}
              setFormData={setFormData}
              MATERIALS_LIST={MATERIALS_LIST}
              onRemove={handleMaterialToggle}
              isDismantling={isDismantling}
              resolved={resolved}
            />
          </div>
        </ScrollArea>

        <DialogFooterActions saving={saving} onCancel={() => onClose()} onSave={handleSaveClick} />
      </DialogContent>
    </Dialog>
  );
};
