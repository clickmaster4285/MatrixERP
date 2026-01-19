// @/components/shared-components/sites/[id]/page.jsx
'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Edit, MapPin, Calendar, Users, FileText, Activity } from 'lucide-react';
import Link from 'next/link';
import { useGetSiteById, useDeleteSite } from '@/features/siteApi';
import EditSiteDialog from '@/components/shared-components/sites/create/EditSiteDialog';
import SiteSurveyTab from '@/components/shared-components/sites/SiteSurveyTab';
import SiteTeamTab from '@/components/shared-components/sites/SiteTeamTab';
import SiteMaterialsTab from '@/components/shared-components/sites/SiteMaterialsTab';
import SiteDocumentsTab from '@/components/shared-components/sites/SiteDocumentsTab';

export default function SiteDetailPage() {
   const params = useParams();
   const siteId = params.id;

   const [editDialogOpen, setEditDialogOpen] = useState(false);

   const { data: siteData, isLoading, error } = useGetSiteById(siteId);
   const deleteSiteMutation = useDeleteSite();

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
                  <Link href="/sites">
                     <Button>Back to Sites</Button>
                  </Link>
               </div>
            </div>
         </div>
      );
   }

   const { site, activities } = siteData.data;

   const handleDelete = async () => {
      if (!confirm(`Are you sure you want to delete site "${site.name}"?`)) return;

      try {
         await deleteSiteMutation.mutateAsync(site._id);
         // Redirect to sites list after deletion
         window.location.href = '/sites';
      } catch (error) {
         alert('Failed to delete site: ' + error.message);
      }
   };

   return (
      <div className="">
         <div className="">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-4">
                  <Link href="/sites">
                     <Button variant="ghost" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Sites
                     </Button>
                  </Link>
                  <div>
                     <h1 className="text-2xl font-bold">{site.name}</h1>
                     <p className="text-gray-600">{site.siteId} • {site.region}</p>
                  </div>
               </div>
               <div className="flex gap-2">
                  <Button
                     onClick={() => setEditDialogOpen(true)}
                     variant="outline"
                     className="gap-2"
                  >
                     <Edit className="h-4 w-4" />
                     Edit
                  </Button>
                  <Button
                     onClick={handleDelete}
                     variant="destructive"
                  >
                     Delete
                  </Button>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               {/* Left Column - Site Info */}
               <div className="lg:col-span-1 space-y-6">
                  <Card>
                     <CardContent className="p-6 space-y-4">
                        <div className="flex items-center gap-2">
                           <MapPin className="h-5 w-5 text-gray-400" />
                           <div>
                              <h3 className="font-semibold">Location</h3>
                              <p className="text-sm text-gray-600">
                                 {site.primaryLocation.address}, {site.primaryLocation.city}, {site.primaryLocation.state}
                              </p>
                           </div>
                        </div>

                        {site.project && (
                           <div className="flex items-center gap-2">
                              <FileText className="h-5 w-5 text-gray-400" />
                              <div>
                                 <h3 className="font-semibold">Project</h3>
                                 <p className="text-sm text-gray-600">
                                    {site.project.name}
                                 </p>
                              </div>
                           </div>
                        )}

                        {site.siteManager && (
                           <div className="flex items-center gap-2">
                              <Users className="h-5 w-5 text-gray-400" />
                              <div>
                                 <h3 className="font-semibold">Site Manager</h3>
                                 <p className="text-sm text-gray-600">
                                    {site.siteManager.name} ({site.siteManager.role})
                                 </p>
                              </div>
                           </div>
                        )}

                        <div className="flex items-center gap-2">
                           <Calendar className="h-5 w-5 text-gray-400" />
                           <div>
                              <h3 className="font-semibold">Created</h3>
                              <p className="text-sm text-gray-600">
                                 {new Date(site.createdAt).toLocaleDateString()}
                              </p>
                           </div>
                        </div>

                        <div className="pt-4 border-t">
                           <h3 className="font-semibold mb-2">Status</h3>
                           <div className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-sky-100 text-sky-800">
                              {site.overallStatus}
                           </div>
                        </div>
                     </CardContent>
                  </Card>

                  {/* Activities Summary */}
                  <Card>
                     <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                           <Activity className="h-5 w-5 text-gray-400" />
                           <h3 className="font-semibold">Activities ({activities?.length || 0})</h3>
                        </div>

                        {activities && activities.length > 0 ? (
                           <div className="space-y-3">
                              {activities.slice(0, 3).map((activity) => (
                                 <div key={activity._id} className="p-3 border rounded-lg">
                                    <div className="font-medium">{activity.activityType?.name}</div>
                                    <div className="text-sm text-gray-600">
                                       Status: {activity.workflow?.status || 'planned'}
                                    </div>
                                 </div>
                              ))}
                              {activities.length > 3 && (
                                 <div className="text-center text-sm text-gray-500">
                                    +{activities.length - 3} more activities
                                 </div>
                              )}
                           </div>
                        ) : (
                           <p className="text-gray-500 text-sm">No activities yet</p>
                        )}
                     </CardContent>
                  </Card>
               </div>

               {/* Right Column - Tabs */}
               <div className="lg:col-span-2">
                  <Tabs defaultValue="survey" className="w-full">
                     <TabsList className="grid grid-cols-4 mb-6">
                        <TabsTrigger value="survey">Survey</TabsTrigger>
                        <TabsTrigger value="team">Team</TabsTrigger>
                        <TabsTrigger value="materials">Materials</TabsTrigger>
                        <TabsTrigger value="documents">Documents</TabsTrigger>
                     </TabsList>

                     <TabsContent value="survey">
                        <SiteSurveyTab site={site} activities={activities} />
                     </TabsContent>

                     <TabsContent value="team">
                        <SiteTeamTab site={site} />
                     </TabsContent>

                     <TabsContent value="materials">
                        <SiteMaterialsTab site={site} activities={activities} />
                     </TabsContent>

                     <TabsContent value="documents">
                        <SiteDocumentsTab site={site} />
                     </TabsContent>
                  </Tabs>
               </div>
            </div>
         </div>

         {/* Edit Dialog */}
         <EditSiteDialog
            site={site}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
         />
      </div>
   );
}