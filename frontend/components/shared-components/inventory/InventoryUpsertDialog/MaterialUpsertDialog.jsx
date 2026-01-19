'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { useVendorManagement } from '@/hooks/useVendorManagement';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

import MaterialNameField, { autoCodeFromName } from './MaterialNameField';

const CATEGORY_OPTIONS = [
  'civil',
  'telecom',
  'tower',
  'shelter',
  'power',
  'air_conditioning',
  'security',
  'furniture',
];

const CATEGORY_CUSTOM_VALUE = '__custom__';
const CONDITION_OPTIONS = ['excellent', 'good', 'fair', 'poor', 'scrap'];

const normalizeCategory = (v) =>
  String(v || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_');

const specsArrayToObject = (pairs = []) => {
  const out = {};
  pairs.forEach((p) => {
    const k = String(p.key || '').trim();
    const v = String(p.value || '').trim();
    if (!k) return;
    out[k] = v;
  });
  return out;
};

const specObjectToPairs = (specs) => {
  if (!specs || typeof specs !== 'object') return [{ key: '', value: '' }];
  const entries = Object.entries(specs);
  if (!entries.length) return [{ key: '', value: '' }];
  return entries.map(([k, v]) => ({ key: k, value: String(v ?? '') }));
};

const makeEmptyRow = (defaults = {}) => ({
  id: undefined,

  materialCode: '',
  materialName: '',

  // ✅ category fixed
  category: '',
  isCustomCategory: false,
  customCategory: '',

  // ✅ location default
  location: defaults.location || '',
  locationName: defaults.locationName || '',

  unit: 'piece',
  pricePerUnit: '',
  quantity: 1,
  condition: 'good',

  vendor: '',
  specifications: [{ key: '', value: '' }],
});

const makeRowFromItem = (item = {}, defaults = {}) => {
  const cat = normalizeCategory(item?.category || '');
  const isKnown = CATEGORY_OPTIONS.includes(cat);

  return {
    id: item?._id,

    materialCode: item?.materialCode || '',
    materialName: item?.materialName || '',

    category: isKnown ? cat : '',
    isCustomCategory: !isKnown && !!cat,
    customCategory: isKnown ? '' : cat,

    location: item?.location || defaults.location || '',
    locationName: item?.locationName || defaults.locationName || '',

    unit: item?.unit || 'piece',
    pricePerUnit: item?.pricePerUnit ?? '',
    quantity: 1,
    condition: 'good',

    vendor: item?.vendor?._id || item?.vendor || '',
    specifications: specObjectToPairs(item?.specifications || {}),
  };
};

export default function MaterialUpsertDialog({
  items,
  open,
  onOpenChange,
  mode = 'create',
  initialItem = null,
  defaultLocation,
  defaultLocationName,
  manualBulkAdd,
  updateInventorySingle,
  isCreating,
  isUpdating,
  onDone,
}) {
  const defaults = useMemo(
    () => ({
      location: defaultLocation || '',
      locationName: defaultLocationName || '',
    }),
    [defaultLocation, defaultLocationName]
  );

  // Vendors
  const { vendorDropdown, dropdownLoading } = useVendorManagement({
    autoLoadDropdown: true,
  });

  const vendorsForSelect = useMemo(() => {
    if (!Array.isArray(vendorDropdown)) return [];
    return vendorDropdown
      .map((v) => ({
        id: String(v?._id || ''),
        label:
          v?.name ||
          v?.vendorName ||
          v?.companyName ||
          v?.title ||
          String(v?._id || ''),
        type: v?.type,
      }))
      .filter((v) => v.id);
  }, [vendorDropdown]);

  const [rows, setRows] = useState([makeEmptyRow(defaults)]);

  useEffect(() => {
    if (!open) return;

    if (mode === 'edit') {
      setRows([makeRowFromItem(initialItem, defaults)]);
      return;
    }

    if (initialItem) {
      setRows([
        {
          ...makeEmptyRow(defaults),
          materialCode: initialItem.materialCode || '',
          materialName: initialItem.materialName || '',
          unit: initialItem.unit || 'piece',
          quantity: Number(initialItem.quantity || 1),
          location: initialItem.location ?? defaults.location ?? '',
          locationName: initialItem.locationName ?? defaults.locationName ?? '',
          category: normalizeCategory(initialItem.category || ''),
        },
      ]);
      return;
    }

    setRows([makeEmptyRow(defaults)]);
  }, [open, mode, initialItem, defaults]);

  const busy = mode === 'edit' ? Boolean(isUpdating) : Boolean(isCreating);

  const addRow = () => setRows((prev) => [...prev, makeEmptyRow(defaults)]);
  const removeRow = (idx) => setRows((prev) => prev.filter((_, i) => i !== idx));
  const updateRow = (idx, patch) =>
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const addSpec = (idx) => {
    setRows((prev) =>
      prev.map((r, i) =>
        i === idx
          ? { ...r, specifications: [...(r.specifications || []), { key: '', value: '' }] }
          : r
      )
    );
  };

  const removeSpec = (idx, specIdx) => {
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== idx) return r;
        const next = (r.specifications || []).filter((_, s) => s !== specIdx);
        return { ...r, specifications: next.length ? next : [{ key: '', value: '' }] };
      })
    );
  };

  const updateSpec = (idx, specIdx, patch) => {
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== idx) return r;
        const next = (r.specifications || []).map((sp, s) =>
          s === specIdx ? { ...sp, ...patch } : sp
        );
        return { ...r, specifications: next };
      })
    );
  };

  // ✅ This is the “simple” auto-fill you want: called when user selects browse item
  const handleSelectExisting = (idx, selectedItem) => {
    if (!selectedItem) return;

    const cat = normalizeCategory(selectedItem.category || '');
    const isKnown = CATEGORY_OPTIONS.includes(cat);

    updateRow(idx, {
      materialCode: selectedItem.materialCode || '',
      materialName: selectedItem.materialName || '',

      // category mapping
      category: isKnown ? cat : '',
      isCustomCategory: !isKnown && !!cat,
      customCategory: isKnown ? '' : cat,

      // ✅ auto location
      location: selectedItem.location || defaults.location || '',
      locationName: selectedItem.locationName || defaults.locationName || '',

      unit: selectedItem.unit || 'piece',
      pricePerUnit: selectedItem.pricePerUnit ?? '',
      vendor: selectedItem.vendor?._id || selectedItem.vendor || '',
      specifications: specObjectToPairs(selectedItem.specifications || {}),
    });

    toast.info(`Auto-filled from: ${selectedItem.materialCode}`);
  };

  const validateRows = () => {
    const errors = [];

    rows.forEach((r, index) => {
      const rowNo = index + 1;

      if (mode === 'edit') {
        if (!r.id) errors.push(`Row ${rowNo}: missing id`);
      }

      if (!String(r.materialCode || '').trim()) errors.push(`Row ${rowNo}: materialCode is required`);
      if (!String(r.materialName || '').trim()) errors.push(`Row ${rowNo}: materialName is required`);
      if (!String(r.location || '').trim()) errors.push(`Row ${rowNo}: location is required`);
      if (!String(r.vendor || '').trim()) errors.push(`Row ${rowNo}: vendor is required`);

      const price = Number(r.pricePerUnit);
      if (!Number.isFinite(price) || price <= 0) errors.push(`Row ${rowNo}: price per unit must be > 0`);

      if (mode === 'create') {
        const qty = Number(r.quantity);
        if (!Number.isFinite(qty) || qty <= 0) errors.push(`Row ${rowNo}: quantity must be > 0`);
      }

      if (r.isCustomCategory && !String(r.customCategory || '').trim()) {
        errors.push(`Row ${rowNo}: custom category is required`);
      }
    });

    return errors;
  };

  const buildCreateItems = () =>
    rows.map((r) => {
      const existingItem = items?.find(
        (it) => it?.materialCode === r.materialCode && it?.location === r.location
      );

      const categoryFinal = r.isCustomCategory
        ? normalizeCategory(r.customCategory || '')
        : normalizeCategory(r.category || '');

      return {
        ...(existingItem ? { _id: existingItem._id, updateExisting: true } : {}),
        materialCode: String(r.materialCode || '').trim(),
        materialName: String(r.materialName || '').trim(),
        category: categoryFinal || 'others',
        location: String(r.location || '').trim(),
        locationName: String(r.locationName || '').trim() || undefined,
        quantity: Number(r.quantity || 1),
        condition: String(r.condition || 'good').toLowerCase(),
        unit: String(r.unit || 'piece').trim() || 'piece',
        vendor: String(r.vendor || '').trim() || undefined,
        pricePerUnit: Number(r.pricePerUnit),
        specifications: specsArrayToObject(r.specifications || []),
      };
    });

  const buildEditPayload = (r) => ({
    id: r.id,
    materialCode: String(r.materialCode || '').trim(),
    materialName: String(r.materialName || '').trim(),
    category: (r.isCustomCategory ? normalizeCategory(r.customCategory) : normalizeCategory(r.category)) || 'others',
    location: String(r.location || '').trim(),
    locationName: String(r.locationName || '').trim() || undefined,
    unit: String(r.unit || 'piece').trim() || 'piece',
    vendor: String(r.vendor || '').trim() || undefined,
    pricePerUnit: Number(r.pricePerUnit),
    specifications: specsArrayToObject(r.specifications || []),
  });

  const onSubmit = async () => {
    // auto generate code if missing
    setRows((prev) =>
      prev.map((r) => {
        const name = String(r.materialName || '').trim();
        const code = String(r.materialCode || '').trim();
        if (!code && name) return { ...r, materialCode: autoCodeFromName(name) };
        return r;
      })
    );

    const errs = validateRows();
    if (errs.length) return toast.error(errs[0]);

    try {
      if (mode === 'edit') {
        const payload = buildEditPayload(rows[0]);
        const res = await updateInventorySingle(payload);

        if (res?.success) {
          toast.success(res?.message || 'Item updated');
          onOpenChange(false);
          onDone?.(res);
        } else {
          toast.error(res?.message || 'Update failed');
        }
        return;
      }

      const itemsToCreate = buildCreateItems();
      const res = await manualBulkAdd(itemsToCreate);

      if (res?.success) {
        toast.success(res?.message || 'Saved');
        onOpenChange(false);
        onDone?.(res);
      } else {
        toast.error(res?.message || 'Some items failed');
      }
    } catch (e) {
      toast.error(e?.message || 'Request failed');
    }
  };

  const title = mode === 'edit' ? 'Edit Material' : 'Add Materials';
  const desc =
    mode === 'edit'
      ? 'Update this material fields.'
      : 'Select from existing to auto-fill, or type custom and generate code.';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[980px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
          <DialogDescription>{desc}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[62vh] pr-3">
          <div className="space-y-4 py-2">
            {rows.map((row, idx) => (
              <div
                key={row?.id || idx}
                className="rounded-xl border border-border bg-background/40 p-4 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">
                    {mode === 'edit' ? 'Editing Item' : `Material #${idx + 1}`}
                  </p>

                  {mode === 'create' && rows.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="gap-2"
                      onClick={() => removeRow(idx)}
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Material Name + Code (with browse + search + auto-fill) */}
                  <div className="space-y-2 md:col-span-2">
                    <Label>Material Name / Code *</Label>

                    <MaterialNameField
                      items={items} // ✅ FULL DB ITEMS
                      valueName={row.materialName}
                      valueCode={row.materialCode}
                      onChangeName={(name) => updateRow(idx, { materialName: name })}
                      onChangeCode={(code) => updateRow(idx, { materialCode: code })}
                      onSelectItem={(selectedItem) => handleSelectExisting(idx, selectedItem)}
                    />

                  
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label>Category</Label>

                    <Select
                      value={
                        row.isCustomCategory
                          ? CATEGORY_CUSTOM_VALUE
                          : row.category || ''
                      }
                      onValueChange={(v) => {
                        if (v === CATEGORY_CUSTOM_VALUE) {
                          updateRow(idx, {
                            isCustomCategory: true,
                            customCategory: row.customCategory || '',
                            category: '',
                          });
                        } else {
                          updateRow(idx, {
                            isCustomCategory: false,
                            category: v,
                            customCategory: '',
                          });
                        }
                      }}
                    >
                      <SelectTrigger className="border-border w-full min-w-0">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>

                      <SelectContent>
                        {CATEGORY_OPTIONS.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c.replace(/_/g, ' ')}
                          </SelectItem>
                        ))}

                        <div className="px-2 py-1">
                          <div className="h-px bg-border" />
                        </div>

                        <SelectItem value={CATEGORY_CUSTOM_VALUE}>Custom…</SelectItem>
                      </SelectContent>
                    </Select>

                    {row.isCustomCategory && (
                      <Input
                        value={row.customCategory || ''}
                        onChange={(e) =>
                          updateRow(idx, {
                            customCategory: normalizeCategory(e.target.value),
                          })
                        }
                        placeholder="Type custom category"
                      />
                    )}
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <Label>Location *</Label>
                    <Input
                      value={row.location}
                      onChange={(e) => updateRow(idx, { location: e.target.value })}
                      placeholder="global / warehouse-2"
                    />
                  </div>

                  {/* Location Name */}
                  <div className="space-y-2">
                    <Label>Location Name</Label>
                    <Input
                      value={row.locationName}
                      onChange={(e) => updateRow(idx, { locationName: e.target.value })}
                      placeholder="Global Store"
                    />
                  </div>

                  {/* Quantity + Condition */}
                  {mode === 'create' && (
                    <>
                      <div className="space-y-2">
                        <Label>Quantity *</Label>
                        <Input
                          type="number"
                          min={1}
                          value={row.quantity}
                          onChange={(e) => updateRow(idx, { quantity: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Condition</Label>
                        <Select
                          value={row.condition || 'good'}
                          onValueChange={(v) => updateRow(idx, { condition: v })}
                        >
                          <SelectTrigger className="border-border w-full min-w-0">
                            <SelectValue placeholder="Select condition" />
                          </SelectTrigger>
                          <SelectContent>
                            {CONDITION_OPTIONS.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {/* Unit */}
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Input
                      value={row.unit}
                      onChange={(e) => updateRow(idx, { unit: e.target.value })}
                      placeholder="pcs"
                    />
                  </div>

                  {/* Price */}
                  <div className="space-y-2">
                    <Label>Price per Unit *</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={row.pricePerUnit}
                      onChange={(e) => updateRow(idx, { pricePerUnit: e.target.value })}
                      placeholder="1200"
                    />
                  </div>

                  {/* Vendor */}
                  <div className="space-y-2 ">
                    <Label>Vendor *</Label>
                    <Select
                      value={row.vendor || ''}
                      onValueChange={(v) => updateRow(idx, { vendor: v })}
                      disabled={dropdownLoading}
                    >
                      <SelectTrigger className="border-border w-full min-w-0">
                        <SelectValue
                          placeholder={dropdownLoading ? 'Loading vendors...' : 'Select vendor'}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {vendorsForSelect.length === 0 ? (
                          <SelectItem value="__none__" disabled>
                            No vendors found
                          </SelectItem>
                        ) : (
                          vendorsForSelect.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.label}
                              {v.type ? ` (${v.type})` : ''}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Specifications */}
                <div className="rounded-lg border border-border bg-card p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Specifications (key/value)</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => addSpec(idx)}
                    >
                      <Plus className="w-4 h-4" /> Add Spec
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {(row.specifications || []).map((sp, sIdx) => (
                      <div key={sIdx} className="grid grid-cols-1 md:grid-cols-7 gap-2">
                        <div className="md:col-span-3">
                          <Input
                            value={sp.key}
                            onChange={(e) => updateSpec(idx, sIdx, { key: e.target.value })}
                            placeholder="e.g. capacity"
                          />
                        </div>
                        <div className="md:col-span-3">
                          <Input
                            value={sp.value}
                            onChange={(e) => updateSpec(idx, sIdx, { value: e.target.value })}
                            placeholder="e.g. 10kVA"
                          />
                        </div>
                        <div className="md:col-span-1 flex items-center justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSpec(idx, sIdx)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Tip: specs must be simple strings.
                  </div>
                </div>
              </div>
            ))}

            {mode === 'create' && (
              <div className="flex items-center">
                <Button onClick={addRow} className="gap-2">
                  <Plus className="w-4 h-4" /> Add Material
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={busy}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            <Save className="w-4 h-4" />
            {busy ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Save Materials'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
