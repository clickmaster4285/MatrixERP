// @/components/shared-components/tasks/taskWorkConfig.js
import { ClipboardCheck, Wrench, Truck, Package, Users } from 'lucide-react';

// ========== DIALOG TYPES ==========
export const DIALOG_TYPES = {
   MATERIAL: 'material',          // For material-based work (survey, store, etc)
   INSTALLATION: 'installation',  // For installation work
   TRANSPORTATION: 'transportation' // For transportation work
};

// ========== ROLE CONFIGURATION ==========
export const ROLE_CONFIG = {
   survey: {
      label: 'Survey',
      icon: ClipboardCheck,
      color: 'text-sky-600',
      bgColor: 'bg-sky-50',
      workType: 'survey',
      sectionComponent: 'SurveyWorkSection',
      dialogType: DIALOG_TYPES.MATERIAL,
      buttonText: (task) => task.survey?.status === 'completed' ? 'Update Survey' : 'Start Survey'
   },
   dismantling: {
      label: 'Dismantling',
      icon: Wrench,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      workType: 'dismantling',
      sectionComponent: 'DismantlingWorkSection',
      dialogType: DIALOG_TYPES.MATERIAL,
      buttonText: (task) => task.dismantling?.status === 'completed' ? 'Update Dismantling' : 'Start Dismantling'
   },
   inventory: {
      label: 'Inventory Manager',
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      workType: 'inventory',
      sectionComponent: 'StoreWorkSection',
      dialogType: DIALOG_TYPES.MATERIAL,
      buttonText: () => 'Start Store Work'
   },
   store: {
      label: 'Store Operator',
      icon: Truck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      workType: 'store',
      sectionComponent: 'StoreWorkSection',
      dialogType: DIALOG_TYPES.MATERIAL,
      buttonText: () => 'Start Store Work'
   },
   'civil engineer': {
      label: 'Civil Engineer',
      icon: Wrench,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      workType: 'civil',
      sectionComponent: 'CivilWorkSection',
      dialogType: DIALOG_TYPES.MATERIAL,
      buttonText: () => 'Start Civil Work'
   },
   'telecom engineer': {
      label: 'Telecom Engineer',
      icon: Wrench,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      workType: 'telecom',
      sectionComponent: 'TeWorkSection',
      dialogType: DIALOG_TYPES.MATERIAL,
      buttonText: () => 'Start TE Work'
   },
   installation: {
      label: 'Installation',
      icon: Wrench,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      workType: 'installation',
      sectionComponent: 'InstallationWorkSection',
      dialogType: DIALOG_TYPES.INSTALLATION,
      buttonText: (task) => task.workData?.status === 'completed' ? 'Update Installation' : 'Start Installation'
   },
   transportation: {
      label: 'Transportation',
      icon: Truck,
      color: 'text-sky-600',
      bgColor: 'bg-sky-50',
      workType: 'transportation',
      sectionComponent: 'TransportationWorkSection',
      dialogType: DIALOG_TYPES.TRANSPORTATION,
      buttonText: (task) => task.workData?.status === 'completed' ? 'Update Transportation' : 'Start Transportation'
   },
   'team member': {
      label: 'Team Member',
      icon: Users,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      workType: 'general',
      sectionComponent: null,
      dialogType: null,
      buttonText: () => null
   }
};

// ========== ACTIVITY TYPE CONFIGURATION ==========
export const ACTIVITY_CONFIG = {
   dismantling: {
      label: 'Dismantling Activity',
      color: 'bg-orange-50',
      borderColor: 'border-orange-200'
   },
   relocation: {
      label: 'Relocation Activity',
      color: 'bg-sky-50',
      borderColor: 'border-sky-200'
   },
   cow: {
      label: 'COW Activity',
      color: 'bg-emerald-50',
      borderColor: 'border-emerald-200'
   }
};

// ========== UTILITY FUNCTIONS ==========
export function getRoleConfig(normalizedRole) {
   return ROLE_CONFIG[normalizedRole] || {
      label: normalizedRole || 'Member',
      icon: Users,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
      workType: 'general',
      sectionComponent: null,
      dialogType: DIALOG_TYPES.MATERIAL,
      buttonText: () => 'Start Work'
   };
}

export function getActivityConfig(activityType) {
   return ACTIVITY_CONFIG[activityType] || {
      label: 'Activity',
      color: 'bg-gray-50',
      borderColor: 'border-gray-200'
   };
}