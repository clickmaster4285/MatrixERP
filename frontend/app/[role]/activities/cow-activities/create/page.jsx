// app/[role]/activities/cow-activities/create/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Add this import
import { useCOWActivityManagement } from '@/hooks/useCOWActivityManagement';
import { CreateCOWForm } from '@/components/shared-components/cowActivities/form-components/forms/CreateCOWForm';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRoleNavigation } from '@/hooks/useRoleNavigation';

export default function CreateCOWPage() {
   const router = useRouter(); // Add router hook
   const { navigate } = useRoleNavigation();
   const [isMounted, setIsMounted] = useState(false);

   const {
      createActivity,
      sites,
      users,
      isLoading,
      error,
   } = useCOWActivityManagement();

   useEffect(() => {
      setIsMounted(true);
   }, []);

   const handleSubmit = async (data) => {
      try {
         if (!data.siteId) {
            toast.error('Please select a parent site');
            return;
         }

         await createActivity(data);
         toast.success('COW activity created successfully');
         navigate('/activities/cow-activities');
      } catch (error) {
         toast.error('Failed to create COW activity');
         console.error('Create error:', error);
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

   return (
      <div className="min-h-screen bg-gray-50">
         <CreateCOWForm
            onSubmit={handleSubmit}
            onCancel={handleCancel} // Pass the updated handleCancel
            sites={sites}
            users={users}
            isLoading={isLoading}
            isEditing={false}
         />
      </div>
   );
}