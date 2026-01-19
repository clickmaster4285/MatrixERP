// components/shared-components/project/project-details/ActivityFilters.jsx
'use client';

import { Search, Filter, X, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const ActivityFilters = ({
   searchQuery = '',
   onSearchChange,
   statusFilter = 'all',
   onStatusFilterChange,
   typeFilter = 'all',
   onTypeFilterChange,
   siteFilter = 'all',
   onSiteFilterChange,
   availableSites = [],
   availableTypes = [],
   availableStatuses = [],
   onClearFilters,
   showAdvanced = false
}) => {
   const hasActiveFilters =
      searchQuery ||
      statusFilter !== 'all' ||
      typeFilter !== 'all' ||
      siteFilter !== 'all';

   return (
      <div className="space-y-4">
         {/* Search Bar */}
         <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
               placeholder="Search activities by name, type, or description..."
               value={searchQuery}
               onChange={(e) => onSearchChange(e.target.value)}
               className="pl-10"
            />
            {searchQuery && (
               <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
               >
                  <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
               </button>
            )}
         </div>

         {/* Filter Controls */}
         <div className="flex flex-wrap gap-3">
            {/* Status Filter */}
            <div className="space-y-2 min-w-[180px]">
               <Label htmlFor="status-filter" className="text-xs">Status</Label>
               <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                  <SelectTrigger id="status-filter" className="h-9">
                     <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="all">All Statuses</SelectItem>
                     {availableStatuses.map(status => (
                        <SelectItem key={status} value={status}>
                           {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                     ))}
                  </SelectContent>
               </Select>
            </div>

            {/* Type Filter */}
            <div className="space-y-2 min-w-[180px]">
               <Label htmlFor="type-filter" className="text-xs">Type</Label>
               <Select value={typeFilter} onValueChange={onTypeFilterChange}>
                  <SelectTrigger id="type-filter" className="h-9">
                     <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="all">All Types</SelectItem>
                     {availableTypes.map(type => (
                        <SelectItem key={type} value={type}>
                           {type}
                        </SelectItem>
                     ))}
                  </SelectContent>
               </Select>
            </div>

            {/* Site Filter */}
            <div className="space-y-2 min-w-[180px]">
               <Label htmlFor="site-filter" className="text-xs">Site</Label>
               <Select value={siteFilter} onValueChange={onSiteFilterChange}>
                  <SelectTrigger id="site-filter" className="h-9">
                     <SelectValue placeholder="All Sites" />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="all">All Sites</SelectItem>
                     {availableSites.map(site => (
                        <SelectItem key={site.id || site.siteId} value={site.siteId}>
                           {site.name} ({site.siteId})
                        </SelectItem>
                     ))}
                  </SelectContent>
               </Select>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
               <div className="self-end">
                  <Button
                     variant="ghost"
                     size="sm"
                     onClick={onClearFilters}
                     className="h-9"
                  >
                     <X className="h-4 w-4 mr-1" />
                     Clear Filters
                  </Button>
               </div>
            )}
         </div>

         {/* Active Filters Badges */}
         {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 pt-2">
               {searchQuery && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                     Search: "{searchQuery}"
                     <button onClick={() => onSearchChange('')}>
                        <X className="h-3 w-3" />
                     </button>
                  </Badge>
               )}
               {statusFilter !== 'all' && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                     Status: {statusFilter}
                     <button onClick={() => onStatusFilterChange('all')}>
                        <X className="h-3 w-3" />
                     </button>
                  </Badge>
               )}
               {typeFilter !== 'all' && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                     Type: {typeFilter}
                     <button onClick={() => onTypeFilterChange('all')}>
                        <X className="h-3 w-3" />
                     </button>
                  </Badge>
               )}
               {siteFilter !== 'all' && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                     Site: {siteFilter}
                     <button onClick={() => onSiteFilterChange('all')}>
                        <X className="h-3 w-3" />
                     </button>
                  </Badge>
               )}
            </div>
         )}
      </div>
   );
};

export default ActivityFilters;