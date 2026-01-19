'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
   ClipboardCheck,
   Package,
   Truck,
   Wrench,
   Users,
   FileText,
   Box,
   Calendar,
   CheckCircle,
   Clock,
   AlertCircle
} from 'lucide-react';
import { formatDate, formatWorkStatus } from '../form-components/utils/formatter';

const getWorkTypeIcon = (type) => {
   const icons = {
      survey: ClipboardCheck,
      inventory: Package,
      transportation: Truck,
      installation: Wrench
   };
   return icons[type] || FileText;
};

const getWorkTypeColor = (type) => {
   const colors = {
      survey: 'bg-sky-100 text-sky-800 border-sky-200',
      inventory: 'bg-green-100 text-green-800 border-green-200',
      transportation: 'bg-purple-100 text-purple-800 border-purple-200',
      installation: 'bg-amber-100 text-amber-800 border-amber-200'
   };
   return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
};

const getStatusIcon = (status) => {
   switch (status) {
      case 'completed':
         return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in-progress':
      case 'loading':
      case 'in-transit':
      case 'unloading':
         return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'not-started':
         return <AlertCircle className="w-4 h-4 text-gray-600" />;
      default:
         return <AlertCircle className="w-4 h-4 text-gray-600" />;
   }
};

export const WorkDetailsCard = ({ site, siteLabel, siteType }) => {
   if (!site || !site.workTypes?.length) return null;

   const calculateWorkProgress = (work) => {
      if (!work) return 0;
      if (work.status === 'completed') return 100;
      if (work.status === 'in-progress') return 50;
      if (work.status === 'loading') return 25;
      if (work.status === 'in-transit') return 60;
      if (work.status === 'unloading') return 80;
      return 0;
   };

   const totalMaterials = site.workTypes.reduce((total, type) => {
      const work = site[`${type}Work`];
      return total + (work?.materials?.length || 0);
   }, 0);

   const totalAssignedUsers = site.workTypes.reduce((total, type) => {
      const work = site[`${type}Work`];
      return total + (work?.assignedUsers?.length || 0);
   }, 0);

   return (
      <Card>
         <CardHeader>
            <div className="flex items-center justify-between">
               <CardTitle className="text-lg">Work Details - {siteLabel}</CardTitle>
               <div className="flex items-center gap-3">
                  <Badge variant="outline" className="gap-2">
                     <Users className="w-3 h-3" />
                     {totalAssignedUsers} team members
                  </Badge>
                  <Badge variant="outline" className="gap-2">
                     <Box className="w-3 h-3" />
                     {totalMaterials} materials
                  </Badge>
               </div>
            </div>
         </CardHeader>

         <CardContent className="space-y-6">
            {/* Work Type Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {site.workTypes.map((type) => {
                  const work = site[`${type}Work`];
                  const progress = calculateWorkProgress(work);
                  const Icon = getWorkTypeIcon(type);

                  return (
                     <div key={type} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                           <div className={`p-2 rounded-lg ${getWorkTypeColor(type).split(' ')[0]}`}>
                              <Icon className="w-4 h-4" />
                           </div>
                           <Badge className={getWorkTypeColor(type)}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                           </Badge>
                        </div>
                        <div className="space-y-2">
                           <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-medium">{progress}%</span>
                           </div>
                           <Progress value={progress} className="h-2" />
                           <div className="flex items-center gap-2 text-sm">
                              {getStatusIcon(work?.status)}
                              <span>{formatWorkStatus(work?.status || 'not-started')}</span>
                           </div>
                        </div>
                     </div>
                  );
               })}
            </div>

            {/* Detailed Work Sections */}
            {site.workTypes.map((workType) => {
               const work = site[`${workType}Work`];
               if (!work) return null;

               const Icon = getWorkTypeIcon(workType);
               const assignedUsers = work.assignedUsers || [];
               const materials = work.materials || [];

               return (
                  <div key={workType} className="border rounded-lg p-5">
                     <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                           <div className={`p-2 rounded-lg ${getWorkTypeColor(workType).split(' ')[0]}`}>
                              <Icon className="w-5 h-5" />
                           </div>
                           <div>
                              <h3 className="font-semibold text-lg">
                                 {workType.charAt(0).toUpperCase() + workType.slice(1)} Work
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                 {workType === 'survey' && 'Site survey and assessment'}
                                 {workType === 'inventory' && 'Material inventory and tracking'}
                                 {workType === 'transportation' && 'Material transportation'}
                                 {workType === 'installation' && 'Equipment installation'}
                              </p>
                           </div>
                        </div>
                        <div className="flex items-center gap-3">
                           <Badge className={
                              work.status === 'completed' ? 'bg-green-100 text-green-800' :
                                 work.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                           }>
                              {formatWorkStatus(work.status)}
                           </Badge>
                           {(work.startTime || work.endTime) && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                 <Calendar className="w-4 h-4" />
                                 {work.startTime && formatDate(work.startTime)}
                                 {work.endTime && ` → ${formatDate(work.endTime)}`}
                              </div>
                           )}
                        </div>
                     </div>

                     <Separator className="my-4" />

                     {/* Assigned Team */}
                     {assignedUsers.length > 0 && (
                        <div className="mb-4">
                           <h4 className="font-medium mb-3 flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              Assigned Team ({assignedUsers.length})
                           </h4>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {assignedUsers.map((user, index) => (
                                 <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                       <span className="text-sm font-medium text-primary">
                                          {user.userId?.name?.charAt(0)?.toUpperCase() || 'U'}
                                       </span>
                                    </div>
                                    <div className="flex-1">
                                       <div className="font-medium">
                                          {user.userId?.name || user.name || 'Unknown User'}
                                       </div>
                                       <div className="text-sm text-muted-foreground flex items-center gap-2">
                                          <Badge variant="outline" className="text-xs capitalize">
                                             {user.role || 'worker'}
                                          </Badge>
                                          {user.userId?.email || user.email}
                                       </div>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                       {user.assignedDate && formatDate(user.assignedDate)}
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>
                     )}

                     {/* Materials */}
                     {materials.length > 0 && (
                        <div className="mb-4">
                           <h4 className="font-medium mb-3 flex items-center gap-2">
                              <Box className="w-4 h-4" />
                              Materials ({materials.length})
                           </h4>
                           <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                 <thead>
                                    <tr>
                                       <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                                       <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                       <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                                       <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Condition</th>
                                       <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reusable</th>
                                    </tr>
                                 </thead>
                                 <tbody className="divide-y divide-gray-200">
                                    {materials.slice(0, 5).map((material, index) => (
                                       <tr key={index}>
                                          <td className="px-3 py-2 text-sm">{material.materialCode}</td>
                                          <td className="px-3 py-2 text-sm font-medium">{material.name}</td>
                                          <td className="px-3 py-2 text-sm">{material.quantity} {material.unit}</td>
                                          <td className="px-3 py-2 text-sm">
                                             <Badge variant="outline">{material.condition}</Badge>
                                          </td>
                                          <td className="px-3 py-2 text-sm">
                                             {material.canBeReused ? 'Yes' : 'No'}
                                          </td>
                                       </tr>
                                    ))}
                                 </tbody>
                              </table>
                              {materials.length > 5 && (
                                 <div className="text-center py-2 text-sm text-gray-500">
                                    Showing 5 of {materials.length} materials
                                 </div>
                              )}
                           </div>
                        </div>
                     )}

                     {/* Work-specific Details */}
                     {workType === 'transportation' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                           {work.vehicleNumber && (
                              <div className="bg-sky-50 p-3 rounded-lg">
                                 <div className="text-sm text-sky-700">Vehicle Number</div>
                                 <div className="font-medium">{work.vehicleNumber}</div>
                              </div>
                           )}
                           {work.driverName && (
                              <div className="bg-green-50 p-3 rounded-lg">
                                 <div className="text-sm text-green-700">Driver Name</div>
                                 <div className="font-medium">{work.driverName}</div>
                              </div>
                           )}
                           {work.driverContact && (
                              <div className="bg-purple-50 p-3 rounded-lg">
                                 <div className="text-sm text-purple-700">Driver Contact</div>
                                 <div className="font-medium">{work.driverContact}</div>
                              </div>
                           )}
                        </div>
                     )}

                     {workType === 'installation' && work.equipmentInstalled?.length > 0 && (
                        <div className="mb-4">
                           <h4 className="font-medium mb-3">Equipment to Install</h4>
                           <div className="flex flex-wrap gap-2">
                              {work.equipmentInstalled.map((eq, idx) => (
                                 <Badge key={idx} variant="secondary" className="gap-2">
                                    <Wrench className="w-3 h-3" />
                                    {eq.name} ({eq.quantity})
                                 </Badge>
                              ))}
                           </div>
                        </div>
                     )}

                     {/* Notes */}
                     {work.notes && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                           <h4 className="font-medium mb-2">Work Notes</h4>
                           <p className="text-gray-700 whitespace-pre-wrap">{work.notes}</p>
                        </div>
                     )}

                     {/* Attachments */}
                     {work.attachments?.length > 0 && (
                        <div className="mt-4">
                           <h4 className="font-medium mb-2">Attachments</h4>
                           <div className="flex flex-wrap gap-2">
                              {work.attachments.map((attachment, index) => (
                                 <Badge key={index} variant="outline" className="gap-2">
                                    <FileText className="w-3 h-3" />
                                    {typeof attachment === 'string'
                                       ? attachment.split('/').pop()
                                       : `Attachment ${index + 1}`}
                                 </Badge>
                              ))}
                           </div>
                        </div>
                     )}
                  </div>
               );
            })}
         </CardContent>
      </Card>
   );
};