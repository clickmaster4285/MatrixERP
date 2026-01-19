'use client';

import { useMemo, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CalendarIcon,
  PackageIcon,
  DollarSignIcon,
  MapPinIcon,
  UserIcon,
  Loader2,
} from 'lucide-react';

import { CategoryBadge } from './CategoryBadge';
import { ConditionBadge } from './ConditionBadge';
import { useVendorManagement } from '@/hooks/useVendorManagement'; // Adjust import path as needed

const toNumberSafe = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const money = (n) => toNumberSafe(n).toLocaleString();

function getMainCondition(breakdown) {
  const safe = breakdown && typeof breakdown === 'object' ? breakdown : {};
  const conditions = ['excellent', 'good', 'fair', 'poor', 'scrap'];

  let best = null;
  let bestCount = -1;
  conditions.forEach((c) => {
    const count = Number(safe[c] || 0);
    if (count > bestCount) {
      best = c;
      bestCount = count;
    }
  });

  return bestCount > 0 ? { condition: best, count: bestCount } : null;
}

function KeyValueGrid({ items, iconMap = {} }) {
  const safe = items && typeof items === 'object' ? items : {};
  const entries = Object.entries(safe);

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <PackageIcon className="h-10 w-10 text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {entries.map(([key, value]) => {
        const Icon = iconMap[key];
        return (
          <div
            key={key}
            className="group rounded-lg border border-border bg-card hover:bg-accent/5 p-4 transition-colors"
          >
            <div className="flex items-start gap-3">
              {Icon && (
                <div className="mt-0.5 rounded-md bg-primary/10 p-2">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  {key
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, (str) => str.toUpperCase())}
                </p>
                <p className="text-sm font-medium text-foreground truncate">
                  {value ? String(value) : '—'}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatCard({ title, value, subValue, icon: Icon, variant = 'default' }) {
  const variants = {
    default: 'bg-card border-l-3 border-l-chart-4',
    primary: 'bg-card border-l-3 border-l-primary',
    secondary: 'bg-card border-l-3 border-l-chart-3',
  };

  return (
    <div className={`rounded-lg border p-4 ${variants[variant]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">
            {title}
          </p>
          <p className="text-xl font-semibold text-foreground">{value}</p>
          {subValue && (
            <p className="text-xs text-muted-foreground mt-1">{subValue}</p>
          )}
        </div>
        {Icon && (
          <div className="rounded-full bg-primary/10 p-2">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        )}
      </div>
    </div>
  );
}

function VendorInfo({ vendor, vendorManagement }) {
  // Check if vendor is an object with ID or just a string ID
  const vendorId = useMemo(() => {
    if (!vendor) return null;
    if (typeof vendor === 'string') return vendor;
    if (typeof vendor === 'object' && vendor._id) return vendor._id;
    return null;
  }, [vendor]);

  // Find vendor name from dropdown or current vendor data
  const vendorName = useMemo(() => {
    if (!vendorId) return '—';

    // Try to get name from vendor object if it exists
    if (typeof vendor === 'object' && vendor.name) {
      return vendor.name;
    }

    // Look up in vendor dropdown
    const vendorFromDropdown = vendorManagement.vendorDropdown.find(
      (v) => v._id === vendorId || v.value === vendorId
    );

    if (vendorFromDropdown) {
      return vendorFromDropdown.label || vendorFromDropdown.name || vendorId;
    }

    return vendorId; // Fallback to ID if name not found
  }, [vendor, vendorId, vendorManagement.vendorDropdown]);

  const isLoading = vendorManagement.dropdownLoading;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
      <UserIcon className="h-4 w-4 text-muted-foreground" />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium wrap-break-word">{vendorName}</p>
          {isLoading && (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          )}
        </div>
        <p className="text-xs text-muted-foreground">Vendor</p>
        {vendorId && vendorId !== vendorName && (
          <p className="text-xs text-muted-foreground mt-1">ID: {vendorId}</p>
        )}
      </div>
    </div>
  );
}

export function InventoryItemSheet({ open, onOpenChange, item }) {
  const safeItem = item || null;

  // Initialize vendor management hook
  const vendorManagement = useVendorManagement({
    autoLoadDropdown: open, // Only load dropdown when sheet is open
  });

  const totals = useMemo(() => {
    const totalQty = toNumberSafe(safeItem?.totalQuantity);
    const availQty = toNumberSafe(safeItem?.availableQuantity);
    const allocQty = toNumberSafe(safeItem?.allocatedQuantity);
    const price = toNumberSafe(safeItem?.pricePerUnit);
    const totalValue = totalQty * price;

    return { totalQty, availQty, allocQty, price, totalValue };
  }, [safeItem]);

  const mainCondition = useMemo(
    () => getMainCondition(safeItem?.conditionBreakdown),
    [safeItem]
  );

  const allocations = Array.isArray(safeItem?.activityAllocations)
    ? safeItem.activityAllocations
    : [];

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-500/10 text-green-700 border-green-500/20',
      pending: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
      completed: 'bg-sky-500/10 text-sky-700 border-sky-500/20',
      cancelled: 'bg-red-500/10 text-red-700 border-red-500/20',
    };
    return (
      colors[status?.toLowerCase()] ||
      'bg-secondary/10 text-secondary-foreground border-secondary/20'
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[540px] p-0">
        <ScrollArea className="h-full">
          <div className="p-6">
            {/* Header Section */}
            <SheetHeader className="mb-4">
              <div className="flex items-start justify-between">
                <div>
                  <SheetTitle className="text-xl font-bold tracking-tight">
                    {safeItem?.materialName || 'Unnamed Item'}
                  </SheetTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {safeItem?.materialCode || 'No code'}
                  </p>
                </div>
              </div>
            </SheetHeader>

            {/* Tags and Status */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <CategoryBadge category={safeItem?.category} />
              {mainCondition && (
                <ConditionBadge
                  condition={mainCondition.condition}
                  count={mainCondition.count}
                  size="md"
                />
              )}
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <StatCard
                title="Total Quantity"
                value={totals.totalQty.toLocaleString()}
                subValue={safeItem?.unit || 'units'}
                icon={PackageIcon}
                variant="primary"
              />
              <StatCard
                title="Available"
                value={totals.availQty.toLocaleString()}
                subValue={`${(
                  (totals.availQty / totals.totalQty) * 100 || 0
                ).toFixed(0)}% available`}
                icon={PackageIcon}
              />
              <StatCard
                title="Price / Unit"
                value={totals.price > 0 ? `$${money(totals.price)}` : '—'}
                subValue={safeItem?.unit || 'unit'}
                icon={DollarSignIcon}
              />
              <StatCard
                title="Total Value"
                value={
                  totals.totalValue > 0 ? `$${money(totals.totalValue)}` : '—'
                }
                icon={DollarSignIcon}
                variant="secondary"
              />
            </div>

            <Separator className="my-6" />

            {/* Tabbed Content */}
            <Tabs defaultValue="overview" className="mt-4">
              <TabsList className="grid grid-cols-4 w-full bg-card border border-border rounded-lg p-1">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-md"
                >
                  Overview
                </TabsTrigger>

                <TabsTrigger
                  value="specs"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-md"
                >
                  Specs
                </TabsTrigger>

                <TabsTrigger
                  value="allocations"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-md"
                >
                  Allocations
                  {allocations.length > 0 && (
                    <Badge
                      variant="outline"
                      className="ml-2 h-5 min-w-5 px-1 text-[11px]
                     data-[state=active]:border-primary-foreground/30
                     data-[state=active]:text-primary-foreground"
                    >
                      {allocations.length}
                    </Badge>
                  )}
                </TabsTrigger>

                <TabsTrigger
                  value="meta"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-md"
                >
                  Meta
                </TabsTrigger>
              </TabsList>

              {/* OVERVIEW */}
              <TabsContent value="overview" className="mt-6 space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                      Location & Vendor
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                      <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {safeItem?.locationName ||
                            safeItem?.location ||
                            'No location'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Storage Location
                        </p>
                      </div>
                    </div>

                    <VendorInfo
                      vendor={safeItem?.vendor}
                      vendorManagement={vendorManagement}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                      Condition Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {safeItem?.conditionBreakdown ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {Object.entries(safeItem.conditionBreakdown).map(
                          ([cond, qty]) => (
                            <div
                              key={cond}
                              className="flex items-center justify-between p-2 rounded border"
                            >
                              <span className="text-sm capitalize">{cond}</span>
                              <Badge variant="outline">{qty}</Badge>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No condition data
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* SPECS */}
              <TabsContent value="specs" className="mt-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                      Specifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <KeyValueGrid items={safeItem?.specifications} />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ALLOCATIONS */}
              <TabsContent value="allocations" className="mt-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                      Activity Allocations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {allocations.length === 0 ? (
                      <div className="py-8 text-center">
                        <PackageIcon className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">
                          No active allocations
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          This item hasn't been allocated to any activities
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {allocations.map((a) => (
                          <div
                            key={
                              a?._id || `${a?.activityId}-${a?.allocatedDate}`
                            }
                            className="rounded-lg border p-4 hover:bg-accent/5 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate">
                                  {a?.activityType || 'Unknown Activity'}
                                </p>
                                {/* <p className="text-xs text-muted-foreground truncate mt-1">
                                  ID: {a?.activityId || '—'}
                                </p> */}
                              </div>
                              <Badge
                                variant="outline"
                                className={`${getStatusColor(
                                  a?.status
                                )} border`}
                              >
                                {a?.status || 'Unknown'}
                              </Badge>
                            </div>

                            <div className="flex items-center justify-between text-sm mt-3">
                              <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1">
                                  <PackageIcon className="h-3 w-3" />
                                  <span className="font-medium">
                                    {toNumberSafe(a?.quantity).toLocaleString()}
                                  </span>
                                  <span className="text-muted-foreground ml-1">
                                    units
                                  </span>
                                </span>
                              </div>

                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <CalendarIcon className="h-3 w-3" />
                                {a?.allocatedDate
                                  ? new Date(
                                    a.allocatedDate
                                  ).toLocaleDateString()
                                  : '—'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* META */}
              <TabsContent value="meta" className="mt-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                      Metadata
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <KeyValueGrid
                      items={{
                        'Created At': safeItem?.createdAt
                          ? new Date(safeItem.createdAt).toLocaleString()
                          : '—',
                        'Updated At': safeItem?.updatedAt
                          ? new Date(safeItem.updatedAt).toLocaleString()
                          : '—',
                        // 'Created By': safeItem?.createdBy,
                        // 'Updated By': safeItem?.updatedBy,
                        'Last Updated': safeItem?.lastUpdatedAt
                          ? new Date(safeItem.lastUpdatedAt).toLocaleString()
                          : '—',
                        'Location Path': safeItem?.location,
                      }}
                      iconMap={{
                        'Created At': CalendarIcon,
                        'Updated At': CalendarIcon,
                        'Created By': UserIcon,
                        'Updated By': UserIcon,
                        'Last Updated': CalendarIcon,
                        'Location Path': MapPinIcon,
                      }}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
