'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  Mail,
  MapPin,
  Phone,
  MoreVertical,
  Pencil,
  Trash2,
  Building,
  User,
  CheckCircle,
  XCircle,
  Eye,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserAvatar } from '@/components/ui/UserAvatar'; // ⬅️ kept as-is (you asked)
import { formatPhoneNumberForDisplay } from '@/utils/formatters';

export function VendorTable({
  vendors,
  pagination,
  onPageChange,
  isLoading,
  onEdit,
  onView,
  onDelete,
}) {
  const currentPage = pagination?.page || 1;
  const totalPages = pagination?.pages || 1;

  const getVendorTypeBadge = (type) => {
    const badges = {
      supplier: 'bg-chart-1/10 text-chart-1 border-chart-1/20',
      manufacturer: 'bg-chart-2/10 text-chart-2 border-chart-2/20',
      distributor: 'bg-chart-3/10 text-chart-3 border-chart-3/20',
      contractor: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
      other: 'bg-muted text-muted-foreground border-border',
    };
    return badges[type] || 'bg-muted text-muted-foreground border-border';
  };

  const getTypeLabel = (type) => {
    const labels = {
      supplier: 'Supplier',
      manufacturer: 'Manufacturer',
      distributor: 'Distributor',
      contractor: 'Contractor',
      other: 'Other',
    };
    return labels[type] || type || 'N/A';
  };

  if (isLoading) {
    return (
      <div className="p-12">
        <div className="flex items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!vendors || vendors.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Building className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-semibold text-foreground">No vendors found</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Try adjusting your filters or add a new vendor
          </p>
        </div>
      </Card>
    );
  }

  return (
    <>
      {/* Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {vendors.map((vendor) => (
          <Card
            key={vendor._id}
            className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-primary/60"
          >
            <div className="p-0">
              {/* Header with avatar and actions */}
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 min-w-0">

                    {/* ✅ ONLY CHANGE — MANUAL AVATAR */}
                    <div className="h-12 w-12 rounded-full overflow-hidden ring-2 ring-white shadow-lg bg-muted shrink-0">
                      <img
                        src="/avatars/person.png"
                        alt="Vendor avatar"
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-semibold text-lg truncate max-w-[180px]">
                        {vendor?.name}
                      </h3>

                      <Badge
                        variant={vendor?.isDeleted ? 'destructive' : 'outline'}
                        className="mt-1 capitalize"
                      >
                        {vendor?.isDeleted ? (
                          <XCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        )}
                        {vendor?.isDeleted ? 'Inactive' : 'Active'}
                      </Badge>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="w-48">
                      {onView && (
                        <>
                          <DropdownMenuItem onClick={() => onView(vendor)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}

                      <DropdownMenuItem onClick={() => onEdit?.(vendor)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit Vendor
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onClick={() => onDelete?.(vendor)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Vendor
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Vendor Info */}
              <div className="px-6 pb-6 space-y-5">
                <div className="space-y-3">
                  {vendor?.contactPerson && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm font-medium truncate">
                        {vendor.contactPerson}
                      </span>
                    </div>
                  )}

                  {vendor?.vendorCode && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Vendor Code
                      </span>
                      <code className="rounded bg-muted px-2 py-1 text-xs font-mono font-medium text-foreground">
                        {vendor.vendorCode}
                      </code>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t space-y-3">
                  <div className="space-y-2">
                    {vendor?.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-muted-foreground truncate">
                          {vendor.email}
                        </span>
                      </div>
                    )}

                    {vendor?.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4 text-primary" />
                        <span>{formatPhoneNumberForDisplay(vendor.phone)}</span>
                      </div>
                    )}

                    {(vendor?.city || vendor?.country) && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="truncate">
                          {[vendor.city, vendor.country].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Type</span>
                    <Badge
                      variant="outline"
                      className={getVendorTypeBadge(vendor?.type)}
                    >
                      {getTypeLabel(vendor?.type)}
                    </Badge>
                  </div>

                  {vendor?.website && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Website
                      </span>
                      <a
                        href={
                          vendor.website.startsWith('http')
                            ? vendor.website
                            : `https://${vendor.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary hover:underline truncate max-w-[120px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Visit
                      </a>
                    </div>
                  )}

                  {vendor?.createdAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Added</span>
                      <span className="text-sm font-medium">
                        {new Date(vendor.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="text-sm text-muted-foreground">
              Showing vendors{' '}
              <span className="font-medium">
                {(currentPage - 1) * (pagination?.limit || 10) + 1}
              </span>
              -
              <span className="font-medium">
                {Math.min(
                  currentPage * (pagination?.limit || 10),
                  pagination?.total || 0
                )}
              </span>{' '}
              of <span className="font-medium">{pagination?.total || 0}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="gap-1"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
