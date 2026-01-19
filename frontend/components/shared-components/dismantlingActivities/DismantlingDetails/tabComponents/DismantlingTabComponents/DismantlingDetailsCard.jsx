// components/shared-components/activities/dismantlingActivities/DismantlingDetails/tabs/DismantlingDetailsCard.jsx
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, CheckCircle2 } from 'lucide-react';

export function DismantlingDetailsCard({
  activity,
  users,
  teamLeaderUser,
  teamMemberUsers,
  dismantlingStatus,
  isUpdating,
  isDismantlingSetupModalOpen,
  dismantlingSetupData,
  setDismantlingSetupData,
  handleOpenSetup,
  handleDismantlingSetupSave,
  getStatusColor,
  onMarkAsCompleted, // <-- NEW: pass from parent
}) {
  return (
    <div className="bg-card rounded-xl border border-border/50 p-6 shadow-card w-full">
      {/* Header + actions */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Dismantling Details</h3>
          <p className="text-sm text-muted-foreground">
            Team and schedule information
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Mark as Completed button */}
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            disabled={dismantlingStatus === 'completed' || isUpdating}
            onClick={onMarkAsCompleted}
          >
            <CheckCircle2 className="w-4 h-4" />
            {dismantlingStatus === 'completed'
              ? 'Completed'
              : isUpdating
                ? 'Updating...'
                : 'Mark as Completed'}
          </Button>

          {/* Add / Edit dismantling setup (dates, issues, etc) */}
          {
            <Dialog
              open={isDismantlingSetupModalOpen}
              onOpenChange={handleOpenSetup}
            >
              {/* <DialogTrigger asChild>
                <Button className="gap-2" size="sm">
                  <Plus className="w-4 h-4" />
                  {dismantlingStatus ? 'Add Dismantling' : 'Edit Dismantling'}
                </Button>
              </DialogTrigger> */}
              <DialogContent className="sm:max-w-[650px] bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Dismantling Setup</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date *</Label>
                      <Input
                        type="date"
                        value={dismantlingSetupData.startDate}
                        readOnly
                        className="bg-input border-border"
                      />
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Auto set to first save date or existing start date.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={dismantlingSetupData.endDate}
                        onChange={(e) =>
                          setDismantlingSetupData((prev) => ({
                            ...prev,
                            endDate: e.target.value,
                          }))
                        }
                        className="bg-input border-border"
                      />
                    </div>
                  </div>

                  {/* Team leader field removed on purpose */}

                  {/* Issues */}
                  <div className="space-y-2">
                    <Label>Issues Encountered</Label>
                    <Textarea
                      value={dismantlingSetupData.issuesEncountered}
                      onChange={(e) =>
                        setDismantlingSetupData((prev) => ({
                          ...prev,
                          issuesEncountered: e.target.value,
                        }))
                      }
                      placeholder="Enter any issues faced during dismantling..."
                      className="bg-input border-border min-h-20"
                    />
                  </div>

                  {/* Completed toggle (still available inside dialog) */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={dismantlingSetupData.markCompleted || false}
                        onCheckedChange={(checked) =>
                          setDismantlingSetupData((prev) => ({
                            ...prev,
                            markCompleted: !!checked,
                          }))
                        }
                      />
                      <span className="text-sm text-muted-foreground">
                        Dismantling completed
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <div />
                    <Button
                      onClick={handleDismantlingSetupSave}
                      disabled={isUpdating}
                      className="min-w-[180px]"
                    >
                      {isUpdating ? 'Saving...' : 'Save Dismantling Info'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          }
        </div>
      </div>

      {/* EXTRA INFO BELOW SUMMARY */}
      <div className="mt-4 border-t border-border/40 pt-4">
        <div className="grid grid-cols-2 gap-4">
          {/* END DATE SECTION */}
          <div>
            <p className="text-xs text-muted-foreground">End Date</p>
            <p className="text-sm font-medium mt-1">
              {activity.dismantling?.endDate
                ? String(activity.dismantling.endDate).slice(0, 10)
                : 'Not set'}
            </p>
          </div>

          {/* ISSUES ENCOUNTERED SECTION */}
          <div>
            <p className="text-xs text-muted-foreground">Issues Encountered</p>
            <p className="text-sm mt-1 truncate">
              {activity.dismantling?.issuesEncountered
                ? activity.dismantling.issuesEncountered
                : 'No issues recorded.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}