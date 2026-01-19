'use client';

import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, X, UserX, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

const ROLE_OPTIONS = [
   { value: 'supervisor', label: 'Supervisor' },
   { value: 'team-lead', label: 'Team Lead' },
   { value: 'technician', label: 'Technician' },
   { value: 'operator', label: 'Operator' },
   { value: 'driver', label: 'Driver' },
   { value: 'helper', label: 'Helper' },
   { value: 'worker', label: 'Worker' }
];

export const UserAssignment = ({
   assignedUsers = [],
   users = [],
   onAddUser,
   onRemoveUser,
}) => {
   const [selectedUser, setSelectedUser] = useState('');
   const [role, setRole] = useState('worker');

   const getAvailableUsers = () => {
      // Get all assigned user IDs from assignment objects
      const assignedUserIds = assignedUsers.map((assignment) =>
         assignment.userId || assignment.id || assignment._id
      );

      // Filter out users who are already assigned
      return users.filter((user) => {
         // Use user.value as the ID (based on your data structure)
         const userId = user.value || user._id || user.id;
         return !assignedUserIds.includes(userId);
      });
   };

   const availableUsers = getAvailableUsers();
   const hasAvailableUsers = availableUsers.length > 0;

   const handleAdd = () => {
      if (!selectedUser || selectedUser === 'no-users') {
         toast.error('Please select a user');
         return;
      }

      // Find the user by value (ID)
      const user = users.find((u) => u.value === selectedUser || u._id === selectedUser || u.id === selectedUser);
      if (!user) {
         toast.error('User not found');
         return;
      }

      const assignment = {
         userId: user.value || user._id || user.id, // Use value as userId
         role: role,
         name: user.label || user.name || 'Unknown', // Use label as name
         email: user.email || '',
         assignedDate: new Date().toISOString(),
      };

      onAddUser(assignment);
      setSelectedUser('');
      setRole('worker');
      toast.success(`Added ${assignment.name} as ${role}`);
   };

   const formatDate = (dateString) => {
      if (!dateString) return '';
      try {
         return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
         });
      } catch {
         return '';
      }
   };

   const handleRemoveUser = (path, userIdToRemove) => {
      handleChange(path, currentAssignedUsers.filter(user => user.userId !== userIdToRemove));
   };

   return (
      <div className="space-y-4">
         {/* Add User Controls */}
         <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex gap-3 items-end">
               <div className="flex-1 space-y-2">
                  <Label className="text-sm">Select User</Label>
                  <Select
                     value={selectedUser}
                     onValueChange={setSelectedUser}
                     disabled={!hasAvailableUsers}
                  >
                     <SelectTrigger>
                        <SelectValue
                           placeholder={
                              hasAvailableUsers ? 'Choose team member' : 'No users available'
                           }
                        />
                     </SelectTrigger>
                     <SelectContent>
                        {hasAvailableUsers ? (
                           availableUsers.map((user) => (
                              <SelectItem key={user.value} value={user.value}>
                                 <div className="flex items-center justify-between">
                                    <span>{user.label || user.name}</span>
                                    <Badge variant="outline" className="text-xs">
                                       {user.role || 'No role'}
                                    </Badge>
                                 </div>
                              </SelectItem>
                           ))
                        ) : (
                           <SelectItem value="no-users" disabled>
                              <div className="flex items-center gap-2 text-gray-500">
                                 <UserX className="h-4 w-4" />
                                 <span>No available users</span>
                              </div>
                           </SelectItem>
                        )}
                     </SelectContent>
                  </Select>
               </div>

               <div className="w-32 space-y-2">
                  <Label className="text-sm">Role</Label>
                  <Select value={role} onValueChange={setRole}>
                     <SelectTrigger>
                        <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                        {ROLE_OPTIONS.map((roleOpt) => (
                           <SelectItem key={roleOpt.value} value={roleOpt.value}>
                              {roleOpt.label}
                           </SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               </div>

               <Button
                  onClick={handleAdd}
                  disabled={!selectedUser}
                  className="h-10"
               >
                  <Plus className="h-4 w-4" />
               </Button>
            </div>
         </div>

         {/* Assigned Users List */}
         {assignedUsers.length > 0 && (
            <div className="space-y-3">
               <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Assigned Team ({assignedUsers.length})</Label>
                  <Badge variant="secondary">
                     <UserCheck className="h-3 w-3 mr-1" />
                     {assignedUsers.length} member{assignedUsers.length !== 1 ? 's' : ''}
                  </Badge>
               </div>

               <div className="space-y-2">
                  {assignedUsers.map((assignment, index) => (
                     <div
                        key={assignment.userId || index}
                        className="flex items-center justify-between p-3 bg-white border rounded-lg hover:shadow-sm transition-shadow"
                     >
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">
                                 {assignment.name?.charAt(0).toUpperCase() || 'U'}
                              </span>
                           </div>
                           <div className="flex-1">
                              <div className="font-medium">
                                 {assignment.name || 'Unknown User'}
                              </div>
                              <div className="text-xs text-gray-600 flex items-center gap-2">
                                 <Badge variant="outline" className="text-xs capitalize">
                                    {assignment.role}
                                 </Badge>
                                 {assignment.email && (
                                    <>
                                       <Separator orientation="vertical" className="h-3" />
                                       <span>{assignment.email}</span>
                                    </>
                                 )}
                              </div>
                           </div>
                        </div>

                        <div className="flex items-center gap-3">
                           {assignment.assignedDate && (
                              <div className="text-xs text-gray-500">
                                 Assigned {formatDate(assignment.assignedDate)}
                              </div>
                           )}
                           <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onRemoveUser(assignment.userId)} // This should be the value from user.value
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                           >
                              <X className="h-4 w-4" />
                           </Button>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         )}

         {assignedUsers.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
               <UserX className="h-12 w-12 text-gray-300 mx-auto mb-3" />
               <h4 className="text-gray-500 font-medium">No team members assigned</h4>
               <p className="text-sm text-gray-400 mt-1">
                  Add team members using the controls above
               </p>
            </div>
         )}
      </div>
   );
};