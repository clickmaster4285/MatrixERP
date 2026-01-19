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
import { Plus, X, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

export const UserAssignment = ({
  assignedUsers = [],
  users = [],
  onAddUser,
  onRemoveUser,
}) => {
  const [selectedUser, setSelectedUser] = useState('');
  const [role, setRole] = useState('worker');

  const getAvailableUsers = () => {
    const assignedUserIds = assignedUsers.map((u) => u.userId || u._id || u.id);
    return users.filter((user) => !assignedUserIds.includes(user._id));
  };

  const availableUsers = getAvailableUsers();
  const hasAvailableUsers = availableUsers.length > 0;

  const handleAdd = () => {
    if (!selectedUser || selectedUser === 'no-users') {
      toast.error('Please select a user');
      return;
    }

    const user = users.find((u) => u._id === selectedUser);
    if (!user) {
      toast.error('User not found');
      return;
    }

    const assignment = {
      userId: user._id,
      role: role,
      name: user.name,
      email: user.email,
      assignedDate: new Date().toISOString(),
    };

    onAddUser(assignment);
    setSelectedUser('');
    setRole('worker');
  };

  return (
    <div className="space-y-3">
      {/* Add User Controls */}
      <div className="flex gap-2 items-end">
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
                  <SelectItem key={user._id} value={user._id}>
                    {user.name} ({user.role || 'No role'})
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
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="worker">Worker</SelectItem>
              <SelectItem value="supervisor">Supervisor</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
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

      {/* Assigned Users List */}
      {assignedUsers.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm">Assigned Team ({assignedUsers.length})</Label>
          <div className="space-y-2">
            {assignedUsers.map((assignment, index) => (
              <div
                key={assignment.userId || index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded border"
              >
                <div className="flex-1">
                  <div className="font-medium">
                    {assignment.name || 'Unknown User'}
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="capitalize">{assignment.role}</span>
                    {assignment.email && ` • ${assignment.email}`}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveUser(assignment.userId)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};