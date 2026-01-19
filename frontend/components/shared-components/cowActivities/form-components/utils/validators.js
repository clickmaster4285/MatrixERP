/**
 * Validate activity name
 */
export const validateActivityName = (name) => {
   if (!name || name.trim().length === 0) {
      return { isValid: false, message: 'Activity name is required' };
   }
   if (name.trim().length < 3) {
      return { isValid: false, message: 'Activity name must be at least 3 characters' };
   }
   if (name.trim().length > 100) {
      return { isValid: false, message: 'Activity name must be less than 100 characters' };
   }
   return { isValid: true, message: '' };
};

/**
 * Validate site selection
 */
export const validateSiteId = (siteId) => {
   if (!siteId || siteId.trim().length === 0) {
      return { isValid: false, message: 'Site selection is required' };
   }
   return { isValid: true, message: '' };
};

/**
 * Validate purpose selection
 */
export const validatePurpose = (purpose) => {
   const validPurposes = ['event-coverage', 'disaster-recovery', 'network-expansion', 'maintenance', 'testing', 'other'];
   if (!purpose || !validPurposes.includes(purpose)) {
      return { isValid: false, message: 'Valid purpose selection is required' };
   }
   return { isValid: true, message: '' };
};

/**
 * Validate dates
 */
export const validateDates = (startDate, endDate) => {
   const errors = [];

   if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start > end) {
         errors.push('End date must be after start date');
      }

      if (start < new Date()) {
         errors.push('Start date cannot be in the past');
      }
   }

   return {
      isValid: errors.length === 0,
      messages: errors
   };
};

/**
 * Validate work types selection
 */
export const validateWorkTypes = (workTypes, siteType) => {
   if (!workTypes || workTypes.length === 0) {
      return {
         isValid: false,
         message: `At least one work type must be selected for ${siteType} site`
      };
   }

   const validWorkTypes = ['survey', 'inventory', 'transportation', 'installation'];
   const invalidTypes = workTypes.filter(type => !validWorkTypes.includes(type));

   if (invalidTypes.length > 0) {
      return {
         isValid: false,
         message: `Invalid work types: ${invalidTypes.join(', ')}`
      };
   }

   return { isValid: true, message: '' };
};

/**
 * Validate address
 */
export const validateAddress = (address) => {
   const errors = [];

   if (!address?.street?.trim()) {
      errors.push('Street address is required');
   }

   if (!address?.city?.trim()) {
      errors.push('City is required');
   }

   if (!address?.state?.trim()) {
      errors.push('State is required');
   }

   return {
      isValid: errors.length === 0,
      messages: errors
   };
};

/**
 * Validate assigned users
 */
export const validateAssignedUsers = (users, minUsers = 1) => {
   if (!users || users.length < minUsers) {
      return {
         isValid: false,
         message: `At least ${minUsers} team member${minUsers !== 1 ? 's' : ''} must be assigned`
      };
   }

   // Check for duplicate user assignments
   const userIds = users.map(u => u.userId);
   const uniqueIds = [...new Set(userIds)];

   if (userIds.length !== uniqueIds.length) {
      return {
         isValid: false,
         message: 'Duplicate user assignments found'
      };
   }

   return { isValid: true, message: '' };
};

/**
 * Validate materials
 */
export const validateMaterial = (material) => {
   const errors = [];

   if (!material?.materialCode?.trim()) {
      errors.push('Material code is required');
   }

   if (!material?.name?.trim()) {
      errors.push('Material name is required');
   }

   if (!material?.quantity || material.quantity <= 0) {
      errors.push('Valid quantity is required');
   }

   if (!material?.unit?.trim()) {
      errors.push('Unit is required');
   }

   if (!material?.condition) {
      errors.push('Condition is required');
   }

   return {
      isValid: errors.length === 0,
      messages: errors
   };
};

/**
 * Validate transportation details
 */
export const validateTransportation = (transportation) => {
   const errors = [];

   if (transportation?.status === 'in-transit' || transportation?.status === 'loading' || transportation?.status === 'unloading') {
      if (!transportation?.vehicleNumber?.trim()) {
         errors.push('Vehicle number is required for transportation work');
      }

      if (!transportation?.driverName?.trim()) {
         errors.push('Driver name is required for transportation work');
      }

      if (!transportation?.driverContact?.trim()) {
         errors.push('Driver contact is required for transportation work');
      }
   }

   return {
      isValid: errors.length === 0,
      messages: errors
   };
};

/**
 * Validate complete form
 */
export const validateCOWForm = (formData) => {
   const errors = {};

   // Validate basic info
   const nameValidation = validateActivityName(formData.activityName);
   if (!nameValidation.isValid) errors.activityName = nameValidation.message;

   const siteValidation = validateSiteId(formData.siteId);
   if (!siteValidation.isValid) errors.siteId = siteValidation.message;

   const purposeValidation = validatePurpose(formData.purpose);
   if (!purposeValidation.isValid) errors.purpose = purposeValidation.message;

   // Validate dates
   const dateValidation = validateDates(formData.plannedStartDate, formData.plannedEndDate);
   if (!dateValidation.isValid) {
      errors.dates = dateValidation.messages;
   }

   // Validate source site
   if (formData.sourceSite) {
      const sourceWorkTypesValidation = validateWorkTypes(formData.sourceSite.workTypes, 'source');
      if (!sourceWorkTypesValidation.isValid) errors.sourceWorkTypes = sourceWorkTypesValidation.message;

      const sourceAddressValidation = validateAddress(formData.sourceSite.location?.address);
      if (!sourceAddressValidation.isValid) errors.sourceAddress = sourceAddressValidation.messages;
   }

   // Validate destination site
   if (formData.destinationSite) {
      const destWorkTypesValidation = validateWorkTypes(formData.destinationSite.workTypes, 'destination');
      if (!destWorkTypesValidation.isValid) errors.destinationWorkTypes = destWorkTypesValidation.message;

      const destAddressValidation = validateAddress(formData.destinationSite.location?.address);
      if (!destAddressValidation.isValid) errors.destinationAddress = destAddressValidation.messages;
   }

   return {
      isValid: Object.keys(errors).length === 0,
      errors
   };
};

/**
 * Sanitize form data
 */
export const sanitizeFormData = (formData) => {
   const sanitized = { ...formData };

   // Trim string fields
   if (sanitized.activityName) sanitized.activityName = sanitized.activityName.trim();
   if (sanitized.description) sanitized.description = sanitized.description.trim();
   if (sanitized.notes) sanitized.notes = sanitized.notes.trim();

   // Sanitize addresses
   if (sanitized.sourceSite?.location?.address) {
      const addr = sanitized.sourceSite.location.address;
      if (addr.street) addr.street = addr.street.trim();
      if (addr.city) addr.city = addr.city.trim();
      if (addr.state) addr.state = addr.state.trim();
   }

   if (sanitized.destinationSite?.location?.address) {
      const addr = sanitized.destinationSite.location.address;
      if (addr.street) addr.street = addr.street.trim();
      if (addr.city) addr.city = addr.city.trim();
      if (addr.state) addr.state = addr.state.trim();
   }

   // Ensure arrays
   if (!Array.isArray(sanitized.sourceSite?.workTypes)) {
      sanitized.sourceSite = { ...sanitized.sourceSite, workTypes: [] };
   }

   if (!Array.isArray(sanitized.destinationSite?.workTypes)) {
      sanitized.destinationSite = { ...sanitized.destinationSite, workTypes: [] };
   }

   if (!Array.isArray(sanitized.teamMembers)) {
      sanitized.teamMembers = [];
   }

   return sanitized;
};