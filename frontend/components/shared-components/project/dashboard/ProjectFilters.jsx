// components/shared-components/project/ProjectFilters.jsx
'use client';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProjectFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  manager,
  onManagerChange,
  managers = [],
  onReset
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
        <Input
          placeholder="Search projects by name or description..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-slate-500" />

        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="planning">Planning</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="on-hold">On Hold</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={manager} onValueChange={onManagerChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Manager" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Managers</SelectItem>
            {managers.map(mgr => (
              <SelectItem key={mgr._id} value={mgr._id}>
                {mgr.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(search !== '' || status !== 'all' || manager !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-9"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}