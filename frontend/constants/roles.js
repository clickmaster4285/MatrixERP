// Centralized Role Definitions
export const ROLES = {
   // Core roles from your system
   ADMIN: 'admin',
   MANAGER: 'manager',
   SUPERVISOR: 'supervisor',
   CIVIL_ENGINEER: 'civil-engineer',

   // New roles from your employee list
   DIRECTOR_PROJECTS: 'director-projects',
   PROJECT_MANAGER: 'project-manager',
   REGIONAL_PROJECT_MANAGER: 'regional-project-manager',
   SUPERVISOR_CIVIL: 'supervisor-civil',
   RAN_ENGINEER: 'ran-engineer',
   TRANSMISSION_ENGINEER: 'transmission-engineer',
   RF_ENGINEER: 'rf-engineer',
   PROJECT_COORDINATOR: 'project-coordinator',
   ENGINEER_CIVIL: 'engineer-civil',
   DT_ENGINEER: 'dt-engineer',
   REGER_TECHNICIAN: 'reger-technician',
   TECHNICIAN: 'technician',
   STORE_INCHARGE: 'store-incharge',
   OFFICE_BOY: 'office-boy',
   INTERNEE: 'internee',
   SURVEYOR: 'surveyor' // from your ROLES array
};

// Role display names
export const ROLE_LABELS = {
   [ROLES.ADMIN]: 'Admin',
   [ROLES.MANAGER]: 'Manager',
   [ROLES.SUPERVISOR]: 'Supervisor',
   [ROLES.CIVIL_ENGINEER]: 'Civil Engineer',
   [ROLES.DIRECTOR_PROJECTS]: 'Director Projects',
   [ROLES.PROJECT_MANAGER]: 'Project Manager',
   [ROLES.REGIONAL_PROJECT_MANAGER]: 'Regional Project Manager',
   [ROLES.SUPERVISOR_CIVIL]: 'Supervisor Civil',
   [ROLES.RAN_ENGINEER]: 'RAN Engineer',
   [ROLES.TRANSMISSION_ENGINEER]: 'Transmission Engineer',
   [ROLES.RF_ENGINEER]: 'RF Engineer',
   [ROLES.PROJECT_COORDINATOR]: 'Project Coordinator',
   [ROLES.ENGINEER_CIVIL]: 'Engineer Civil',
   [ROLES.DT_ENGINEER]: 'DT Engineer',
   [ROLES.REGER_TECHNICIAN]: 'Reger Technician',
   [ROLES.TECHNICIAN]: 'Technician',
   [ROLES.STORE_INCHARGE]: 'Store Incharge',
   [ROLES.OFFICE_BOY]: 'Office Boy',
   [ROLES.INTERNEE]: 'Internee',
   [ROLES.SURVEYOR]: 'Surveyor'
};

// Allowed roles for protected routes (all roles that can access the dashboard)
export const ALLOWED_ROLES = Object.values(ROLES);

// Role hierarchy for permissions
export const ROLE_HIERARCHY = {
   [ROLES.ADMIN]: 100,
   [ROLES.DIRECTOR_PROJECTS]: 90,
   [ROLES.PROJECT_MANAGER]: 85,
   [ROLES.REGIONAL_PROJECT_MANAGER]: 80,
   [ROLES.MANAGER]: 75,
   [ROLES.SUPERVISOR]: 70,
   [ROLES.SUPERVISOR_CIVIL]: 65,
   [ROLES.CIVIL_ENGINEER]: 60,
   [ROLES.ENGINEER_CIVIL]: 60,
   [ROLES.RAN_ENGINEER]: 55,
   [ROLES.TRANSMISSION_ENGINEER]: 55,
   [ROLES.RF_ENGINEER]: 55,
   [ROLES.DT_ENGINEER]: 55,
   [ROLES.PROJECT_COORDINATOR]: 50,
   [ROLES.SURVEYOR]: 45,
   [ROLES.REGER_TECHNICIAN]: 40,
   [ROLES.TECHNICIAN]: 40,
   [ROLES.STORE_INCHARGE]: 40,
   [ROLES.OFFICE_BOY]: 30,
   [ROLES.INTERNEE]: 20
};

// Role groups for UI organization
export const ROLE_GROUPS = {
   MANAGEMENT: [
      ROLES.ADMIN,
      ROLES.DIRECTOR_PROJECTS,
      ROLES.PROJECT_MANAGER,
      ROLES.REGIONAL_PROJECT_MANAGER,
      ROLES.MANAGER
   ],
   SUPERVISION: [
      ROLES.SUPERVISOR,
      ROLES.SUPERVISOR_CIVIL,
      ROLES.PROJECT_COORDINATOR
   ],
   TECHNICAL: [
      ROLES.CIVIL_ENGINEER,
      ROLES.ENGINEER_CIVIL,
      ROLES.RAN_ENGINEER,
      ROLES.TRANSMISSION_ENGINEER,
      ROLES.RF_ENGINEER,
      ROLES.DT_ENGINEER,
      ROLES.SURVEYOR
   ],
   OPERATIONS: [
      ROLES.REGER_TECHNICIAN,
      ROLES.TECHNICIAN
   ],
   SUPPORT: [
      ROLES.STORE_INCHARGE,
      ROLES.OFFICE_BOY,
      ROLES.INTERNEE,
   ]
};