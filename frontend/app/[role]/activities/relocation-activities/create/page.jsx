// app/[role]/activities/relocation-activities/create/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRelocationManagement } from '@/hooks/useRelocationManagement';
import { CreateRelocationForm } from '@/components/shared-components/relocationActivities/form-components/forms/CreateRelocationForm';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRoleNavigation } from '@/hooks/useRoleNavigation';
import { useRouter } from 'next/navigation';

const normalizeStoreOperatorKey = (site) => {
   if (!site) return site;

   const fixed = { ...site };

   const legacy = fixed.store_operatorWork; // ✅ snake
   const modern = fixed.storeOperatorWork || {}; // ✅ camel

   if (legacy) {
      fixed.storeOperatorWork = {
         ...modern,
         ...legacy,
         // ✅ keep assignedUsers from legacy if it has data
         assignedUsers:
            Array.isArray(legacy.assignedUsers) && legacy.assignedUsers.length > 0
               ? legacy.assignedUsers
               : Array.isArray(modern.assignedUsers)
                  ? modern.assignedUsers
                  : [],
      };

      delete fixed.store_operatorWork;
   }

   return fixed;
};

export default function CreateRelocationPage() {
   const router = useRouter(); // Add router hook
   const { navigate } = useRoleNavigation();
   const [isMounted, setIsMounted] = useState(false);

   const {
      createRelocation,
      sites,
      users,
      isLoadingFormData,
      formDataError,
   } = useRelocationManagement();

   useEffect(() => {
      setIsMounted(true);
   }, []);

   const handleSubmit = async (data) => {
      try {
         if (!data.siteId) {
            toast.error('Please select a parent site');
            return;
         }

         const cleanedData = {
            ...data,
            sourceSite: {
               ...normalizeStoreOperatorKey(data.sourceSite),
               siteRequired: data.sourceSite?.siteRequired ?? true,
            },
            destinationSite: {
               ...normalizeStoreOperatorKey(data.destinationSite),
               siteRequired: data.destinationSite?.siteRequired ?? true,
            },
         };

         await createRelocation(cleanedData);
         toast.success('Relocation activity created successfully');
         router.back();
         // navigate('/activities/relocation-activities');
      } catch (error) {
         toast.error('Failed to create relocation activity');
         console.error('Create error:', error);
      }
   };

   const handleCancel = () => {
      router.back();
      // navigate('/activities/relocation-activities');
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

   return (
      <div className="min-h-screen bg-gray-50">
         <CreateRelocationForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            sites={sites}
            users={users}
            isLoading={isLoadingFormData}
            isEditing={false}
         />
      </div>
   );
}