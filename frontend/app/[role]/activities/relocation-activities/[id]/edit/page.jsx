// app/[role]/activities/relocation-activities/[id]/edit/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRelocationManagement } from '@/hooks/useRelocationManagement';
import { CreateRelocationForm } from '@/components/shared-components/relocationActivities/form-components/forms/CreateRelocationForm';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useRoleNavigation } from '@/hooks/useRoleNavigation';
import { Button } from '@/components/ui/button';
import { useParams } from 'next/navigation';

// Helper function to transform API data to form format
const transformActivityToFormData = (activity) => {
   if (!activity) return null;

   return {
      siteId: activity.siteId?._id || activity.siteId || '',
      relocationType: activity.relocationType || 'B2S',
      overallStatus: activity.overallStatus || 'draft',
      notes: activity.notes || '',

      // Transform source site
      sourceSite: {
         siteRequired: activity.sourceSite?.siteRequired ?? true,
         address: activity.sourceSite?.address || { street: '', city: '', state: '' },
         operatorName: activity.sourceSite?.operatorName || '',
         siteStatus: activity.sourceSite?.siteStatus || 'not-started',
         workTypes: activity.sourceSite?.workTypes || [],

         // Ensure all work types exist with proper structure
         surveyWork: activity.sourceSite?.surveyWork || {
            required: activity.sourceSite?.workTypes?.includes('survey') || false,
            status: 'not-started',
            assignedUsers: [],
            notes: ''
         },
         dismantlingWork: activity.sourceSite?.dismantlingWork || {
            required: activity.sourceSite?.workTypes?.includes('dismantling') || false,
            status: 'not-started',
            assignedUsers: [],
            notes: ''
         },
         storeOperatorWork: activity.sourceSite?.storeOperatorWork || {
            required: activity.sourceSite?.workTypes?.includes('storeOperator') || false,
            status: 'not-started',
            assignedUsers: [],
            notes: ''
         },
      },

      // Transform destination site
      destinationSite: {
         siteRequired: activity.destinationSite?.siteRequired ?? true,
         address: activity.destinationSite?.address || { street: '', city: '', state: '' },
         operatorName: activity.destinationSite?.operatorName || '',
         siteStatus: activity.destinationSite?.siteStatus || 'not-started',
         workTypes: activity.destinationSite?.workTypes || [],

         // Ensure all work types exist with proper structure
         civilWork: activity.destinationSite?.civilWork || {
            required: activity.destinationSite?.workTypes?.includes('civil') || false,
            status: 'not-started',
            assignedUsers: [],
            notes: ''
         },
         telecomWork: activity.destinationSite?.telecomWork || {
            required: activity.destinationSite?.workTypes?.includes('telecom') || false,
            status: 'not-started',
            assignedUsers: [],
            notes: ''
         },
      }
   };
};

export default function EditRelocationPage() {
   const { navigate } = useRoleNavigation();
   const { id } = useParams();
   const [isMounted, setIsMounted] = useState(false);
   const [formattedActivity, setFormattedActivity] = useState(null);

   const {
      useGetRelocationActivityQuery,
      updateRelocation,
      sites,
      users,
      isLoadingFormData,
      formDataError,
   } = useRelocationManagement();

   // Use the hook properly
   const {
      data: activity,
      isLoading: isLoadingActivity,
      error: activityError
   } = useGetRelocationActivityQuery(id);

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
         toast.error('Failed to load relocation activity');
         console.error('Activity error:', activityError);
      }
   }, [activityError]);

   const handleSubmit = async (data) => {
      try {
         if (!data.siteId) {
            toast.error('Please select a parent site');
            return;
         }

         await updateRelocation({
            activityId: id,
            data
         });
         toast.success('Relocation activity updated successfully');
         navigate('/activities/relocation-activities');
      } catch (error) {
         toast.error('Failed to update relocation activity');
         console.error('Update error:', error);
      }
   };

   const handleCancel = () => {
      navigate('/activities/relocation-activities');
   };

   if (!isMounted) {
      return (
         <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
         </div>
      );
   }

   if (formDataError) {
      return (
         <Card>
            <CardContent className="p-6 text-center">
               <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
               <h3 className="text-lg font-semibold mb-2">Error Loading Form Data</h3>
               <p className="text-gray-600">{formDataError.message}</p>
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
            <p className="text-gray-600 mb-4">Could not load the relocation activity</p>
            <Button onClick={handleCancel}>
               <ArrowLeft className="h-4 w-4 mr-2" />
               Back to Activities
            </Button>
         </div>
      );
   }

   return (
      <div className="min-h-screen bg-gray-50">

         <CreateRelocationForm
            activity={formattedActivity}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            sites={sites}
            users={users}
            isLoading={isLoadingFormData}
            isEditing={true}
         />
      </div>
   );
}