// components/shared-components/sites/create/CreateSiteDialog.jsx - UPDATED
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useCreateSite } from '@/features/siteApi';
import SiteForm from './SiteForm';

export default function CreateSiteDialog({ open, onOpenChange, projectId }) {
  const createSiteMutation = useCreateSite();
  const router = useRouter();

  const handleSiteCreated = async (
    formData,
    shouldOpenActivityDialog = false
  ) => {
    try {
      // Add projectId to formData if provided
      const siteData = projectId ? { ...formData, project: projectId } : formData;

      const response = await createSiteMutation.mutateAsync(siteData);

      toast.success('Site created successfully', {
        description: `${formData.name} has been added.`,
      });

      onOpenChange(false);

      // Refresh the page to show new site
      if (window.location) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Create site error:', error);
      toast.error('Creation failed', {
        description: error?.response?.data?.message || 'Please try again.',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {projectId ? 'Add Site to Project' : 'Create New Site'}
          </DialogTitle>
          <DialogDescription>
            {projectId
              ? 'Add a new site to this project'
              : 'Add a new site to manage material transfer and installations.'
            }
          </DialogDescription>
        </DialogHeader>

        <SiteForm
          onSubmit={(data) => handleSiteCreated(data, false)}
          onNext={(data) => handleSiteCreated(data, true)}
          submitLabel="Create Site"
          isLoading={createSiteMutation.isLoading}
          showNextButton={false}
          projectId={projectId}
          onOpenChange={onOpenChange}
        />
      </DialogContent>
    </Dialog>
  );
}