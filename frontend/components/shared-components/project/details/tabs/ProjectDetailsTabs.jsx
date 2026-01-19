// components/shared-components/project/project-details/ProjectDetailsTabs.jsx
'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
   Building,
   Activity,
   BarChart3,
   TrendingUp,
   Plus,
   Download
} from 'lucide-react';

import OverviewTab from '../overview/OverviewTab';
import SiteCardEnhanced from '../../../sites/get_all/SiteCard';
import ActivityListEnhanced from '../activities/ActivityListEnhanced';
import StatisticsDashboard from '../status/StatisticsDashboard';
// Import dialogs and components
import CreateSiteDialog from '@/components/shared-components/sites/create/CreateSiteDialog';

const ProjectDetailsTabs = ({ project, progressData, projectId }) => {
   const [activeTab, setActiveTab] = useState('overview');
   const [createSiteDialogOpen, setCreateSiteDialogOpen] = useState(false);

   const tabs = [
      {
         value: 'overview',
         label: 'Overview',
         icon: BarChart3,
         content: <OverviewTab project={project} progressData={progressData} />
      },
      {
         value: 'sites',
         label: `Sites (${project.sites?.length || 0})`,
         icon: Building,
         content: (
            <div className="space-y-6">
               <div className="flex items-center justify-between mb-4">
                  <div>
                     <h3 className="text-lg font-semibold text-slate-900">Project Sites</h3>
                     <p className="text-slate-600">Manage and monitor all project sites</p>
                  </div>
                  <Button onClick={() => setCreateSiteDialogOpen(true)} className="gap-2">
                     <Plus className="h-4 w-4" />
                     Add Site
                  </Button>
               </div>

               {project.sites?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {project.sites.map(site => (
                        <SiteCardEnhanced key={site._id} site={site} />
                     ))}
                  </div>
               ) : (
                  <div className="text-center py-12 bg-linear-to-b from-slate-50 to-white rounded-xl">
                     <Building className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                     <h4 className="font-semibold text-slate-700 mb-2">No Sites Added</h4>
                     <p className="text-slate-500 mb-4">Add sites to this project to get started</p>
                     <Button onClick={() => setCreateSiteDialogOpen(true)} className="gap-2">
                        <Building className="h-4 w-4" />
                        Create First Site
                     </Button>
                  </div>
               )}
            </div>
         )
      },
      {
         value: 'activities',
         label: `Activities (${project.allActivities?.length || 0})`,
         icon: Activity,
         content: (
            <div className="space-y-6">
               <div className="flex items-center justify-between mb-4">
                  <div>
                     <h3 className="text-lg font-semibold text-slate-900">All Activities</h3>
                     <p className="text-slate-600">Monitor all project activities across sites</p>
                  </div>
                  <div className="flex items-center gap-2">
                     <Button size="sm" className="gap-2">
                        <Activity className="h-4 w-4" />
                        Add Activity
                     </Button>
                  </div>
               </div>

               <ActivityListEnhanced
                  activities={project.allActivities || []}
                  sites={project.sites || []}
               />
            </div>
         )
      },
      {
         value: 'status',
         label: 'Status',
         icon: TrendingUp,
         content: <StatisticsDashboard project={project} progressData={progressData} />
      }
   ];

   return (
      <>
         <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-0">
               <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  {/* Tabs Header */}
                  <div className="border-b">
                     <div className="px-6 pt-6">
                        <TabsList className="w-full justify-start bg-transparent p-0 gap-2">
                           {tabs.map((tab) => (
                              <TabsTrigger
                                 key={tab.value}
                                 value={tab.value}
                                 className={`
                        data-[state=active]:bg-sky-50 data-[state=active]:text-sky-700 data-[state=active]:border-sky-200 rounded-lg px-4 py-2 gap-2
                        ${tab.value === 'sites' ? 'data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:border-emerald-200' : ''}
                        ${tab.value === 'activities' ? 'data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 data-[state=active]:border-amber-200' : ''}
                        ${tab.value === 'status' ? 'data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 data-[state=active]:border-purple-200' : ''}
                      `}
                              >
                                 <tab.icon className="h-4 w-4" />
                                 {tab.label}
                              </TabsTrigger>
                           ))}
                        </TabsList>
                     </div>
                  </div>

                  {/* Tabs Content */}
                  <div className="p-6">
                     {tabs.map((tab) => (
                        <TabsContent key={tab.value} value={tab.value} className="m-0">
                           {tab.content}
                        </TabsContent>
                     ))}
                  </div>
               </Tabs>
            </CardContent>
         </Card>

         {/* Create Site Dialog */}
         <CreateSiteDialog
            open={createSiteDialogOpen}
            onOpenChange={setCreateSiteDialogOpen}
            projectId={projectId} // Pass projectId to pre-select in form
         />
      </>
   );
};

export default ProjectDetailsTabs;