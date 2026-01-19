export const COW_ACTIVITY_CONSTANTS = {
   // Purpose options
   PURPOSES: [
      { value: 'event-coverage', label: 'Event Coverage' },
      { value: 'disaster-recovery', label: 'Disaster Recovery' },
      { value: 'network-expansion', label: 'Network Expansion' },
      { value: 'maintenance', label: 'Maintenance' },
      { value: 'testing', label: 'Testing' },
      { value: 'other', label: 'Other' },
   ],

   // Overall status options
   OVERALL_STATUS: [
      { value: 'planned', label: 'Planned', color: 'blue' },
      { value: 'in-progress', label: 'In Progress', color: 'yellow' },
      { value: 'completed', label: 'Completed', color: 'green' },
      { value: 'cancelled', label: 'Cancelled', color: 'red' },
      { value: 'on-hold', label: 'On Hold', color: 'gray' },
   ],

   // Work types
   WORK_TYPES: [
      { value: 'survey', label: 'Survey', icon: '📋' },
      { value: 'inventory', label: 'Inventory', icon: '📦' },
      { value: 'transportation', label: 'Transportation', icon: '🚚' },
      { value: 'installation', label: 'Installation', icon: '🔧' },
   ],

   // Work status options
   WORK_STATUS: {
      survey: [
         { value: 'not-started', label: 'Not Started' },
         { value: 'in-progress', label: 'In Progress' },
         { value: 'completed', label: 'Completed' },
      ],
      inventory: [
         { value: 'not-started', label: 'Not Started' },
         { value: 'in-progress', label: 'In Progress' },
         { value: 'completed', label: 'Completed' },
      ],
      transportation: [
         { value: 'not-started', label: 'Not Started' },
         { value: 'loading', label: 'Loading' },
         { value: 'in-transit', label: 'In Transit' },
         { value: 'unloading', label: 'Unloading' },
         { value: 'completed', label: 'Completed' },
      ],
      installation: [
         { value: 'not-started', label: 'Not Started' },
         { value: 'in-progress', label: 'In Progress' },
         { value: 'completed', label: 'Completed' },
      ],
   },

   // Material condition options
   MATERIAL_CONDITIONS: [
      { value: 'excellent', label: 'Excellent' },
      { value: 'good', label: 'Good' },
      { value: 'fair', label: 'Fair' },
      { value: 'poor', label: 'Poor' },
      { value: 'scrap', label: 'Scrap' },
   ],

   // Location types
   LOCATION_TYPES: [
      { value: 'source', label: 'Source' },
      { value: 'destination', label: 'Destination' },
      { value: 'storage', label: 'Storage' },
      { value: 'other', label: 'Other' },
   ],

   // Role options for assignments
   ROLE_OPTIONS: [
      { value: 'supervisor', label: 'Supervisor' },
      { value: 'team-lead', label: 'Team Lead' },
      { value: 'technician', label: 'Technician' },
      { value: 'operator', label: 'Operator' },
      { value: 'driver', label: 'Driver' },
      { value: 'helper', label: 'Helper' },
      { value: 'worker', label: 'Worker' },
   ],

   // Unit options for materials
   UNIT_OPTIONS: [
      { value: 'pieces', label: 'Pieces' },
      { value: 'meters', label: 'Meters' },
      { value: 'kg', label: 'Kilograms' },
      { value: 'liters', label: 'Liters' },
      { value: 'boxes', label: 'Boxes' },
      { value: 'units', label: 'Units' },
      { value: 'sets', label: 'Sets' },
   ],

   // Time options
   TIME_OPTIONS: [
      { value: '1h', label: '1 hour' },
      { value: '2h', label: '2 hours' },
      { value: '4h', label: '4 hours' },
      { value: '8h', label: '8 hours' },
      { value: '1d', label: '1 day' },
      { value: '2d', label: '2 days' },
      { value: '1w', label: '1 week' },
   ],

   // Priority options
   PRIORITY_OPTIONS: [
      { value: 'low', label: 'Low', color: 'green' },
      { value: 'medium', label: 'Medium', color: 'yellow' },
      { value: 'high', label: 'High', color: 'orange' },
      { value: 'critical', label: 'Critical', color: 'red' },
   ],

   // Export formats
   EXPORT_FORMATS: [
      { value: 'csv', label: 'CSV' },
      { value: 'excel', label: 'Excel' },
      { value: 'pdf', label: 'PDF' },
      { value: 'json', label: 'JSON' },
   ],
};

