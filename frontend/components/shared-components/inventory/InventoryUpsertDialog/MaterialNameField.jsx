'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, Wand2, X, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const clean = (v) => String(v ?? '').trim();

export const autoCodeFromName = (name) => {
  const n = clean(name);
  if (!n) return '';
  return n
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

const normalizeMaterial = (m) => {
  const code = clean(m?.materialCode || m?.code || m?.id);
  const name = clean(m?.materialName || m?.name);

  return {
    id: clean(m?._id || m?.id || code),
    code,
    name,
    category: clean(m?.category || 'others'),
    unit: clean(m?.unit || 'piece'),
    pricePerUnit: m?.pricePerUnit ?? '',
    vendor: m?.vendor?._id || m?.vendor || '',
    location: clean(m?.location || ''),
    locationName: clean(m?.locationName || ''),
    specifications: m?.specifications || {},
    raw: m,
  };
};

export default function MaterialNameField({
  valueName,
  valueCode,
  onChangeName,
  onChangeCode,

  // ✅ ONLY THIS: pass dropdownItems / full inventory list here
  items = [],

  // ✅ return selected full item to parent
  onSelectItem,

  disabled = false,
}) {
  const wrapRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  const list = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items
      .map(normalizeMaterial)
      .filter((m) => m.code && m.name)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  const selected = useMemo(() => {
    const code = clean(valueCode).toLowerCase();
    const name = clean(valueName).toLowerCase();

    if (code) {
      const byCode = list.find((m) => m.code.toLowerCase() === code);
      if (byCode) return byCode;
    }
    if (name) {
      const byName = list.find((m) => m.name.toLowerCase() === name);
      if (byName) return byName;
    }
    return null;
  }, [list, valueCode, valueName]);

  const isCustom = !!clean(valueName) && !selected;
  const autoCodeDisabled = disabled || !clean(valueName) || !!selected;

  const filtered = useMemo(() => {
    const query = clean(q).toLowerCase();
    if (!query) return list;
    return list.filter((m) => {
      const hay =
        `${m.name} ${m.code} ${m.category} ${m.location} ${m.locationName}`.toLowerCase();
      return hay.includes(query);
    });
  }, [list, q]);

  useEffect(() => {
    const onDown = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  useEffect(() => {
    if (open) setQ('');
  }, [open]);

  const handleSelect = (m) => {
    onChangeName?.(m.name);
    onChangeCode?.(m.code);
    onSelectItem?.(m.raw || m);
    setOpen(false);
  };

  const handleNameChange = (v) => {
    onChangeName?.(v);
    if (!v) onChangeCode?.('');
  };

  const handleAutoCode = () => {
    if (!valueName) return;
    onChangeCode?.(autoCodeFromName(valueName));
  };

  const clearSelected = () => {
    onChangeName?.('');
    onChangeCode?.('');
    onSelectItem?.(null);
  };

  return (
    <div ref={wrapRef} className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
        <div className="md:col-span-8 relative">
          <Input
            value={valueName || ''}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Material name (type or select)"
            disabled={disabled}
            className={cn(selected && 'pr-10')}
          />

          {!!selected && !disabled && (
            <button
              type="button"
              onClick={clearSelected}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground hover:bg-accent"
              title="Clear selection"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="md:col-span-4 relative">
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={() => setOpen((v) => !v)}
            className="w-full justify-between"
          >
            <span
              className={cn(
                'truncate',
                selected ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {selected ? `Selected: ${selected.name}` : 'Browse materials'}
            </span>
            <ChevronDown
              className={cn(
                'h-4 w-4 opacity-60 transition-transform',
                open && 'rotate-180'
              )}
            />
          </Button>

          {open && (
            <div className="absolute z-30 mt-1 w-full rounded-md border bg-popover shadow-md overflow-hidden">
              <div className="p-2 border-b">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search name / code / category / location..."
                    className="pl-8"
                    autoFocus
                  />
                </div>
              </div>

              <div className="max-h-64 overflow-auto">
                {filtered.length === 0 && (
                  <div className="px-3 py-3 text-sm text-muted-foreground">
                    No results
                  </div>
                )}

                {filtered.map((m) => {
                  const active = selected?.code === m.code;
                  return (
                    <button
                      key={`${m.id}_${m.location || 'na'}`}
                      type="button"
                      onClick={() => handleSelect(m)}
                      className={cn(
                        'w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors',
                        active && 'bg-accent'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            {active && <Check className="h-4 w-4 text-primary" />}
                            <span className="truncate font-medium">{m.name}</span>
                          </div>
                          <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground">
                            <span className="font-mono">{m.code}</span>
                            {m.category && <span>• {m.category}</span>}
                            {(m.locationName || m.location) && (
                              <span>• {m.locationName || m.location}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          {m.unit || ''}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
        <div className="md:col-span-5">
          <Input
            value={valueCode || ''}
            onChange={(e) => onChangeCode?.(e.target.value)}
            placeholder="Material code"
            disabled={disabled || !!selected}
            className="font-mono"
          />
          {!!selected && (
            <div className="mt-1 text-[11px] text-muted-foreground">
              Code locked because you selected an existing item.
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <Button
            type="button"
            onClick={handleAutoCode}
            disabled={autoCodeDisabled}
            className={cn(
              'w-full gap-2',
              isCustom && !disabled && 'bg-emerald-600 hover:bg-emerald-700'
            )}
            title={selected ? 'Disabled for existing items' : 'Generate code from name'}
          >
            <Wand2 className="h-4 w-4" />
            Auto Code
          </Button>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        {selected
          ? '✓ Selected from list (auto-filled)'
          : isCustom
            ? '✓ Custom material'
            : 'Type or select a material'}
      </div>
    </div>
  );
}
