'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { MapPin } from 'lucide-react';
import { COW_ACTIVITY_CONSTANTS } from '../../constants/cowActivity.constants';

export const SiteConfiguration = ({
   siteData = {},
   siteType,
   onChange,
}) => {
   return (
      <div className="space-y-6">
         <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
               <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
               <h3 className="font-medium">Site Location Details</h3>
               <p className="text-sm text-muted-foreground">
                  Enter location information for the {siteType} site
               </p>
            </div>
         </div>

         <div className="space-y-4">
            {/* <div className="space-y-2">
               <Label>Location Name</Label>
               <Input
                  value={siteData.location?.name || ''}
                  onChange={(e) => onChange(`${siteType}Site.location.name`, e.target.value)}
                  placeholder="Enter location name"
               />
            </div> */}

            <div className="space-y-2">
               <Label>Location Type</Label>
               <Select
                  value={siteData.location?.type || (siteType === 'source' ? 'source' : 'destination')}
                  onValueChange={(value) => onChange(`${siteType}Site.location.type`, value)}
               >
                  <SelectTrigger>
                     <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                     {COW_ACTIVITY_CONSTANTS.LOCATION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                           {type.label}
                        </SelectItem>
                     ))}
                  </SelectContent>
               </Select>
            </div>

            <Separator />

            <div className="space-y-4">
               <h4 className="font-medium">Address Details</h4>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                     <Label>Street</Label>
                     <Input
                        value={siteData.location?.address?.street || ''}
                        onChange={(e) => onChange(`${siteType}Site.location.address.street`, e.target.value)}
                        placeholder="Street address"
                     />
                  </div>

                  <div className="space-y-2">
                     <Label>City</Label>
                     <Input
                        value={siteData.location?.address?.city || ''}
                        onChange={(e) => onChange(`${siteType}Site.location.address.city`, e.target.value)}
                        placeholder="City"
                     />
                  </div>

                  <div className="space-y-2">
                     <Label>State</Label>
                     <Input
                        value={siteData.location?.address?.state || ''}
                        onChange={(e) => onChange(`${siteType}Site.location.address.state`, e.target.value)}
                        placeholder="State"
                     />
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};