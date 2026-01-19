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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { UserAssignment } from './UserAssignment';
import { toast } from 'sonner';
import {
   ClipboardCheck,
   Package,
   Truck,
   Wrench,
   Calendar,
   FileText
} from 'lucide-react';

const WORK_TYPE_LABELS = {
   survey: { label: 'Survey Work', icon: ClipboardCheck, color: 'bg-sky-100 text-sky-800' },
   inventory: { label: 'Inventory Work', icon: Package, color: 'bg-green-100 text-green-800' },
   transportation: { label: 'Transportation Work', icon: Truck, color: 'bg-purple-100 text-purple-800' },
   installation: { label: 'Installation Work', icon: Wrench, color: 'bg-amber-100 text-amber-800' }
};

const WORK_STATUS_OPTIONS = [
   { value: 'not-started', label: 'Not Started' },
   { value: 'in-progress', label: 'In Progress' },
   { value: 'completed', label: 'Completed' },
   { value: 'loading', label: 'Loading' },
   { value: 'in-transit', label: 'In Transit' },
   { value: 'unloading', label: 'Unloading' }
];

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

   const [transportationData, setTransportationData] = useState({
      vehicleNumber: '',
      driverName: '',
      driverContact: ''
   });

   const [installationData, setInstallationData] = useState({
      equipmentInstalled: []
   });

   useEffect(() => {
      if (open && workData) {
         setLocalData({
            status: workData.status || 'not-started',
            assignedUsers: workData.assignedUsers || [],
            notes: workData.notes || '',
            required: workData.required !== false,
         });

         if (workType === 'transportation') {
            setTransportationData({
               vehicleNumber: workData.vehicleNumber || '',
               driverName: workData.driverName || '',
               driverContact: workData.driverContact || ''
            });
         }

         if (workType === 'installation') {
            setInstallationData({
               equipmentInstalled: workData.equipmentInstalled || []
            });
         }
      }
   }, [open, workData, workType]);

   const workTypeInfo = WORK_TYPE_LABELS[workType] || { label: workType, icon: FileText };

   const handleSave = () => {
      const saved = {
         ...localData,
         assignedUsers: (localData.assignedUsers || []).map((u) => ({
            ...u,
            userId: u.userId || u._id || u.id,
            role: u.role || 'worker',
            assignedDate: u.assignedDate || new Date().toISOString()
         })),
         ...(workType === 'transportation' && transportationData),
         ...(workType === 'installation' && installationData)
      };

      onSave(saved);
      toast.success(`${workTypeInfo.label} configured successfully!`);
      onOpenChange(false);
   };

   const handleAddEquipment = () => {
      setInstallationData(prev => ({
         ...prev,
         equipmentInstalled: [...prev.equipmentInstalled, { name: '', quantity: 1 }]
      }));
   };

   const handleEquipmentChange = (index, field, value) => {
      const updated = [...installationData.equipmentInstalled];
      updated[index] = { ...updated[index], [field]: value };
      setInstallationData(prev => ({ ...prev, equipmentInstalled: updated }));
   };

   const handleRemoveEquipment = (index) => {
      setInstallationData(prev => ({
         ...prev,
         equipmentInstalled: prev.equipmentInstalled.filter((_, i) => i !== index)
      }));
   };

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
               <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${workTypeInfo.color}`}>
                     <workTypeInfo.icon className="w-5 h-5" />
                  </div>
                  <div>
                     <DialogTitle className="text-xl font-bold">
                        Configure {workTypeInfo.label}
                     </DialogTitle>
                     <p className="text-sm text-muted-foreground">
                        Set up team assignments, status, and work details
                     </p>
                  </div>
               </div>
            </DialogHeader>

            <div className="space-y-6 py-4">
               {/* Status */}
               <div className="space-y-2">
                  <Label>Work Status</Label>
                  <Select
                     value={localData.status}
                     onValueChange={(v) => setLocalData(d => ({ ...d, status: v }))}
                  >
                     <SelectTrigger>
                        <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                        {WORK_STATUS_OPTIONS.filter(option => {
                           if (workType === 'transportation') {
                              return ['not-started', 'loading', 'in-transit', 'unloading', 'completed'].includes(option.value);
                           }
                           return ['not-started', 'in-progress', 'completed'].includes(option.value);
                        }).map((o) => (
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
                     assignedUsers={localData.assignedUsers}
                     users={users}
                     onAddUser={(newUser) =>
                        setLocalData(d => ({
                           ...d,
                           assignedUsers: [...d.assignedUsers, newUser],
                        }))
                     }
                     onRemoveUser={(userId) =>
                        setLocalData(d => ({
                           ...d,
                           assignedUsers: d.assignedUsers.filter(
                              (u) => (u.userId || u._id || u.id) !== userId
                           ),
                        }))
                     }
                  />
               </div>

               {/* Work-specific Fields */}
               {workType === 'transportation' && (
                  <div className="space-y-4">
                     <Separator />
                     <h4 className="font-medium">Transportation Details</h4>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                           <Label>Vehicle Number</Label>
                           <Input
                              value={transportationData.vehicleNumber}
                              onChange={(e) => setTransportationData(d => ({ ...d, vehicleNumber: e.target.value }))}
                              placeholder="Enter vehicle number"
                           />
                        </div>
                        <div className="space-y-2">
                           <Label>Driver Name</Label>
                           <Input
                              value={transportationData.driverName}
                              onChange={(e) => setTransportationData(d => ({ ...d, driverName: e.target.value }))}
                              placeholder="Driver name"
                           />
                        </div>
                        <div className="space-y-2">
                           <Label>Driver Contact</Label>
                           <Input
                              value={transportationData.driverContact}
                              onChange={(e) => setTransportationData(d => ({ ...d, driverContact: e.target.value }))}
                              placeholder="Contact number"
                           />
                        </div>
                     </div>
                  </div>
               )}

               {/* Notes */}
               <div className="space-y-2">
                  <Label>Work Notes</Label>
                  <Textarea
                     value={localData.notes}
                     onChange={(e) => setLocalData(d => ({ ...d, notes: e.target.value }))}
                     placeholder="Add notes about this work..."
                     rows={4}
                  />
               </div>

               {/* Summary */}
               <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Configuration Summary</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                     <div>
                        <span className="text-muted-foreground">Status:</span>
                        <Badge className="ml-2">
                           {localData.status.replace('-', ' ')}
                        </Badge>
                     </div>
                     <div>
                        <span className="text-muted-foreground">Team Members:</span>
                        <span className="ml-2 font-medium">{localData.assignedUsers.length}</span>
                     </div>
                     {workType === 'transportation' && (
                        <>
                           <div>
                              <span className="text-muted-foreground">Vehicle:</span>
                              <span className="ml-2 font-medium">{transportationData.vehicleNumber || 'Not set'}</span>
                           </div>
                           <div>
                              <span className="text-muted-foreground">Driver:</span>
                              <span className="ml-2 font-medium">{transportationData.driverName || 'Not set'}</span>
                           </div>
                        </>
                     )}
                  </div>
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