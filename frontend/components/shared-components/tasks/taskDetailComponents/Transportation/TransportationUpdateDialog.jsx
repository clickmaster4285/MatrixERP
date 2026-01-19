// components/shared-components/tasks/taskDetailComponents/Transportation/TransportationUpdateDialog.jsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useUpdatePhase } from '@/features/taskApi';
import { Truck } from 'lucide-react';
import { toast } from 'sonner';

export function TransportationUpdateDialog({
   task,
   open,
   onClose,
   onSuccess
}) {

 
   const [status, setStatus] = useState(task.workData?.status || 'not-started');
   const [vehicleNumber, setVehicleNumber] = useState(task.workData?.vehicleNumber || '');
   const [driverName, setDriverName] = useState(task.workData?.driverName || '');
   const [driverContact, setDriverContact] = useState(task.workData?.driverContact || '');
   const [notes, setNotes] = useState(task.workData?.notes || '');

   const { mutate: updatePhase, isLoading, isSuccess, isError } = useUpdatePhase();

   // Reset form when dialog opens
   useEffect(() => {
      if (open) {
         setStatus(task.workData?.status || 'not-started');
         setVehicleNumber(task.workData?.vehicleNumber || '');
         setDriverName(task.workData?.driverName || '');
         setDriverContact(task.workData?.driverContact || '');
         setNotes(task.workData?.notes || '');
      }
   }, [open, task.workData]);

   // Handle success
   useEffect(() => {
      if (isSuccess && onSuccess) {
         toast.success("Transportation status has been updated successfully.");
         onSuccess();
      }
   }, [isSuccess, onSuccess]);

   // Handle error
   useEffect(() => {
      if (isError) {
         toast.error("Failed to update transportation status.");
      }
   }, [isError]);

   const handleSubmit = () => {
      const updates = {
         status,
         vehicleNumber,
         driverName,
         driverContact,
         notes,
      };

      updatePhase({
         activityType: task.activityType,
         activityId: task.parentActivityId,
         phase: task.siteType === 'destination' ? 'destinationSite' : 'sourceSite',
         subPhase: 'transportationWork',
         updates,
      });
   };

   const handleCancel = () => {
      if (!isLoading && onClose) {
         onClose();
      }
   };

   return (
      <Dialog open={open} onOpenChange={(openState) => {
         if (!openState && !isLoading) {
            handleCancel();
         }
      }}>
         <DialogContent className="sm:max-w-md">
            <DialogHeader>
               <DialogTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Update Transportation Status
               </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
               <div className="space-y-2">
                  <Label htmlFor="status">Transportation Status</Label>
                  <Select value={status} onValueChange={setStatus} disabled={isLoading}>
                     <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                     </SelectTrigger>
                     <SelectContent>
                        <SelectItem value="not-started">Not Started</SelectItem>
                        <SelectItem value="loading">Loading</SelectItem>
                        <SelectItem value="in-transit">In Transit</SelectItem>
                        <SelectItem value="unloading">Unloading</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                     </SelectContent>
                  </Select>
               </div>

               <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                     <Label htmlFor="vehicleNumber">Vehicle Number</Label>
                     <Input
                        id="vehicleNumber"
                        value={vehicleNumber}
                        onChange={(e) => setVehicleNumber(e.target.value)}
                        placeholder="Enter vehicle number"
                        disabled={isLoading}
                     />
                  </div>

                  <div className="space-y-2">
                     <Label htmlFor="driverName">Driver Name</Label>
                     <Input
                        id="driverName"
                        value={driverName}
                        onChange={(e) => setDriverName(e.target.value)}
                        placeholder="Enter driver name"
                        disabled={isLoading}
                     />
                  </div>
               </div>

               <div className="space-y-2">
                  <Label htmlFor="driverContact">Driver Contact</Label>
                  <Input
                     id="driverContact"
                     value={driverContact}
                     onChange={(e) => setDriverContact(e.target.value)}
                     placeholder="Enter driver contact number"
                     disabled={isLoading}
                  />
               </div>

               <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                     id="notes"
                     value={notes}
                     onChange={(e) => setNotes(e.target.value)}
                     placeholder="Add any notes about transportation"
                     rows={3}
                     disabled={isLoading}
                  />
               </div>
            </div>

            <div className="flex justify-end gap-3">
               <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
               >
                  Cancel
               </Button>
               <Button
                  onClick={handleSubmit}
                  disabled={isLoading}
               >
                  {isLoading ? 'Updating...' : 'Update Status'}
               </Button>
            </div>
         </DialogContent>
      </Dialog>
   );
}