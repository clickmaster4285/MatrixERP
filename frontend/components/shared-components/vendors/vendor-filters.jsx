"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { Search, X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Label } from "recharts"
import { Switch } from '@/components/ui/switch';



export function VendorFilters({
  filters,
  onSearchChange,
  onTypeChange,
  onIncludeDeletedChange,
  onReset,
}) {
  const hasActiveFilters = filters.search || filters.type || filters.includeDeleted === "true"

  return (
    <div className="mb-8 ">
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        {/* Search Input */}
        <div className="flex-1">
          <Label htmlFor="search" className="mb-2 text-sm font-medium">
            Search
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by name, code, email, city..."
              value={filters.search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Type Filter */}
        <div className="">
          <Label htmlFor="type" className="mb-2 text-sm font-medium">
            Vendor Type
          </Label>
          <Select
            value={filters.type || "all"}
            onValueChange={(value) => onTypeChange(value === "all" ? undefined : value)}
          >
            <SelectTrigger id="type">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="supplier">Supplier</SelectItem>
              <SelectItem value="manufacturer">Manufacturer</SelectItem>
              <SelectItem value="distributor">Distributor</SelectItem>
              <SelectItem value="contractor">Contractor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Include Deleted Toggle */}
        {/* <div className="flex items-center space-x-2">
          <Switch
            id="include-deleted"
            checked={filters.includeDeleted === "true"}
            onCheckedChange={onIncludeDeletedChange}
          />
          <Label htmlFor="include-deleted" className="text-sm font-medium">
            Show Deleted
          </Label>
        </div> */}

        {/* Reset Button */}
        {hasActiveFilters && (
          <Button variant="outline" onClick={onReset} className="w-full md:w-auto bg-transparent">
            <X className="mr-2 h-4 w-4" />
            Reset
          </Button>
        )}
      </div>
    </div>
  )
}
