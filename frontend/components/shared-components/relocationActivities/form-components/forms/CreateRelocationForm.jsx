// components/shared-components/relocationActivities/form-components/forms/CreateRelocationForm.jsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { FormHeader } from './FormHeader';
import { BasicInfoSection } from './BasicInfoSection';
import { SiteWorkSection } from './SiteWorkSection';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const STEPS = [
   { id: 'basic', label: 'Basic Information', icon: 'Basic' },
   { id: 'source', label: 'Source Site', icon: 'Source' },
   { id: 'destination', label: 'Destination Site', icon: 'Destination' },
   { id: 'review', label: 'Review & Submit', icon: 'Submit' },
];

// Helper function to transform work type keys
const transformWorkTypeForDisplay = (workType) => {
   // For display: store_operator → storeOperator
   return workType === 'store_operator' ? 'storeOperator' : workType;
};

const INITIAL_FORM_DATA = {
   siteId: '',
   relocationType: 'B2S',
   overallStatus: 'draft',
   notes: '',
   sourceSite: {
      siteRequired: true,
      address: { street: '', city: '', state: '' },
      operatorName: '',
      siteStatus: 'not-started',
      workTypes: [],
      surveyWork: { required: false, status: 'not-started', assignedUsers: [], notes: '' },
      dismantlingWork: { required: false, status: 'not-started', assignedUsers: [], notes: '' },
      storeOperatorWork: { required: false, status: 'not-started', assignedUsers: [], notes: '' }, // Keep camelCase for frontend
   },
   destinationSite: {
      siteRequired: true,
      address: { street: '', city: '', state: '' },
      operatorName: '',
      siteStatus: 'not-started',
      workTypes: [],
      civilWork: { required: false, status: 'not-started', assignedUsers: [], notes: '' },
      telecomWork: { required: false, status: 'not-started', assignedUsers: [], notes: '' },
   },
};

