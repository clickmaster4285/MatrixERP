// components/shared-components/relocation/constants/options.js
export const RELOCATION_TYPES = [
   { value: 'B2S', label: 'B2S (Base Station to Site)' },
   { value: 'OMO', label: 'OMO (Operator Maintenance Operation)' },
   { value: 'StandAlone', label: 'Stand Alone' },
   { value: 'Custom', label: 'Custom' },
];

export const STATUS_OPTIONS = [
   { value: 'draft', label: 'Draft' },
   { value: 'active', label: 'Active' },
   { value: 'completed', label: 'Completed' },
];

export const SITE_STATUS_OPTIONS = [
   { value: 'not-started', label: 'Not Started' },
   { value: 'in-progress', label: 'In Progress' },
   { value: 'completed', label: 'Completed' },
];

export const WORK_STATUS_OPTIONS = [
   { value: 'not-started', label: 'Not Started' },
   { value: 'in-progress', label: 'In Progress' },
   { value: 'completed', label: 'Completed' },
   { value: 'on-hold', label: 'On Hold' },
];

export const MATERIAL_STATUS_OPTIONS = [
   { value: 'pending', label: 'Pending' },
   { value: 'in-transit', label: 'In Transit' },
   { value: 'delivered', label: 'Delivered' },
];

export const SITE_TYPE_OPTIONS = [
   { value: 'existing', label: 'Existing Site' },
   { value: 'new', label: 'New Site' },
   { value: 'shared', label: 'Shared Site' },
   { value: 'not-required', label: 'Not Required' },
];

export const WORK_TYPE_OPTIONS = [
   { value: 'civil', label: 'Civil Work' },
   { value: 'te', label: 'Telecom Equipment' },
   { value: 'material', label: 'Material' },
   { value: 'survey', label: 'Survey' },
];

export const EQUIPMENT_TYPES = [
   'RRU',
   'BBU',
   'Antenna',
   'Tower',
   'Power System',
   'Battery Backup',
   'Transmission Equipment',
   'Other'
];

export const SURVEY_TYPES = [
   'Site Survey',
   'Civil Survey',
   'Material Survey',
   'Technical Survey',
   'Environmental Survey'
];

export const USER_ROLES_FOR_CIVIL = ['civil-engineer', 'engineer', 'supervisor', 'admin'];
export const USER_ROLES_FOR_TE = ['te-technician', 'engineer', 'supervisor', 'admin'];
export const USER_ROLES_FOR_MATERIAL = ['material-handler', 'store-manager', 'supervisor', 'admin'];
export const USER_ROLES_FOR_SURVEY = ['surveyor', 'engineer', 'supervisor', 'admin'];