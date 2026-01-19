// components/shared-components/sites/detail/SiteInfoCard.jsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Building, UserCircle, Globe, Calendar } from 'lucide-react';

const SiteInfoCard = ({ site }) => {
   const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleDateString('en-US', {
         year: 'numeric',
         month: 'short',
         day: 'numeric',
         hour: '2-digit',
         minute: '2-digit',
      });
   };

   return (
      <Card>
         <CardHeader>
            <CardTitle className="flex items-center gap-2">
               <Building className="h-5 w-5" />
               Site Information
            </CardTitle>
         </CardHeader>
         <CardContent className="space-y-4">
            <div className="space-y-3">
               <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Region</span>
                  <span className="font-medium">{site.region || 'N/A'}</span>
               </div>
               <Separator />
               <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Site Manager</span>
                  <div className="flex items-center gap-2">
                     <UserCircle className="h-4 w-4 text-gray-400" />
                     <span className="font-medium">
                        {site.siteManager?.name || 'Unassigned'}
                     </span>
                  </div>
               </div>
               <Separator />
               <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Project</span>
                  <span className="font-medium">{site.project?.name || 'N/A'}</span>
               </div>
               <Separator />
               <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Created By</span>
                  <span className="font-medium">{site.createdBy?.name || 'N/A'}</span>
               </div>
               <Separator />
               <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Created Date</span>
                  <span className="font-medium">{formatDate(site.createdAt)}</span>
               </div>
               <Separator />
               <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Last Updated</span>
                  <span className="font-medium">{formatDate(site.updatedAt)}</span>
               </div>
            </div>
         </CardContent>
      </Card>
   );
};

export default SiteInfoCard;