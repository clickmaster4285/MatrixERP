import { COW_ACTIVITY_CONSTANTS } from '../../constants/cowActivity.constants';

export const PURPOSE_OPTIONS = COW_ACTIVITY_CONSTANTS.PURPOSES;

export const OVERALL_STATUS_OPTIONS = COW_ACTIVITY_CONSTANTS.OVERALL_STATUS;

export const WORK_TYPE_OPTIONS = COW_ACTIVITY_CONSTANTS.WORK_TYPES;

export const WORK_STATUS_OPTIONS = {
   survey: COW_ACTIVITY_CONSTANTS.WORK_STATUS.survey,
   inventory: COW_ACTIVITY_CONSTANTS.WORK_STATUS.inventory,
   transportation: COW_ACTIVITY_CONSTANTS.WORK_STATUS.transportation,
   installation: COW_ACTIVITY_CONSTANTS.WORK_STATUS.installation,
};

export const MATERIAL_CONDITION_OPTIONS = COW_ACTIVITY_CONSTANTS.MATERIAL_CONDITIONS;

export const LOCATION_TYPE_OPTIONS = COW_ACTIVITY_CONSTANTS.LOCATION_TYPES;

export const ROLE_OPTIONS = COW_ACTIVITY_CONSTANTS.ROLE_OPTIONS;

export const UNIT_OPTIONS = COW_ACTIVITY_CONSTANTS.UNIT_OPTIONS;

export const SITE_WORK_TYPES = [
   { value: 'survey', label: 'Survey Work', description: 'Site survey and assessment' },
   { value: 'inventory', label: 'Inventory Work', description: 'Material inventory and tracking' },
   { value: 'transportation', label: 'Transportation Work', description: 'Material transportation' },
   { value: 'installation', label: 'Installation Work', description: 'Equipment installation' },
];

export const TRANSPORTATION_STATUS_OPTIONS = [
   { value: 'not-started', label: 'Not Started' },
   { value: 'loading', label: 'Loading' },
   { value: 'in-transit', label: 'In Transit' },
   { value: 'unloading', label: 'Unloading' },
   { value: 'completed', label: 'Completed' },
];

export const SORT_OPTIONS = [
   { value: 'createdAt', label: 'Date Created' },
   { value: 'updatedAt', label: 'Last Updated' },
   { value: 'activityName', label: 'Activity Name' },
   { value: 'plannedStartDate', label: 'Start Date' },
   { value: 'overallStatus', label: 'Status' },
];

export const FILTER_STATUS_OPTIONS = [
   { value: 'all', label: 'All Status' },
   { value: 'planned', label: 'Planned' },
   { value: 'in-progress', label: 'In Progress' },
   { value: 'completed', label: 'Completed' },
   { value: 'cancelled', label: 'Cancelled' },
   { value: 'on-hold', label: 'On Hold' },
];

export const FILTER_PURPOSE_OPTIONS = [
   { value: 'all', label: 'All Purposes' },
   ...COW_ACTIVITY_CONSTANTS.PURPOSES,
];

export const ITEMS_PER_PAGE_OPTIONS = [
   { value: '12', label: '12 per page' },
   { value: '24', label: '24 per page' },
   { value: '48', label: '48 per page' },
   { value: '96', label: '96 per page' },
];

export const getWorkTypeIcon = (workType) => {
   const icons = {
      survey: '📋',
      inventory: '📦',
      transportation: '🚚',
      installation: '🔧'
   };
   return icons[workType] || '📄';
};

export const getWorkTypeColor = (workType) => {
   const colors = {
      survey: 'bg-sky-100 text-sky-800 border-sky-200',
      inventory: 'bg-green-100 text-green-800 border-green-200',
      transportation: 'bg-purple-100 text-purple-800 border-purple-200',
      installation: 'bg-amber-100 text-amber-800 border-amber-200'
   };
   return colors[workType] || 'bg-gray-100 text-gray-800 border-gray-200';
};

export const getStatusColor = (status) => {
   const colors = {
      planned: 'bg-sky-100 text-sky-800 border-sky-200',
      'in-progress': 'bg-amber-100 text-amber-800 border-amber-200',
      completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      'on-hold': 'bg-gray-100 text-gray-800 border-gray-200'
   };
   return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
};

export const getPurposeColor = (purpose) => {
   const colors = {
      'event-coverage': 'bg-purple-100 text-purple-800 border-purple-200',
      'disaster-recovery': 'bg-red-100 text-red-800 border-red-200',
      'network-expansion': 'bg-green-100 text-green-800 border-green-200',
      'maintenance': 'bg-amber-100 text-amber-800 border-amber-200',
      'testing': 'bg-sky-100 text-sky-800 border-sky-200',
      'other': 'bg-gray-100 text-gray-800 border-gray-200'
   };
   return colors[purpose] || 'bg-gray-100 text-gray-800 border-gray-200';
};