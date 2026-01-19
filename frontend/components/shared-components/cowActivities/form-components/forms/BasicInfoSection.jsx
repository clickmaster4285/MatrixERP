'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/select';
import { COW_ACTIVITY_CONSTANTS } from '@/components/shared-components/cowActivities/constants/cowActivity.constants';

export const BasicInfoSection = ({
   formData,
   errors,
   sites = [],
   onChange,
}) => {
   return (
      <div className="space-y-6">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
               <Label>Activity Name *</Label>
               <Input
                  value={formData.activityName || ''}
                  onChange={(e) => onChange('activityName', e.target.value)}
                  placeholder="Enter activity name"
                  className={errors.activityName ? 'border-red-500' : ''}
               />
               {errors.activityName && (
                  <p className="text-sm text-red-500">{errors.activityName}</p>
               )}
            </div>

            <div className="space-y-2">
               <Label>Parent Site *</Label>
               <Select
                  value={formData.siteId || ''}
                  onValueChange={(value) => onChange('siteId', value)}
               >
                  <SelectTrigger className={errors.siteId ? 'border-red-500' : ''}>
                     <SelectValue placeholder="Select site" />
                  </SelectTrigger>
                  <SelectContent>
                     {sites.map((site) => (
                        <SelectItem key={site.value} value={site.value}>
                           {site.label}
                        </SelectItem>
                     ))}
                  </SelectContent>
               </Select>
               {errors.siteId && (
                  <p className="text-sm text-red-500">{errors.siteId}</p>
               )}
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
               <Label>Purpose *</Label>
               <Select
                  value={formData.purpose || ''}
                  onValueChange={(value) => onChange('purpose', value)}
               >
                  <SelectTrigger className={errors.purpose ? 'border-red-500' : ''}>
                     <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>
                  <SelectContent>
                     {COW_ACTIVITY_CONSTANTS.PURPOSES.map((purpose) => (
                        <SelectItem key={purpose.value} value={purpose.value}>
                           {purpose.label}
                        </SelectItem>
                     ))}
                  </SelectContent>
               </Select>
               {errors.purpose && (
                  <p className="text-sm text-red-500">{errors.purpose}</p>
               )}
            </div>

            <div className="space-y-2">
               <Label>Overall Status</Label>
               <Select
                  value={formData.overallStatus || 'planned'}
                  onValueChange={(value) => onChange('overallStatus', value)}
               >
                  <SelectTrigger>
                     <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                     {COW_ACTIVITY_CONSTANTS.OVERALL_STATUS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                           {status.label}
                        </SelectItem>
                     ))}
                  </SelectContent>
               </Select>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
               <Label>Planned Start Date</Label>
               <Input
                  type="date"
                  value={formData.plannedStartDate || ''}
                  onChange={(e) => onChange('plannedStartDate', e.target.value)}
               />
            </div>

            <div className="space-y-2">
               <Label>Planned End Date</Label>
               <Input
                  type="date"
                  value={formData.plannedEndDate || ''}
                  onChange={(e) => onChange('plannedEndDate', e.target.value)}
               />
            </div>
         </div>

         <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
               value={formData.description || ''}
               onChange={(e) => onChange('description', e.target.value)}
               placeholder="Describe the COW activity..."
               rows={3}
            />
         </div>

         <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
               value={formData.notes || ''}
               onChange={(e) => onChange('notes', e.target.value)}
               placeholder="Additional notes..."
               rows={2}
            />
         </div>
      </div>
   );
};