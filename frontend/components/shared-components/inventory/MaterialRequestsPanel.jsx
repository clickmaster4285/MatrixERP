'use client';

import { useMemo, useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

import { useInventoryRequestManagement } from '@/hooks/useInventoryRequestManagement';
import MaterialUpsertDialog from './InventoryUpsertDialog/MaterialUpsertDialog';



const StatusBadge = ({ status }) => {
  const s = String(status || 'pending').toLowerCase();
  if (s === 'approved') return <Badge className="bg-emerald-600">Approved</Badge>;
  if (s === 'rejected') return <Badge variant="destructive">Rejected</Badge>;
  return <Badge variant="secondary">Pending</Badge>;
};

const StatusIcon = ({ status }) => {
  const s = String(status || 'pending').toLowerCase();
  if (s === 'approved') return <CheckCircle2 className="w-4 h-4" />;
  if (s === 'rejected') return <XCircle className="w-4 h-4" />;
  return <Clock className="w-4 h-4" />;
};

export default function MaterialRequestsPanel({
  
  items = [],
  manualBulkAdd,
  isCreating,
  defaultLocation,
  defaultLocationName, })
{
  const {
    requests,
    isLoading,
    listError,
    approveRequest,
    rejectRequest,
    isApproving,
    isRejecting,
  } = useInventoryRequestManagement({
    initialFilters: { status: 'pending', page: 1, limit: 30 },
  });


 
  // ✅ Purchase dialog
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [purchaseItem, setPurchaseItem] = useState(null);
  const openPurchaseDialog = (req, material, invAvail) => {
    setPurchaseItem({
      materialCode: material?.materialCode,
      materialName: material?.name,
      unit: material?.unit || 'pcs',
      requiredQuantity: Number(material?.quantity || 0),
      availableQuantity: Number(invAvail || 0),
      fromRequestId: req?._id,
    });
    setPurchaseOpen(true);
  };
  //-------------------------

  const [selected, setSelected] = useState(null);

  // ✅ Details modal
  const [detailsOpen, setDetailsOpen] = useState(false);

  // ✅ Confirm modal (approve/reject)
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState(null); // approve | reject
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (!selected && requests?.length) setSelected(requests[0]);
  }, [requests, selected]);

  // ✅ build inventory lookup: materialCode -> total availableQuantity
  const inventoryAvailableByCode = useMemo(() => {
    const map = new Map();
    for (const inv of items || []) {
      const code = String(inv?.materialCode || '').trim();
      if (!code) continue;

      const avail = Number(inv?.availableQuantity ?? inv?.summary?.availableQuantity ?? 0) || 0;
      map.set(code, (map.get(code) || 0) + avail);
    }
    return map;
  }, [items]);

  const pendingCount = useMemo(() => {
    return (requests || []).filter((r) => String(r.status).toLowerCase() === 'pending').length;
  }, [requests]);

  const isPending = String(selected?.status || '').toLowerCase() === 'pending';

  const openDetails = (req) => {
    setSelected(req);
    setDetailsOpen(true);
  };

  const openApprove = () => {
    setDialogMode('approve');
    setConfirmOpen(true);
  };

  const openReject = () => {
    setDialogMode('reject');
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    setConfirmOpen(false);
    setDialogMode(null);
    setRejectReason('');
  };

  const confirmAction = async () => {
    if (!selected?._id) return;

    if (dialogMode === 'approve') {
      await approveRequest(selected._id);
    }

    if (dialogMode === 'reject') {
      await rejectRequest({ requestId: selected._id, reason: rejectReason });
    }

    closeConfirm();
    setDetailsOpen(false);
  };

  if (listError) {
    return (
      <div className="p-3 text-sm text-red-500">
        {listError?.message || 'Failed to load requests'}
      </div>
    );
  }



  return (
    <div className="space-y-4">
      {/* REQUEST LIST */}
      <Card>
        <CardHeader>
          <div className="flex justify-between">
            <div>
              <h2 className="font-semibold">Material Requests</h2>
              <p className="text-xs text-muted-foreground">
                Pending: {pendingCount} • Total: {requests.length}
              </p>
            </div>
            <StatusBadge status="pending" />
          </div>
        </CardHeader>

        <CardContent>
          <ScrollArea className="h-[300px]">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (
              <div className="space-y-2">
                {requests.map((r) => (
                  <button
                    key={r._id}
                    onClick={() => openDetails(r)}
                    className="w-full p-3 rounded-xl border text-left border-border hover:bg-muted/50"
                  >
                    <div className="flex justify-between">
                      <div>
                        <div className="text-sm font-medium">
                          {r.subPhase} • {r.phase}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {r.siteName || 'Site'} • {r.activityType}
                        </p>

                        {/* ✅ show inventory availability before materials count */}
                        <div className="text-xs mt-1 flex gap-2 items-center">
                          <StatusIcon status={r.status} />

                          <span className="text-muted-foreground">
                            Inv:
                            <span className="ml-1 font-semibold text-foreground">
                              {(() => {
                                const totalInvAvail = (r.materials || []).reduce((sum, m) => {
                                  const code = String(m?.materialCode || '').trim();
                                  if (!code) return sum;
                                  return sum + (inventoryAvailableByCode.get(code) || 0);
                                }, 0);
                                return totalInvAvail;
                              })()}
                            </span>
                          </span>

                          <span className="text-muted-foreground">•</span>
                          <span>{r.materials?.length || 0} items</span>
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 mt-1 text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* ✅ DETAILS MODAL */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-3">
              <span>Request Details</span>
              {selected && <StatusBadge status={selected.status} />}
            </DialogTitle>
          </DialogHeader>

          {!selected ? (
            <p className="text-sm text-muted-foreground">No request selected</p>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <div>
                  <span className="font-medium text-foreground">Phase:</span> {selected.phase} •{' '}
                  {selected.subPhase}
                </div>
                <div>
                  <span className="font-medium text-foreground">Site:</span> {selected.siteName || 'Site'}
                </div>
                <div>
                  <span className="font-medium text-foreground">Activity:</span> {selected.activityType}
                </div>
              </div>

              {/* Materials */}
              <div className="space-y-2">
                {(selected.materials || []).map((m, i) => {
                  const code = String(m?.materialCode || '').trim();
                  const invAvail = code ? (inventoryAvailableByCode.get(code) || 0) : 0;

                  return (
                    <div key={i} className="flex justify-between p-2 rounded-lg bg-muted/40">
                      <div>
                        <div className="text-sm font-medium">
                          {m.name} ({m.materialCode})
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {m.condition} • {m.unit} • Inv available: <span className="font-semibold">{invAvail}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {m.quantity} {m.unit}
                        </span>

                        {invAvail < Number(m?.quantity || 0) ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-3 text-xs"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              openPurchaseDialog(selected, m, invAvail);
                            }}
                          >
                            Purchase
                          </Button>

                        ) : (
                          <span className="text-xs bg-emerald-500/10 px-2 py-1 rounded-full text-emerald-700 border border-emerald-200">
                            In stock
                          </span>
                        )}

                      </div>


                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button className="flex-1" disabled={!isPending || isApproving} onClick={openApprove}>
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  disabled={!isPending || isRejecting}
                  onClick={openReject}
                >
                  Reject
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✅ APPROVE / REJECT CONFIRM MODAL */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'approve' ? 'Approve Request' : 'Reject Request'}
            </DialogTitle>
            <DialogTitle className="text-sm text-muted-foreground mt-2">
              Are you sure you want to {dialogMode === 'approve' ? 'approve' : 'reject'} this request?
            </DialogTitle>
          </DialogHeader>

          {dialogMode === 'reject' && (
            <Textarea
              placeholder="Reason (optional)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeConfirm}>
              Cancel
            </Button>
            <Button
              variant={dialogMode === 'reject' ? 'destructive' : 'default'}
              onClick={confirmAction}
              disabled={dialogMode === 'approve' ? isApproving : isRejecting}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MaterialUpsertDialog
        open={purchaseOpen}
        onOpenChange={setPurchaseOpen}
        mode="create"
        defaultLocation={defaultLocation}
        defaultLocationName={defaultLocationName}
        manualBulkAdd={manualBulkAdd}
        isCreating={isCreating}
        onDone={() => {
          setPurchaseOpen(false);
          setPurchaseItem(null);
        }}
        initialItem={
          purchaseItem
            ? {
              materialCode: purchaseItem.materialCode,
              materialName: purchaseItem.materialName,
              unit: purchaseItem.unit,
              quantity: Math.max(
                purchaseItem.requiredQuantity - purchaseItem.availableQuantity,
                0
              ),
              // optional but helps because your dialog validation requires location
              location: defaultLocation || '',
              locationName: defaultLocationName || '',
            }
            : null
        }
      />

    </div>
  );
}
