'use client';

import { useState, useMemo, useCallback } from "react";
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from "@/features/userApi";
import { useGetMe } from "@/features/authApi";
import { toast } from "sonner";
import { Users, UserCheck, XCircle } from "lucide-react";
import { ROLES, ROLE_LABELS, ROLE_GROUPS } from "@/constants/roles";
import { handleApiError } from '@/utils/errorHandler';
// Department constants remain the same
export const DEPARTMENTS = [
   { value: "installation", label: "Installation" },
   { value: "maintenance", label: "Maintenance" },
   { value: "inventory", label: "Inventory" },
   { value: "planning", label: "Planning" },
];

export const INITIAL_FORM_DATA = {
   name: "",
   email: "",
   phone: "",
   role: "",
   department: "",
   password: "default123"
};

// Create ROLES array from constants for backward compatibility
export const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([value, label]) => ({
   value,
   label
}));

// Group roles for better UI in dropdown
export const GROUPED_ROLE_OPTIONS = [
   {
      group: "Management",
      roles: ROLE_GROUPS.MANAGEMENT.map(role => ({
         value: role,
         label: ROLE_LABELS[role]
      }))
   },
   {
      group: "Supervision",
      roles: ROLE_GROUPS.SUPERVISION.map(role => ({
         value: role,
         label: ROLE_LABELS[role]
      }))
   },
   {
      group: "Technical",
      roles: ROLE_GROUPS.TECHNICAL.map(role => ({
         value: role,
         label: ROLE_LABELS[role]
      }))
   },
   {
      group: "Operations",
      roles: ROLE_GROUPS.OPERATIONS.map(role => ({
         value: role,
         label: ROLE_LABELS[role]
      }))
   },
   {
      group: "Support",
      roles: ROLE_GROUPS.SUPPORT.map(role => ({
         value: role,
         label: ROLE_LABELS[role]
      }))
   }
];

