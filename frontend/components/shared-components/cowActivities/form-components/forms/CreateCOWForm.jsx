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

const INITIAL_FORM_DATA = {
   activityName: '',
   siteId: '',
   purpose: 'event-coverage',
   description: '',
   plannedStartDate: '',
   plannedEndDate: '',
   notes: '',
   overallStatus: 'planned',
   teamMembers: [],
   sourceSite: {
      location: {
         name: '',
         address: { street: '', city: '', state: '' },
         type: 'source'
      },
      workTypes: [],
      siteStatus: 'not-started',
      surveyWork: { required: false, status: 'not-started', assignedUsers: [], notes: '' },
      inventoryWork: { required: false, status: 'not-started', assignedUsers: [], notes: '' },
      transportationWork: { required: false, status: 'not-started', assignedUsers: [], notes: '', vehicleNumber: '', driverName: '', driverContact: '' },
      installationWork: { required: false, status: 'not-started', assignedUsers: [], notes: '', equipmentInstalled: [] },
   },
   destinationSite: {
      location: {
         name: '',
         address: { street: '', city: '', state: '' },
         type: 'destination'
      },
      workTypes: [],
      siteStatus: 'not-started',
      surveyWork: { required: false, status: 'not-started', assignedUsers: [], notes: '' },
      inventoryWork: { required: false, status: 'not-started', assignedUsers: [], notes: '' },
      transportationWork: { required: false, status: 'not-started', assignedUsers: [], notes: '', vehicleNumber: '', driverName: '', driverContact: '' },
      installationWork: { required: false, status: 'not-started', assignedUsers: [], notes: '', equipmentInstalled: [] },
   },
};

export const CreateCOWForm = ({
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

   useEffect(() => {
      if (activity && !hasInitialized) {
         const mergedData = {
            ...INITIAL_FORM_DATA,
            ...activity,
            sourceSite: {
               ...INITIAL_FORM_DATA.sourceSite,
               ...activity.sourceSite,
               location: activity.sourceSite?.location || INITIAL_FORM_DATA.sourceSite.location,
               workTypes: activity.sourceSite?.workTypes || [],
            },
            destinationSite: {
               ...INITIAL_FORM_DATA.destinationSite,
               ...activity.destinationSite,
               location: activity.destinationSite?.location || INITIAL_FORM_DATA.destinationSite.location,
               workTypes: activity.destinationSite?.workTypes || [],
            },
         };
         setFormData(mergedData);
         setHasInitialized(true);
      } else if (!activity && !isEditing) {
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

   const validateStep = () => {
      const newErrors = {};

      if (currentStep === 0) {
         if (!formData.activityName?.trim()) newErrors.activityName = 'Activity name is required';
         if (!formData.siteId) newErrors.siteId = 'Site is required';
         if (!formData.purpose) newErrors.purpose = 'Purpose is required';
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

   const submit = async () => {
      if (validateStep()) {
         setIsSubmitting(true);
         try {
            const submitData = {
               activityName: formData.activityName,
               siteId: formData.siteId,
               purpose: formData.purpose,
               description: formData.description,
               plannedStartDate: formData.plannedStartDate,
               plannedEndDate: formData.plannedEndDate,
               notes: formData.notes,
               overallStatus: formData.overallStatus,
               teamMembers: formData.teamMembers,
               sourceSite: {
                  location: formData.sourceSite.location,
                  workTypes: formData.sourceSite.workTypes,
                  ...(formData.sourceSite.workTypes.includes('survey') && { surveyWork: formData.sourceSite.surveyWork }),
                  ...(formData.sourceSite.workTypes.includes('inventory') && { inventoryWork: formData.sourceSite.inventoryWork }),
                  ...(formData.sourceSite.workTypes.includes('transportation') && { transportationWork: formData.sourceSite.transportationWork }),
                  ...(formData.sourceSite.workTypes.includes('installation') && { installationWork: formData.sourceSite.installationWork }),
               },
               destinationSite: {
                  location: formData.destinationSite.location,
                  workTypes: formData.destinationSite.workTypes,
                  ...(formData.destinationSite.workTypes.includes('survey') && { surveyWork: formData.destinationSite.surveyWork }),
                  ...(formData.destinationSite.workTypes.includes('inventory') && { inventoryWork: formData.destinationSite.inventoryWork }),
                  ...(formData.destinationSite.workTypes.includes('transportation') && { transportationWork: formData.destinationSite.transportationWork }),
                  ...(formData.destinationSite.workTypes.includes('installation') && { installationWork: formData.destinationSite.installationWork }),
               },
            };

            await onSubmit(submitData);
            toast.success(isEditing ? "COW activity updated!" : "COW activity created!");
         } catch (err) {
            toast.error("Failed to save COW activity");
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
               {currentStep === 0 && (
                  <BasicInfoSection
                     formData={formData}
                     errors={errors}
                     sites={sites}
                     onChange={handleChange}
                  />
               )}

               {currentStep === 1 && (
                  <SiteWorkSection
                     siteType="source"
                     formData={formData}
                     sites={sites}
                     users={users}
                     onChange={handleChange}
                  />
               )}

               {currentStep === 2 && (
                  <SiteWorkSection
                     siteType="destination"
                     formData={formData}
                     sites={sites}
                     users={users}
                     onChange={handleChange}
                  />
               )}

               {currentStep === 3 && (
                  <div className="space-y-6">
                     <div className="text-center py-8 bg-emerald-50 rounded-xl border border-emerald-200">
                        <CheckCircle className="h-16 w-16 text-emerald-600 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800">Review & Submit</h2>
                        <p className="text-gray-600 mt-2">Review the configuration below before submitting</p>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="border rounded-lg p-4">
                           <h3 className="font-semibold mb-3">Basic Information</h3>
                           <div className="space-y-2 text-sm">
                              <p><span className="font-medium">Activity:</span> {formData.activityName}</p>
                              <p><span className="font-medium">Site:</span> {sites.find(s => s.value === formData.siteId)?.label || 'N/A'}</p>
                              <p><span className="font-medium">Purpose:</span> {formData.purpose.replace('-', ' ')}</p>
                              <p><span className="font-medium">Status:</span> {formData.overallStatus}</p>
                              {formData.description && <p><span className="font-medium">Description:</span> {formData.description}</p>}
                           </div>
                        </div>

                        <div className="border rounded-lg p-4">
                           <h3 className="font-semibold mb-3">Sites Configuration</h3>
                           <div className="space-y-2 text-sm">
                              <p><span className="font-medium">Source Site:</span> {formData.sourceSite.location.name || 'Not specified'}</p>
                              <p><span className="font-medium">Work Types:</span> {formData.sourceSite.workTypes.join(', ') || 'None'}</p>
                              <p><span className="font-medium">Destination Site:</span> {formData.destinationSite.location.name || 'Not specified'}</p>
                              <p><span className="font-medium">Work Types:</span> {formData.destinationSite.workTypes.join(', ') || 'None'}</p>
                           </div>
                        </div>
                     </div>
                  </div>
               )}

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
                           className="bg-emerald-600 hover:bg-emerald-700 px-10"
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