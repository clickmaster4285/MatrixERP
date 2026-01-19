'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';

export const TaskFilters = ({
  filters,
  updateFilters,
  resetFilters,
  byStatus,
  byModule,
}) => {
  // Map backend statuses to frontend categories
  const getStatusCount = (frontendStatus) => {
    if (frontendStatus === 'all') return Object.values(byStatus || {}).reduce((a, b) => a + b, 0);

    // Map frontend status to possible backend status values
    const statusMap = {
      'pending': ['pending', 'draft', 'planned'],
      'in-progress': ['in-progress', 'in_progress', 'In Progress', 'dismantling'],
      'completed': ['completed']
    };

    const backendStatuses = statusMap[frontendStatus] || [frontendStatus];
    return backendStatuses.reduce((total, status) => {
      return total + (byStatus?.[status] || 0);
    }, 0);
  };

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
  ];

  const moduleOptions = [
    { value: 'all', label: 'All Modules' },
    { value: 'relocation', label: 'Relocation' },
    { value: 'dismantling', label: 'Dismantling' },
  ];

  const hasActiveFilters =
    (filters.status && filters.status !== 'all') ||
    (filters.module && filters.module !== 'all') ||
    (filters.search && filters.search.trim().length > 0);

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
      <div className="relative flex-1 max-w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
        <Input
          placeholder="Search tasks by site, type, or module..."
          value={filters.search || ''}
          onChange={(e) => updateFilters({ search: e.target.value })}
          className="pl-10"
        />
      </div>

      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-slate-500" />

        <Select
          value={filters.status || 'all'}
          onValueChange={(value) =>
            updateFilters({ status: value === 'all' ? undefined : value })
          }
        >
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => {
              const count = getStatusCount(option.value);
              const label = option.value === 'all' || !count
                ? option.label
                : `${option.label} (${count})`;

              return (
                <SelectItem key={option.value} value={option.value}>
                  {label}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        <Select
          value={filters.module || 'all'}
          onValueChange={(value) =>
            updateFilters({ module: value === 'all' ? undefined : value })
          }
        >
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Filter by module" />
          </SelectTrigger>
          <SelectContent>
            {moduleOptions.map((option) => {
              const count = option.value === 'all'
                ? undefined
                : byModule?.[option.value] ?? 0;
              const label = option.value === 'all' || !count
                ? option.label
                : `${option.label} (${count})`;

              return (
                <SelectItem key={option.value} value={option.value}>
                  {label}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            className="text-slate-600"
          >
            Reset
          </Button>
        )}
      </div>
    </div>
  );
};