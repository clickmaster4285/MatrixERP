'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useVendorManagement } from '@/hooks/useVendorManagement';

import { VendorStats } from './vendor-stats';
import { VendorFilters } from './vendor-filters';
import { VendorTable } from './vendor-table';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { CreateVendor } from './create-vendor-dialog';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

export default function VendorsPage() {
  const {
    vendors,
    pagination,
    filters,
    setSearch,
    setType,
    setPage,
    toggleIncludeDeleted,
    resetFilters,
    listLoading,

    // upsert helpers
    currentVendor,
    selectedVendorId,
    selectVendor,
    createVendor,
    updateVendor,

    // ✅ delete
    deleteVendor,
    isDeleting,

    detailLoading,
    isCreating,
    isUpdating,
  } = useVendorManagement({
    autoLoadDropdown: false,
  });

  const [showDialog, setShowDialog] = useState(false);
  const [mode, setMode] = useState('create'); // 'create' | 'edit'

  // ✅ delete modal state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const openCreate = () => {
    setMode('create');
    selectVendor(null);
    setShowDialog(true);
  };

  const openEdit = (vendorId) => {
    setMode('edit');
    selectVendor(vendorId);
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
  };

  // ✅ open delete confirm
  const openDelete = (vendor) => {
    setDeleteTarget(vendor);
    setDeleteOpen(true);
  };

  // ✅ confirm delete
  const confirmDelete = async () => {
    if (!deleteTarget?._id) return;

    try {
      await deleteVendor(deleteTarget._id);
      toast.success('Vendor deleted');
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      const msg =
        error?.data?.message || error?.message || 'Failed to delete vendor';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen ">
      {/* Header */}
      <div className="">
        <div className=" px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="">
                Vendor Management
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Manage and track all your vendors in one place
              </p>
            </div>

            <Button onClick={openCreate} size="lg">
              <Plus className="mr-2 h-4 w-4" />
              Add Vendor
            </Button>
          </div>
        </div>
      </div>

      <div className=" px-6 ">
        {/* Stats */}
        <VendorStats vendors={vendors} />

        {/* Filters */}
        <VendorFilters
          filters={filters}
          onSearchChange={setSearch}
          onTypeChange={setType}
          onIncludeDeletedChange={toggleIncludeDeleted}
          onReset={resetFilters}
        />

        {/* Cards/Grid */}
        <VendorTable
          vendors={vendors}
          pagination={pagination}
          onPageChange={setPage}
          isLoading={listLoading}
          onEdit={(row) => openEdit(row?._id)}
          onDelete={(row) => openDelete(row)} // ✅ wire delete
        />
      </div>

      {/* Upsert Dialog */}
      <CreateVendor
        open={showDialog}
        onOpenChange={(v) => (v ? setShowDialog(true) : closeDialog())}
        mode={mode}
        vendorId={selectedVendorId}
        vendor={mode === 'edit' ? currentVendor : null}
        isLoadingVendor={detailLoading}
        isSaving={mode === 'create' ? isCreating : isUpdating}
        onCreate={createVendor}
        onUpdate={updateVendor}
        onDone={closeDialog}
      />

      {/* ✅ Delete Confirm Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete vendor?</AlertDialogTitle>
            <AlertDialogDescription>
             Are you sure you want to delete <b>{deleteTarget?.name}</b>.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              onClick={() => {
                setDeleteOpen(false);
                setDeleteTarget(null);
              }}
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              disabled={isDeleting}
              onClick={confirmDelete}
              className="bg-destructive text-card hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
