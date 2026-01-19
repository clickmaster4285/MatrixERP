'use client';

import { useMemo, useState, useCallback } from 'react';
import { CheckCircle2, Package, Clock, AlertTriangle, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

import { useInventoryManagement } from '@/hooks/useInventoryManagement';
import { useDirectAllocateSurveyMaterials } from '@/features/inventoryRequestsApi';
import { useUpdatePhase } from '@/features/taskApi';
import AddMissingInventoryDialog from './AddMissingInventoryDialog';

const STORE_OPTIONS = [
  { value: 'own', label: 'Own Store' },
  { value: 'ptcl', label: 'PTCL' },
  { value: 'ufone', label: 'Ufone' },
  { value: 'zong', label: 'Zong' },
  { value: 'custom', label: 'Custom' },
];

const StatusIcon = ({ ok }) => {
  return ok ? (
    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
  ) : (
    <Clock className="w-4 h-4 text-amber-600" />
  );
};

export default function SurveyMaterialsAllocateDialog({
  open,
  onOpenChange,
  surveyMaterials = [],
  task,
  defaultLocation,
  defaultLocationName,
  isCreating = false,
}) {
  const { dropdownItems: allInventoryItems, isLoading: inventoryLoading } =
    useInventoryManagement({ defaultLocation });

  const { mutate: directAllocate, isPending: isAllocating } =
    useDirectAllocateSurveyMaterials();

  const { mutate: updatePhase, isPending: isUpdatingPhase } = useUpdatePhase();

  // store selector on top (one time selection for all)
  const [takenFrom, setTakenFrom] = useState('own');
  const [takenFromCustom, setTakenFromCustom] = useState('');

  // (optional) local patch: only for UI refresh after missing saved
  const [localAddedStock, setLocalAddedStock] = useState(() => new Map());

  const handleMissingSaved = useCallback((added = []) => {
    // added: [{ materialCode, quantity }]
    setLocalAddedStock((prev) => {
      const next = new Map(prev);
      for (const a of added) {
        const code = String(a?.materialCode || '').trim().toUpperCase();
        const qty = Number(a?.quantity || 0) || 0;
        if (!code || qty <= 0) continue;
        next.set(code, (next.get(code) || 0) + qty);
      }
      return next;
    });
  }, []);

  const inventoryAvailableByCode = useMemo(() => {
    const map = new Map();
    for (const item of allInventoryItems || []) {
      const code = String(item?.materialCode || '').trim().toUpperCase();
      if (!code) continue;
      const qty = Number(item?.availableQuantity ?? item?.quantity ?? 0) || 0;
      map.set(code, (map.get(code) || 0) + qty);
    }

    // only used for UI instantly after missing purchase save
    for (const [code, qty] of localAddedStock.entries()) {
      map.set(code, (map.get(code) || 0) + qty);
    }

    return map;
  }, [allInventoryItems, localAddedStock]);

  const requiredMaterials = useMemo(() => {
    const map = new Map();

    for (const m of surveyMaterials || []) {

      const code = String(m?.materialCode || '').trim().toUpperCase();
      if (!code) continue;
console.log("m", m)
      const materialName = String(m?.name || m?.materialName || 'Unknown').trim();
      console.log("material name", materialName )
      const unit = String(m?.unit || 'pcs').trim() || 'pcs';
      const condition = String(m?.condition || 'good').toLowerCase().trim();
      const qty = Number(m?.quantity || 0) || 0;
      if (qty <= 0) continue;

      const key = `${code}__${condition}__${unit}`;

      const prev = map.get(key);
      if (!prev) {
        map.set(key, {
          materialCode: code,
          name: materialName,         // ✅ keep for your UI
          materialName: materialName, // ✅ keep for backend/schema
          unit,
          condition,
          quantity: qty,
        });
      } else {
        prev.quantity += qty;
        if (prev.name === 'Unknown' && materialName && materialName !== 'Unknown') {
          prev.name = materialName;
          prev.materialName = materialName;
        }
      }
    }

    return Array.from(map.values());
  }, [surveyMaterials]);



  const { missingItems, restItems } = useMemo(() => {
    const missing = [];
    const rest = [];

    for (const m of requiredMaterials) {
      const avail = inventoryAvailableByCode.get(m.materialCode) || 0;

      const missingQty = Math.max(m.quantity - avail, 0);
      const availableQty = Math.min(avail, m.quantity);

      if (missingQty > 0) {
        missing.push({
          materialCode: m.materialCode,
          name: m.name,
          unit: m.unit,
          quantity: m.quantity,
          missingQty,
          availableQty,
        });
      }

      // ✅ only the part that can be fulfilled
      if (availableQty > 0) {
        rest.push({
          materialCode: m.materialCode,
          name: m.name,
          unit: m.unit,
          quantity: availableQty,
          condition: m.condition,
        });
      }
    }

    return { missingItems: missing, restItems: rest };
  }, [requiredMaterials, inventoryAvailableByCode]);

  const hasMissing = missingItems.length > 0;

  const [openAddMissingDialog, setOpenAddMissingDialog] = useState(false);
  const startPurchase = () => setOpenAddMissingDialog(true);

  const phaseKey =
    task?.phase === 'destinationSite' || task?.siteType === 'destination'
      ? 'destinationSite'
      : 'sourceSite';

  const handlePrimaryAction = () => {
    if (!task?.parentActivityId || !task?.activityType) return;

    if (takenFrom === 'custom' && !takenFromCustom.trim()) {
      toast.error('Enter custom store name');
      return;
    }

    // ✅ OWN STORE: only allow allocate if there is NO missing
    if (takenFrom === 'own') {
      if (requiredMaterials.length === 0) return;

      if (hasMissing) {
        toast.error('Insufficient stock. Add missing first.');
        return;
      }
      console.log("requiredMaterials")
      // allocate full required (since no missing)
      directAllocate(
        {
          activityType: task.activityType,
          activityId: task.parentActivityId,
          phase: phaseKey,
          subPhase: 'inventoryWork',
          materials: requiredMaterials,
        },
        {
          onSuccess: () => {
            toast.success('Materials allocated and deducted from inventory');
            onOpenChange(false);
          },
          onError: (err) => {
            toast.error('Allocation failed');
            console.error(err);
          },
        }
      );

      return;
    }


    // ✅ OTHER STORES: Save (no deduction)
    const updates = {
      materials: requiredMaterials.map((m) => ({
        materialCode: m.materialCode,
        name: String(m.name || m.materialName || '').trim(),
        materialName: String(m.materialName || m.name || '').trim(),
        unit: m.unit,
        condition: m.condition,
        quantity: m.quantity,
        takenFrom,
        takenFromCustom: takenFrom === 'custom' ? takenFromCustom.trim() : '',
      })),
    };

    updatePhase(
      {
        activityType: task.activityType,
        activityId: task.parentActivityId,
        phase: phaseKey,
        subPhase: 'inventoryWork',
        updates,
      },
      {
        onSuccess: () => {
          toast.success('Materials saved (no inventory deduction)');
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error('Failed to save materials');
          console.error(err);
        },
      }
    );

    return; // ✅ important: stop here


    updatePhase(
      {
        activityType: task.activityType,
        activityId: task.parentActivityId,
        phase: phaseKey,
        subPhase: 'inventoryWork',
        updates,
      },
      {
        onSuccess: () => {
          toast.success('Materials saved (no inventory deduction)');
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error('Failed to save materials');
          console.error(err);
        },
      }
    );


    updatePhase(
      {
        activityType: task.activityType,
        activityId: task.parentActivityId,
        phase: phaseKey,
        subPhase: 'inventoryWork',
        updates,
      },
      {
        onSuccess: () => {
          toast.success('Saved available materials (no deduction)');
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error('Failed to save materials');
          console.error(err);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <DialogTitle>Materials Allocation</DialogTitle>
              <Badge variant="secondary">
                {task?.siteType === 'destination' ? 'Destination' : 'Source'} Survey
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-1">
                <Label>Taken From</Label>
                <select
                  className="w-full h-10 px-3 rounded-md border bg-background"
                  value={takenFrom}
                  onChange={(e) => setTakenFrom(e.target.value)}
                >
                  {STORE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              {takenFrom === 'custom' && (
                <div className="md:col-span-2">
                  <Label>Custom Store Name *</Label>
                  <Input
                    value={takenFromCustom}
                    onChange={(e) => setTakenFromCustom(e.target.value)}
                    placeholder="e.g. Local Supplier Shop"
                  />
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Only show stock alert for Own Store */}
            {takenFrom === 'own' && hasMissing && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>{missingItems.length} material(s) are missing in stock.</span>
                  <Button size="sm" onClick={startPurchase}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add / Purchase Missing
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Required Survey Materials ({requiredMaterials.length})
              </h3>

              <div className="space-y-3">
                {requiredMaterials.map((m) => {
                  const avail = inventoryAvailableByCode.get(m.materialCode) || 0;
                  const ok = avail >= m.quantity;

                  return (
                    <div
                      key={m.materialCode}
                      className="flex justify-between items-center p-4 rounded-xl border bg-card"
                    >
                      <div>
                        <div className="font-medium">
                          {m.name} ({m.materialCode})
                        </div>
                        <div className="text-sm text-muted-foreground mt-1 flex flex-wrap items-center gap-3">
                          <StatusIcon ok={ok} />
                          <span>
                            Required: <strong>{m.quantity}</strong> {m.unit}
                          </span>
                          <span>
                            • Available: <strong>{avail}</strong>
                          </span>
                          {takenFrom !== 'own' && (
                            <Badge variant="outline" className="ml-2">
                              No deduction from inventory
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />
          </div>
        </ScrollArea>

        <DialogFooter className="mt-4 gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>

          <Button
            onClick={handlePrimaryAction}
            disabled={
              isCreating ||
              inventoryLoading ||
              isAllocating ||
              isUpdatingPhase ||
              requiredMaterials.length === 0 ||
              (takenFrom === 'own' && hasMissing) ||
              (takenFrom === 'custom' && !takenFromCustom.trim())
            }
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {takenFrom === 'own'
              ? isAllocating
                ? 'Allocating...'
                : 'Allocate & Deduct from Inventory'
              : isUpdatingPhase
                ? 'Saving...'
                : 'Save '}
          </Button>
        </DialogFooter>

        {/* Missing handled ONLY in this dialog */}
        <AddMissingInventoryDialog
          open={openAddMissingDialog}
          onOpenChange={setOpenAddMissingDialog}
          task={task}
          insufficient={missingItems}
          restMaterials={restItems}
          defaultLocation={defaultLocation}
          defaultLocationName={defaultLocationName}
          onSavedMissing={handleMissingSaved}
        />
      </DialogContent>
    </Dialog>
  );
}
