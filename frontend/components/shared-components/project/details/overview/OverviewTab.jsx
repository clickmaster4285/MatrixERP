// components/shared-components/project/project-details/OverviewTab.jsx
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
   Calendar,
   Clock,
   FileText,
   Users,
   Building,
   Activity,
   TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';

const OverviewTab = ({ project, progressData }) => {
   const stats = [
      {
         label: 'Total Sites',
         value: project.sites?.length || 0,
         icon: Building,
         color: 'sky'
      },
      {
         label: 'Total Activities',
         value: project.allActivities?.length || 0,
         icon: Activity,
         color: 'emerald'
      },
      {
         label: 'Project Progress',
         value: `${progressData?.overall || 0}%`,
         icon: TrendingUp,
         color: 'amber'
      },
      {
         label: 'Days Remaining',
         value: progressData?.time?.remainingDays || 0,
         icon: Clock,
         color: progressData?.time?.remainingDays <= 7 ? 'red' : 'green'
      }
   ];

   return (
      <div className="space-y-6">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
               <Card key={index} className="bg-linear-to-br from-white to-slate-50 border-slate-200">
                  <CardContent className="p-6">
                     <div className="flex items-center justify-between">
                        <div>
                           <p className="text-slate-600 text-sm">{stat.label}</p>
                           <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                        </div>
                        <div className={`p-3 rounded-lg ${stat.color === 'sky' ? 'bg-sky-100 text-sky-600' :
                              stat.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                                 stat.color === 'amber' ? 'bg-amber-100 text-amber-600' :
                                    stat.color === 'red' ? 'bg-red-100 text-red-600' :
                                       'bg-green-100 text-green-600'
                           }`}>
                           <stat.icon className="h-6 w-6" />
                        </div>
                     </div>
                  </CardContent>
               </Card>
            ))}
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Project Details Card */}
            <Card className="lg:col-span-2">
               <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                     <div className="p-2 bg-sky-100 rounded-lg">
                        <FileText className="h-5 w-5 text-sky-600" />
                     </div>
                     <div>
                        <h3 className="font-semibold text-slate-900">Project Details</h3>
                        <p className="text-slate-600 text-sm">Complete project information</p>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <p className="text-sm text-slate-500">Project ID</p>
                           <p className="font-medium text-slate-900">{project._id?.slice(-8) || 'N/A'}</p>
                        </div>
                        <div className="space-y-2">
                           <p className="text-sm text-slate-500">Created By</p>
                           <p className="font-medium text-slate-900">{project.createdBy?.name || 'System Admin'}</p>
                        </div>
                        <div className="space-y-2">
                           <p className="text-sm text-slate-500">Created Date</p>
                           <p className="font-medium text-slate-900">
                              {format(new Date(project.createdAt), 'MMM dd, yyyy hh:mm a')}
                           </p>
                        </div>
                        <div className="space-y-2">
                           <p className="text-sm text-slate-500">Last Updated</p>
                           <p className="font-medium text-slate-900">
                              {format(new Date(project.updatedAt), 'MMM dd, yyyy hh:mm a')}
                           </p>
                        </div>
                     </div>

                     <Separator />

                     <div>
                        <h4 className="font-semibold text-slate-900 mb-3">Timeline</h4>
                        <div className="flex items-center justify-between p-4 bg-linear-to-r from-sky-50 to-emerald-50 rounded-lg">
                           <div className="text-center">
                              <p className="text-sm text-slate-600">Start Date</p>
                              <p className="font-semibold text-slate-900">
                                 {format(new Date(project.timeline?.startDate), 'MMM dd, yyyy')}
                              </p>
                           </div>
                           <div className="flex-1 px-4">
                              <div className="relative">
                                 <div className="h-1 bg-slate-200 rounded-full">
                                    <div
                                       className="h-1 bg-linear-to-r from-sky-500 to-emerald-500 rounded-full"
                                       style={{ width: `${progressData?.time?.elapsedPercentage || 0}%` }}
                                    />
                                 </div>
                                 <div
                                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow"
                                    style={{ left: `${progressData?.time?.elapsedPercentage || 0}%` }}
                                 />
                              </div>
                              <div className="text-center text-xs text-slate-500 mt-2">
                                 {progressData?.time?.elapsedPercentage || 0}% elapsed
                              </div>
                           </div>
                           <div className="text-center">
                              <p className="text-sm text-slate-600">End Date</p>
                              <p className="font-semibold text-slate-900">
                                 {format(new Date(project.timeline?.endDate), 'MMM dd, yyyy')}
                              </p>
                           </div>
                        </div>
                     </div>
                  </div>
               </CardContent>
            </Card>

            {/* Team Members Card */}
            <Card>
               <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                     <div className="p-2 bg-purple-100 rounded-lg">
                        <Users className="h-5 w-5 text-purple-600" />
                     </div>
                     <div>
                        <h3 className="font-semibold text-slate-900">Project Team</h3>
                        <p className="text-slate-600 text-sm">Assigned personnel</p>
                     </div>
                  </div>

                  <div className="space-y-3">
                     {/* Project Manager */}
                     {project.manager && (
                        <div className="flex items-center gap-3 p-3 bg-linear-to-r from-slate-50 to-white rounded-lg">
                           <div className="w-8 h-8 rounded-full bg-linear-to-br from-sky-100 to-sky-200 flex items-center justify-center text-sky-700 font-medium text-sm">
                              {project.manager.name?.charAt(0)}
                           </div>
                           <div className="flex-1">
                              <p className="font-medium text-sm text-slate-900">{project.manager.name}</p>
                              <p className="text-xs text-slate-600">Project Manager</p>
                           </div>
                        </div>
                     )}

                     {/* Site Managers */}
                     {project.sites?.slice(0, 3).map(site => (
                        site.siteManager && (
                           <div key={site._id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                              <div className="w-8 h-8 rounded-full bg-linear-to-br from-sky-100 to-sky-200 flex items-center justify-center text-sky-700 font-medium text-sm">
                                 {site.siteManager.name?.charAt(0)}
                              </div>
                              <div className="flex-1">
                                 <p className="font-medium text-sm text-slate-900">{site.siteManager.name}</p>
                                 <p className="text-xs text-slate-600">Site Manager - {site.name}</p>
                              </div>
                           </div>
                        )
                     ))}

                     {(!project.manager && (!project.sites || project.sites.length === 0)) && (
                        <div className="text-center py-4">
                           <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                           <p className="text-slate-500 text-sm">No team members assigned</p>
                        </div>
                     )}
                  </div>
               </CardContent>
            </Card>
         </div>
      </div>
   );
};

export default OverviewTab;