'use client';

import { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { useGetProjects, useGetProject } from '@/features/projectApi'; // Added useGetProject
import { useUsers } from '@/features/userApi';

export default function SiteForm({
   onSubmit,
   onNext,
   initialData,
   submitLabel = 'Save Site',
   isLoading = false,
   showNextButton = false,
   projectId = null, // NEW: Add projectId prop
   onOpenChange = null, // NEW: For dialog close
}) {
   // Fetch specific project if projectId is provided
   const { data: specificProject, isLoading: isSpecificProjectLoading } = useGetProject(
      projectId,
      { enabled: !!projectId } // Only fetch if projectId exists
   );

   // Projects for dropdown (if no projectId)
   const { data: projectsRes, isLoading: isProjectsLoading } = useGetProjects();

   // Get projects list based on whether projectId is provided
   const projects = useMemo(() => {
      if (projectId && specificProject?.data) {
         // If projectId is provided, return array with only that project
         return [specificProject.data];
      }
      return projectsRes?.data || projectsRes?.projects || [];
   }, [projectId, specificProject, projectsRes]);

   // Users → managers list for dropdown
   const { data: usersRes, isLoading: isUsersLoading } = useUsers();

   // Normalize users shape
   const users = useMemo(() => {
      if (!usersRes) return [];
      if (Array.isArray(usersRes)) return usersRes;
      if (Array.isArray(usersRes.data)) return usersRes.data;
      if (Array.isArray(usersRes.users)) return usersRes.users;
      return [];
   }, [usersRes]);

   const managers = useMemo(
      () => users.filter((u) => u.role === 'project-manager'),
      [users]
   );

   const [formData, setFormData] = useState({
      name: '',
      siteId: '',
      project: projectId || '', // Initialize with projectId if provided
      region: '',
      siteManager: '',
      description: '',
   });

   const [isFormReady, setIsFormReady] = useState(!initialData);

   // -------- Prefill for edit or when projectId is provided --------
   useEffect(() => {
      if (projectId) {
         // Set project from projectId
         setFormData(prev => ({
            ...prev,
            project: projectId,
         }));

         // If we have the specific project data, set site manager from project manager
         if (specificProject?.data?.manager) {
            setFormData(prev => ({
               ...prev,
               siteManager: specificProject.data.manager._id || specificProject.data.manager,
            }));
         }
      }

      if (!initialData) {
         setIsFormReady(true);
         return;
      }

      const hasProjects = projects.length > 0;
      const hasManagers = managers.length > 0;

      if (hasProjects && hasManagers) {
         setFormData({
            name: initialData.name || '',
            siteId: initialData.siteId || '',
            project:
               initialData.project?._id?.toString() || initialData.project || '',
            region: initialData.region || '',
            siteManager:
               initialData.siteManager?._id?.toString() ||
               initialData.siteManager ||
               '',
            description: initialData.notes || '',
         });

         setIsFormReady(true);
      }
   }, [initialData, projects, managers, projectId, specificProject]);

   const updateField = (field, value) => {
      setFormData((prev) => ({
         ...prev,
         [field]: value,
      }));
   };

   const handleProjectChange = (value) => {
      const selectedProject = projects.find((p) => p._id === value);

      setFormData((prev) => ({
         ...prev,
         project: value,
         siteManager: selectedProject?.manager?._id || prev.siteManager,
      }));
   };

   // -------- Validation --------
   const validateForm = () => {
      const missing = [];

      if (!formData.name) missing.push('Name');
      if (!formData.siteId) missing.push('Site ID');
      if (!formData.region) missing.push('Region');
      if (!formData.project) missing.push('Project');
      if (!formData.siteManager) missing.push('Site Manager');

      if (missing.length > 0) {
         toast.error('Missing Required Fields', {
            description: missing.join(', '),
         });
         return false;
      }

      return true;
   };

   // -------- Submit Handler (Create Site Only) --------
   const handleSubmit = (e) => {
      e.preventDefault();

      if (!validateForm()) return;

      const payload = {
         name: formData.name,
         siteId: formData.siteId,
         region: formData.region,
         project: formData.project,
         siteManager: formData.siteManager,
         notes: formData.description || '',
      };

      onSubmit?.(payload);
   };

   // -------- Next Button Handler (Create Site & Add Activity) --------
   const handleNext = () => {
      if (!validateForm()) return;

      const payload = {
         name: formData.name,
         siteId: formData.siteId,
         region: formData.region,
         project: formData.project,
         siteManager: formData.siteManager,
         notes: formData.description || '',
      };

      // Call onNext if provided, otherwise fall back to onSubmit
      if (onNext) {
         onNext(payload);
      } else {
         onSubmit?.(payload);
      }
   };

   // Show loading while fetching project data
   if (projectId && isSpecificProjectLoading) {
      return (
         <div className="flex items-center justify-center p-8">
            <div className="text-center">
               <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
               <p className="text-sm text-gray-500">Loading project data...</p>
            </div>
         </div>
      );
   }

   if (initialData && !isFormReady) {
      return (
         <div className="flex items-center justify-center p-8">
            <div className="text-center">
               <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
               <p className="text-sm text-gray-500">Loading form data...</p>
            </div>
         </div>
      );
   }

   return (
      <form className="space-y-6" onSubmit={handleSubmit}>
         {/* Show project info if projectId is provided */}
         {projectId && specificProject?.data && (
            <div className="p-4 bg-linear-to-r from-sky-50 to-emerald-50 rounded-lg mb-4">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-sky-100 rounded-lg">
                     <svg
                        className="h-5 w-5 text-sky-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                     >
                        <path
                           strokeLinecap="round"
                           strokeLinejoin="round"
                           strokeWidth={2}
                           d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                     </svg>
                  </div>
                  <div>
                     <h4 className="font-semibold text-sky-800">
                        Creating Site for: {specificProject.data.name}
                     </h4>
                     <p className="text-sky-600 text-sm">
                        Site will be automatically added to this project
                     </p>
                  </div>
               </div>
            </div>
         )}

         {/* BASIC INFO */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
               <Label>Name *</Label>
               <Input
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="e.g. Market Tower B2S"
               />
            </div>

            <div>
               <Label>Site ID *</Label>
               <Input
                  value={formData.siteId}
                  onChange={(e) => updateField('siteId', e.target.value)}
                  placeholder="e.g. MT-B2S-001"
               />
            </div>

            <div>
               <Label>Region *</Label>
               <Input
                  value={formData.region}
                  onChange={(e) => updateField('region', e.target.value)}
                  placeholder="e.g. North, South, Central"
               />
            </div>

            <div>
               <Label>Project *</Label>
               <Select
                  value={formData.project}
                  onValueChange={handleProjectChange}
                  disabled={isProjectsLoading || !!projectId} // Disable if projectId is provided
               >
                  <SelectTrigger>
                     <SelectValue placeholder="Select project">
                        {formData.project &&
                           projects.find((p) => p._id === formData.project)?.name}
                     </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                     {projects.map((project) => (
                        <SelectItem key={project._id} value={project._id}>
                           {project.name}
                        </SelectItem>
                     ))}
                  </SelectContent>
               </Select>
               {projectId && (
                  <p className="text-sm text-slate-500 mt-1">
                     Project is pre-selected and cannot be changed
                  </p>
               )}
            </div>

            <div>
               <Label>Site Manager *</Label>
               <Select
                  value={formData.siteManager}
                  onValueChange={(value) => updateField('siteManager', value)}
                  disabled={isUsersLoading}
               >
                  <SelectTrigger>
                     <SelectValue placeholder="Select site manager">
                        {formData.siteManager &&
                           managers.find((m) => m._id === formData.siteManager)?.name}
                     </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                     {managers.length > 0 ? (
                        managers.map((manager) => (
                           <SelectItem key={manager._id} value={manager._id}>
                              {manager.name} ({manager.role})
                           </SelectItem>
                        ))
                     ) : (
                        <SelectItem value="none" disabled>
                           No managers found
                        </SelectItem>
                     )}
                  </SelectContent>
               </Select>
               {projectId && specificProject?.data?.manager && (
                  <p className="text-sm text-slate-500 mt-1">
                     Default: {specificProject.data.manager.name}
                  </p>
               )}
            </div>
         </div>

         <div>
            <Label>Description</Label>
            <Textarea
               value={formData.description}
               onChange={(e) => updateField('description', e.target.value)}
               placeholder="Optional notes"
               rows={3}
            />
         </div>

         {/* BUTTONS */}
         <div className="flex justify-end gap-4">
            <Button
               type="button"
               variant="outline"
               onClick={() => {
                  // If we're in a dialog, close it; otherwise go back
                  if (onOpenChange) {
                     onOpenChange(false);
                  } else {
                     window.history.back();
                  }
               }}
            >
               Cancel
            </Button>

            {showNextButton ? (
               <>
                  <Button type="submit" disabled={isLoading}>
                     {isLoading ? 'Creating...' : submitLabel || 'Create Site Only'}
                  </Button>
               </>
            ) : (
               <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-sky-600 hover:bg-sky-700"
               >
                  {isLoading ? 'Saving...' : submitLabel}
               </Button>
            )}
         </div>
      </form>
   );
}