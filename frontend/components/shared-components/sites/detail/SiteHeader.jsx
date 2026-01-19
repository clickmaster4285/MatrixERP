// components/shared-components/sites/detail/SiteHeader.jsx
'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

const SiteHeader = ({ site, onEdit, onDelete, isDeleting }) => {
   const router = useRouter();

   const getStatusColor = (status) => {
      switch (status?.toLowerCase()) {
         case 'completed':
         case 'commissioned':
         case 'planned':
            return 'bg-green-100 text-green-800';
         case 'in-progress':
         case 'dispatching':
         case 'active':
            return 'bg-blue-100 text-blue-800';
         case 'pending':
         case 'draft':
            return 'bg-yellow-100 text-yellow-800';
         case 'not-started':
            return 'bg-gray-100 text-gray-800';
         case 'cancelled':
         case 'failed':
            return 'bg-red-100 text-red-800';
         default:
            return 'bg-gray-100 text-gray-800';
      }
   };

   const getStatusIcon = (status) => {
      switch (status?.toLowerCase()) {
         case 'completed':
            return <CheckCircle className="h-4 w-4" />;
         case 'in-progress':
            return <Clock className="h-4 w-4" />;
         case 'pending':
            return <Clock className="h-4 w-4" />;
         default:
            return <AlertCircle className="h-4 w-4" />;
      }
   };

   return (
      <>
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
               <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/admin/sites')}
                  className="gap-2"
               >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Sites
               </Button>
               <div>
                  <h1 className="text-2xl md:text-3xl font-bold">{site.name}</h1>
               </div>
            </div>
            <div className="flex gap-2 justify-between">
               <div className="">
                  <Badge className={`px-3 py-1 text-sm font-medium ${getStatusColor(site.overallStatus)}`}>
                     {getStatusIcon(site.overallStatus)}
                     <span className="ml-1">{site.overallStatus || 'No Status'}</span>
                  </Badge>
               </div>
               <div className="">
               <Button
                  variant="outline"
                  onClick={onEdit}
                  className="gap-2"
               >
                  <Edit className="h-4 w-4" />
                  Edit Site
               </Button>
               <Button
                  variant="destructive"
                  onClick={onDelete}
                  disabled={isDeleting}
               >
                  {isDeleting ? 'Deleting...' : 'Delete Site'}
               </Button>
               </div>
            </div>
         </div>

        
      </>
   );
};

export default SiteHeader;