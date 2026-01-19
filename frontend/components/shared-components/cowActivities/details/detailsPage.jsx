'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCOWActivityManagement } from '@/hooks/useCOWActivityManagement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
   FileText,
   Users,
   Box,
   AlertCircle,
   BarChart3,
   ArrowLeft,
   Edit,
   Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/components/shared-components/cowActivities/form-components/utils/formatter';

import { ActivityHeader } from './ActivityHeader';
import { SiteDetailsCard } from './SiteDetailsCard';
import { WorkDetailsCard } from './WorkDetailsCard';

export default function COWDetailsPage() {
   const { id } = useParams();
   const router = useRouter();
   const { useGetCOWActivity, deleteActivity, getStatusColor, calculateActivityProgress } = useCOWActivityManagement();

   const {
      data: activity,
      isLoading,
      error
   } = useGetCOWActivity(id);

   const [activeTab, setActiveTab] = useState('overview');

   useEffect(() => {
      if (error) {
         toast.error('Failed to load activity details');
         console.error('Error:', error);
      }
   }, [error]);

   const handleEdit = () => {
      router.push(`/admin/activities/cow-activities/${id}/edit`);
   };

   const handleDelete = async () => {
      if (confirm('Are you sure you want to delete this COW activity?')) {
         try {
            await deleteActivity(id);
            toast.success('COW activity deleted successfully');
            router.push('/admin/activities/cow-activities');
         } catch (error) {
            toast.error('Failed to delete COW activity');
         }
      }
   };

   const handleBack = () => {
      router.push('/admin/activities/cow-activities');
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
                     {error?.message || 'The COW activity doesn\'t exist.'}
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

   const MaterialsSummary = () => {
      const allMaterials = [
         ...(activity.sourceSite?.surveyWork?.materials || []),
         ...(activity.sourceSite?.inventoryWork?.materials || []),
         ...(activity.sourceSite?.transportationWork?.materials || []),
         ...(activity.sourceSite?.installationWork?.materials || []),
         ...(activity.destinationSite?.surveyWork?.materials || []),
         ...(activity.destinationSite?.inventoryWork?.materials || []),
         ...(activity.destinationSite?.transportationWork?.materials || []),
         ...(activity.destinationSite?.installationWork?.materials || [])
      ];

      if (allMaterials.length === 0) return null;

      return (
         <Card>
            <CardHeader>
               <CardTitle className="text-lg flex items-center gap-2">
                  <Box className="w-5 h-5" />
                  Materials Summary ({allMaterials.length})
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
                           <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Work Type</th>
                           <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Site</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-200">
                        {allMaterials.slice(0, 10).map((material, index) => (
                           <tr key={index}>
                              <td className="px-4 py-2 text-sm">{material.materialCode}</td>
                              <td className="px-4 py-2 text-sm font-medium">{material.name}</td>
                              <td className="px-4 py-2 text-sm">{material.quantity} {material.unit}</td>
                              <td className="px-4 py-2 text-sm">
                                 <Badge variant="outline">{material.condition}</Badge>
                              </td>
                              <td className="px-4 py-2 text-sm">{material.workType}</td>
                              <td className="px-4 py-2 text-sm">{material.siteType}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
                  {allMaterials.length > 10 && (
                     <div className="text-center py-3 text-sm text-gray-500">
                        Showing 10 of {allMaterials.length} materials
                     </div>
                  )}
               </div>
            </CardContent>
         </Card>
      );
   };

   const StatsOverview = () => {
      const progress = calculateActivityProgress(activity);
      const totalTeamMembers = activity.teamMembers?.length || 0;

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
                     <h4 className="text-sm font-medium text-sky-800">Overall Progress</h4>
                     <p className="text-2xl font-bold text-sky-900 mt-2">{progress}%</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                     <h4 className="text-sm font-medium text-green-800">Team Members</h4>
                     <p className="text-2xl font-bold text-green-900 mt-2">{totalTeamMembers}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                     <h4 className="text-sm font-medium text-purple-800">Work Items</h4>
                     <p className="text-2xl font-bold text-purple-900 mt-2">
                        {(activity.sourceSite?.workTypes?.length || 0) + (activity.destinationSite?.workTypes?.length || 0)}
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
            getStatusColor={getStatusColor}
         />

         <div className="max-w-7xl mx-auto px-6 py-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
               <TabsList className="grid w-full md:w-auto grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="work">Work Details</TabsTrigger>
                  <TabsTrigger value="materials">Materials</TabsTrigger>
                  <TabsTrigger value="activity">Activity Log</TabsTrigger>
               </TabsList>

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

               <TabsContent value="materials" className="space-y-6">
                  <MaterialsSummary />
               </TabsContent>

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