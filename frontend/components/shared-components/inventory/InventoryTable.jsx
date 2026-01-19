'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { cn } from '@/lib/utils';
import {
  MapPin,
  MoreHorizontal,
  ArrowUpDown,
  Package,
  Eye,
  Edit,
  Trash2,
  Layers,
  PackagePlus,
  Hash,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';

import { ActivityAllocationsDialog } from './ActivityAllocationsDialog';
import { InventoryItemSheet } from './InventoryItemSheet';
import { Badge } from '@/components/ui/badge';

/* ---------------- helpers ---------------- */
const toNumberSafe = (value) => {
  if (value == null) return 0;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

/* --------- Stock status chip (professional) --------- */
const StockBadge = React.memo(({ available }) => {
  const avail = toNumberSafe(available);

  if (avail === 0) {
    return (
      <Badge variant="destructive" className="text-[11px] px-2 py-0.5">
        Out of stock
      </Badge>
    );
  }

  if (avail < 10) {
    return (
      <Badge
        variant="outline"
        className="text-[11px] px-2 py-0.5 border-amber-300/60 bg-amber-500/10 text-amber-700"
      >
        Low stock
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="text-[11px] px-2 py-0.5 border-emerald-300/60 bg-emerald-500/10 text-emerald-700"
    >
      In stock
    </Badge>
  );
});
StockBadge.displayName = 'StockBadge';

/* --------- Condition chips (instead of plain text) --------- */
const ConditionChips = React.memo(({ breakdown }) => {
  const order = useMemo(
    () => ['excellent', 'good', 'fair', 'poor', 'scrap'],
    []
  );

  const parts = useMemo(() => {
    if (!breakdown || typeof breakdown !== 'object') return [];
    return order
      .map((k) => [k, Number(breakdown?.[k] || 0)])
      .filter(([, v]) => v > 0);
  }, [breakdown, order]);

  if (!parts.length) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  const compact = parts
    .map(([k, v]) => `${k} (${v})`)
    .join(', ');

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-wrap gap-1.5 max-w-[210px]">
            {parts.slice(0, 3).map(([k, v]) => (
              <span
                key={k}
                className="text-[11px] px-2 py-0.5 rounded-full border border-border bg-muted/30 text-foreground capitalize"
              >
                {k}: {v}
              </span>
            ))}
            {parts.length > 3 && (
              <span className="text-[11px] px-2 py-0.5 rounded-full border border-border bg-muted/30 text-muted-foreground">
                +{parts.length - 3}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="capitalize text-sm">{compact}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});
ConditionChips.displayName = 'ConditionChips';

/* --------- Sortable header --------- */
const SortableHeader = React.memo(
  ({ field, children, align = 'left', sortField, sortDirection, onSort }) => {
    const handleClick = useCallback(() => {
      onSort?.(field);
    }, [field, onSort]);

    const isActive = sortField === field;

    return (
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          '-ml-3 h-8 font-medium',
          align === 'right' && 'ml-0 -mr-3 justify-end w-full',
          isActive && 'text-primary bg-primary/5'
        )}
        onClick={handleClick}
        type="button"
      >
        {children}
        <ArrowUpDown
          className={cn(
            'ml-1 h-3 w-3 transition-transform',
            isActive && sortDirection === 'desc' && 'rotate-180'
          )}
        />
      </Button>
    );
  }
);
SortableHeader.displayName = 'SortableHeader';

/* --------- Empty state --------- */
const EmptyState = React.memo(() => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="p-4 rounded-full bg-muted/50 mb-4">
      <Package className="w-12 h-12 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-medium text-foreground mb-2">
      No inventory items found
    </h3>
    <p className="text-sm text-muted-foreground max-w-sm">
      Try adjusting your filters, search terms, or add new items to get started
    </p>
  </div>
));
EmptyState.displayName = 'EmptyState';

/* ===================== TABLE ===================== */
export function InventoryTable({
  items,
  onSort,
  sortField,
  sortDirection = 'asc',
  onEditItem,
  className,
  onRemoveItem,
  isRemoving,
  isLoading = false,
  onAddStockClick,
}) {
  const safeItems = useMemo(() => (Array.isArray(items) ? items : []), [items]);

  const [allocOpen, setAllocOpen] = useState(false);
  const [selectedForAlloc, setSelectedForAlloc] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const openAllocations = useCallback((item) => {
    setSelectedForAlloc(item);
    setAllocOpen(true);
  }, []);

  const openSheet = useCallback((item) => {
    setSelectedItem(item);
    setSheetOpen(true);
  }, []);

  const handleEdit = useCallback(
    (item, e) => {
      e?.stopPropagation();
      onEditItem?.(item);
    },
    [onEditItem]
  );

  const handleRemove = useCallback(
    (item, e) => {
      e?.stopPropagation();
      onRemoveItem?.(item);
    },
    [onRemoveItem]
  );

  const tableRows = useMemo(() => {
    return safeItems.map((item, index) => {
      const availQty = toNumberSafe(item?.availableQuantity);
      const allocQty = toNumberSafe(item?.allocatedQuantity);
      const totalQty = toNumberSafe(item?.totalQuantity) || availQty + allocQty;

      const isOutOfStock = availQty === 0;

      return (
        <TableRow
          key={item?._id || `${item?.materialCode}-${index}`}
          className={cn(
            'hover:bg-muted/30 transition-colors cursor-pointer',
            isOutOfStock && 'bg-destructive/5 hover:bg-destructive/10'
          )}
          onClick={() => openSheet(item)}
        >
          {/* ✅ PROFESSIONAL MATERIAL CELL */}
          <TableCell className="w-[420px]">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-9 w-9 rounded-lg border border-border bg-muted/30 flex items-center justify-center shrink-0">
                <Package className="h-4 w-4 text-muted-foreground" />
              </div>

              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground line-clamp-1">
                    {item?.materialName || '—'}
                  </p>

                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Hash className="h-3.5 w-3.5" />
                    {item?.materialCode || '—'}
                  </span>

                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {item?.locationName || item?.location || '—'}
                  </span>

                  {item?.unit && (
                    <span className="text-xs">
                      Unit: <span className="text-foreground/80">{item.unit}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </TableCell>

          <TableCell className="text-right w-[150px]">
            <div className="flex justify-end">
              <StockBadge available={availQty} />
            </div>
          </TableCell>


          {/* ✅ Available */}
          <TableCell className="text-right w-[130px]">
            <div className="flex flex-col items-end">
              <span
                className={cn(
                  'font-semibold tabular-nums',
                  isOutOfStock
                    ? 'text-destructive'
                    : availQty > 0
                      ? 'text-emerald-600'
                      : 'text-muted-foreground'
                )}
              >
                {availQty.toLocaleString()}
              </span>
              <span className="text-[11px] text-muted-foreground">
                of {totalQty.toLocaleString()}
              </span>
            </div>
          </TableCell>

          {/* ✅ Allocated */}
          <TableCell className="text-right w-[120px]">
            <div className="flex flex-col items-end">
              <span
                className={cn(
                  'font-semibold tabular-nums',
                  allocQty > 0 ? 'text-amber-600' : 'text-muted-foreground'
                )}
              >
                {allocQty.toLocaleString()}
              </span>
              <span className="text-[11px] text-muted-foreground">
                allocated
              </span>
            </div>
          </TableCell>

          {/* ✅ Condition */}
          <TableCell className="w-[240px]">
            <ConditionChips breakdown={item?.conditionBreakdown} />
          </TableCell>

          {/* ✅ Actions */}
          <TableCell className="w-[70px]" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-muted"
                  type="button"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => onAddStockClick?.(item)}>
                  <PackagePlus className="mr-2 h-4 w-4" />
                  Add Stock
                </DropdownMenuItem>

                <DropdownMenuItem onClick={(e) => handleEdit(item, e)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Item
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={(e) => handleRemove(item, e)}
                  disabled={isRemoving}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isRemoving ? 'Removing...' : 'Remove Item'}
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => openSheet(item)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => openAllocations(item)}>
                  <Layers className="mr-2 h-4 w-4" />
                  View Allocations
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
      );
    });
  }, [
    safeItems,
    openSheet,
    openAllocations,
    handleEdit,
    handleRemove,
    isRemoving,
    onAddStockClick,
  ]);

  if (isLoading) {
    return (
      <div
        className={cn(
          'rounded-xl border border-border overflow-hidden bg-card',
          'flex items-center justify-center py-16',
          className
        )}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading inventory...</p>
        </div>
      </div>
    );
  }

  if (safeItems.length === 0) return <EmptyState />;

  return (
    <>
      <div
        className={cn(
          'rounded-xl border border-border overflow-hidden bg-card shadow-sm',
          className
        )}
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[420px]">
                <SortableHeader
                  field="materialName"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={onSort}
                >
                  Material
                </SortableHeader>
              </TableHead>


              <TableHead className="text-right w-[150px]">
                Status
              </TableHead>


              <TableHead className="text-right w-[130px]">
                <SortableHeader
                  field="availableQuantity"
                  align="right"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={onSort}
                >
                  Available
                </SortableHeader>
              </TableHead>

              <TableHead className="text-right w-[120px]">
                <SortableHeader
                  field="allocatedQuantity"
                  align="right"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={onSort}
                >
                  Allocated
                </SortableHeader>
              </TableHead>

              <TableHead className="w-[240px]">Condition</TableHead>

              <TableHead className="w-[70px]">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>{tableRows}</TableBody>
        </Table>
      </div>

      <InventoryItemSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        item={selectedItem}
        onEdit={onEditItem}
        onAllocationsOpen={() => {
          setSheetOpen(false);
          openAllocations(selectedItem);
        }}
      />

      <ActivityAllocationsDialog
        open={allocOpen}
        onOpenChange={setAllocOpen}
        inventoryItem={selectedForAlloc}
      />
    </>
  );
}
