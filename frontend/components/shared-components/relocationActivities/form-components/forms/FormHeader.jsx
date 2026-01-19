'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Clock, Edit } from 'lucide-react';

export const FormHeader = ({
   isEditing = false,
   isSubmitting = false,
   onCancel,
}) => {
   return (
      <div className="bg-white border-b shadow-sm">
         <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
               <div className="flex items-center space-x-4">
                  <Button
                     variant="outline"
                     size="icon"
                     onClick={onCancel}
                     className="h-10 w-10"
                  >
                     <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div className="flex items-center gap-3">
                     <div className={`p-2 rounded-lg ${isEditing ? 'bg-sky-100 text-sky-600' : 'bg-green-100 text-green-600'}`}>
                        {isEditing ? (
                           <Edit className="h-6 w-6" />
                        ) : (
                           <Clock className="h-6 w-6" />
                        )}
                     </div>
                     <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                           {isEditing ? 'Edit Relocation Activity' : 'Create New Relocation Activity'}
                        </h1>
                        <p className="text-gray-600 mt-1">
                           {isEditing
                              ? 'Update all details of the relocation activity'
                              : 'Fill in all required details to create a new relocation activity'
                           }
                        </p>
                     </div>
                  </div>
               </div>

               <div className="flex items-center space-x-3">
                  {isSubmitting && (
                     <div className="flex items-center text-sm text-gray-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sky-600 mr-2"></div>
                        {isEditing ? 'Saving...' : 'Creating...'}
                     </div>
                  )}
               </div>
            </div>
         </div>
      </div>
   );
};