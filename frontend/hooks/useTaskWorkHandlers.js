// @/hooks/useTaskWorkHandlers.js
import { useState } from 'react';
import { normalizeRole } from '@/components/shared-components/tasks/taskDetailComponents/TaskDetailHelpers';
import { getRoleConfig } from '@/components/shared-components/tasks/taskWorkConfig';

export function useTaskWorkHandlers() {
   const [dialogStates, setDialogStates] = useState({
      survey: false,
      civil: false,
      telecom: false,
      store: false,
      dismantling: false,
      inventory: false,
      installation: false,
      transportation: false
   });

   const [activeDialog, setActiveDialog] = useState(null);
   const [activeDialogType, setActiveDialogType] = useState(null);

   // Centralized handler to open any work dialog
   const openWorkDialog = (workType, dialogType) => {
      setDialogStates(prev => ({ ...prev, [workType]: true }));
      setActiveDialog(workType);
      setActiveDialogType(dialogType);
   };

   const closeWorkDialog = (workType) => {
      setDialogStates(prev => ({ ...prev, [workType]: false }));
      setActiveDialog(null);
      setActiveDialogType(null);
   };

   // Get handler for a specific role
   const getHandlerForRole = (normalizedRole) => {
      const roleConfig = getRoleConfig(normalizedRole);

      // Special handling for installation and transportation
      if (normalizedRole === 'installation') {
         return () => openWorkDialog('installation', roleConfig.dialogType);
      }

      if (normalizedRole === 'transportation') {
         return () => openWorkDialog('transportation', roleConfig.dialogType);
      }

      // Material-based dialogs (survey, store, etc)
      return () => {
         const workType = roleConfig.workType || normalizedRole;
         openWorkDialog(workType, roleConfig.dialogType);
      };
   };

   return {
      dialogStates,
      activeDialog,
      activeDialogType,
      openWorkDialog,
      closeWorkDialog,
      getHandlerForRole
   };
}