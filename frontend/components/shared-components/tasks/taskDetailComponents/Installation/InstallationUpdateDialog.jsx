// components/shared-components/tasks/taskDetailComponents/Installation/InstallationUpdateDialog.jsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useUpdatePhase } from '@/features/taskApi';
import { Wrench } from 'lucide-react';

export function InstallationUpdateDialog({
   task,
   open,
   onClose,
   onSuccess
}) {
   const [status, setStatus] = useState(task.workData?.status || 'not-started');
   const [notes, setNotes] = useState(task.workData?.notes || '');

   const { mutate: updatePhase, isLoading, isSuccess, isError, error } = useUpdatePhase();

   // Reset form when dialog opens
   useEffect(() => {
      if (open) {
         setStatus(task.workData?.status || 'not-started');
         setNotes(task.workData?.notes || '');
      }
   }, [open, task.workData]);

   // Handle success
   useEffect(() => {
      if (isSuccess && onSuccess) {
         onSuccess();
      }
   }, [isSuccess, onSuccess]);

   // Handle error
   useEffect(() => {
      if (isError) {
         console.error('Installation update error:', error);
      }
   }, [isError, error]);

   const handleSubmit = () => {
      const updates = {
         status,
         notes,
      };

      updatePhase({
         activityType: task.activityType,
         activityId: task.parentActivityId,
         phase: task.siteType === 'destination' ? 'destinationSite' : 'sourceSite',
         subPhase: 'installationWork',
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
                  <Wrench className="h-5 w-5" />
                  Update Installation Status
               </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
               <div className="space-y-2">
                  <Label htmlFor="status">Installation Status</Label>
                  <Select value={status} onValueChange={setStatus} disabled={isLoading}>
                     <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                     </SelectTrigger>
                     <SelectContent>
                        <SelectItem value="not-started">Not Started</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                     </SelectContent>
                  </Select>
               </div>

               <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                     id="notes"
                     value={notes}
                     onChange={(e) => setNotes(e.target.value)}
                     placeholder="Add any notes about the installation"
                     rows={4}
                     disabled={isLoading}
                  />
               </div>
            </div>

            <div className="flex justify-end gap-3">
               <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                  Cancel
               </Button>
               <Button onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Status'}
               </Button>
            </div>
         </DialogContent>
      </Dialog>
   );
}