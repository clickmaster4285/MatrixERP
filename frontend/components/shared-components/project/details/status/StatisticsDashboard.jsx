// components/shared-components/project/project-details/StatisticsDashboard.jsx
'use client';

import {
   TrendingUp,
   Activity,
   Building,
   CheckCircle,
   Clock,
   AlertCircle,
   BarChart3,
   Calendar,
   Target
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const StatisticsDashboard = ({ project, progressData }) => {
   const stats = {
      totalSites: project.sites?.length || 0,
      totalActivities: project.allActivities?.length || 0,
      completedActivities: project.allActivities?.filter(a =>
         a.status === 'completed' || a.overallStatus === 'completed'
      ).length || 0,
      inProgressActivities: project.allActivities?.filter(a =>
         a.status === 'in-progress' || a.overallStatus === 'in-progress'
      ).length || 0,
      pendingActivities: project.allActivities?.filter(a =>
         ['pending', 'planned', 'draft'].includes(a.status || a.overallStatus)
      ).length || 0,
   };

   const completionRate = stats.totalActivities > 0
      ? Math.round((stats.completedActivities / stats.totalActivities) * 100)
      : 0;

   const getHealthStatus = () => {
      if (completionRate >= 80) return { status: 'Excellent', color: 'green', icon: CheckCircle };
      if (completionRate >= 60) return { status: 'Good', color: 'sky', icon: TrendingUp };
      if (completionRate >= 40) return { status: 'Moderate', color: 'amber', icon: Clock };
      return { status: 'Needs Attention', color: 'red', icon: AlertCircle };
   };

   const health = getHealthStatus();

   // Calculate site status distribution
   const siteStatusDistribution = project.sites?.reduce((acc, site) => {
      const status = site.overallStatus || 'planned';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
   }, {}) || {};

   return (
      <div className="space-y-6">
         {/* Health Overview */}
         <Card className="border-slate-200">
            <CardContent className="p-6">
               <div className="flex items-center justify-between mb-6">
                  <div>
                     <h3 className="text-lg font-semibold text-slate-900">Project Health</h3>
                     <p className="text-slate-600">Overall project performance and status</p>
                  </div>
                  <Badge className={`
              ${health.color === 'green' ? 'bg-green-100 text-green-700 border-green-200' :
                        health.color === 'sky' ? 'bg-sky-100 text-sky-700 border-sky-200' :
                           health.color === 'amber' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                              'bg-red-100 text-red-700 border-red-200'
                     } px-4 py-2`}>
                     {health.icon && <health.icon className="h-4 w-4 mr-2" />}
                     {health.status}
                  </Badge>
               </div>

               <div className="space-y-4">
                  <div className="space-y-2">
                     <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Overall Progress</span>
                        <span className="font-semibold text-slate-900">{progressData?.overall || 0}%</span>
                     </div>
                     <Progress value={progressData?.overall || 0} className="h-3" />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                     <div className="text-center p-4 bg-linear-to-b from-green-50 to-white rounded-lg">
                        <div className="text-2xl font-bold text-green-700">{stats.completedActivities}</div>
                        <div className="text-sm text-green-600">Completed</div>
                     </div>
                     <div className="text-center p-4 bg-linear-to-b from-sky-50 to-white rounded-lg">
                        <div className="text-2xl font-bold text-sky-700">{stats.inProgressActivities}</div>
                        <div className="text-sm text-sky-600">In Progress</div>
                     </div>
                     <div className="text-center p-4 bg-linear-to-b from-amber-50 to-white rounded-lg">
                        <div className="text-2xl font-bold text-amber-700">{stats.pendingActivities}</div>
                        <div className="text-sm text-amber-600">Pending</div>
                     </div>
                  </div>
               </div>
            </CardContent>
         </Card>

         {/* Detailed Statistics */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Activity Type Distribution */}
            <Card className="border-slate-200">
               <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                     <div className="p-2 bg-purple-100 rounded-lg">
                        <Activity className="h-5 w-5 text-purple-600" />
                     </div>
                     <div>
                        <h3 className="font-semibold text-slate-900">Activity Types</h3>
                        <p className="text-slate-600 text-sm">Distribution by activity type</p>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                           <span className="text-slate-700">Dismantling</span>
                           <span className="font-medium">{project.statistics?.totalDismantling || 0}</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                           <div
                              className="bg-amber-500 h-2 rounded-full"
                              style={{
                                 width: `${(project.statistics?.totalDismantling || 0) / Math.max(stats.totalActivities, 1) * 100}%`
                              }}
                           />
                        </div>
                     </div>

                     <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                           <span className="text-slate-700">COW Activities</span>
                           <span className="font-medium">{project.statistics?.totalCow || 0}</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                           <div
                              className="bg-sky-500 h-2 rounded-full"
                              style={{
                                 width: `${(project.statistics?.totalCow || 0) / Math.max(stats.totalActivities, 1) * 100}%`
                              }}
                           />
                        </div>
                     </div>

                     <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                           <span className="text-slate-700">Relocations</span>
                           <span className="font-medium">{project.statistics?.totalRelocation || 0}</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                           <div
                              className="bg-purple-500 h-2 rounded-full"
                              style={{
                                 width: `${(project.statistics?.totalRelocation || 0) / Math.max(stats.totalActivities, 1) * 100}%`
                              }}
                           />
                        </div>
                     </div>
                  </div>
               </CardContent>
            </Card>

            {/* Site Status Overview */}
            <Card className="border-slate-200">
               <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                     <div className="p-2 bg-emerald-100 rounded-lg">
                        <Building className="h-5 w-5 text-emerald-600" />
                     </div>
                     <div>
                        <h3 className="font-semibold text-slate-900">Site Status</h3>
                        <p className="text-slate-600 text-sm">Site distribution by status</p>
                     </div>
                  </div>

                  <div className="space-y-4">
                     {Object.keys(siteStatusDistribution).length > 0 ? (
                        Object.entries(siteStatusDistribution).map(([status, count]) => (
                           <div key={status} className="space-y-2">
                              <div className="flex justify-between text-sm">
                                 <span className="text-slate-700 capitalize">{status}</span>
                                 <span className="font-medium">{count}</span>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-2">
                                 <div
                                    className={`h-2 rounded-full ${status === 'completed' ? 'bg-green-500' :
                                       status === 'in-progress' ? 'bg-sky-500' :
                                          status === 'planned' ? 'bg-amber-500' :
                                             'bg-slate-500'
                                       }`}
                                    style={{
                                       width: `${(count / Math.max(project.sites?.length, 1)) * 100}%`
                                    }}
                                 />
                              </div>
                           </div>
                        ))
                     ) : (
                        <div className="text-center py-8">
                           <Building className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                           <p className="text-slate-500">No site data available</p>
                        </div>
                     )}
                  </div>
               </CardContent>
            </Card>
         </div>

         {/* Timeline Progress */}
         <Card className="border-slate-200">
            <CardContent className="p-6">
               <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-amber-100 rounded-lg">
                     <Calendar className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                     <h3 className="font-semibold text-slate-900">Timeline Progress</h3>
                     <p className="text-slate-600 text-sm">Time vs. progress comparison</p>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="text-center p-4 bg-linear-to-b from-slate-50 to-white rounded-lg">
                        <div className="text-2xl font-bold text-slate-900">{progressData?.time?.elapsedDays || 0}</div>
                        <div className="text-sm text-slate-600">Days Elapsed</div>
                     </div>
                     <div className="text-center p-4 bg-linear-to-b from-slate-50 to-white rounded-lg">
                        <div className="text-2xl font-bold text-slate-900">{progressData?.time?.remainingDays || 0}</div>
                        <div className="text-sm text-slate-600">Days Remaining</div>
                     </div>
                  </div>

                  {progressData?.time && (
                     <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                           <span className="text-slate-600">Progress vs. Time</span>
                           <span className={`font-semibold ${progressData.time.progressVsTime >= 100 ? 'text-green-600' : 'text-amber-600'
                              }`}>
                              {progressData.time.progressVsTime}% of expected
                           </span>
                        </div>
                        <div className="h-4 bg-slate-200 rounded-full overflow-hidden">
                           <div
                              className="h-full bg-linear-to-r from-sky-500 to-emerald-500"
                              style={{ width: `${Math.min(100, progressData.time.progressVsTime)}%` }}
                           />
                        </div>
                        <div className="flex justify-between text-xs text-slate-500">
                           <span>Time Elapsed: {progressData.time.elapsedPercentage}%</span>
                           <span>Work Completed: {progressData.overall}%</span>
                        </div>
                     </div>
                  )}
               </div>
            </CardContent>
         </Card>
      </div>
   );
};

export default StatisticsDashboard;