// components/shared-components/sites/detail/ActivitiesTabs.jsx
'use client';

import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, HardHat, Wrench, Truck, Plus } from 'lucide-react';
import ActivityCard from './ActivityCard';
import DismantlingTable from './DismantlingTable';
import CowTable from './CowTable';
import RelocationTable from './RelocationTable';
import { useAuth } from '@/hooks/useAuth';


const ActivitiesTabs = ({ activities, formatDate, siteId, setIsCreateOpen }) => {
   const router = useRouter();
   const totalActivities =
      activities.dismantling.count +
      activities.cow.count +
      activities.relocation.count;
   
   const { user } = useAuth();
   const role = user?.role || user?.user_role;

   const handleCreateActivity = (type) => {
      if (!siteId) return;

      const routes = {
         cow: `/admin/activities/cow-activities/create?siteId=${siteId}`,
         relocation: `/admin/activities/relocation-activities/create?siteId=${siteId}`,
      };

      if (routes[type]) {
         router.push(routes[type]);
      }
   };

   return (
      <Card>
         <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
               <Activity className="h-5 w-5" />
               Site Activities
            </CardTitle>
            <div className="flex gap-2">
               {/* Add Dismantling button if you want it in the tabs header too */}
               <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsCreateOpen(true)} // You'll need to pass setIsCreateOpen as prop
                  className="gap-2 bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
               >
                  <Plus className="h-3 w-3" />
                  Dismantling
               </Button>
               <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCreateActivity('cow')}
                  className="gap-2 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
               >
                  <Plus className="h-3 w-3" />
                  COW
               </Button>
               <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCreateActivity('relocation')}
                  className="gap-2 bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
               >
                  <Plus className="h-3 w-3" />
                  Relocation
               </Button>
            </div>
         </CardHeader>
         <CardContent>
            <Tabs defaultValue="all" className="w-full">
               <TabsList className="grid grid-cols-4 mb-6">
                  <TabsTrigger value="all">
                     All ({totalActivities})
                  </TabsTrigger>
                  <TabsTrigger value="dismantling">
                     Dismantling ({activities.dismantling.count})
                  </TabsTrigger>
                  <TabsTrigger value="cow">
                     COW ({activities.cow.count})
                  </TabsTrigger>
                  <TabsTrigger value="relocation">
                     Relocation ({activities.relocation.count})
                  </TabsTrigger>
               </TabsList>

               {/* All Activities Tab */}
               <TabsContent value="all" className="space-y-4">
                  {totalActivities === 0 ? (
                     <div className="text-center py-12">
                        <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                           No Activities Found
                        </h3>
                        <p className="text-gray-600 mb-4">
                           This site doesn't have any activities yet.
                        </p>
                        <div className="flex gap-2 justify-center">
                           <Button
                              variant="outline"
                              onClick={() => handleCreateActivity('cow')}
                              className="gap-2"
                           >
                              <Plus className="h-4 w-4" />
                              Create COW Activity
                           </Button>
                           <Button
                              variant="outline"
                              onClick={() => handleCreateActivity('relocation')}
                              className="gap-2"
                           >
                              <Plus className="h-4 w-4" />
                              Create Relocation Activity
                           </Button>
                        </div>
                     </div>
                  ) : (
                     <div className="space-y-4">
                        {/* Dismantling Activities */}
                        {activities.dismantling.activities.length > 0 && (
                           <div>
                              <div className="flex items-center justify-between mb-3">
                                 <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <HardHat className="h-5 w-5 text-orange-500" />
                                    Dismantling Activities
                                 </h3>
                              </div>
                              <div className="space-y-3">
                                 {activities.dismantling.activities.map((activity) => (
                                    <ActivityCard
                                       key={activity._id}
                                       activity={activity}
                                       type="dismantling"
                                       formatDate={formatDate}
                                    />
                                 ))}
                              </div>
                           </div>
                        )}

                        {/* COW Activities */}
                        {activities.cow.activities.length > 0 && (
                           <div>
                              <div className="flex items-center justify-between mb-3">
                                 <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Wrench className="h-5 w-5 text-blue-500" />
                                    COW Activities
                                 </h3>
                                 <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCreateActivity('cow')}
                                    className="gap-2"
                                 >
                                    <Plus className="h-3 w-3" />
                                    Add COW
                                 </Button>
                              </div>
                              <div className="space-y-3">
                                 {activities.cow.activities.map((activity) => (
                                    <ActivityCard
                                       key={activity._id}
                                       activity={activity}
                                       type="cow"
                                       formatDate={formatDate}
                                    />
                                 ))}
                              </div>
                           </div>
                        )}

                        {/* Relocation Activities */}
                        {activities.relocation.activities.length > 0 && (
                           <div>
                              <div className="flex items-center justify-between mb-3">
                                 <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Truck className="h-5 w-5 text-green-500" />
                                    Relocation Activities
                                 </h3>
                                 <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCreateActivity('relocation')}
                                    className="gap-2"
                                 >
                                    <Plus className="h-3 w-3" />
                                    Add Relocation
                                 </Button>
                              </div>
                              <div className="space-y-3">
                                 {activities.relocation.activities.map((activity) => (
                                    <ActivityCard
                                       key={activity._id}
                                       activity={activity}
                                       type="relocation"
                                       formatDate={formatDate}
                                    />
                                 ))}
                              </div>
                           </div>
                        )}
                     </div>
                  )}
               </TabsContent>

               {/* Dismantling Activities Tab */}
               <TabsContent value="dismantling">
                  <DismantlingTable
                     activities={activities.dismantling.activities}
                     formatDate={formatDate}
                  />
               </TabsContent>

               {/* COW Activities Tab */}
               <TabsContent value="cow">
                  <CowTable
                     activities={activities.cow.activities}
                     formatDate={formatDate}
                     onAddNew={() => handleCreateActivity('cow')}
                  />
               </TabsContent>

               {/* Relocation Activities Tab */}
               <TabsContent value="relocation">
                  <RelocationTable
                     activities={activities.relocation.activities}
                     formatDate={formatDate}
                     onAddNew={() => handleCreateActivity('relocation')}
                  />
               </TabsContent>
            </Tabs>
         </CardContent>
      </Card>
   );
};

export default ActivitiesTabs;