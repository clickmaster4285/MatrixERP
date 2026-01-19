// components/shared-components/project/project-details/SiteActivities.jsx
'use client';

import { useState } from 'react';
import {
   Building,
   MapPin,
   User,
   Activity,
   ChevronDown,
   ChevronUp,
   CheckCircle,
   Clock,
   AlertCircle
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import ActivityCard from './ActivityCard';

const SiteCardDetailed = ({ site }) => {
   const [isExpanded, setIsExpanded] = useState(false);

   const getStatusColor = (status) => {
      switch (status) {
         case 'completed': return 'bg-green-100 text-green-700 border-green-200';
         case 'in-progress': return 'bg-sky-100 text-sky-700 border-sky-200';
         case 'planned': return 'bg-amber-100 text-amber-700 border-amber-200';
         default: return 'bg-slate-100 text-slate-700 border-slate-200';
      }
   };

   const getProgressColor = (progress) => {
      if (progress === 100) return 'bg-green-500';
      if (progress >= 70) return 'bg-sky-500';
      if (progress >= 40) return 'bg-amber-500';
      return 'bg-red-500';
   };

   return (
      <Card className="overflow-hidden">
         <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
               <div className="space-y-1">
                  <div className="flex items-center gap-2">
                     <Building className="h-5 w-5 text-slate-500" />
                     <CardTitle className="text-lg">{site.name}</CardTitle>
                     <Badge variant="outline" className="text-xs">
                        {site.siteId}
                     </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                     {site.primaryLocation?.address && (
                        <div className="flex items-center gap-1">
                           <MapPin className="h-3 w-3" />
                           <span>{site.primaryLocation.address}</span>
                        </div>
                     )}
                     {site.siteManager?.name && (
                        <div className="flex items-center gap-1">
                           <User className="h-3 w-3" />
                           <span>{site.siteManager.name}</span>
                        </div>
                     )}
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <Badge className={getStatusColor(site.overallStatus)}>
                     {site.overallStatus?.charAt(0).toUpperCase() + site.overallStatus?.slice(1)}
                  </Badge>
                  <Button
                     variant="ghost"
                     size="sm"
                     onClick={() => setIsExpanded(!isExpanded)}
                     className="h-8 w-8 p-0"
                  >
                     {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                     ) : (
                        <ChevronDown className="h-4 w-4" />
                     )}
                  </Button>
               </div>
            </div>
         </CardHeader>

         <CardContent>
            <div className="space-y-4">
               {/* Site Progress */}
               <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                     <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-slate-500" />
                        <span>Site Progress</span>
                     </div>
                     <span className="font-semibold">{site.progress}%</span>
                  </div>
                  <Progress
                     value={site.progress}
                     className={`h-2 ${getProgressColor(site.progress)}`}
                  />
                  <div className="flex items-center justify-between text-xs text-slate-500">
                     <span>{site.completedActivities} of {site.activityCount} activities completed</span>
                     <span>{site.activityCount - site.completedActivities} remaining</span>
                  </div>
               </div>

               {/* Expanded Activities */}
               {isExpanded && site.activities?.length > 0 && (
                  <>
                     <Separator />
                     <div className="space-y-3">
                        <h4 className="font-semibold text-slate-900">Activities</h4>
                        <div className="space-y-2">
                           {site.activities.map((activity, index) => (
                              <ActivityCard
                                 key={activity._id || index}
                                 activity={activity}
                                 showSiteInfo={false}
                              />
                           ))}
                        </div>
                     </div>
                  </>
               )}
            </div>
         </CardContent>
      </Card>
   );
};

const SiteActivities = ({ sites, allActivities }) => {
   const [viewMode, setViewMode] = useState('sites'); // 'sites' or 'activities'

   if (!sites || sites.length === 0) {
      return (
         <div className="text-center py-12">
            <Building className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h4 className="font-medium text-slate-700 mb-2">No Sites Added</h4>
            <p className="text-slate-500">Add sites to this project to get started.</p>
         </div>
      );
   }

   return (
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">
               Sites & Activities
            </h3>
            <Tabs value={viewMode} onValueChange={setViewMode} className="w-auto">
               <TabsList>
                  <TabsTrigger value="sites">By Site</TabsTrigger>
                  <TabsTrigger value="activities">All Activities</TabsTrigger>
               </TabsList>
            </Tabs>
         </div>

         {viewMode === 'sites' ? (
            <div className="space-y-4">
               {sites.map((site) => (
                  <SiteCardDetailed key={site._id} site={site} />
               ))}
            </div>
         ) : (
            <div className="space-y-3">
               {allActivities.map((activity, index) => (
                  <ActivityCard
                     key={activity._id || index}
                     activity={activity}
                     showSiteInfo={true}
                  />
               ))}
            </div>
         )}
      </div>
   );
};

export default SiteActivities;