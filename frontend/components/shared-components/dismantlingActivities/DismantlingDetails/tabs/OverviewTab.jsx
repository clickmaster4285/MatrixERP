// components/dismantling/tabs/OverviewTab.jsx
'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

import {
  MapPin,
  Users,
  Calendar,
  Clock,
  AlertCircle,
  Pencil,
} from 'lucide-react';

import { useDismantlingManagement } from '@/hooks/useDismantlingManagement';

const formatDate = (value, fallback = 'Not set') => {
  if (!value) return fallback;
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return typeof value === 'string' && value.includes('T')
        ? value.slice(0, 10)
        : value;
    }
    return date.toISOString().slice(0, 10);
  } catch {
    return fallback;
  }
};

export function OverviewTab({ activity, setActivity }) {
  const { updateDismantling, isUpdating } = useDismantlingManagement();

  // Notes edit
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [notesDraft, setNotesDraft] = useState(activity.notes || '');

  // Location edit
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [locationDraft, setLocationDraft] = useState(
    Array.isArray(activity.location) ? activity.location : []
  );

  const handleOpenNotes = () => {
    if (!activity?._id) return;
    setNotesDraft(activity.notes || '');
    setIsNotesDialogOpen(true);
  };

  const handleNotesSave = async () => {
    if (!activity?._id) return;

    const payload = {
      notes: notesDraft?.trim() || '',
    };

    try {
      await updateDismantling(activity._id, payload);

      setActivity((prev) => ({
        ...prev,
        notes: payload.notes,
      }));

      toast.success('Notes updated successfully');
      setIsNotesDialogOpen(false);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to update notes';
      toast.error(msg);
    }
  };

  const handleOpenLocation = () => {
    if (!activity?._id) return;
    setLocationDraft(Array.isArray(activity.location) ? activity.location : []);
    setIsLocationDialogOpen(true);
  };

  const handleLocationChange = (index, field, value) => {
    setLocationDraft((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddLocationRow = () => {
    setLocationDraft((prev) => [...prev, { city: '', state: '', address: '' }]);
  };

  const handleLocationSave = async () => {
    if (!activity?._id) return;

    const cleanedLocations = locationDraft.filter(
      (loc) => loc.city || loc.state || loc.address
    );

    const payload = {
      location: cleanedLocations,
    };

    try {
      await updateDismantling(activity._id, payload);

      setActivity((prev) => ({
        ...prev,
        location: cleanedLocations,
      }));

      toast.success('Location updated successfully');
      setIsLocationDialogOpen(false);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to update location';
      toast.error(msg);
    }
  };

  const locations = Array.isArray(activity.location) ? activity.location : [];

  return (
    <>
      {/* Notes Edit Dialog */}
      <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
        <DialogContent className="sm:max-w-[550px] bg-card border-border">
          <DialogHeader>
            <DialogTitle>Edit Notes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              className="min-h-[140px]"
              placeholder="Add important notes about this dismantling activity..."
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsNotesDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleNotesSave}
                disabled={isUpdating}
                className="min-w-[120px]"
              >
                {isUpdating ? 'Saving...' : 'Save Notes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Location Edit Dialog */}
      <Dialog
        open={isLocationDialogOpen}
        onOpenChange={setIsLocationDialogOpen}
      >
        <DialogContent className="sm:max-w-[650px] bg-card border-border">
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[420px] overflow-y-auto pr-1">
            {locationDraft.map((loc, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-3 gap-3 border border-border/60 rounded-md p-3"
              >
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">
                    City
                  </p>
                  <Input
                    value={loc.city || ''}
                    onChange={(e) =>
                      handleLocationChange(index, 'city', e.target.value)
                    }
                    className="bg-input border-border"
                  />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">
                    State
                  </p>
                  <Input
                    value={loc.state || ''}
                    onChange={(e) =>
                      handleLocationChange(index, 'state', e.target.value)
                    }
                    className="bg-input border-border"
                  />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">
                    Address
                  </p>
                  <Input
                    value={loc.address || ''}
                    onChange={(e) =>
                      handleLocationChange(index, 'address', e.target.value)
                    }
                    className="bg-input border-border"
                  />
                </div>
              </div>
            ))}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLocationDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleLocationSave}
                disabled={isUpdating}
                className="min-w-[140px]"
              >
                {isUpdating ? 'Saving...' : 'Save Location'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6">
        {/* Timeline */}
        <div className="bg-card rounded-xl border border-border/50 p-6 shadow-card ">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Timeline
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
            <TimelineItem
              label="Survey Completed"
              value={formatDate(
                activity.timeline?.surveyCompletionDate,
                'Pending'
              )}
            />
            <TimelineItem
              label="Dismantling Completed"
              value={formatDate(
                activity.timeline?.dismantlingCompletionDate,
                'Pending'
              )}
            />
            <TimelineItem
              label="Dispatch Completed"
              value={formatDate(
                activity.timeline?.dispatchCompletionDate,
                'Pending'
              )}
            />
            <TimelineItem
              label="Assigned Date"
              value={formatDate(activity.assignment?.assignedDate, 'Not set')}
            />
            <TimelineItem
              label="Created At"
              value={formatDate(activity.createdAt, '—')}
            />
          </div>
        </div>
        
        {/* Location */}
        <div className="bg-card rounded-xl border border-border/50 p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Location
            </h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleOpenLocation}
              disabled={isUpdating}
            >
              <Pencil className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-3">
            {locations.length > 0 ? (
              locations.map((loc, index) => (
                <div key={index} className="bg-secondary/50 rounded-lg p-4">
                  <p className="font-medium">
                    {loc.city || '—'}, {loc.state || '—'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {loc.address || 'No address set'}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No location added yet.
              </p>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-card rounded-xl border border-border/50 p-6 shadow-card ">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary" />
              Notes
            </h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleOpenNotes}
              disabled={isUpdating}
            >
              <Pencil className="w-4 h-4" />
            </Button>
          </div>

          <p className="text-muted-foreground text-sm whitespace-pre-wrap">
            {activity.notes || 'No notes added'}
          </p>
        </div>
      </div>
    </>
  );
}

function TimelineItem({ label, value }) {
  return (
    <div className="bg-secondary/50 rounded-lg p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium mt-1">{value}</p>
    </div>
  );
}
