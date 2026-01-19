'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
   MapPin,
   ClipboardCheck,
   Package,
   Truck,
   Wrench,
   Users,
   FileText,
   ChevronRight,
   Building
} from 'lucide-react';
import { formatAddress } from '../form-components/utils/formatter';

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
      survey: 'bg-sky-100 text-sky-800',
      inventory: 'bg-green-100 text-green-800',
      transportation: 'bg-purple-100 text-purple-800',
      installation: 'bg-amber-100 text-amber-800'
   };
   return colors[type] || 'bg-gray-100 text-gray-800';
};

export const SiteDetailsCard = ({ site, title, siteType }) => {
   if (!site) return null;

   const workTypes = site.workTypes || [];

   return (
      <Card>
         <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                     {siteType === 'source' ? (
                        <ChevronRight className="w-5 h-5 text-primary rotate-180" />
                     ) : (
                        <ChevronRight className="w-5 h-5 text-primary" />
                     )}
                  </div>
                  <div>
                     <CardTitle className="text-lg">{title}</CardTitle>
                     <div className="flex items-center gap-2 mt-1">
                        <Badge className={
                           site.siteStatus === 'completed' ? 'bg-green-100 text-green-800' :
                              site.siteStatus === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                                 'bg-gray-100 text-gray-800'
                        }>
                           {site.siteStatus || 'not-started'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                           {workTypes.length} work type{workTypes.length !== 1 ? 's' : ''}
                        </span>
                     </div>
                  </div>
               </div>
            </div>
         </CardHeader>

         <CardContent className="space-y-6">
            {/* Location Details */}
            <div className="space-y-3">
               <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-muted-foreground" />
                  <h4 className="font-medium">Location Details</h4>
               </div>

               <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-3">
                     <div>
                        <div className="text-sm text-muted-foreground">Name</div>
                        <div className="font-medium">{site.location?.name || 'Not specified'}</div>
                     </div>

                     <Separator />

                     <div>
                        <div className="text-sm text-muted-foreground">Address</div>
                        <div className="font-medium flex items-center gap-2 mt-1">
                           <MapPin className="w-4 h-4" />
                           {formatAddress(site.location?.address) || 'Not specified'}
                        </div>
                     </div>

                     {site.location?.type && (
                        <>
                           <Separator />
                           <div>
                              <div className="text-sm text-muted-foreground">Type</div>
                              <Badge variant="outline" className="mt-1">
                                 {site.location.type}
                              </Badge>
                           </div>
                        </>
                     )}
                  </div>
               </div>
            </div>

            {/* Work Types */}
            {workTypes.length > 0 && (
               <div className="space-y-3">
                  <div className="flex items-center gap-2">
                     <ClipboardCheck className="w-4 h-4 text-muted-foreground" />
                     <h4 className="font-medium">Work Types</h4>
                  </div>

                  <div className="space-y-3">
                     {workTypes.map((workType) => {
                        const work = site[`${workType}Work`];
                        const Icon = getWorkTypeIcon(workType);
                        const assignedCount = work?.assignedUsers?.length || 0;
                        const materialCount = work?.materials?.length || 0;

                        return (
                           <div key={workType} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                 <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${getWorkTypeColor(workType)}`}>
                                       <Icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                       <h5 className="font-medium">
                                          {workType.charAt(0).toUpperCase() + workType.slice(1)} Work
                                       </h5>
                                       <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                          <div className="flex items-center gap-1">
                                             <Users className="w-3 h-3" />
                                             <span>{assignedCount} assigned</span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                             <Package className="w-3 h-3" />
                                             <span>{materialCount} materials</span>
                                          </div>
                                       </div>
                                    </div>
                                 </div>
                                 <Badge className={
                                    work?.status === 'completed' ? 'bg-green-100 text-green-800' :
                                       work?.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                                          'bg-gray-100 text-gray-800'
                                 }>
                                    {work?.status || 'not-started'}
                                 </Badge>
                              </div>

                              {/* Work-specific details */}
                              {work?.notes && (
                                 <div className="mt-3">
                                    <div className="text-sm text-muted-foreground mb-1">Notes</div>
                                    <p className="text-sm bg-gray-50 p-3 rounded">{work.notes}</p>
                                 </div>
                              )}

                              {/* Transportation-specific */}
                              {workType === 'transportation' && work && (
                                 <div className="grid grid-cols-2 gap-3 mt-3">
                                    {work.vehicleNumber && (
                                       <div>
                                          <div className="text-sm text-muted-foreground">Vehicle</div>
                                          <div className="font-medium">{work.vehicleNumber}</div>
                                       </div>
                                    )}
                                    {work.driverName && (
                                       <div>
                                          <div className="text-sm text-muted-foreground">Driver</div>
                                          <div className="font-medium">{work.driverName}</div>
                                       </div>
                                    )}
                                 </div>
                              )}

                              {/* Installation-specific */}
                              {workType === 'installation' && work?.equipmentInstalled?.length > 0 && (
                                 <div className="mt-3">
                                    <div className="text-sm text-muted-foreground mb-2">Equipment to Install</div>
                                    <div className="flex flex-wrap gap-2">
                                       {work.equipmentInstalled.map((eq, idx) => (
                                          <Badge key={idx} variant="outline">
                                             {eq.name} ({eq.quantity})
                                          </Badge>
                                       ))}
                                    </div>
                                 </div>
                              )}
                           </div>
                        );
                     })}
                  </div>
               </div>
            )}

            {/* No Work Types Message */}
            {workTypes.length === 0 && (
               <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h4 className="text-gray-500 font-medium">No work types configured</h4>
                  <p className="text-sm text-gray-400 mt-1">
                     No work types have been configured for this site
                  </p>
               </div>
            )}
         </CardContent>
      </Card>
   );
};