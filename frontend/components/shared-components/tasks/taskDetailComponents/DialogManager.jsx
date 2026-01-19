// @/components/shared-components/tasks/taskDetailComponents/DialogManager.jsx
'use client';

import { TaskWorkDialog } from './DynamicAddMaterialDialog/DynamicMaterialDialog';
import { TransportationUpdateDialog } from './Transportation/TransportationUpdateDialog';
import { InstallationUpdateDialog } from './Installation/InstallationUpdateDialog';
import { DIALOG_TYPES } from '../taskWorkConfig';

export function DialogManager({
   activeDialog,
   dialogStates,
   onClose,
   task,
   onUpdated,
   dialogType
}) {
   if (!activeDialog) return null;

   const commonProps = {
      open: dialogStates[activeDialog],
      task,
   };

   // Handle dialog close
   const handleDialogClose = () => {
      onClose(activeDialog);
   };

   // Handle success (after update)
   const handleSuccess = () => {
      onClose(activeDialog);
      if (onUpdated) {
         onUpdated();
      }
   };

   // Render based on dialog type
   switch (dialogType) {
      case DIALOG_TYPES.INSTALLATION:
         return (
            <InstallationUpdateDialog
               {...commonProps}
               onClose={handleDialogClose}
               onSuccess={handleSuccess}
            />
         );

      case DIALOG_TYPES.TRANSPORTATION:
         return (
            <TransportationUpdateDialog
               {...commonProps}
               onClose={handleDialogClose}
               onSuccess={handleSuccess}
            />
         );

      case DIALOG_TYPES.MATERIAL:
      default:
         return (
            <TaskWorkDialog
               {...commonProps}
               onClose={handleDialogClose}
               onUpdated={handleSuccess}
            />
         );
   }
}