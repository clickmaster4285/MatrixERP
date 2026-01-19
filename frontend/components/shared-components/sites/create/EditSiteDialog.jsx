// components/shared-components/sites/EditSiteDialog.jsx
'use client';

import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useUpdateSite } from '@/features/siteApi';
import SiteForm from './SiteForm';

export default function EditSiteDialog({
   site,
   open,
   onOpenChange,
   onSuccess
}) {
   const updateSiteMutation = useUpdateSite();

   const handleSubmit = async (formData) => {
      try {
         await updateSiteMutation.mutateAsync({
            siteId: site._id,
            updateData: formData,
         });

         toast.success('Site updated successfully', {
            description: `${formData.name} has been updated.`,
         });

         onOpenChange(false);
         onSuccess?.();
      } catch (error) {
         console.error('Update site error:', error);
         toast.error('Update failed', {
            description: error?.response?.data?.message || 'Please try again.',
         });
      }
   };

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
               <DialogTitle className="text-2xl font-bold">
                  Edit Site: {site?.name}
               </DialogTitle>
               <DialogDescription>
                  Update site information and details.
               </DialogDescription>
            </DialogHeader>

            {site && (
               <SiteForm
                  initialData={site}
                  onSubmit={handleSubmit}
                  submitLabel="Update Site"
                  isLoading={updateSiteMutation.isLoading}
               />
            )}
         </DialogContent>
      </Dialog>
   );
}