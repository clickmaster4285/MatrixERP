// app/[role]/activities/cow-activities/[id]/edit/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Add this import
import { useCOWActivityManagement } from '@/hooks/useCOWActivityManagement';
import { CreateCOWForm } from '@/components/shared-components/cowActivities/form-components/forms/CreateCOWForm';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useRoleNavigation } from '@/hooks/useRoleNavigation';
import { Button } from '@/components/ui/button';
import { useParams } from 'next/navigation';

const transformActivityToFormData = (activity) => {
   if (!activity) return null;

   return {
      activityName: activity.activityName || '',
      siteId: activity.siteId?._id || activity.siteId || '',
      purpose: activity.purpose || 'event-coverage',
      description: activity.description || '',
      plannedStartDate: activity.plannedStartDate || '',
      plannedEndDate: activity.plannedEndDate || '',
      notes: activity.notes || '',
      overallStatus: activity.overallStatus || 'planned',
      teamMembers: activity.teamMembers || [],

      sourceSite: {
         location: {
            name: activity.sourceSite?.location?.name || '',
            address: activity.sourceSite?.location?.address || { street: '', city: '', state: '' },
            type: activity.sourceSite?.location?.type || 'source'
         },
         workTypes: activity.sourceSite?.workTypes || [],
         siteStatus: activity.sourceSite?.siteStatus || 'not-started',
         surveyWork: activity.sourceSite?.surveyWork || {},
         inventoryWork: activity.sourceSite?.inventoryWork || {},
         transportationWork: activity.sourceSite?.transportationWork || {},
         installationWork: activity.sourceSite?.installationWork || {},
      },

      destinationSite: {
         location: {
            name: activity.destinationSite?.location?.name || '',
            address: activity.destinationSite?.location?.address || { street: '', city: '', state: '' },
            type: activity.destinationSite?.location?.type || 'destination'
         },
         workTypes: activity.destinationSite?.workTypes || [],
         siteStatus: activity.destinationSite?.siteStatus || 'not-started',
         surveyWork: activity.destinationSite?.surveyWork || {},
         inventoryWork: activity.destinationSite?.inventoryWork || {},
         transportationWork: activity.destinationSite?.transportationWork || {},
         installationWork: activity.destinationSite?.installationWork || {},
      }
   };
};

export default function EditCOWPage() {
   const router = useRouter(); // Add router hook
   const { navigate } = useRoleNavigation();
   const { id } = useParams();
   const [isMounted, setIsMounted] = useState(false);
   const [formattedActivity, setFormattedActivity] = useState(null);

   const {
      useGetCOWActivity,
      updateActivity,
      sites,
      users,
      isLoading,
      error,
   } = useCOWActivityManagement();

   const {
      data: activity,
      isLoading: isLoadingActivity,
      error: activityError
   } = useGetCOWActivity(id);

   useEffect(() => {
      setIsMounted(true);
   }, []);

   useEffect(() => {
      if (activity) {
         const formatted = transformActivityToFormData(activity);
         setFormattedActivity(formatted);
      }
   }, [activity]);

   useEffect(() => {
      if (activityError) {
         toast.error('Failed to load COW activity');
         console.error('Activity error:', activityError);
      }
   }, [activityError]);

   const handleSubmit = async (data) => {
      try {
         if (!data.siteId) {
            toast.error('Please select a parent site');
            return;
         }

         await updateActivity(id, data);
         toast.success('COW activity updated successfully');
         navigate('/activities/cow-activities');
      } catch (error) {
         toast.error('Failed to update COW activity');
         console.error('Update error:', error);
      }
   };

   const handleCancel = () => {
      router.back(); // Change this to router.back()
   };

   if (!isMounted) {
      return (
         <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
         </div>
      );
   }

   if (error) {
      return (
         <Card>
            <CardContent className="p-6 text-center">
               <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
               <h3 className="text-lg font-semibold mb-2">Error Loading Form Data</h3>
               <p className="text-gray-600">{error.message}</p>
            </CardContent>
         </Card>
      );
   }

   if (isLoadingActivity || (activity && !formattedActivity)) {
      return (
         <div className="flex flex-col items-center justify-center min-h-screen p-8">
            <Loader2 className="h-12 w-12 animate-spin text-sky-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Activity...</h2>
            <p className="text-gray-600">Preparing form data</p>
         </div>
      );
   }

   if (activityError || !activity) {
      return (
         <div className="flex flex-col items-center justify-center min-h-screen p-8">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Activity Not Found</h2>
            <p className="text-gray-600 mb-4">Could not load the COW activity</p>
            <Button onClick={handleCancel}>
               <ArrowLeft className="h-4 w-4 mr-2" />
               Back to Activities
            </Button>
         </div>
      );
   }

   return (
      <div className="min-h-screen bg-gray-50">
         <CreateCOWForm
            activity={formattedActivity}
            onSubmit={handleSubmit}
            onCancel={handleCancel} // Pass the updated handleCancel
            sites={sites}
            users={users}
            isLoading={isLoading}
            isEditing={true}
         />
      </div>
   );
}