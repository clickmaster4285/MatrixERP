'use client';

import { useEffect, useMemo, useState } from 'react';
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

import { Loader2, Save, X } from 'lucide-react';

const VENDOR_TYPES = [
  { label: 'Supplier', value: 'supplier' },
  { label: 'Contractor', value: 'contractor' },
  { label: 'Manufacturer', value: 'manufacturer' },
  { label: 'Distributor', value: 'distributor' },
  { label: 'Other', value: 'other' },
];

// API vendor -> form
const toForm = (v) => ({
  name: v?.name || '',
  vendorCode: v?.vendorCode || '',
  type: v?.type || 'supplier',

  contactPerson: v?.contactPerson || '',
  phone: v?.phone || '',
  email: v?.email || '',
  address: v?.address || '',
  city: v?.city || '',
  country: v?.country || '',

  taxNumber: v?.taxNumber || '',
  registrationNumber: v?.registrationNumber || '',

  notes: v?.notes || '',
});

export function CreateVendor({
  open,
  onOpenChange,
  mode = 'create', // 'create' | 'edit'
  vendorId,
  vendor,
  isLoadingVendor = false,
  isSaving = false,
  onCreate,
  onUpdate,
  onDone,
}) {
  const isEdit = mode === 'edit';

  const initial = useMemo(() => {
    if (!isEdit) {
      return {
        name: '',
        vendorCode: '',
        type: 'supplier',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        country: '',
        taxNumber: '',
        registrationNumber: '',
        notes: '',
      };
    }
    return toForm(vendor);
  }, [isEdit, vendor]);

  const [form, setForm] = useState(initial);

  useEffect(() => {
    if (!open) return;
    setForm(initial);
  }, [open, initial]);

  const setField = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const validate = () => {
    if (!form.name.trim()) return 'Vendor name is required';
    // vendorCode is optional, but if you want format checks, add here
    // email optional, but basic format check if present
    if (form.email?.trim()) {
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
      if (!ok) return 'Email format looks invalid';
    }
    return null;
  };

  const buildPayload = () => ({
    name: form.name.trim(),
    vendorCode: form.vendorCode.trim() ? form.vendorCode.trim() : undefined, // keep optional
    type: form.type,

    contactPerson: form.contactPerson.trim() || undefined,
    phone: form.phone.trim() || undefined,
    email: form.email.trim() || undefined,
    address: form.address.trim() || undefined,
    city: form.city.trim() || undefined,
    country: form.country.trim() || undefined,

    taxNumber: form.taxNumber.trim() || undefined,
    registrationNumber: form.registrationNumber.trim() || undefined,

    notes: form.notes.trim() || undefined,
  });

  const handleSubmit = async (e) => {
    e?.preventDefault();

    const err = validate();
    if (err) return toast.error(err);

    try {
      const payload = buildPayload();

      if (!isEdit) {
        await onCreate(payload);
        toast.success('Vendor created');
      } else {
        if (!vendorId) return toast.error('Vendor ID missing');
        await onUpdate(vendorId, payload);
        toast.success('Vendor updated');
      }

      onDone?.();
    } catch (error) {
      const msg =
        error?.data?.message ||
        error?.message ||
        'Something went wrong. Please try again.';
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[780px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {isEdit ? 'Edit Vendor' : 'Add Vendor'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update vendor details and save changes'
              : 'Create a new vendor in your system'}
          </DialogDescription>
        </DialogHeader>

        {isEdit && isLoadingVendor ? (
          <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading vendor...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-5">
            {/* Row 1 */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2 sm:col-span-2">
                <Label>Vendor Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  placeholder="e.g., ABC Traders"
                />
              </div>

              <div className="space-y-2">
                <Label>Vendor Code (optional)</Label>
                <Input
                  value={form.vendorCode}
                  onChange={(e) => setField('vendorCode', e.target.value)}
                  placeholder="e.g., VND-001"
                />
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setField('type', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {VENDOR_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Contact Person Name</Label>
                <Input
                  value={form.contactPerson}
                  onChange={(e) => setField('contactPerson', e.target.value)}
                  placeholder="e.g., Ali Khan"
                />
              </div>

              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setField('phone', e.target.value)}
                  placeholder="e.g., 03xx-xxxxxxx"
                />
              </div>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2 sm:col-span-1">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                  placeholder="vendor@email.com"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>Address</Label>
                <Input
                  value={form.address}
                  onChange={(e) => setField('address', e.target.value)}
                  placeholder="Street / Area"
                />
              </div>
            </div>

            {/* Row 4 */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={form.city}
                  onChange={(e) => setField('city', e.target.value)}
                  placeholder="e.g., Rawalpindi"
                />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input
                  value={form.country}
                  onChange={(e) => setField('country', e.target.value)}
                  placeholder="e.g., Pakistan"
                />
              </div>
            </div>

            {/* Row 5 */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tax Number</Label>
                <Input
                  value={form.taxNumber}
                  onChange={(e) => setField('taxNumber', e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label>Registration Number</Label>
                <Input
                  value={form.registrationNumber}
                  onChange={(e) =>
                    setField('registrationNumber', e.target.value)
                  }
                  placeholder="Optional"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                value={form.notes}
                onChange={(e) => setField('notes', e.target.value)}
                placeholder="Optional notes..."
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onDone?.()}
                disabled={isSaving}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>

              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
