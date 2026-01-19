'use client';

import { useState, useMemo } from 'react';
import {
  Package,
  PackageCheck,
  PackageMinus,
  Truck,
  Plus,
  Download,
  RefreshCw,
} from 'lucide-react';

import { StatCard } from './StatCard';
import { InventoryFilters } from './InventoryFilters';
import { InventoryTable } from './InventoryTable';
import { InventoryPagination } from './InventoryPagination';
import { Button } from '@/components/ui/button';
import MaterialRequestsPanel from './MaterialRequestsPanel';

import { useInventoryManagement } from '@/hooks/useInventoryManagement';

import MaterialUpsertDialog from './InventoryUpsertDialog/MaterialUpsertDialog';

import { AddStockDialog } from './AddStockDialog';


export default function Inventory() {
  const {
    overviewItems,
    overviewTotals,
    overviewPagination,
    overviewFilters,
    updateOverviewFilters,
    isLoading,
    listError,
    dropdownItems,
    manualBulkAdd,
    isBulkAdding,
    softDeleteInventory,
    isSoftDeleting,
    updateInventorySingle,
    isSingleUpdating,
  } = useInventoryManagement();

  // --------------------
  // Dialog state
  // --------------------
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // 'create' | 'edit'
  const [selectedItem, setSelectedItem] = useState(null);

  const [addStockOpen, setAddStockOpen] = useState(false);
  const [addStockItem, setAddStockItem] = useState(null);


  //----open handler-----
  const openAddStock = (item) => {
    setAddStockItem(item);
    setAddStockOpen(true);
  };



  // --------------------
  // Sorting
  // --------------------
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');

  const filteredItems = useMemo(() => {
    let items = [...(overviewItems || [])];

    if (sortField) {
      items.sort((a, b) => {
        const aVal = a?.[sortField];
        const bVal = b?.[sortField];

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }

        return sortDirection === 'asc'
          ? String(aVal ?? '').localeCompare(String(bVal ?? ''))
          : String(bVal ?? '').localeCompare(String(aVal ?? ''));
      });
    }

    return items;
  }, [overviewItems, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((p) => (p === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  if (listError) {
    return (
      <div className="p-6">
        <p className="text-red-500 text-sm">
          Inventory error: {listError?.message || 'Something went wrong'}
        </p>
      </div>
    );
  }

  const totals = {
    totalQuantity: Number(overviewTotals?.totalQuantity ?? 0),
    availableQuantity: Number(overviewTotals?.availableQuantity ?? 0),
    allocatedQuantity: Number(overviewTotals?.allocatedQuantity ?? 0),
    inUseQty: Number(overviewTotals?.inUseQty ?? 0),
  };


  const handleRemove = async (item) => {
    const ok = window.confirm(
      `Remove ${item?.materialCode || 'this item'}? (Soft delete)`
    );
    if (!ok) return;

    try {
      const res = await softDeleteInventory({
        id: item?._id,
        location: item?.location,
      });

    } catch (err) {
      console.error('SOFT DELETE ERROR FULL:', err);

    }
  };


  return (
    <div className="">
      {/* =========================
          CREATE / EDIT DIALOG
         ========================= */}
      <MaterialUpsertDialog
        items={dropdownItems}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        initialItem={selectedItem}
        defaultLocation={overviewFilters?.location}
        defaultLocationName={undefined}
        manualBulkAdd={manualBulkAdd}
        updateInventorySingle={updateInventorySingle}
        isCreating={isBulkAdding}
        isUpdating={isSingleUpdating}
        onDone={() => {
          setSelectedItem(null);
          setDialogMode('create');
        }}
      />

      {/* =========================
          HEADER
         ========================= */}
      <header>
        <div className="px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1>Inventory Management</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Track, allocate, and manage your materials
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" /> Export
              </Button>

              <Button variant="outline" className="gap-2">
                <RefreshCw className="w-4 h-4" /> Sync
              </Button>

              <Button
                className="gap-2 bg-primary hover:bg-primary/90"
                onClick={() => {
                  setDialogMode('create');
                  setSelectedItem(null);
                  setDialogOpen(true);
                }}
              >
                <Plus className="w-4 h-4" /> Add Material
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* =========================
          MAIN
         ========================= */}
      <main className="px-4 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Inventory"
            value={totals.totalQuantity}
            subtitle="Across all locations"
            icon={Package}
            variant="primary"
          />
          <StatCard
            title="Available"
            value={totals.availableQuantity}
            subtitle="Ready for allocation"
            icon={PackageCheck}
            variant="success"
          />
          <StatCard
            title="Allocated"
            value={totals.allocatedQuantity}
            subtitle="Assigned to activities"
            icon={PackageMinus}
            variant="warning"
          />
          <StatCard
            title="In Use"
            value={totals.inUseQty}
            subtitle="Currently in use"
            icon={Truck}
            variant="info"
          />
        </div>

        {/* Filters */}
        <InventoryFilters
          filters={overviewFilters}
          onFiltersChange={updateOverviewFilters}
          onReset={() =>
            updateOverviewFilters({
              search: '',
              status: 'all',
              page: 1,
              limit: 20,
            })
          }
        />

        {/* Table + Requests (70/30) */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
          {/* LEFT */}
          <div className="lg:col-span-7">
            {isLoading ? (
              <div className="p-6 text-sm text-muted-foreground">Loading inventory...</div>
            ) : (
              <>
                <InventoryTable
                  items={filteredItems}
                  onSort={handleSort}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onRemoveItem={handleRemove}
                  isRemoving={isSoftDeleting}
                  onAddStockClick={(item) => openAddStock(item)}
                  onEditItem={(item) => {
                    setSelectedItem(item);
                    setDialogMode('edit');
                    setDialogOpen(true);
                  }}
                />

                {filteredItems.length > 0 && (
                  <InventoryPagination
                    pagination={overviewPagination}
                    totalItems={filteredItems.length}
                    onPageChange={(page) =>
                      updateOverviewFilters((prev) => ({ ...prev, page }))
                    }
                    onLimitChange={(limit) =>
                      updateOverviewFilters((prev) => ({
                        ...prev,
                        limit,
                        page: 1,
                      }))
                    }
                  />
                )}
              </>
            )}
          </div>

          {/* RIGHT */}
          <div className="lg:col-span-3">
            <MaterialRequestsPanel
              items={dropdownItems}
              manualBulkAdd={manualBulkAdd}
              isCreating={isBulkAdding}
              defaultLocation={overviewFilters?.location || ''}
              defaultLocationName={undefined}
            />
          </div>
        </div>

        {/* ✅ Keep dialog outside grid */}
        <AddStockDialog
          open={addStockOpen}
          onOpenChange={setAddStockOpen}
          item={addStockItem}
          isSaving={isSingleUpdating}
          onAddStock={async ({ id, quantity, condition }) => {
            return await updateInventorySingle({
              id,
              action: 'add_stock',
              addQuantity: quantity,
              condition,
              location: addStockItem?.location,
            });
          }}
        />

      </main>
    </div>
  );
}
