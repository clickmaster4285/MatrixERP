// components/shared-components/sites/detail/MaterialsOverview.jsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Package } from 'lucide-react';

const MaterialsOverview = ({ activities }) => {
   const hasDismantlingMaterials = activities.dismantling.activities.some(
      a => a.survey?.materials?.length > 0
   );

   const hasCowMaterials = activities.cow.activities.some(a =>
      (a.sourceSite?.surveyWork?.materials?.length > 0) ||
      (a.destinationSite?.surveyWork?.materials?.length > 0)
   );

   if (!hasDismantlingMaterials && !hasCowMaterials) {
      return null;
   }

   return (
      <Card className="mt-6">
         <CardHeader>
            <CardTitle className="flex items-center gap-2">
               <Package className="h-5 w-5" />
               Materials Overview
            </CardTitle>
         </CardHeader>
         <CardContent>
            <Tabs defaultValue="dismantling-materials">
               <TabsList className="mb-4">
                  <TabsTrigger value="dismantling-materials">
                     Dismantling Materials
                  </TabsTrigger>
                  <TabsTrigger value="cow-materials">
                     COW Materials
                  </TabsTrigger>
               </TabsList>
               <TabsContent value="dismantling-materials">
                  {!hasDismantlingMaterials ? (
                     <p className="text-gray-600 text-center py-4">No materials found in dismantling activities</p>
                  ) : (
                     <div className="space-y-3">
                        {activities.dismantling.activities.map(activity =>
                           activity.survey?.materials?.map((material, index) => (
                              <div key={`${activity._id}-${index}`} className="flex items-center justify-between p-2 border rounded">
                                 <div>
                                    <p className="font-medium">{material.name}</p>
                                    <p className="text-sm text-gray-600">ID: {material.materialId}</p>
                                 </div>
                                 <div className="text-right">
                                    <p className="font-medium">{material.quantity} {material.unit}</p>
                                    <Badge className={material.canBeReused ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                       {material.canBeReused ? 'Reusable' : 'Not Reusable'}
                                    </Badge>
                                 </div>
                              </div>
                           ))
                        )}
                     </div>
                  )}
               </TabsContent>
               <TabsContent value="cow-materials">
                  {!hasCowMaterials ? (
                     <p className="text-gray-600 text-center py-4">No materials found in COW activities</p>
                  ) : (
                     <div className="space-y-3">
                        {activities.cow.activities.map(activity =>
                           [...(activity.sourceSite?.surveyWork?.materials || []),
                           ...(activity.destinationSite?.surveyWork?.materials || [])].map((material, index) => (
                              <div key={`${activity._id}-${index}`} className="flex items-center justify-between p-2 border rounded">
                                 <div>
                                    <p className="font-medium">{material.name}</p>
                                    <p className="text-sm text-gray-600">Code: {material.materialCode}</p>
                                 </div>
                                 <div className="text-right">
                                    <p className="font-medium">{material.quantity} {material.unit}</p>
                                    <Badge className={material.canBeReused ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                       {material.canBeReused ? 'Reusable' : 'Not Reusable'}
                                    </Badge>
                                 </div>
                              </div>
                           ))
                        )}
                     </div>
                  )}
               </TabsContent>
            </Tabs>
         </CardContent>
      </Card>
   );
};

export default MaterialsOverview;