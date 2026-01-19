// components/shared-components/sites/detail/ActivitiesSummaryCard.jsx
'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Activity, HardHat, Wrench, Truck, Plus, Trash2 } from 'lucide-react';

const ActivitiesSummaryCard = ({ activities, siteId, onCreateDismantling }) => {
   const router = useRouter();

   const totalActivities =
      activities.dismantling.count +
      activities.cow.count +
      activities.relocation.count;

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
               Activities Summary
            </CardTitle>
         </CardHeader>
         <CardContent className="space-y-4">
            <div className="space-y-3">
               <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Total Activities</span>
                  <Badge variant="outline" className="font-bold">
                     {totalActivities}
                  </Badge>
               </div>
               <Separator />
               <div className="space-y-2">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <HardHat className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-medium">Dismantling</span>
                     </div>
                     <Badge variant="secondary">{activities.dismantling.count}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">COW Activities</span>
                     </div>
                     <Badge variant="secondary">{activities.cow.count}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">Relocation</span>
                     </div>
                     <Badge variant="secondary">{activities.relocation.count}</Badge>
                  </div>
               </div>
            </div>
         </CardContent>
      </Card>
   );
};

export default ActivitiesSummaryCard;