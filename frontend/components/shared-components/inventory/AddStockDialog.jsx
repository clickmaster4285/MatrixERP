'use client';

import { useEffect, useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

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

import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select';

const CONDITION_OPTIONS = ['excellent', 'good', 'fair', 'poor', 'scrap'];

export function AddStockDialog({
    open,
    onOpenChange,
    item,
    onAddStock, // <-- async function passed from parent
    isSaving,
}) {
    const [qty, setQty] = useState(1);
    const [condition, setCondition] = useState('good');

    const title = useMemo(() => {
        const code = item?.materialCode ? ` (${item.materialCode})` : '';
        return `Add Stock${code}`;
    }, [item]);

    useEffect(() => {
        if (!open) return;
        setQty(1);
        setCondition('good');
    }, [open]);

    const handleSubmit = async () => {
        const nQty = Number(qty);

        if (!item?._id) {
            toast.error('Missing inventory item');
            return;
        }
        if (!Number.isFinite(nQty) || nQty <= 0) {
            toast.error('Quantity must be greater than 0');
            return;
        }

        try {
            const res = await onAddStock?.({
                id: item._id,
                quantity: nQty,
                condition,
            });

            if (res?.success === false) {
                toast.error(res?.message || 'Failed to add stock');
                return;
            }

            toast.success(res?.message || 'Stock added');
            onOpenChange(false);
        } catch (e) {
            toast.error(e?.message || 'Request failed');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[520px] bg-card border-border">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
                    <DialogDescription>
                        Add quantity into available stock and update condition breakdown.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="rounded-lg border border-border bg-muted/20 p-3">
                        <p className="text-sm font-medium text-foreground">
                            {item?.materialName || '—'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Location: {item?.locationName || item?.location || '—'}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Quantity *</Label>
                        <Input
                            type="number"
                            min={1}
                            value={qty}
                            onChange={(e) => setQty(e.target.value)}
                            placeholder="10"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Condition</Label>
                        <Select value={condition} onValueChange={setCondition}>
                            <SelectTrigger className="border-border">
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
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                        Cancel
                    </Button>

                    <Button onClick={handleSubmit} disabled={isSaving} className="gap-2">
                        <Save className="w-4 h-4" />
                        {isSaving ? 'Saving...' : 'Add Stock'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
