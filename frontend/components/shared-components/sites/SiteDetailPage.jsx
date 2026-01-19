// components/shared-components/sites/SiteDetailPage.jsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useGetSiteById, useDeleteSite } from '@/features/siteApi';
import { useUsers } from '@/features/userApi';
import { useCreateDismantlingActivity } from '@/features/dismantlingApi'; // Import the API hook
import EditSiteDialog from './create/EditSiteDialog';

// Import new components
import SiteHeader from './detail/SiteHeader';
import SiteInfoCard from './detail/SiteInfoCard';
import ActivitiesSummaryCard from './detail/ActivitiesSummaryCard';
import NotesCard from './detail/NotesCard';
import ActivitiesTabs from './detail/ActivitiesTabs';
import MaterialsOverview from './detail/MaterialsOverview';

// Import DismantlingCreateDialog
import DismantlingCreateDialog from '@/components/shared-components/dismantlingActivities/dismantlingActivityPageComponents/DismantlingCreateDialog';
import { Button } from '@/components/ui/button';
import { HardHat, Plus } from 'lucide-react';

export default function SiteDetailPage() {
   const params = useParams();
   const router = useRouter();
   const siteId = params.id;

   const [editDialogOpen, setEditDialogOpen] = useState(false);
   const [isCreateOpen, setIsCreateOpen] = useState(false); // State for dialog

   const { data: siteData, isLoading, error, refetch } = useGetSiteById(siteId);
   const deleteSiteMutation = useDeleteSite();

   // Use the dismantling creation hook
   const createDismantlingMutation = useCreateDismantlingActivity();

   // Get users for the dismantling dialog
   const { data: usersRaw } = useUsers({ page: 1, limit: 100 });

   // Form state for dismantling creation
   const [formData, setFormData] = useState({
      siteId: '',
      dismantlingType: 'B2S', // Default value
      state: '',
      city: '',
      address: '',
      assignedTo: [],
      surveyAssignedTo: '',
      dismantlingAssignedTo: '',
      storeAssignedTo: '',
   });

   // Refresh data when edit dialog closes
   useEffect(() => {
      if (!editDialogOpen) {
         refetch();
      }
   }, [editDialogOpen, refetch]);

   // Initialize form with site data when dialog opens
   useEffect(() => {
      if (isCreateOpen && siteData?.data) {
         const site = siteData.data;
         const region = site.region || '';

         setFormData(prev => ({
            ...prev,
            siteId: site._id,
            state: region,
            city: region,
            address: `${site.name} (${site.siteId})`,
            dismantlingType: 'B2S' // Reset to default
         }));
      }
   }, [isCreateOpen, siteData]);

   if (isLoading) {
      return (
         <div className="min-h-screen p-6">
            <div className="max-w-7xl mx-auto">
               <div className="animate-pulse space-y-4">
                  <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-64 bg-gray-200 rounded"></div>
               </div>
            </div>
         </div>
      );
   }

   if (error || !siteData?.data) {
      return (
         <div className="min-h-screen p-6">
            <div className="max-w-7xl mx-auto">
               <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
                  <h2 className="text-2xl font-bold text-red-800 mb-4">
                     Site Not Found
                  </h2>
                  <p className="text-red-600 mb-4">
                     The site you're looking for doesn't exist or you don't have permission to view it.
                  </p>
                  <Button onClick={() => router.push('/admin/sites')}>
                     Go Back to Sites
                  </Button>
               </div>
            </div>
         </div>
      );
   }

   const site = siteData.data;
   const activities = site.activities || {
      dismantling: { count: 0, activities: [] },
      cow: { count: 0, activities: [] },
      relocation: { count: 0, activities: [] },
   };

   // Format users for the dialog
   const users = Array.isArray(usersRaw?.data?.users)
      ? usersRaw.data.users
      : Array.isArray(usersRaw?.users)
         ? usersRaw.users
         : Array.isArray(usersRaw?.data)
            ? usersRaw.data
            : Array.isArray(usersRaw)
               ? usersRaw
               : [];

   const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleDateString('en-US', {
         year: 'numeric',
         month: 'short',
         day: 'numeric',
         hour: '2-digit',
         minute: '2-digit',
      });
   };

   const handleDelete = async () => {
      if (!confirm(`Are you sure you want to delete site "${site.name}"? This action cannot be undone.`)) return;

      try {
         await deleteSiteMutation.mutateAsync(site._id);
         toast.success('Site deleted successfully');
         router.push('/admin/sites');
      } catch (error) {
         toast.error('Failed to delete site', {
            description: error?.message || 'Please try again.',
         });
      }
   };

   // Handle dismantling creation - USING ACTUAL API
   const handleCreateDismantling = async () => {
      if (
         !formData.siteId ||
         !formData.dismantlingType ||
         !formData.state ||
         !formData.city ||
         formData.assignedTo.length === 0
      ) {
         toast.error('Please fill all required fields');
         return;
      }

      try {
         // Build assignActivityTasks from dialog fields
         const assignActivityTasks = {
            assignSurveyTo: formData.surveyAssignedTo
               ? [formData.surveyAssignedTo]
               : [],
            assignDismantlingTo: formData.dismantlingAssignedTo
               ? [formData.dismantlingAssignedTo]
               : [],
            assignStoreTo: formData.storeAssignedTo
               ? [formData.storeAssignedTo]
               : [],
         };

         const hasAnyTaskAssignee =
            assignActivityTasks.assignSurveyTo.length > 0 ||
            assignActivityTasks.assignDismantlingTo.length > 0 ||
            assignActivityTasks.assignStoreTo.length > 0;

         const basePayload = {
            site: formData.siteId,
            dismantlingType: formData.dismantlingType,
            location: [
               {
                  state: formData.state,
                  address: formData.address,
                  city: formData.city,
               },
            ],
            assignment: {
               assignedTo: formData.assignedTo, // main manager
               status: 'assigned',
            },
            timeline: {
               plannedStartDate: formData.plannedStartDate || null,
               plannedEndDate: formData.plannedEndDate || null,
            },
            notes: formData.notes || '',
         };

         // Only include assignActivityTasks if something is selected
         const payload = hasAnyTaskAssignee
            ? { ...basePayload, assignActivityTasks }
            : basePayload;

         // Use the actual API mutation
         await createDismantlingMutation.mutateAsync(payload);
         toast.success('Dismantling activity created successfully!');

         // Refresh the site data to show the new activity
         refetch();
         setIsCreateOpen(false);

         // Reset form
         setFormData({
            siteId: '',
            dismantlingType: 'B2S',
            state: '',
            city: '',
            address: '',
            assignedTo: [],
            surveyAssignedTo: '',
            dismantlingAssignedTo: '',
            storeAssignedTo: '',
         });
      } catch (err) {
         const msg =
            err?.response?.data?.message ||
            err?.message ||
            'Error creating dismantling activity';
         toast.error(msg);
      }
   };

   return (
      <div className="min-h-screen">
               {/* Header Component */}
               <SiteHeader
                  site={site}
                  onEdit={() => setEditDialogOpen(true)}
                  onDelete={handleDelete}
                  isDeleting={deleteSiteMutation.isLoading}
               />
               {/* Main Content */}
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column - Site Info & Activities Summary */}
                  <div className="lg:col-span-1 space-y-6">
                     <SiteInfoCard site={site} />
                     <ActivitiesSummaryCard activities={activities} />
                     <NotesCard notes={site.notes} />
                  </div>

                  {/* Right Column - Activities Details */}
                  <div className="lg:col-span-2">
                     <ActivitiesTabs activities={activities} formatDate={formatDate} siteId={site._id} setIsCreateOpen={setIsCreateOpen} />
                     <MaterialsOverview activities={activities} />
                  </div>
               </div>

         {/* Edit Site Dialog */}
         <EditSiteDialog
            site={site}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
         />

         {/* Dismantling Create Dialog */}
         <DismantlingCreateDialog
            isOpen={isCreateOpen}
            onOpenChange={setIsCreateOpen}
            formData={formData}
            setFormData={setFormData}
            sites={[site]} // Pass current site as array
            users={users}
            onSubmit={handleCreateDismantling}
            isSubmitting={createDismantlingMutation.isLoading}
         />
      </div>
   );
}