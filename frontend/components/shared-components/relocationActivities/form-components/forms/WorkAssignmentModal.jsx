'use client';

import { useState, useEffect } from 'react';
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
} from '@/components/ui/dialog';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { UserAssignment } from './UserAssignment';
import { WORK_STATUS_OPTIONS } from '../utils/options';
import { toast } from 'sonner';

const WORK_TYPE_LABELS = {
   survey: 'Survey Work',
   dismantling: 'Dismantling Work',
   storeOperator: 'Store Operator Work',
   civil: 'Civil Work',
   telecom: 'Telecom Work',
};

export const WorkAssignmentModal = ({
   open,
   onOpenChange,
   workType,
   workData = {},
   users = [],
   onSave,
}) => {
   const [localData, setLocalData] = useState({
      status: 'not-started',
      assignedUsers: [],
      notes: '',
      required: true,
   });

   useEffect(() => {
      if (open) {
         setLocalData({
            status: 'not-started',
            assignedUsers: [],
            notes: '',
            required: true,
            ...workData,
         });
      }
   }, [open, workData]);

   const handleSave = () => {
      const saved = {
         ...localData,
         assignedUsers: (localData.assignedUsers || []).map((u) => ({
            ...u,
            userId: u.userId || u._id || u.id,
            role: u.role || 'worker',
         })),
      };

      onSave(saved);
      toast.success(`${WORK_TYPE_LABELS[workType]} configured successfully!`);
      onOpenChange(false);
   };

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="max-w-lg">
            <DialogHeader>
               <DialogTitle className="text-xl font-bold">
                  Configure {WORK_TYPE_LABELS[workType]}
               </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
               {/* Status */}
               <div className="space-y-2">
                  <Label>Initial Status</Label>
                  <Select
                     value={localData.status || 'not-started'}
                     onValueChange={(v) => setLocalData(d => ({ ...d, status: v }))}
                  >
                     <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                     </SelectTrigger>
                     <SelectContent>
                        {WORK_STATUS_OPTIONS.map((o) => (
                           <SelectItem key={o.value} value={o.value}>
                              {o.label}
                           </SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               </div>

               {/* Team Assignment */}
               <div className="space-y-2">
                  <Label>Assign Team</Label>
                  <UserAssignment
                     assignedUsers={localData.assignedUsers || []}
                     users={users}
                     onAddUser={(newUser) =>
                        setLocalData(d => ({
                           ...d,
                           assignedUsers: [...(d.assignedUsers || []), newUser],
                        }))
                     }
                     onRemoveUser={(userId) =>
                        setLocalData(d => ({
                           ...d,
                           assignedUsers: (d.assignedUsers || []).filter(
                              (u) => (u.userId || u._id || u.id) !== userId
                           ),
                        }))
                     }
                  />
               </div>

               {/* Notes */}
               <div className="space-y-2">
                  <Label>Initial Notes</Label>
                  <Textarea
                     value={localData.notes || ''}
                     onChange={(e) => setLocalData(d => ({ ...d, notes: e.target.value }))}
                     placeholder="Add initial notes about this work..."
                     rows={3}
                  />
               </div>

               {/* Footer Buttons */}
               <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                     Cancel
                  </Button>
                  <Button onClick={handleSave}>
                     Save Configuration
                  </Button>
               </div>
            </div>
         </DialogContent>
      </Dialog>
   );
};