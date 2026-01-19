'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { SiteConfiguration } from './SiteConfiguration';
import { WorkAssignmentModal } from './WorkAssignmentModal';
import {
   ClipboardCheck,
   Package,
   Truck,
   Wrench,
   Plus,
   Settings,
   MapPin,
   Users
} from 'lucide-react';
import { COW_ACTIVITY_CONSTANTS } from '../../constants/cowActivity.constants';

const WORK_TYPES = [
   { id: 'survey', label: 'Survey', icon: ClipboardCheck, color: 'bg-sky-100 text-sky-800' },
   { id: 'inventory', label: 'Inventory', icon: Package, color: 'bg-green-100 text-green-800' },
   { id: 'transportation', label: 'Transportation', icon: Truck, color: 'bg-purple-100 text-purple-800' },
   { id: 'installation', label: 'Installation', icon: Wrench, color: 'bg-amber-100 text-amber-800' }
];

const getWorkIcon = (type) => {
   const work = WORK_TYPES.find(w => w.id === type);
   return work ? work.icon : ClipboardCheck;
};

export const SiteWorkSection = ({
   siteType,
   formData,
   sites = [],
   users = [],
   onChange,
}) => {
   const [selectedWorkModal, setSelectedWorkModal] = useState(null);
   const site = formData[`${siteType}Site`];
   const workTypes = site?.workTypes || [];

   const handleWorkTypeToggle = (workType) => {
      const newWorkTypes = workTypes.includes(workType)
         ? workTypes.filter(wt => wt !== workType)
         : [...workTypes, workType];

      onChange(`${siteType}Site.workTypes`, newWorkTypes);
   };

   const handleWorkConfigSave = (workType, config) => {
      onChange(`${siteType}Site.${workType}Work`, {
         ...site[`${workType}Work`],
         ...config,
         required: true
      });
   };

   const hasWorkConfig = (workType) => {
      return site?.[`${workType}Work`]?.required === true;
   };

   const getAssignedUsersCount = (workType) => {
      return site?.[`${workType}Work`]?.assignedUsers?.length || 0;
   };

   return (
      <div className="space-y-6">
         <Card>
            <CardHeader>
               <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {siteType === 'source' ? 'Source Site' : 'Destination Site'} Configuration
               </CardTitle>
               <p className="text-sm text-muted-foreground">
                  Configure location and work types for {siteType === 'source' ? 'source' : 'destination'} site
               </p>
            </CardHeader>
            <CardContent className="space-y-6">
               <SiteConfiguration
                  siteData={site}
                  siteType={siteType}
                  onChange={onChange}
               />

               <Separator />

               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <Label className="text-base font-medium">Work Types</Label>
                     <Badge variant="outline">
                        {workTypes.length} selected
                     </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {WORK_TYPES.map((workType) => {
                        const isSelected = workTypes.includes(workType.id);
                        const hasConfig = hasWorkConfig(workType.id);
                        const assignedCount = getAssignedUsersCount(workType.id);

                        return (
                           <div
                              key={workType.id}
                              className={`border rounded-lg p-4 transition-all ${isSelected ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                           >
                              <div className="flex items-start justify-between">
                                 <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${workType.color}`}>
                                       <workType.icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                       <Label className="font-medium cursor-pointer" htmlFor={`work-${workType.id}`}>
                                          {workType.label}
                                       </Label>
                                       <p className="text-sm text-muted-foreground mt-1">
                                          {workType.id === 'survey' && 'Site survey and assessment'}
                                          {workType.id === 'inventory' && 'Material inventory and tracking'}
                                          {workType.id === 'transportation' && 'Material transportation'}
                                          {workType.id === 'installation' && 'Equipment installation'}
                                       </p>
                                    </div>
                                 </div>
                                 <Checkbox
                                    id={`work-${workType.id}`}
                                    checked={isSelected}
                                    onCheckedChange={() => handleWorkTypeToggle(workType.id)}
                                 />
                              </div>

                              {isSelected && (
                                 <div className="mt-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                       <div className="flex items-center gap-2 text-sm">
                                          <Users className="w-4 h-4" />
                                          <span>{assignedCount} assigned</span>
                                       </div>
                                       <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => setSelectedWorkModal(workType.id)}
                                          className="gap-2"
                                       >
                                          <Settings className="w-4 h-4" />
                                          Configure
                                       </Button>
                                    </div>

                                    {hasConfig && (
                                       <div className="bg-gray-50 p-3 rounded-md">
                                          <div className="text-sm space-y-2">
                                             <div className="flex items-center justify-between">
                                                <span className="font-medium">Status:</span>
                                                <Badge variant="outline">
                                                   {site[`${workType.id}Work`]?.status || 'not-started'}
                                                </Badge>
                                             </div>
                                             {site[`${workType.id}Work`]?.notes && (
                                                <div>
                                                   <span className="font-medium">Notes:</span>
                                                   <p className="text-muted-foreground mt-1">
                                                      {site[`${workType.id}Work`].notes.substring(0, 60)}...
                                                   </p>
                                                </div>
                                             )}
                                          </div>
                                       </div>
                                    )}
                                 </div>
                              )}
                           </div>
                        );
                     })}
                  </div>
               </div>

               {workTypes.length > 0 && (
                  <div className="bg-sky-50 p-4 rounded-lg border border-sky-200">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-sky-100 rounded-lg">
                           <ClipboardCheck className="w-5 h-5 text-sky-600" />
                        </div>
                        <div>
                           <h4 className="font-medium text-sky-900">Work Types Selected</h4>
                           <p className="text-sm text-sky-700">
                              Configure each work type by clicking the "Configure" button
                           </p>
                        </div>
                     </div>
                     <div className="flex flex-wrap gap-2 mt-3">
                        {workTypes.map(type => {
                           const Icon = getWorkIcon(type);
                           return (
                              <Badge key={type} variant="secondary" className="gap-2">
                                 <Icon className="w-3 h-3" />
                                 {type.charAt(0).toUpperCase() + type.slice(1)}
                              </Badge>
                           );
                        })}
                     </div>
                  </div>
               )}
            </CardContent>
         </Card>

         {selectedWorkModal && (
            <WorkAssignmentModal
               open={!!selectedWorkModal}
               onOpenChange={(open) => !open && setSelectedWorkModal(null)}
               workType={selectedWorkModal}
               workData={site?.[`${selectedWorkModal}Work`]}
               users={users}
               onSave={(config) => {
                  handleWorkConfigSave(selectedWorkModal, config);
                  setSelectedWorkModal(null);
               }}
            />
         )}
      </div>
   );
};