export const useStaffManagement = () => {
   // API Hooks
   const { data: users = [], isLoading, error, refetch } = useUsers();
   const { data: currentUser } = useGetMe();
   const createUserMutation = useCreateUser();
   const updateUserMutation = useUpdateUser();
   const deleteUserMutation = useDeleteUser();

   // State
   const [searchTerm, setSearchTerm] = useState("");
   const [isDialogOpen, setIsDialogOpen] = useState(false);
   const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
   const [editingUser, setEditingUser] = useState(null);
   const [userToDelete, setUserToDelete] = useState(null);
   const [formData, setFormData] = useState(INITIAL_FORM_DATA);

   // Filter users with useMemo
   const filteredUsers = useMemo(() => {
      if (!searchTerm.trim()) return users;

      const term = searchTerm.toLowerCase();
      return users.filter(user =>
         user.name.toLowerCase().includes(term) ||
         (user.email && user.email.toLowerCase().includes(term)) ||
         (user.phone && user.phone.includes(term)) ||
         (user.role && ROLE_LABELS[user.role]?.toLowerCase().includes(term))
      );
   }, [users, searchTerm]);

   // Calculate stats
   const stats = useMemo(() => {
      const totalUsers = users.length;
      const activeUsers = users.filter(u => u.isActive).length;
      const inactiveUsers = totalUsers - activeUsers;

      return [
         {
            label: "Total Users",
            value: totalUsers,
            border: "border-l-sky-500",
            bg: "bg-sky-50",
            iconColor: "text-sky-600",
            Icon: Users
         },
         {
            label: "Active",
            value: activeUsers,
            border: "border-l-emerald-500",
            bg: "bg-emerald-50",
            iconColor: "text-emerald-600",
            Icon: UserCheck
         },
         {
            label: "Inactive",
            value: inactiveUsers,
            border: "border-l-rose-500",
            bg: "bg-rose-50",
            iconColor: "text-rose-600",
            Icon: XCircle
         },
      ];
   }, [users]);

   // Get role label helper
   const getRoleLabel = useCallback((roleValue) => {
      return ROLE_LABELS[roleValue] || roleValue;
   }, []);

   // Get role group helper
   const getRoleGroup = useCallback((roleValue) => {
      for (const [group, roles] of Object.entries(ROLE_GROUPS)) {
         if (roles.includes(roleValue)) {
            return group;
         }
      }
      return "Other";
   }, []);

   // Rest of the hooks remain the same...
   // Form handlers
   const updateFormField = useCallback((field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
   }, []);

   const handleEdit = useCallback((user) => {
      setEditingUser(user);
      setFormData({
         name: user.name,
         email: user.email || "",
         phone: user.phone || "",
         role: user.role,
         department: user.department,
         password: ""
      });
      setIsDialogOpen(true);
   }, []);

   const confirmDelete = useCallback((user) => {
      setUserToDelete(user);
      setDeleteConfirmOpen(true);
   }, []);

   const resetForm = useCallback(() => {
      setFormData(INITIAL_FORM_DATA);
      setEditingUser(null);
      setIsDialogOpen(false);
   }, []);

   // Validation
   const validateForm = () => {
      if (!formData.name.trim()) {
         toast.error("Validation Error", {
            description: "Please enter a name for the staff member."
         });
         return false;
      }

      if (!formData.role) {
         toast.error("Validation Error", {
            description: "Please select a role for the staff member."
         });
         return false;
      }

      if (!formData.department) {
         toast.error("Validation Error", {
            description: "Please select a department for the staff member."
         });
         return false;
      }

      if (!editingUser && (!formData.password || formData.password.length < 6)) {
         toast.error("Validation Error", {
            description: "Password must be at least 6 characters long."
         });
         return false;
      }

      return true;
   };

   // Submit handler
   const handleSubmit = async (e) => {
      e.preventDefault();

      if (!validateForm()) return;

      let toastId;

      try {
         const dataToSend = { ...formData };

         // If email is empty string, don't send it
         if (dataToSend.email === '') {
            delete dataToSend.email;
         }

         // If editing and password is empty, don't send password field
         if (editingUser && !formData.password.trim()) {
            delete dataToSend.password;
         }

         if (editingUser) {
            toastId = toast.loading("Updating staff member...");

            await updateUserMutation.mutateAsync({
               id: editingUser._id,
               data: dataToSend
            });

            toast.success("Staff Updated", {
               id: toastId,
               description: `${formData.name} has been updated successfully.`
            });

            refetch();
         } else {
            toastId = toast.loading("Creating staff member...");

            await createUserMutation.mutateAsync(dataToSend);

            toast.success("Staff Created", {
               id: toastId,
               description: `${formData.name} has been added to the team.`
            });

            refetch();
         }

         resetForm();
      } catch (error) {
         handleApiError(error, toast, toastId);
      }
   };

   // Delete handler
   const handleDelete = async () => {
      if (!userToDelete) return;

      const toastId = toast.loading("Deleting staff member...");

      try {
         await deleteUserMutation.mutateAsync(userToDelete._id);

         toast.success("Staff Deleted", {
            id: toastId,
            description: `${userToDelete.name} has been removed from the system.`
         });

         refetch();
         setDeleteConfirmOpen(false);
         setUserToDelete(null);
      } catch (error) {
         toast.error("Delete Failed", {
            id: toastId,
            description: error.response?.data?.message || 'Failed to delete staff member.',
            duration: 5000
         });
      }
   };

   // Utility functions
   const getStatusBadge = useCallback((user) => {
      return user.isActive ? "Active" : "Inactive";
   }, []);

   const getStatusVariant = useCallback((user) => {
      return user.isActive ? "active" : "inActive";
   }, []);

   const getDepartmentLabel = useCallback((deptValue) => {
      const dept = DEPARTMENTS.find(d => d.value === deptValue);
      return dept ? dept.label : deptValue;
   }, []);

   return {
      // State
      users,
      filteredUsers,
      stats,
      searchTerm,
      setSearchTerm,
      isDialogOpen,
      setIsDialogOpen,
      deleteConfirmOpen,
      setDeleteConfirmOpen,
      editingUser,
      userToDelete,
      formData,

      // Constants
      ROLES: ROLE_OPTIONS,
      GROUPED_ROLES: GROUPED_ROLE_OPTIONS,
      DEPARTMENTS,

      // Loading & Error
      isLoading,
      error,
      refetch,
      currentUser,

      // Mutations
      createUserMutation,
      updateUserMutation,
      deleteUserMutation,

      // Form handlers
      updateFormField,
      handleSubmit,
      resetForm,
      handleEdit,
      confirmDelete,
      handleDelete,

      // Utility functions
      getStatusBadge,
      getStatusVariant,
      getRoleLabel,
      getRoleGroup,
      getDepartmentLabel
   };
};