// Default form values
export const DEFAULT_COW_ACTIVITY_FORM = {
   activityName: '',
   siteId: '',
   purpose: '',
   description: '',
   plannedStartDate: '',
   plannedEndDate: '',
   notes: '',
   overallStatus: 'planned',
   teamMembers: [],
   sourceSite: {
      location: {
         name: '',
         address: {
            street: '',
            city: '',
            state: '',
         },
         type: 'source',
      },
      workTypes: [],
      siteStatus: 'not-started',
   },
   destinationSite: {
      location: {
         name: '',
         address: {
            street: '',
            city: '',
            state: '',
         },
         type: 'destination',
      },
      workTypes: [],
      siteStatus: 'not-started',
   },
};

// Work type default configurations
export const WORK_TYPE_DEFAULTS = {
   surveyWork: {
      status: 'not-started',
      assignedUsers: [],
      materials: [],
      notes: '',
      attachments: [],
      startTime: null,
      endTime: null,
   },
   inventoryWork: {
      status: 'not-started',
      assignedUsers: [],
      materials: [],
      notes: '',
      attachments: [],
      startTime: null,
      endTime: null,
   },
   transportationWork: {
      status: 'not-started',
      assignedUsers: [],
      materials: [],
      notes: '',
      attachments: [],
      vehicleNumber: '',
      driverName: '',
      driverContact: '',
      startTime: null,
      endTime: null,
   },
   installationWork: {
      status: 'not-started',
      assignedUsers: [],
      materials: [],
      notes: '',
      attachments: [],
      equipmentInstalled: [],
      startTime: null,
      endTime: null,
   },
};

// Status colors for UI
export const STATUS_COLORS = {
   planned: 'bg-sky-100 text-sky-800 border-sky-200',
   'in-progress': 'bg-amber-100 text-amber-800 border-amber-200',
   completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
   cancelled: 'bg-red-100 text-red-800 border-red-200',
   'on-hold': 'bg-gray-100 text-gray-800 border-gray-200',
   'not-started': 'bg-gray-100 text-gray-800 border-gray-200',
   loading: 'bg-sky-100 text-sky-800 border-sky-200',
   'in-transit': 'bg-purple-100 text-purple-800 border-purple-200',
   unloading: 'bg-indigo-100 text-indigo-800 border-indigo-200',
};

// Purpose colors for UI
export const PURPOSE_COLORS = {
   'event-coverage': 'bg-purple-100 text-purple-800 border-purple-200',
   'disaster-recovery': 'bg-red-100 text-red-800 border-red-200',
   'network-expansion': 'bg-green-100 text-green-800 border-green-200',
   'maintenance': 'bg-amber-100 text-amber-800 border-amber-200',
   'testing': 'bg-sky-100 text-sky-800 border-sky-200',
   'other': 'bg-gray-100 text-gray-800 border-gray-200',
};

// Work type colors for UI
export const WORK_TYPE_COLORS = {
   survey: 'bg-sky-100 text-sky-800 border-sky-200',
   inventory: 'bg-green-100 text-green-800 border-green-200',
   transportation: 'bg-purple-100 text-purple-800 border-purple-200',
   installation: 'bg-amber-100 text-amber-800 border-amber-200',
};

// Validation messages
export const VALIDATION_MESSAGES = {
   REQUIRED: 'This field is required',
   MIN_LENGTH: (min) => `Minimum ${min} characters required`,
   MAX_LENGTH: (max) => `Maximum ${max} characters allowed`,
   INVALID_EMAIL: 'Please enter a valid email address',
   INVALID_DATE: 'Please enter a valid date',
   DATE_RANGE: 'End date must be after start date',
   INVALID_NUMBER: 'Please enter a valid number',
   MIN_VALUE: (min) => `Value must be at least ${min}`,
   MAX_VALUE: (max) => `Value must be at most ${max}`,
};