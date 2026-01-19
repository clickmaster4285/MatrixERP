// components/dismantling/tabs/DispatchTab.jsx
'use client';

import { useState, useMemo } from 'react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Save, Truck, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { getStatusColor } from '@/utils/InventoryStaticList';
import { useDismantlingManagement } from '@/hooks/useDismantlingManagement';
import { StoreAssignmentTab } from '../tabComponents/StoreTabComponents/StoreAssignmentTab';
import { StoreAttachmentTab } from '../tabComponents/StoreTabComponents/StoreAttachmentTab';
import { DispatchLocationCard } from '../tabComponents/StoreTabComponents/DispatchLocationCard';

export function DispatchTab({ users, activity, setActivity }) {
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);

  // destinationlocation: dropdown + optional custom + status
  const [globalDispatchInfo, setGlobalDispatchInfo] = useState({
    destinationlocation: '', // 'own-store' | 'ufone' | 'ptcl' | 'zong' | 'custom'
    customDestinationlocation: '', // used only when dropdown = 'custom'
    dispatchDate: '', // WILL NOT BE SHOWN IN UI, ONLY SENT AS CURRENT DATE ON SAVE
    receiverName: '',
    destinationDetails: '',
    status: activity.dispatch?.status || 'pending', // dispatch status control
  });

  const [dispatchFormData, setDispatchFormData] = useState({});

  const { updateDismantling, isUpdating } = useDismantlingManagement();

  const dispatch = activity.dispatch || { status: 'pending', materials: [] };
  const existingDispatchMaterials = Array.isArray(dispatch.materials)
    ? dispatch.materials
    : [];

  // Materials that can be dispatched (you currently don't use them in UI)
  const dispatchableMaterials = useMemo(() => {
    if (
      Array.isArray(activity.dismantling?.actualMaterials) &&
      activity.dismantling.actualMaterials.length > 0
    ) {
      return activity.dismantling.actualMaterials;
    }

    if (
      Array.isArray(activity.survey?.materials) &&
      activity.survey.materials.length > 0
    ) {
      return activity.survey.materials.map((m) => ({
        materialId: m.materialId,
        name: m.name,
        quantityDismantled: m.quantity,
      }));
    }

    return [];
  }, [activity.dismantling, activity.survey]);

  const handleDispatchSubmit = async () => {
    if (!activity._id) return;

    if (dispatchableMaterials.length === 0) {
      toast.error('No materials available for dispatch.');
      return;
    }

    const {
      destinationlocation,
      customDestinationlocation,
      receiverName,
      destinationDetails,
      status: statusFromForm,
    } = globalDispatchInfo;

    // Resolve final destinationlocation
    let finalDestinationlocation = destinationlocation;
    if (destinationlocation === 'custom') {
      if (!customDestinationlocation.trim()) {
        toast.error('Please enter a custom destination location.');
        return;
      }
      finalDestinationlocation = customDestinationlocation.trim();
    }

    if (!finalDestinationlocation) {
      toast.error('Please select or enter a destination location.');
      return;
    }

    // You commented out quantity logic, so we just reuse existing materials
    let updatedMaterials = [...existingDispatchMaterials];

    dispatchableMaterials.forEach((material) => {
      const form = dispatchFormData[material.materialId];
      if (!form || !form.quantity) return;

      const qty = Number(form.quantity);
      if (qty <= 0) return;

      const existingIndex = updatedMaterials.findIndex(
        (m) => m.materialId === material.materialId
      );

      const payload = {
        materialId: material.materialId,
        name: material.name,
        quantity: qty,
      };

      if (existingIndex >= 0) {
        updatedMaterials[existingIndex].quantity += qty;
      } else {
        updatedMaterials.push(payload);
      }
    });

    // Status from form or existing dispatch
    const finalStatus = statusFromForm || dispatch.status || 'pending';

    // ALWAYS send current date (not shown in form)
    const currentDateISO = new Date().toISOString();

    const payload = {
      dispatch: {
        ...dispatch,
        destinationlocation: finalDestinationlocation,
        destinationDetails,
        dispatchDate: currentDateISO, // current date/time
        receiverName,
        materials: updatedMaterials,
        status: finalStatus,
      },
      timeline: {
        ...(activity.timeline || {}),
        ...(finalStatus === 'completed'
          ? { dispatchCompletionDate: currentDateISO }
          : {}),
      },
    };

    // If status is completed, also push overall activity progress
    if (finalStatus === 'completed') {
      payload.status = 'completed';
      payload.completionPercentage = 100;
    }

    try {
      await updateDismantling(activity._id, payload);

      setActivity((prev) => ({
        ...prev,
        dispatch: payload.dispatch,
        timeline: payload.timeline,
        ...(finalStatus === 'completed'
          ? {
              status: 'completed',
              completionPercentage: 100,
            }
          : {}),
      }));

      setDispatchFormData({});
      toast.success('Dispatch updated');
      setIsDispatchModalOpen(false);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Unable to update dispatch';
      toast.error(msg);
    }
  };

  const completeDispatch = async () => {
    if (!activity._id) return;

    const completionDateISO = new Date().toISOString();

    const payload = {
      dispatch: {
        ...dispatch,
        status: 'completed',
      },
      timeline: {
        ...(activity.timeline || {}),
        dispatchCompletionDate: completionDateISO,
      },
      status: 'completed',
      completionPercentage: 100,
    };

    try {
      await updateDismantling(activity._id, payload);

      setActivity((prev) => ({
        ...prev,
        dispatch: payload.dispatch,
        timeline: payload.timeline,
        status: 'completed',
        completionPercentage: 100,
      }));

      toast.success('Dispatch completed');
    } catch {
      toast.error('Failed to mark dispatch as completed');
    }
  };

  const dispatchStatus = dispatch.status || 'pending';

  // Decide whether we already have a dispatch to show "Edit Dispatch"
  const hasExistingDispatch =
    !!dispatch.destinationlocation ||
    !!dispatch.receiverName ||
    existingDispatchMaterials.length > 0;

  const handleOpenChange = (open) => {
    setIsDispatchModalOpen(open);

    if (open) {
      const d = activity.dispatch || {};

      // Pre-fill form with existing dispatch data
      const knownOptions = ['own-store', 'ufone', 'ptcl', 'zong', 'custom'];
      const dest = d.destinationlocation || '';

      let destinationlocation = dest;
      let customDestinationlocation = '';

      if (dest && !knownOptions.includes(dest)) {
        destinationlocation = 'custom';
        customDestinationlocation = dest;
      }

      setGlobalDispatchInfo({
        destinationlocation,
        customDestinationlocation,
        dispatchDate: '', // not used in UI anymore
        receiverName: d.receiverName || '',
        destinationDetails: d.destinationDetails || '',
        status: d.status || 'pending',
      });
    }
  };

return (
  <div className="space-y-6">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* LEFT COLUMN: Assignment + Attachments */}
      <div className="space-y-6">
        <StoreAssignmentTab
          activity={activity}
          setActivity={setActivity}
          users={users}
        />

        <StoreAttachmentTab activity={activity} setActivity={setActivity} />
      </div>

      {/* RIGHT COLUMN: Dispatch Details + Table */}
      <div className="space-y-6">
        <DispatchLocationCard
          activity={activity}
          dispatch={dispatch}
          dispatchStatus={dispatchStatus}
          existingDispatchMaterials={existingDispatchMaterials}
          isDispatchModalOpen={isDispatchModalOpen}
          handleOpenChange={handleOpenChange}
          globalDispatchInfo={globalDispatchInfo}
          setGlobalDispatchInfo={setGlobalDispatchInfo}
          dispatchableMaterials={dispatchableMaterials}
          isUpdating={isUpdating}
          hasExistingDispatch={hasExistingDispatch}
          handleDispatchSubmit={handleDispatchSubmit}
          completeDispatch={completeDispatch}
        />
      </div>
    </div>
  </div>
);

}
