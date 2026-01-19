'use client';

import { useMemo, useState, useEffect } from 'react';
import {
    Building2,
    Store,
    Upload,
    CheckCircle2,
    AlertCircle,
    PackagePlus,
    Loader2,
    X,
    Save
} from 'lucide-react';
import { toast } from 'sonner';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

import { useCOWActivityManagement } from '@/hooks/useCOWActivityManagement';



const STORE_OPTIONS = [
    { value: 'own', label: 'Own Store' },
    { value: 'ptcl', label: 'PTCL' },
    { value: 'ufone', label: 'Ufone' },
    { value: 'zong', label: 'Zong' },
    { value: 'custom', label: 'Custom' },
];

const toCode = (v) => String(v || '').trim().toUpperCase();
const toCond = (v) => String(v || 'good').toLowerCase().trim() || 'good';

export default function AddMissingInventoryDialog({
    open,
    onOpenChange,
    task,
    defaultLocation,
    defaultLocationName,
    insufficient = [], // [{ materialCode, name, unit, missingQty, ... }]
    onSavedMissing,
    restMaterials = [], // [{ materialCode, name, unit, quantity, condition }]
}) {
    const { addMissingInventoryMaterials, isAddingMissing } =
        useCOWActivityManagement();

    // Missing store source (applies to missing section)
    const [storeSource, setStoreSource] = useState('ptcl');
    const [customStoreName, setCustomStoreName] = useState('');
    const [receipts, setReceipts] = useState([]); // File[]

    // Missing rows
    const [missingRows, setMissingRows] = useState([]);
    // Rest rows (available items user took)
    const [restRows, setRestRows] = useState([]);

    // ✅ rebuild rows every time dialog opens OR props change
    useEffect(() => {
        if (!open) return;

        setMissingRows(
            (insufficient || [])
                .map((m) => ({
                    materialCode: toCode(m?.materialCode),
                    materialName: m?.name || '',
                    unit: m?.unit || 'pcs',
                    quantity: Number(m?.missingQty || 0),
                    maxQty: Number(m?.missingQty || 0),
                    pricePerUnit: '',
                    condition: 'good',
                    notes: '',
                }))
                .filter((r) => r.materialCode && r.materialName && r.quantity > 0)
        );

        setRestRows(
            (restMaterials || [])
                .map((m) => ({
                    materialCode: toCode(m?.materialCode),
                    materialName: m?.name || '',
                    unit: m?.unit || 'pcs',
                    quantity: Number(m?.quantity || 0),
                    condition: toCond(m?.condition),
                    takenFromType: 'own', // user can change
                    pricePerUnit: '',
                    notes: '',
                }))
                .filter((r) => r.materialCode && r.materialName && r.quantity > 0)
        );

        // reset misc fields
        setStoreSource('ptcl');
        setCustomStoreName('');
        setReceipts([]);
    }, [open, insufficient, restMaterials]);

    // receipts required if custom selected anywhere
    const needsReceipts =
        storeSource === 'custom' || restRows.some((r) => r.takenFromType === 'custom');

    const handleReceiptsChange = (e) => {
        const files = Array.from(e.target.files || []);
        setReceipts(files);
    };

    const updateMissingRow = (idx, key, value) => {
        setMissingRows((prev) =>
            prev.map((r, i) => {
                if (i !== idx) return r;

                if (key === 'quantity') {
                    const v = Number(value || 0);
                    const max = Number(r.maxQty || 0);
                    const safe = Math.min(Math.max(v, 1), max || 1);
                    return { ...r, quantity: safe };
                }

                return { ...r, [key]: value };
            })
        );
    };

    const updateRestRow = (idx, key, value) => {
        setRestRows((prev) =>
            prev.map((r, i) => (i === idx ? { ...r, [key]: value } : r))
        );
    };

    const canSubmit = useMemo(() => {
        const hasMissing = missingRows.some((r) => r.quantity > 0);
        const hasRest = restRows.some((r) => r.quantity > 0);
        if (!hasMissing && !hasRest) return false;

        // custom validations (if custom anywhere)
        if (needsReceipts) {
            if (!customStoreName.trim()) return false;
            if (receipts.length === 0) return false;

            // require price only for rows where takenFromType/custom selected
            const missingNeedsPrice = storeSource === 'custom';
            if (missingNeedsPrice && missingRows.some((r) => Number(r.pricePerUnit) <= 0))
                return false;

            const restCustomRows = restRows.filter((r) => r.takenFromType === 'custom');
            if (restCustomRows.some((r) => Number(r.pricePerUnit) <= 0)) return false;
        }

        return true;
    }, [missingRows, restRows, needsReceipts, customStoreName, receipts, storeSource]);

    const handleSubmit = async () => {
        try {
            if (!task?.parentActivityId) {
                toast.error('Activity not found');
                return;
            }

            const normalizeTakenFrom = (v) => {
                const x = String(v || '').toLowerCase().trim();
                if (x === 'own') return 'own-store'; // ✅ match backend
                return x; // ptcl / ufone / zong / custom
            };

            const missingPayload = missingRows
                .filter((r) => Number(r.quantity || 0) > 0)
                .map((r) => ({
                    materialCode: toCode(r.materialCode),
                    materialName: String(r.materialName || '').trim(),
                    unit: r.unit || 'pcs',
                    quantity: Number(r.quantity || 0),
                    condition: toCond(r.condition),
                    notes: String(r.notes || ''),
                    takenFrom: normalizeTakenFrom(storeSource), // ✅ FIXED KEY + VALUE
                    takenFromCustom: storeSource === 'custom' ? customStoreName.trim() : '', // ✅ FIXED KEY
                    pricePerUnit:
                        storeSource === 'custom' ? Number(r.pricePerUnit || 0) : undefined,
                    location: defaultLocation || '',
                    locationName: defaultLocationName || '',
                }))
                .filter((r) => r.materialCode && r.materialName && r.quantity > 0);

            const restPayload = restRows
                .filter((r) => Number(r.quantity || 0) > 0)
                .map((r) => ({
                    materialCode: toCode(r.materialCode),
                    materialName: String(r.materialName || '').trim(),
                    unit: r.unit || 'pcs',
                    quantity: Number(r.quantity || 0),
                    condition: toCond(r.condition),
                    notes: String(r.notes || ''),
                    takenFrom: normalizeTakenFrom(r.takenFromType), // ✅ FIXED KEY + VALUE
                    takenFromCustom: r.takenFromType === 'custom' ? customStoreName.trim() : '', // ✅ FIXED KEY
                    pricePerUnit:
                        r.takenFromType === 'custom' ? Number(r.pricePerUnit || 0) : undefined,
                    location: defaultLocation || '',
                    locationName: defaultLocationName || '',
                }))
                .filter((r) => r.materialCode && r.materialName && r.quantity > 0);

            const allMaterials = [...missingPayload, ...restPayload];

            if (allMaterials.length === 0) {
                toast.error('Nothing to save');
                return;
            }

            await addMissingInventoryMaterials({
                activityId: task.parentActivityId,
                siteType: task?.siteType,
                materials: allMaterials,
                receipts: needsReceipts ? receipts : [],
            });

            toast.success('Saved successfully');

            if (typeof onSavedMissing === 'function' && missingPayload.length > 0) {
                onSavedMissing(
                    missingPayload.map((r) => ({
                        materialCode: r.materialCode,
                        quantity: r.quantity,
                    }))
                );
            }

            onOpenChange(false);
        } catch (err) {
            console.error(err);
            toast.error('Failed to save');
        }
    };


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <div className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-gray-50 to-white">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-gray-900">
                            Material Reconciliation
                        </DialogTitle>
                        <DialogDescription className="text-gray-600 mt-1">
                            Add missing materials and track extra materials taken
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="flex-1 overflow-auto px-6 py-4">
                    {/* Store Information Section */}
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Building2 className="w-5 h-5 text-blue-600" />
                            <h3 className="text-lg font-semibold text-gray-800">Store Information</h3>
                        </div>

                        <div className="bg-white rounded-lg border shadow-sm p-5">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="space-y-3">
                                    <div>
                                        <Label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                                            <Store className="w-5 h-5" />
                                            Source Store
                                        </Label>
                                        <select
                                            className="w-full h-11 px-4 rounded-lg border border-gray-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
                                            value={storeSource}
                                            onChange={(e) => setStoreSource(e.target.value)}
                                        >
                                            {STORE_OPTIONS.map((o) => (
                                                <option key={o.value} value={o.value}>
                                                    {o.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {needsReceipts && (
                                    <div className="lg:col-span-2 space-y-3">
                                        <div>
                                            <Label className="text-sm font-medium text-gray-700 mb-1.5">
                                                Custom Store Name <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                value={customStoreName}
                                                onChange={(e) => setCustomStoreName(e.target.value)}
                                                placeholder="e.g. Local Hardware Store, ABC Suppliers"
                                                className="h-11"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-gray-700">
                                                Receipt(s) <span className="text-red-500">*</span>
                                            </Label>
                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                                                <Input
                                                    type="file"
                                                    multiple
                                                    onChange={handleReceiptsChange}
                                                    className="hidden"
                                                    id="receipt-upload"
                                                />
                                                <label htmlFor="receipt-upload" className="cursor-pointer">
                                                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                                                    <p className="text-sm text-gray-600 mb-1">
                                                        Click to upload or drag and drop
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        PNG, JPG, PDF up to 10MB
                                                    </p>
                                                </label>
                                            </div>
                                            {receipts.length > 0 && (
                                                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                                                    <CheckCircle2 className="w-5 h-5" />
                                                    <span>{receipts.length} file(s) uploaded successfully</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Missing Materials Section */}
                    {missingRows.length > 0 && (
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-amber-600" />
                                    <h3 className="text-lg font-semibold text-gray-800">Missing Materials</h3>
                                </div>
                                <span className="px-3 py-1 bg-amber-100 text-amber-800 text-sm font-medium rounded-full">
                                    {missingRows.length} item{missingRows.length > 1 ? 's' : ''}
                                </span>
                            </div>

                            <div className="space-y-4">
                                {missingRows.map((row, idx) => (
                                    <div
                                        key={`missing-${idx}`}
                                        className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow p-5"
                                    >
                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                                            <div className="lg:col-span-2">
                                                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    M.Code
                                                </Label>
                                                <div className="mt-1.5 font-mono text-gray-900 bg-gray-50 p-3 rounded-lg">
                                                    {row.materialCode}
                                                </div>
                                            </div>

                                            <div className="lg:col-span-4">
                                                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Material Name
                                                </Label>
                                                <div className="mt-1.5 text-gray-900 p-3 rounded-lg border bg-white">
                                                    {row.materialName}
                                                </div>
                                            </div>

                                            <div className="lg:col-span-2">
                                                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Quantity <span className="text-red-500">*</span>
                                                </Label>
                                                <div className="mt-1.5">
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        max={row.maxQty}
                                                        value={row.quantity}
                                                        onChange={(e) =>
                                                            updateMissingRow(idx, 'quantity', e.target.value)
                                                        }
                                                        className="h-11"
                                                    />
                                                    <div className="text-xs text-gray-500 mt-2">
                                                        <div className="flex ">
                                                            <span className='mr-2'>Missing:</span>{" "}
                                                            <span className="font-semibold">{row.maxQty}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {storeSource === 'custom' && (
                                                <div className="lg:col-span-2">
                                                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Unit Price <span className="text-red-500">*</span>
                                                    </Label>
                                                    <div className="flex items-center mt-1.5">
                                                        <span className="text-gray-500 bg-gray-100 border border-r-0 rounded-l-lg h-11 px-3 flex items-center">
                                                            PKR
                                                        </span>
                                                        <Input
                                                            type="number"
                                                            value={row.pricePerUnit}
                                                            onChange={(e) =>
                                                                updateMissingRow(idx, 'pricePerUnit', e.target.value)
                                                            }
                                                            className="h-11 rounded-l-none"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            <div className="lg:col-span-12">
                                                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Notes
                                                </Label>
                                                <textarea
                                                    value={row.notes}
                                                    onChange={(e) =>
                                                        updateMissingRow(idx, 'notes', e.target.value)
                                                    }
                                                    className="w-full mt-1.5 p-3 border rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 min-h-[80px]"
                                                    placeholder="Add any notes or comments..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Extra Materials Section */}
                    {restRows.length > 0 && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <PackagePlus className="w-5 h-5 text-emerald-600" />
                                    <h3 className="text-lg font-semibold text-gray-800">Extra Materials</h3>
                                </div>
                                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-sm font-medium rounded-full">
                                    {restRows.length} item{restRows.length > 1 ? 's' : ''}
                                </span>
                            </div>

                            <div className="space-y-4">
                                {restRows.map((row, idx) => (
                                    <div
                                        key={`rest-${idx}`}
                                        className="bg-gradient-to-r from-emerald-50/50 to-white rounded-lg border border-emerald-100 p-5"
                                    >
                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                                            <div className="lg:col-span-2">
                                                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    M.Code
                                                </Label>
                                                <div className="mt-1.5 font-mono text-gray-900 bg-white p-3 rounded-lg border">
                                                    {row.materialCode}
                                                </div>
                                            </div>

                                            <div className="lg:col-span-3">
                                                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Name
                                                </Label>
                                                <div className="mt-1.5 text-gray-900 p-3 rounded-lg border bg-white">
                                                    {row.materialName}
                                                </div>
                                            </div>

                                            <div className="lg:col-span-2">
                                                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Quantity
                                                </Label>
                                                <div className="mt-1.5 text-gray-900 p-3 rounded-lg border bg-white">
                                                    {row.quantity}
                                                </div>
                                            </div>

                                            <div className="lg:col-span-2">
                                                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Source
                                                </Label>
                                                <select
                                                    className="w-full h-11 mt-1.5 px-3  rounded-lg border border-gray-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                    value={row.takenFromType}
                                                    onChange={(e) =>
                                                        updateRestRow(idx, 'takenFromType', e.target.value)
                                                    }
                                                >
                                                    {STORE_OPTIONS.map((o) => (
                                                        <option key={o.value} value={o.value}>
                                                            {o.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {row.takenFromType === 'custom' && (
                                                <div className="lg:col-span-2">
                                                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Unit Price <span className="text-red-500">*</span>
                                                    </Label>
                                                    <div className="flex items-center mt-1.5">
                                                        <span className="text-gray-500 bg-gray-100 border border-r-0 rounded-l-lg h-11 px-3 flex items-center">
                                                            PKR
                                                        </span>
                                                        <Input
                                                            type="number"
                                                            value={row.pricePerUnit}
                                                            onChange={(e) =>
                                                                updateRestRow(idx, 'pricePerUnit', e.target.value)
                                                            }
                                                            placeholder="0.00"
                                                            className="h-11 rounded-l-none"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            <div className="lg:col-span-12 mt-2">
                                                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Notes
                                                </Label>
                                                <textarea
                                                    value={row.notes}
                                                    onChange={(e) => updateRestRow(idx, 'notes', e.target.value)}
                                                    className="w-full mt-1.5 p-3 border rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 min-h-[80px]"
                                                    placeholder="Add notes about why this material was taken..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="border-t bg-gray-50 px-6 py-4">
                    <DialogFooter className="gap-3">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="h-11 px-6 border-gray-300 hover:bg-gray-100"
                        >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={!canSubmit || isAddingMissing}
                            className="h-11 px-8 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md"
                        >
                            {isAddingMissing ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save All Materials
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
