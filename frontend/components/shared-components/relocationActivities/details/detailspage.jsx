// app/[role]/relocationactivities/details/detailspage.jsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRelocationManagement } from '@/hooks/useRelocationManagement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
   FileText,
   Users,
   Box,
   AlertCircle,
   BarChart3,
   ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/components/shared-components/relocationActivities/form-components/utils/formatters';

// Import components
import { ActivityHeader } from './ActivityHeader';
import { SiteDetailsCard } from './SiteDetailsCard';
import { WorkDetailsCard } from './WorkDetailsCard';

export default function RelocationDetailsPage() {
   const { id } = useParams();
   const router = useRouter();
   const { useGetRelocationActivityQuery, deleteRelocation } = useRelocationManagement();

   const {
      data: activity,
      isLoading,
      error
   } = useGetRelocationActivityQuery(id);
   const [activeTab, setActiveTab] = useState('overview');

   useEffect(() => {
      if (error) {
         toast.error('Failed to load activity details');
         console.error('Error:', error);
      }
   }, [error]);

   const handleEdit = () => {
      router.push(`/admin/activities/relocation-activities/${id}/edit`);
   };

   const handleDelete = async () => {
      if (confirm('Are you sure you want to delete this relocation activity?')) {
         try {
            await deleteRelocation({ activityId: id });
            toast.success('Relocation activity deleted successfully');
            router.push('/admin/activities/relocation-activities');
         } catch (error) {
            toast.error('Failed to delete relocation activity');
         }
      }
   };

   const handleBack = () => {
      router.push('/admin/activities/relocation-activities');
   };

   if (isLoading) {
      return (
         <div className="min-h-screen p-8">
            <div className="flex items-center justify-center">
               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
            </div>
         </div>
      );
   }

   if (error || !activity) {
      return (
         <div className="min-h-screen p-8">
            <Card>
               <CardContent className="p-6 text-center">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Activity Not Found</h3>
                  <p className="text-gray-600 mb-4">
                     {error?.message || 'The relocation activity you\'re looking for doesn\'t exist.'}
                  </p>
                  <Button onClick={handleBack}>
                     <ArrowLeft className="w-4 h-4 mr-2" />
                     Back to Activities
                  </Button>
               </CardContent>
            </Card>
         </div>
      );
   }

   // Materials Summary Component
   const MaterialsSummary = () => {
      const allMaterials = [
         ...(activity.sourceSite?.surveyWork?.materials || []),
         ...(activity.sourceSite?.storeOperatorWork?.materials || []),
         ...(activity.destinationSite?.civilWork?.materials || []),
         ...(activity.materials || [])
      ];

      if (allMaterials.length === 0) return null;

      return (
         <Card>
            <CardHeader>
               <CardTitle className="text-lg flex items-center gap-2">
                  <Box className="w-5 h-5" />
                  Materials Summary
               </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                     <thead>
                        <tr>
                           <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                           <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                           <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                           <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Condition</th>
                           <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reusable</th>
                           <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Work Type</th>
                           <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Site</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-200">
                        {allMaterials.map((material, index) => (
                           <tr key={index}>
                              <td className="px-4 py-2 text-sm">{material.materialCode}</td>
                              <td className="px-4 py-2 text-sm font-medium">{material.name}</td>
                              <td className="px-4 py-2 text-sm">{material.quantity} {material.unit}</td>
                              <td className="px-4 py-2 text-sm">
                                 <Badge variant="outline">{material.condition}</Badge>
                              </td>
                              <td className="px-4 py-2 text-sm">
                                 {material.canBeReused ? 'Yes' : 'No'}
                              </td>
                              <td className="px-4 py-2 text-sm">{material.workType}</td>
                              <td className="px-4 py-2 text-sm">{material.siteType}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </CardContent>
         </Card>
      );
   };

   // Stats Component
   const StatsOverview = () => {
      const totalMaterials = [
         ...(activity.sourceSite?.surveyWork?.materials || []),
         ...(activity.sourceSite?.storeOperatorWork?.materials || []),
         ...(activity.destinationSite?.civilWork?.materials || []),
      ].length;

      const totalAssignedUsers = [
         ...(activity.sourceSite?.surveyWork?.assignedUsers || []),
         ...(activity.sourceSite?.storeOperatorWork?.assignedUsers || []),
         ...(activity.destinationSite?.civilWork?.assignedUsers || []),
      ].length;

      const completedWork = [
         activity.sourceSite?.surveyWork?.status === 'completed',
         activity.sourceSite?.storeOperatorWork?.status === 'completed',
         activity.destinationSite?.civilWork?.status === 'completed',
      ].filter(Boolean).length;

      const totalWork = 3; // Adjust based on actual work types

      return (
         <Card>
            <CardHeader>
               <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Statistics
               </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-sky-50 p-4 rounded-lg">
                     <h4 className="text-sm font-medium text-sky-800">Total Materials</h4>
                     <p className="text-2xl font-bold text-sky-900 mt-2">{totalMaterials}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                     <h4 className="text-sm font-medium text-green-800">Assigned Team</h4>
                     <p className="text-2xl font-bold text-green-900 mt-2">{totalAssignedUsers}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                     <h4 className="text-sm font-medium text-purple-800">Completion</h4>
                     <p className="text-2xl font-bold text-purple-900 mt-2">
                        {Math.round((completedWork / totalWork) * 100)}%
                     </p>
                  </div>
               </div>
            </CardContent>
         </Card>
      );
   };

   return (
      <div className="min-h-screen bg-gray-50">
         <ActivityHeader
            activity={activity}
            onBack={handleBack}
            onEdit={handleEdit}
            onDelete={handleDelete}
         />

         <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
               <TabsList className="grid w-full md:w-auto grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="work">Work Details</TabsTrigger>
                  <TabsTrigger value="materials">Materials</TabsTrigger>
                  <TabsTrigger value="activity">Activity Log</TabsTrigger>
               </TabsList>

               {/* Overview Tab */}
               <TabsContent value="overview" className="space-y-6">
                  <StatsOverview />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     <SiteDetailsCard
                        site={activity.sourceSite}
                        title="Source Site"
                        siteType="source"
                     />
                     <SiteDetailsCard
                        site={activity.destinationSite}
                        title="Destination Site"
                        siteType="destination"
                     />
                  </div>
               </TabsContent>

               {/* Work Details Tab */}
               <TabsContent value="work" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     <WorkDetailsCard
                        site={activity.sourceSite}
                        siteLabel="Source Site"
                        siteType="source"
                     />
                     <WorkDetailsCard
                        site={activity.destinationSite}
                        siteLabel="Destination Site"
                        siteType="destination"
                     />
                  </div>
               </TabsContent>

               {/* Materials Tab */}
               <TabsContent value="materials" className="space-y-6">
                  <MaterialsSummary />
               </TabsContent>

               {/* Activity Log Tab */}
               <TabsContent value="activity">
                  <Card>
                     <CardHeader>
                        <CardTitle className="text-lg">Activity Timeline</CardTitle>
                     </CardHeader>
                     <CardContent>
                        <div className="space-y-4">
                           <div className="border-l-4 border-sky-500 pl-4 py-2">
                              <div className="font-medium">Activity Created</div>
                              <div className="text-sm text-gray-600">
                                 By {activity.createdBy?.name} on {formatDate(activity.createdAt)}
                              </div>
                           </div>
                           <div className="border-l-4 border-green-500 pl-4 py-2">
                              <div className="font-medium">Last Updated</div>
                              <div className="text-sm text-gray-600">
                                 By {activity.updatedBy?.name} on {formatDate(activity.updatedAt)}
                              </div>
                           </div>
                        </div>
                     </CardContent>
                  </Card>
               </TabsContent>
            </Tabs>

            {/* Notes Section */}
            {activity.notes && (
               <Card className="mt-6">
                  <CardHeader>
                     <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        General Notes
                     </CardTitle>
                  </CardHeader>
                  <CardContent>
                     <p className="text-gray-600 whitespace-pre-wrap">{activity.notes}</p>
                  </CardContent>
               </Card>
            )}
         </div>
      </div>
   );
}