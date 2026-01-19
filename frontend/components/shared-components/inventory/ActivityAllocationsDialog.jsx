'use client';

import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Package, Loader2 } from 'lucide-react';

import { useInventoryManagement } from '@/hooks/useInventoryManagement';

const fmt = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString() : String(v ?? '—');
};

export function ActivityAllocationsDialog({
  open,
  onOpenChange,
  inventoryItem,
}) {
  const inventoryId = inventoryItem?._id;

  // ✅ We will attempt to use the API using inventoryId filter
  // If backend doesn't support, allocations may return empty — then we fallback.
  const { allocations, allocationsLoading } = useInventoryManagement({
    initialAllocationsFilters: {
      inventoryId: inventoryId || undefined, // ✅ backend must support this to work
    },
  });

  const fallbackAllocations = useMemo(() => {
    return Array.isArray(inventoryItem?.activityAllocations)
      ? inventoryItem.activityAllocations
      : [];
  }, [inventoryItem]);

  const list = useMemo(() => {
    // prefer API result, if it returns something
    if (Array.isArray(allocations) && allocations.length > 0)
      return allocations;
    return fallbackAllocations;
  }, [allocations, fallbackAllocations]);

  const title =
    inventoryItem?.materialName || inventoryItem?.materialCode || 'Item';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Allocations: {title}
          </DialogTitle>
          <DialogDescription>
            Shows where this item is allocated. If nothing appears, your backend
            likely doesn’t support filtering allocations by inventoryId yet.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-border bg-background/40 p-3">
          <div className="flex flex-wrap gap-2 text-sm">
            <Badge variant="secondary">
              Code: {inventoryItem?.materialCode || '—'}
            </Badge>
            <Badge variant="secondary">
              Location:{' '}
              {inventoryItem?.locationName || inventoryItem?.location || '—'}
            </Badge>
            <Badge variant="secondary">
              Allocated Qty: {fmt(inventoryItem?.allocatedQuantity)}
            </Badge>
          </div>
        </div>

        <ScrollArea className="h-[52vh] pr-3">
          {allocationsLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading allocations...
            </div>
          )}

          {!allocationsLoading && list.length === 0 && (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="p-4 rounded-full bg-muted mb-4">
                <Package className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">
                No allocations found
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Either this item has no allocations, or the API filter needs
                support.
              </p>
            </div>
          )}

          {!allocationsLoading && list.length > 0 && (
            <div className="space-y-3 py-2">
              {list.map((a, i) => {
                // Support different shapes (API vs fallback)
                const activityType = a?.activityType || a?.type || '—';
                const activityName = a?.activityName || a?.name || '—';
                const qty =
                  a?.quantity ?? a?.allocatedQuantity ?? a?.qty ?? '—';
                const status = a?.status || '—';
                const at = a?.allocatedAt || a?.createdAt || a?.date;

                return (
                  <div
                    key={a?._id || `${activityType}-${i}`}
                    className={cn(
                      'rounded-xl border border-border bg-card p-4',
                      'hover:bg-muted/20 transition-colors'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-medium ">
                          Type: {String(activityType)}
                          {at
                            ? ` • Date: ${new Date(at).toLocaleString()}`
                            : ''}
                        </p>
                        {(a?.locationName || a?.location) && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Location: {a?.locationName || a?.location}
                          </p>
                        )}
                      </div>

                      <div className="text-right space-y-1">
                        <p className="text-sm font-semibold tabular-nums">
                          Qty: {fmt(qty)}
                        </p>
                        <Badge variant="outline">{String(status)}</Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
