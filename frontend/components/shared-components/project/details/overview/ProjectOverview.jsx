// components/shared-components/project/project-details/ProjectOverview.jsx
'use client';

import {
   Calendar,
   Clock,
   User,
   FileText,
   Target,
   AlertCircle,
   TrendingUp,
   MapPin
} from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const ProjectOverview = ({ project, progressData }) => {
   if (!project) return null;

   const getStatusColor = (status) => {
      const colors = {
         planning: 'bg-sky-100 text-sky-700',
         active: 'bg-emerald-100 text-emerald-700',
         completed: 'bg-green-100 text-green-700',
         cancelled: 'bg-slate-100 text-slate-700',
         'on-hold': 'bg-amber-100 text-amber-700',
      };
      return colors[status] || 'bg-slate-100 text-slate-700';
   };
   return (
      <div className="space-y-6">
         {/* Description Card */}
         <Card>
            <CardHeader>
               <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-slate-600" />
                  Project Overview
               </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="space-y-3">
                  <h4 className="font-semibold text-slate-900">Description</h4>
                  <p className="text-slate-700 leading-relaxed">
                     {project.description || 'No description provided for this project.'}
                  </p>
               </div>

               <Separator />

               {/* Key Information Grid */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Target className="h-4 w-4" />
                        <span>Project Status</span>
                     </div>
                     <Badge className={`${getStatusColor(project.status)} px-3 py-1.5 font-medium`}>
                        {project.status?.charAt(0).toUpperCase() + project.status?.slice(1)}
                     </Badge>
                  </div>

                  <div className="space-y-2">
                     <div className="flex items-center gap-2 text-sm text-slate-500">
                        <User className="h-4 w-4" />
                        <span>Project Manager</span>
                     </div>
                     <div className="font-medium text-slate-900">
                        {project.manager?.name || 'Unassigned'}
                     </div>
                  </div>

                  <div className="space-y-2">
                     <div className="flex items-center gap-2 text-sm text-slate-500">
                        <MapPin className="h-4 w-4" />
                        <span>Sites</span>
                     </div>
                     <div className="font-medium text-slate-900">
                        {project.sites?.length || 0} site{project.sites?.length !== 1 ? 's' : ''}
                     </div>
                  </div>

                  <div className="space-y-2">
                     <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Calendar className="h-4 w-4" />
                        <span>Created On</span>
                     </div>
                     <div className="font-medium text-slate-900">
                        {format(new Date(project.createdAt), 'MMM dd, yyyy')}
                     </div>
                  </div>
               </div>
            </CardContent>
         </Card>

         {/* Progress and Timeline */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Progress Card */}
            <Card>
               <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                     <TrendingUp className="h-5 w-5 text-slate-600" />
                     Project Progress
                  </CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                  <div className="space-y-2">
                     <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Overall Completion</span>
                        <span className="font-semibold">{progressData?.overall || 0}%</span>
                     </div>
                     <Progress value={progressData?.overall || 0} className="h-3" />
                  </div>

                  {progressData?.time && (
                     <div className="pt-3 border-t border-slate-100 space-y-3">
                        <div className="flex items-center justify-between text-sm">
                           <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-slate-500" />
                              <span>Time Elapsed</span>
                           </div>
                           <span className="font-medium">
                              {progressData.time.elapsedDays} of {progressData.time.totalDays} days
                           </span>
                        </div>

                        {progressData.time.isBehindSchedule && (
                           <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                              <AlertCircle className="h-4 w-4 text-amber-600" />
                              <span className="text-sm text-amber-700">
                                 Project is {Math.abs(100 - progressData.time.progressVsTime)}% behind schedule
                              </span>
                           </div>
                        )}
                     </div>
                  )}
               </CardContent>
            </Card>

            {/* Timeline Card */}
            <Card>
               <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                     <Calendar className="h-5 w-5 text-slate-600" />
                     Project Timeline
                  </CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                  <div className="space-y-4">
                     <div className="flex justify-between items-center">
                        <div>
                           <div className="text-sm text-slate-500">Start Date</div>
                           <div className="font-semibold text-slate-900">
                              {format(new Date(project.timeline?.startDate), 'MMM dd, yyyy')}
                           </div>
                        </div>
                        <div className="p-2 bg-sky-100 rounded-lg">
                           <Calendar className="h-5 w-5 text-sky-600" />
                        </div>
                     </div>

                     <Separator />

                     <div className="flex justify-between items-center">
                        <div>
                           <div className="text-sm text-slate-500">End Date</div>
                           <div className="font-semibold text-slate-900">
                              {format(new Date(project.timeline?.endDate), 'MMM dd, yyyy')}
                           </div>
                        </div>
                        <div className={`p-2 rounded-lg ${progressData?.time?.remainingDays <= 7 ? 'bg-amber-100' : 'bg-green-100'
                           }`}>
                           <Clock className={`h-5 w-5 ${progressData?.time?.remainingDays <= 7 ? 'text-amber-600' : 'text-green-600'
                              }`} />
                        </div>
                     </div>

                     {progressData?.time && progressData.time.remainingDays !== null && (
                        <>
                           <Separator />
                           <div className={`flex justify-between items-center p-3 rounded-lg ${progressData.time.remainingDays < 0 ? 'bg-red-50' :
                              progressData.time.remainingDays <= 7 ? 'bg-amber-50' : 'bg-green-50'
                              }`}>
                              <div>
                                 <div className="text-sm font-medium">
                                    {progressData.time.remainingDays < 0 ? 'Overdue by' : 'Days remaining'}
                                 </div>
                                 <div className={`font-bold ${progressData.time.remainingDays < 0 ? 'text-red-600' :
                                    progressData.time.remainingDays <= 7 ? 'text-amber-600' : 'text-green-600'
                                    }`}>
                                    {Math.abs(progressData.time.remainingDays)} days
                                 </div>
                              </div>
                              <AlertCircle className={`h-5 w-5 ${progressData.time.remainingDays < 0 ? 'text-red-600' :
                                 progressData.time.remainingDays <= 7 ? 'text-amber-600' : 'text-green-600'
                                 }`} />
                           </div>
                        </>
                     )}
                  </div>
               </CardContent>
            </Card>
         </div>
      </div>
   );
};

export default ProjectOverview;