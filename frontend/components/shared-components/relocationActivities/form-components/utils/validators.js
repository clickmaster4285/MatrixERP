// components/shared-components/relocation/utils/validators.js
export const validateRelocationForm = (formData) => {
   const errors = {};

   if (!formData.siteId) {
      errors.siteId = 'Parent Site is required';
   }

   if (!formData.relocationType) {
      errors.relocationType = 'Relocation type is required';
   }

   // Validate at least one site is required
   if (!formData.sourceSite?.siteRequired && !formData.destinationSite?.siteRequired) {
      errors.general = 'At least one site (source or destination) must be configured';
   }

   // Validate source site if required
   if (formData.sourceSite?.siteRequired) {
      if (!formData.sourceSite.address?.city) {
         errors['sourceSite.address.city'] = 'City is required for source site';
      }
      if (formData.sourceSite.workTypes?.length === 0) {
         errors['sourceSite.workTypes'] = 'Select at least one work type for source site';
      }
   }

   // Validate destination site if required
   if (formData.destinationSite?.siteRequired) {
      if (!formData.destinationSite.address?.city) {
         errors['destinationSite.address.city'] = 'City is required for destination site';
      }
      if (formData.destinationSite.workTypes?.length === 0) {
         errors['destinationSite.workTypes'] = 'Select at least one work type for destination site';
      }
   }

   return {
      isValid: Object.keys(errors).length === 0,
      errors,
   };
};

// Validate site work configuration
export const validateSiteWork = (site, isSource = false) => {
   const errors = {};

   if (site.siteRequired) {
      if (!site.siteId && !site.address?.city) {
         errors.address = `${isSource ? 'Source' : 'Destination'} site requires either existing site selection or address`;
      }

      if (site.workTypes?.length === 0) {
         errors.workTypes = 'Select at least one work type';
      }

      // Validate each selected work type
      site.workTypes?.forEach(workType => {
         const workField = `${workType}Work`;
         if (site[workField]?.required) {
            // Add specific validations for each work type
            if (workType === 'civil' && site[workField]?.materials?.length === 0) {
               errors[`${workType}Materials`] = 'Civil work requires at least one material';
            }
            if (workType === 'te' && site[workField]?.towerRequired && !site[workField]?.towerHeight) {
               errors[`${workType}TowerHeight`] = 'Tower height is required';
            }
         }
      });
   }

   return errors;
};