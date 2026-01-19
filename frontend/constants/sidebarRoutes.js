import {
  LayoutDashboard,
  Users,
  UserCog,
  FolderTree,
  MapPin,
  ClipboardList,
  Factory,
  Building2,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { ROLES } from './roles';

// Permission-based configuration
export const PERMISSIONS = {
  [ROLES.ADMIN]: {
    canSeeAllProjects: true,
    canSeeSites: true,
    canSeeVendors: true,
    canSeeInventory: true,
    canSeeProjectManagement: true,
    canSeeSiteActivities: true,
  },
  [ROLES.MANAGER]: {
    canSeeAllProjects: true,
    canSeeSites: true,
    canSeeVendors: true,
    canSeeInventory: true,
    canSeeProjectManagement: true,
    canSeeSiteActivities: true,
  },
  // Add permissions for other roles if needed
  [ROLES.SUPERVISOR]: {
    canSeeAllProjects: false,
    canSeeSites: false,
    canSeeVendors: false,
    canSeeInventory: false,
    canSeeProjectManagement: false,
    canSeeSiteActivities: false, 
  },
  [ROLES.CIVIL_ENGINEER]: {
    canSeeAllProjects: false,
    canSeeSites: false,
    canSeeVendors: false,
    canSeeInventory: false,
    canSeeProjectManagement: false,
    canSeeSiteActivities: false, 
  },
    [ROLES.STORE_INCHARGE]: {
    canSeeAllProjects: false,
    canSeeSites: false,
    canSeeVendors: false,
    canSeeInventory: true,
    canSeeProjectManagement: false,
    canSeeSiteActivities: false, 
  },
  // Default for all other roles
  default: {
    canSeeAllProjects: false,
    canSeeSites: false,
    canSeeVendors: false,
    canSeeInventory: false,
    canSeeProjectManagement: false,
    canSeeSiteActivities: false,
  }
};

// Helper function to get permission
const getPermission = (role, permissionKey) => {
  return PERMISSIONS[role]?.[permissionKey] ?? PERMISSIONS.default[permissionKey];
};

// Define all possible route sections
export const ROUTE_SECTIONS = {
  DASHBOARD: {
    name: 'Dashboard',
    path: '/[role]/dashboard',
    icon: <LayoutDashboard size={18} />,
    permission: () => true, // Everyone can see dashboard
  },
  ALL_PROJECTS: {
    name: 'All Projects',
    path: '/[role]/project',
    icon: <FolderTree size={18} />,
    permission: (role) => getPermission(role, 'canSeeAllProjects'),
  },
  SITES: {
    name: 'Sites',
    path: '/[role]/sites',
    icon: <MapPin size={18} />,
    permission: (role) => getPermission(role, 'canSeeSites'),
  },
  SITE_ACTIVITIES: {
    name: 'Site Activities',
    path: '/[role]/activities',
    icon: <ClipboardList size={18} />,
    permission: (role) => getPermission(role, 'canSeeSiteActivities'), // FIXED: Removed double arrow
    children: [
      {
        name: 'Dismantling Only',
        path: '/[role]/activities/dismantling',
      },
      {
        name: 'Site Relocation',
        path: '/[role]/activities/relocation-activities',
      },
      {
        name: 'CoW Site',
        path: '/[role]/activities/cow-activities',
      },
      {
        name: 'DAS / iBS Site',
        path: '/[role]/activities/ibs',
      },
    ],
  },
  VENDORS: {
    name: 'Vendors',
    path: '/[role]/vendors',
    icon: <Factory size={18} />,
    permission: (role) => getPermission(role, 'canSeeVendors'),
  },
  INVENTORY: {
    name: 'Inventory',
    path: '/[role]/inventory',
    icon: <Building2 size={18} />,
    permission: (role) => getPermission(role, 'canSeeInventory'),
  },
  MY_TASKS: {
    name: 'My Tasks',
    path: '/[role]/tasks',
    icon: <ClipboardList size={18} />,
    permission: () => true, // Everyone can see their tasks
  },

  // STAFF_MANAGEMENT: {
  //   name: 'Staff Management',
  //   path: '/[role]/staff',
  //   icon: <UserCog size={18} />,
  //   permission: (role) => role === ROLES.ADMIN, // Only admin
  // },
};

// Bottom section items (common for all)
export const BOTTOM_SECTIONS = [
  {
    name: 'Settings',
    path: '/[role]/settings',
    icon: <Settings size={18} />,
  },
  {
    name: 'Help & Support',
    path: '/[role]/help-support',
    icon: <HelpCircle size={18} />,
  },
];

// Build sidebar sections based on role
export const buildSidebarSections = (role) => {
  // Filter visible items for this role
  const getVisibleItems = (items) => {
    return items.filter(item => {
      if (typeof item.permission === 'function') {
        return item.permission(role);
      }
      return true;
    });
  };

  // Build main sections
  const mainSections = [];

  // Main Menu Section
  const mainMenuItems = getVisibleItems([ROUTE_SECTIONS.DASHBOARD]);
  if (mainMenuItems.length > 0) {
    mainSections.push({
      title: 'Main Menu',
      items: mainMenuItems,
    });
  }

  // Project Management Section
  const projectItems = getVisibleItems([
    ROUTE_SECTIONS.ALL_PROJECTS,
    ROUTE_SECTIONS.SITES,
    ROUTE_SECTIONS.SITE_ACTIVITIES,
  ]);
  if (projectItems.length > 0) {
    mainSections.push({
      title: 'Project Management',
      items: projectItems,
    });
  }

  // Inventory Management Section
  const inventoryItems = getVisibleItems([
    ROUTE_SECTIONS.VENDORS,
    ROUTE_SECTIONS.INVENTORY,
  ]);
  if (inventoryItems.length > 0) {
    mainSections.push({
      title: 'Inventory Management',
      items: inventoryItems,
    });
  }

  // Task Management Section
  const taskItems = getVisibleItems([ROUTE_SECTIONS.MY_TASKS]);
  if (taskItems.length > 0) {
    mainSections.push({
      title: 'Task Management',
      items: taskItems,
    });
  }

  // Role-specific sections
  const roleSpecificItems = [];
  // Add staff management only for admin
  // if (ROUTE_SECTIONS.STAFF_MANAGEMENT.permission(role)) {
  //   roleSpecificItems.push(ROUTE_SECTIONS.STAFF_MANAGEMENT);
  // }

  if (roleSpecificItems.length > 0) {
    mainSections.push({
      title: `${role.charAt(0).toUpperCase() + role.slice(1).replace('-', ' ')} Tools`,
      items: roleSpecificItems,
    });
  }

  return {
    mainSections,
    bottomSection: { items: BOTTOM_SECTIONS },
  };
};

// Pre-computed routes for all roles
export const SIDEBAR_ROUTES = Object.fromEntries(
  Object.values(ROLES).map(role => [role, buildSidebarSections(role)])
);