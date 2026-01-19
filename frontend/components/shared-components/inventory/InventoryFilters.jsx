import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { categories, locations, statusOptions } from './mockInventory';
import { cn } from '@/lib/utils';

export function InventoryFilters({
  filters = {},
  onFiltersChange,
  onReset,
  className,
}) {
  const safeFilters = filters || {};

  const hasActiveFilters =
    Boolean(safeFilters.search) ||
    Boolean(safeFilters.category) ||
    Boolean(safeFilters.location) ||
    (safeFilters.status && safeFilters.status !== 'all');

  const update = (patch) => {
    if (!onFiltersChange) return;
    try {
      onFiltersChange((prev) => ({ ...(prev || {}), ...patch }));
    } catch {
      onFiltersChange({ ...safeFilters, ...patch });
    }
  };

  return (
    <div
      className={cn('p-4 rounded-xl bg-card border border-border', className)}
    >
      {/* Header */}
      <div className="flex items-start sm:items-center gap-2 mb-3 text-sm font-medium text-foreground">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filters</span>
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="ml-auto h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            type="button"
          >
            <X className="w-3 h-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        {/* Search */}
        <div className="relative w-full sm:flex-1 sm:min-w-[260px] min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search materials..."
            value={safeFilters.search || ''}
            onChange={(e) => update({ search: e.target.value, page: 1 })}
            className="pl-9 border-border w-full"
          />
        </div>

        {/* Dropdowns grid on mobile, row on desktop */}
        <div className="grid grid-cols-1 gap-3 sm:flex sm:gap-2 w-full sm:w-auto">
          {/* Category */}
          <Select
            value={safeFilters.category || 'all'}
            onValueChange={(value) =>
              update({
                category: value === 'all' ? undefined : value,
                page: 1,
              })
            }
          >
            <SelectTrigger className="w-full sm:w-[180px] border-border">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Location */}
          <Select
            value={safeFilters.location || 'all'}
            onValueChange={(value) =>
              update({
                location: value === 'all' ? undefined : value,
                page: 1,
              })
            }
          >
            <SelectTrigger className="w-full sm:w-[180px] border-border">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((loc) => (
                <SelectItem key={loc.value} value={loc.value}>
                  {loc.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status */}
          <Select
            value={safeFilters.status || 'all'}
            onValueChange={(value) =>
              update({
                status: value,
                page: 1,
              })
            }
          >
            <SelectTrigger className="w-full sm:w-[160px] border-border">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
