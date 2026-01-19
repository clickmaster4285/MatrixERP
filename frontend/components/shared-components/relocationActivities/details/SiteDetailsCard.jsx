import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Building2 } from 'lucide-react';
import { formatAddress } from '@/components/shared-components/relocationActivities/form-components/utils/formatters';

export const SiteDetailsCard = ({ site, title, siteType }) => {
   if (!site || site.siteRequired === false) return null;

   return (
      <Card>
         <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
               <MapPin className="w-5 h-5" />
               {title}
            </CardTitle>
         </CardHeader>
         <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {/* Basic Info */}
               <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Address</h4>
                  <p className="text-gray-600">{formatAddress(site.address)}</p>
               </div>

               {site.operatorName && (
                  <div className="space-y-2">
                     <h4 className="font-medium text-gray-900">Operator</h4>
                     <p className="text-gray-600">{site.operatorName}</p>
                  </div>
               )}

               <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Site Status</h4>
                  <Badge className="bg-sky-100 text-sky-800 border-sky-200">
                     {site.siteStatus?.replace('-', ' ') || 'Not Started'}
                  </Badge>
               </div>

               <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Required</h4>
                  <p className="text-gray-600">{site.siteRequired ? 'Yes' : 'No'}</p>
               </div>
            </div>

            {/* Work Types */}
            <div className="space-y-2">
               <h4 className="font-medium text-gray-900">Work Types</h4>
               <div className="flex flex-wrap gap-2">
                  {site.workTypes?.map((workType) => {
                     const formattedType = workType
                        .split('_')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');
                     return (
                        <Badge key={workType} variant="outline">
                           {formattedType}
                        </Badge>
                     );
                  })}
               </div>
            </div>
         </CardContent>
      </Card>
   );
};