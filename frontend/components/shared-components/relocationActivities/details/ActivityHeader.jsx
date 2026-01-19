import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Edit, Trash2, Calendar, Building2 } from 'lucide-react';
import { formatDate } from '@/components/shared-components/relocationActivities/form-components/utils/formatters';
import { Card, CardContent } from '@/components/ui/card';

export const ActivityHeader = ({
   activity,
   onBack,
   onEdit,
   onDelete
}) => {
   const getStatusColor = (status) => {
      switch (status) {
         case 'active': return 'bg-sky-100 text-sky-800 border-sky-200';
         case 'completed': return 'bg-green-100 text-green-800 border-green-200';
         case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
         default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
   };

   const getRelocationTypeColor = (type) => {
      switch (type) {
         case 'B2S': return 'bg-sky-100 text-sky-800 border-sky-200';
         case 'OMO': return 'bg-green-100 text-green-800 border-green-200';
         case 'StandAlone': return 'bg-purple-100 text-purple-800 border-purple-200';
         default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
   };

   return (
      <>
         {/* Header */}
         <div className="bg-white border-b shadow-sm">
            <div className="max-w-7xl mx-auto px-6 py-6">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Back
                     </Button>
                     <div>
                        <h1 className="text-2xl font-bold text-gray-900">Relocation Activity Details</h1>
                        <p className="text-gray-600 mt-1">
                           {activity.siteId?.name || 'Unknown Site'} • {formatDate(activity.createdAt)}
                        </p>
                     </div>
                  </div>
                  <div className="flex gap-3">
                     <Button variant="outline" onClick={onEdit} className="gap-2">
                        <Edit className="w-4 h-4" />
                        Edit
                     </Button>
                     <Button variant="destructive" onClick={onDelete} className="gap-2">
                        <Trash2 className="w-4 h-4" />
                        Delete
                     </Button>
                  </div>
               </div>
            </div>
         </div>

         {/* Basic Info Card */}
         <Card className="mb-6">
            <CardContent className="p-6">
               <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                     <div className="p-3 rounded-lg bg-sky-100">
                        <Building2 className="w-6 h-6 text-sky-600" />
                     </div>
                     <div>
                        <h2 className="text-xl font-bold text-gray-900">
                           {activity.siteId?.name || 'Unknown Site'}
                        </h2>
                        <p className="text-gray-600">
                           Site ID: {activity.siteId?.siteId} • Region: {activity.siteId?.region}
                        </p>
                     </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                     <Badge className={getRelocationTypeColor(activity.relocationType)}>
                        {activity.relocationType}
                     </Badge>
                     <Badge className={getStatusColor(activity.overallStatus)}>
                        {activity.overallStatus}
                     </Badge>
                  </div>
               </div>

               <Separator className="my-4" />

               <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                     <h3 className="font-medium text-gray-900 mb-2">Created</h3>
                     <p className="text-gray-600 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {formatDate(activity.createdAt)}
                     </p>
                  </div>
                  <div>
                     <h3 className="font-medium text-gray-900 mb-2">Last Updated</h3>
                     <p className="text-gray-600">{formatDate(activity.updatedAt)}</p>
                  </div>
                  <div>
                     <h3 className="font-medium text-gray-900 mb-2">Created By</h3>
                     <p className="text-gray-600">{activity.createdBy?.name || 'Unknown'}</p>
                  </div>
                  <div>
                     <h3 className="font-medium text-gray-900 mb-2">Updated By</h3>
                     <p className="text-gray-600">{activity.updatedBy?.name || 'Unknown'}</p>
                  </div>
               </div>
            </CardContent>
         </Card>
      </>
   );
};