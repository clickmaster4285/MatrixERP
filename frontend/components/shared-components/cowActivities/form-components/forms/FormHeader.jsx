'use client';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, TowerControl, Save, Loader2 } from 'lucide-react';

export const FormHeader = ({
   isEditing = false,
   isSubmitting = false,
   onCancel,
}) => {
   return (
      <div className="sticky top-0 z-10 bg-white border-b">
         <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon" onClick={onCancel} className="hover:bg-gray-100 border">
                     <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-primary/10 rounded-lg">
                        <TowerControl className="h-6 w-6 text-primary" />
                     </div>
                     <div>
                        <h1 className="text-xl font-bold text-gray-900">
                           {isEditing ? 'Edit COW Activity' : 'Create New COW Activity'}
                        </h1>
                        <p className="text-sm text-gray-600">
                           {isEditing
                              ? 'Update your Cell on Wheels deployment details'
                              : 'Configure a new Cell on Wheels deployment activity'
                           }
                        </p>
                     </div>
                  </div>
               </div>

               <div className="flex items-center gap-3">
                  <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
                     Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
                     {isSubmitting ? (
                        <>
                           <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                           {isEditing ? 'Updating...' : 'Creating...'}
                        </>
                     ) : (
                        <>
                           <Save className="h-4 w-4 mr-2" />
                           {isEditing ? 'Update Activity' : 'Create Activity'}
                        </>
                     )}
                  </Button>
               </div>
            </div>
         </div>
      </div>
   );
};