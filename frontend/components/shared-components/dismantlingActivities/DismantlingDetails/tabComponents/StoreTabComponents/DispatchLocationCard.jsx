'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Save, Truck, CheckCircle2 } from 'lucide-react';
import { getStatusColor } from '@/utils/InventoryStaticList';

export function DispatchLocationCard({
  activity,
  dispatch,
  dispatchStatus,
  isDispatchModalOpen,
  handleOpenChange,
  globalDispatchInfo,
  setGlobalDispatchInfo,
  // still accepted for compatibility, but not used:
  existingDispatchMaterials,
  dispatchableMaterials,
  isUpdating,
  hasExistingDispatch,
  handleDispatchSubmit,
  completeDispatch,
}) {
  const hasDispatchInfo =
    !!dispatch.destinationlocation ||
    !!dispatch.receiverName ||
    !!dispatch.destinationDetails;

  return (
    <div className="bg-card rounded-xl border border-border/50 p-6 shadow-card">
      {/* HEADER + ACTIONS */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Store Location</h3>
        </div>

        {activity.dismantling?.status === 'completed' &&
          dispatchStatus !== 'completed' && (
            <div className="flex gap-3">
              {/* ADD / EDIT STORE LOCATION */}
              <Dialog
                open={isDispatchModalOpen}
                onOpenChange={handleOpenChange}
              >
                <DialogTrigger asChild>
                  <Button
                    className="gap-2 bg-primary"
                    // if you really don't care about materials at all,
                    // you can remove "|| dispatchableMaterials.length === 0"
                    disabled={isUpdating}
                  >
                    <Plus className="w-4 h-4" />
                    {hasExistingDispatch ? 'Edit Store' : 'Add Store Record'}
                  </Button>
                </DialogTrigger>

                <DialogContent className="max-w-3xl bg-card border-border">
                  <DialogHeader>
                    <DialogTitle>Record Store Location</DialogTitle>
                  </DialogHeader>

                  <ScrollArea className="pr-4">
                    <div className="rounded-lg space-y-3 mb-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* DESTINATION LOCATION */}
                        <div>
                          <Label className="text-xs">
                            Destination Location
                          </Label>
                          <select
                            value={globalDispatchInfo.destinationlocation}
                            onChange={(e) => {
                              const value = e.target.value;
                              setGlobalDispatchInfo((prev) => ({
                                ...prev,
                                destinationlocation: value,
                                // clear these when own-store selected
                                receiverName:
                                  value === 'own-store'
                                    ? ''
                                    : prev.receiverName,
                                destinationDetails:
                                  value === 'own-store'
                                    ? ''
                                    : prev.destinationDetails,
                              }));
                            }}
                            className="w-full bg-input border border-border rounded-md px-3 py-2 mt-1 text-sm"
                          >
                            <option value="">Select</option>
                            <option value="own-store">Own Store</option>
                            <option value="ufone">Ufone</option>
                            <option value="ptcl">PTCL</option>
                            <option value="zong">Zong</option>
                            <option value="custom">Custom</option>
                          </select>
                        </div>

                        {/* CUSTOM DESTINATION */}
                        {globalDispatchInfo.destinationlocation ===
                          'custom' && (
                          <div>
                            <Label className="text-xs">
                              Custom Destination Location
                            </Label>
                            <Input
                              value={
                                globalDispatchInfo.customDestinationlocation
                              }
                              onChange={(e) =>
                                setGlobalDispatchInfo((prev) => ({
                                  ...prev,
                                  customDestinationlocation: e.target.value,
                                }))
                              }
                              className="bg-input border-border mt-1"
                              placeholder="e.g. Jazz Warehouse Islamabad"
                            />
                          </div>
                        )}

                        {/* RECEIVER + DETAILS ONLY WHEN NOT OWN-STORE */}
                        {globalDispatchInfo.destinationlocation !==
                          'own-store' && (
                          <>
                            <div>
                              <Label className="text-xs">Receiver Name</Label>
                              <Input
                                value={globalDispatchInfo.receiverName}
                                onChange={(e) =>
                                  setGlobalDispatchInfo((prev) => ({
                                    ...prev,
                                    receiverName: e.target.value,
                                  }))
                                }
                                className="bg-input border-border mt-1"
                                placeholder="Person receiving"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <Label className="text-xs">
                                Destination Details
                              </Label>
                              <Input
                                value={globalDispatchInfo.destinationDetails}
                                onChange={(e) =>
                                  setGlobalDispatchInfo((prev) => ({
                                    ...prev,
                                    destinationDetails: e.target.value,
                                  }))
                                }
                                className="bg-input border-border mt-1"
                                placeholder="Warehouse, address, rack, etc."
                              />
                            </div>
                          </>
                        )}

                        {/* STORE STATUS */}
                        <div className="md:col-span-2">
                          <Label className="text-xs">Store Status</Label>
                          <select
                            value={globalDispatchInfo.status}
                            onChange={(e) =>
                              setGlobalDispatchInfo((prev) => ({
                                ...prev,
                                status: e.target.value,
                              }))
                            }
                            className="w-full bg-input border border-border rounded-md px-3 py-2 mt-1 text-sm"
                          >
                            <option value="pending">Pending</option>
                            <option value="in-transit">In Transit</option>
                            <option value="received">Received</option>
                            <option value="completed">Completed</option>
                          </select>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            If you select{' '}
                            <span className="font-semibold">Completed</span>,
                            overall activity progress will be set to 100%.
                          </p>
                        </div>
                      </div>
                    </div>
                  </ScrollArea>

                  <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <Button
                      variant="outline"
                      onClick={() => handleOpenChange(false)}
                      disabled={isUpdating}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleDispatchSubmit}
                      disabled={isUpdating}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isUpdating ? 'Saving...' : 'Save Store Location'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* MARK AS COMPLETED */}
              <Button
                variant="outline"
                onClick={completeDispatch}
                className="gap-2"
                disabled={isUpdating || dispatchStatus === 'completed'}
              >
                <CheckCircle2 className="w-4 h-4" />
                {dispatchStatus === 'completed'
                  ? 'Completed'
                  : isUpdating
                  ? 'Updating...'
                  : 'Mark as Completed'}
              </Button>
            </div>
          )}
      </div>

      {/* STORE DETAILS CARD */}
      <div className="bg-card rounded-xl border border-border/50 p-4 shadow-card mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold">Store Details</h3>
            <p className="text-xs text-muted-foreground">
              Destination and receiver information
            </p>
          </div>

          <div className="text-right">
            <p className="text-[11px] text-muted-foreground">Store Status</p>
            <Badge className={getStatusColor(dispatchStatus)}>
              {dispatchStatus || 'Not set'}
            </Badge>
          </div>
        </div>

        {hasDispatchInfo ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {dispatch.destinationlocation && (
              <div>
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="font-medium wrap-break-word">
                  {dispatch.destinationlocation}
                </p>
              </div>
            )}

            {dispatch.receiverName && (
              <div>
                <p className="text-xs text-muted-foreground">Receiver</p>
                <p className="font-medium wrap-break-word">
                  {dispatch.receiverName}
                </p>
              </div>
            )}

            {dispatch.destinationDetails && (
              <div className="md:col-span-1">
                <p className="text-xs text-muted-foreground">Details</p>
                <p className="font-medium text-sm wrap-break-word">
                  {dispatch.destinationDetails}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-xs text-muted-foreground">
              No store location recorded yet.
            </p>
          </div>
        )}
      </div>

      {/* GLOBAL EMPTY STATE IF NOTHING AT ALL */}
      {!hasDispatchInfo && (
        <div className="text-center py-8">
          <Truck className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            Once you add a store record, it will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