export const CreateRelocationForm = ({
   activity = null,
   onSubmit,
   onCancel,
   sites = [],
   users = [],
   isEditing = false,
   isLoading = false,
}) => {
   const [formData, setFormData] = useState(INITIAL_FORM_DATA);
   const [errors, setErrors] = useState({});
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [currentStep, setCurrentStep] = useState(0);
   const [hasInitialized, setHasInitialized] = useState(false);
   const formRef = useRef(null);

   // Initialize form with activity data
   useEffect(() => {
      if (activity && !hasInitialized) {
         // Transform backend data to frontend format
         const transformedActivity = { ...activity };

         // Transform work types from backend (store_operator) to frontend (storeOperator)
         if (transformedActivity.sourceSite?.workTypes) {
            transformedActivity.sourceSite.workTypes = transformedActivity.sourceSite.workTypes.map(type =>
               type === 'store_operator' ? 'storeOperator' : type
            );
         }

         if (transformedActivity.destinationSite?.workTypes) {
            transformedActivity.destinationSite.workTypes = transformedActivity.destinationSite.workTypes.map(type =>
               type === 'store_operator' ? 'storeOperator' : type
            );
         }

         // Merge with initial form structure
         const mergedData = {
            ...INITIAL_FORM_DATA,
            ...transformedActivity,
            // Ensure nested structures exist
            sourceSite: {
               ...INITIAL_FORM_DATA.sourceSite,
               ...transformedActivity.sourceSite,
               address: transformedActivity.sourceSite?.address || INITIAL_FORM_DATA.sourceSite.address,
               workTypes: transformedActivity.sourceSite?.workTypes || [],
            },
            destinationSite: {
               ...INITIAL_FORM_DATA.destinationSite,
               ...transformedActivity.destinationSite,
               address: transformedActivity.destinationSite?.address || INITIAL_FORM_DATA.destinationSite.address,
               workTypes: transformedActivity.destinationSite?.workTypes || [],
            },
         };
         setFormData(mergedData);
         setHasInitialized(true);
      } else if (!activity && !isEditing) {
         // Reset for create mode
         setFormData(INITIAL_FORM_DATA);
         setHasInitialized(true);
      }
   }, [activity, isEditing, hasInitialized]);

   const handleChange = (path, value) => {
      setFormData(prev => {
         const keys = path.split('.');
         const last = keys.pop();
         const obj = { ...prev };
         let curr = obj;
         keys.forEach(k => {
            if (!curr[k]) curr[k] = {};
            curr = curr[k] = { ...curr[k] };
         });
         curr[last] = value;
         return obj;
      });
   };

   const getSelectValue = (v) => v || "";

   const validateStep = () => {
      const newErrors = {};

      if (currentStep === 0) {
         if (!formData.siteId) newErrors.siteId = 'Site is required';
         if (!formData.relocationType) newErrors.relocationType = 'Relocation type is required';
      }

      if (currentStep === 1 && formData.sourceSite.siteRequired) {
         if (formData.sourceSite.workTypes.length === 0) {
            newErrors.sourceWorkTypes = 'Select at least one work type for source site';
         }
      }

      if (currentStep === 2 && formData.destinationSite.siteRequired) {
         if (formData.destinationSite.workTypes.length === 0) {
            newErrors.destinationWorkTypes = 'Select at least one work type for destination site';
         }
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
   };

   const next = () => {
      if (validateStep()) {
         if (currentStep < STEPS.length - 1) {
            setCurrentStep(s => s + 1);
         }
      }
   };

   const prev = () => {
      if (currentStep > 0) {
         setCurrentStep(s => s - 1);
      }
   };

   // Transform data for backend submission
   const transformForBackend = (data) => {
      const transformed = { ...data };

      // Transform work types for backend (storeOperator → store_operator)
      if (transformed.sourceSite) {
         transformed.sourceSite = {
            ...transformed.sourceSite,
            workTypes: transformed.sourceSite.workTypes?.map(type =>
               type === 'storeOperator' ? 'store_operator' : type
            ) || [],
         };
      }

      if (transformed.destinationSite) {
         transformed.destinationSite = {
            ...transformed.destinationSite,
            workTypes: transformed.destinationSite.workTypes?.map(type =>
               type === 'storeOperator' ? 'store_operator' : type
            ) || [],
         };
      }

      return transformed;
   };

   const submit = async () => {
      if (validateStep()) {
         setIsSubmitting(true);
         try {
            // Transform data for backend
            const backendData = transformForBackend({
               siteId: formData.siteId,
               relocationType: formData.relocationType,
               overallStatus: formData.overallStatus,
               notes: formData.notes || '',
               sourceSite: {
                  siteRequired: formData.sourceSite.siteRequired,
                  address: formData.sourceSite.address,
                  operatorName: formData.sourceSite.operatorName || '',
                  siteStatus: formData.sourceSite.siteStatus,
                  workTypes: formData.sourceSite.workTypes,
                  // Include work configs for selected work types
                  ...(formData.sourceSite.surveyWork?.required && {
                     surveyWork: formData.sourceSite.surveyWork
                  }),
                  ...(formData.sourceSite.dismantlingWork?.required && {
                     dismantlingWork: formData.sourceSite.dismantlingWork
                  }),
                  ...(formData.sourceSite.storeOperatorWork?.required && {
                     storeOperatorWork: formData.sourceSite.storeOperatorWork
                  }),
               },
               destinationSite: {
                  siteRequired: formData.destinationSite.siteRequired,
                  address: formData.destinationSite.address,
                  operatorName: formData.destinationSite.operatorName || '',
                  siteStatus: formData.destinationSite.siteStatus,
                  workTypes: formData.destinationSite.workTypes,
                  // Include work configs for selected work types
                  ...(formData.destinationSite.civilWork?.required && {
                     civilWork: formData.destinationSite.civilWork
                  }),
                  ...(formData.destinationSite.telecomWork?.required && {
                     telecomWork: formData.destinationSite.telecomWork
                  }),
               },
               materials: []
            });
            await onSubmit(backendData);
            toast.success(isEditing ? "Relocation updated successfully!" : "Relocation created successfully!");
         } catch (err) {
            toast.error("Failed to save relocation");
            console.error('Submit error:', err);
         } finally {
            setIsSubmitting(false);
         }
      }
   };

   if (isLoading || (isEditing && !hasInitialized)) {
      return (
         <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
         </div>
      );
   }

   return (
      <div ref={formRef} className="min-h-screen">
         <FormHeader
            isEditing={isEditing}
            isSubmitting={isSubmitting}
            onCancel={onCancel}
         />

         {/* Progress Bar */}
         <div className="border-b">
            <div className="max-w-7xl mx-auto px-6 py-6">
               <div className="flex items-center justify-between">
                  {STEPS.map((s, i) => (
                     <div key={i} className="flex items-center flex-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${i <= currentStep ? 'bg-primary' : 'bg-gray-300'}`}>
                           {i < currentStep ? <CheckCircle className="h-6 w-6" /> : i + 1}
                        </div>
                        <span className="ml-3 hidden md:block font-medium">{s.label}</span>
                        {i < STEPS.length - 1 && <div className={`flex-1 h-1 mx-4 ${i < currentStep ? 'bg-primary' : 'bg-gray-300'}`} />}
                     </div>
                  ))}
               </div>
            </div>
         </div>

         <div className="mx-auto px-6 py-8 max-w-6xl">
            <form onSubmit={e => e.preventDefault()}>
               {/* Step 1: Basic Info */}
               {currentStep === 0 && (
                  <BasicInfoSection
                     formData={formData}
                     errors={errors}
                     sites={sites}
                     onChange={handleChange}
                     getSelectValue={getSelectValue}
                  />
               )}

               {/* Step 2: Source Site */}
               {currentStep === 1 && (
                  <SiteWorkSection
                     siteType="source"
                     formData={formData}
                     sites={sites}
                     users={users}
                     onChange={handleChange}
                     getSelectValue={getSelectValue}
                  />
               )}

               {/* Step 3: Destination Site */}
               {currentStep === 2 && (
                  <SiteWorkSection
                     siteType="destination"
                     formData={formData}
                     sites={sites}
                     users={users}
                     onChange={handleChange}
                     getSelectValue={getSelectValue}
                  />
               )}

               {/* Step 4: Review */}
               {currentStep === 3 && (
                  <div className="space-y-6">
                     <div className="text-center py-8 bg-green-50 rounded-xl border border-green-200">
                        <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800">Review & Submit</h2>
                        <p className="text-gray-600 mt-2">Review the configuration below before submitting</p>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="border rounded-lg p-4">
                           <h3 className="font-semibold mb-3">Basic Information</h3>
                           <div className="space-y-2 text-sm">
                              <p><span className="font-medium">Site:</span> {sites.find(s => s._id === formData.siteId)?.name || 'N/A'}</p>
                              <p><span className="font-medium">Type:</span> {formData.relocationType}</p>
                              <p><span className="font-medium">Status:</span> {formData.overallStatus}</p>
                              {formData.notes && (
                                 <p><span className="font-medium">Notes:</span> {formData.notes}</p>
                              )}
                           </div>
                        </div>

                        <div className="border rounded-lg p-4">
                           <h3 className="font-semibold mb-3">Sites Configuration</h3>
                           <div className="space-y-2 text-sm">
                              <p><span className="font-medium">Source Site:</span> {formData.sourceSite.siteRequired ? 'Configured' : 'Skipped'}</p>
                              <p><span className="font-medium">Work Types:</span> {(formData.sourceSite.workTypes || []).map(type => transformWorkTypeForDisplay(type)).join(', ') || 'None'}</p>
                              <p><span className="font-medium">Address:</span> {formData.sourceSite.address ? `${formData.sourceSite.address.street}, ${formData.sourceSite.address.city}, ${formData.sourceSite.address.state}` : 'N/A'}</p>
                              <p><span className="font-medium">Destination Site:</span> {formData.destinationSite.siteRequired ? 'Configured' : 'Skipped'}</p>
                              <p><span className="font-medium">Work Types:</span> {(formData.destinationSite.workTypes || []).map(type => transformWorkTypeForDisplay(type)).join(', ') || 'None'}</p>
                              <p><span className="font-medium">Address:</span> {formData.destinationSite.address ? `${formData.destinationSite.address.street}, ${formData.destinationSite.address.city}, ${formData.destinationSite.address.state}` : 'N/A'}</p>
                           </div>
                        </div>
                     </div>
                  </div>
               )}

               {/* Navigation */}
               <div className="flex justify-between mt-12 pt-8 border-t">
                  <Button variant="outline" onClick={onCancel}>
                     Cancel
                  </Button>
                  <div className="flex gap-4">
                     {currentStep > 0 && (
                        <Button variant="outline" onClick={prev}>
                           <ChevronLeft className="h-4 w-4 mr-2" />
                           Previous
                        </Button>
                     )}
                     {currentStep < 3 ? (
                        <Button onClick={next} className="bg-primary hover:bg-primary/80">
                           Next
                           <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                     ) : (
                        <Button
                           onClick={submit}
                           disabled={isSubmitting}
                           className="bg-green-600 hover:bg-green-700 px-10"
                        >
                           {isSubmitting ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update Activity" : "Create Activity")}
                        </Button>
                     )}
                  </div>
               </div>
            </form>
         </div>
      </div>
   );
};