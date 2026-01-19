// taskWorkUtils.js

export function normalizeStatus(status) {
  const v = String(status || '').toLowerCase();
  if (!v || v === 'pending' || v === 'not-started' || v === 'draft')
    return 'in-progress';
  return status;
}

// --- Relocation mapping based on YOUR API ---
export function mapRelocationWorkTypeToSubPhase(workType, myRole) {
  const v = String(workType || myRole || '').toLowerCase();

  // First check for specific work types
  if (v.includes('store')) return 'storeOperatorWork';
  if (v.includes('dismant')) return 'dismantlingWork';
  if (v.includes('civil')) return 'civilWork';
  if (v.includes('telecom') || v.includes('te')) return 'telecomWork';
  if (v.includes('survey')) return 'surveyWork';

  // Fallback based on role mapping
  const roleMap = {
    'surveyor': 'surveyWork',
    'civil engineer': 'civilWork',
    'telecom engineer': 'telecomWork',
    'dismantling supervisor': 'dismantlingWork',
    'store operator': 'storeOperatorWork'
  };

  // Check if any role keyword matches
  for (const [roleKeyword, subPhase] of Object.entries(roleMap)) {
    if (v.includes(roleKeyword)) {
      return subPhase;
    }
  }

  // Default fallback
  return 'surveyWork';
}

// --- Dismantling phase based on YOUR API ---
export function resolveDismantlingPhase(task) {
  // ✅ for dismantling activity tasks, phase must come from assignedIn
  const assignedIn = String(task?.assignedIn || '').toLowerCase();

  if (assignedIn.includes('dispatch') || assignedIn.includes('store'))
    return 'dispatch';

  if (assignedIn.includes('dismant')) return 'dismantling';

  if (assignedIn.includes('survey')) return 'survey';

  // fallback (just in case)
  const p = String(task?.phase || task?.status || '').toLowerCase();
  if (p.includes('dispatch') || p.includes('store')) return 'dispatch';
  if (p.includes('dismant')) return 'dismantling';
  return 'survey';
}

export function resolveMode(task) {
  if (!task) return 'survey';

  // ✅ DISMANTLING activity => use assignedIn only
  if (task.activityType === 'dismantling') {
    const phase = resolveDismantlingPhase(task);

    if (phase === 'dismantling') return 'dismantling';
    if (phase === 'dispatch') return 'store';
    return 'survey';
  }

  // relocation stays same
  if (task.activityType === 'relocation') {
    const sp = mapRelocationWorkTypeToSubPhase(task.workType, task.myRole);

    // Add civil and telecom mapping
    if (sp === 'dismantlingWork') return 'dismantling';
    if (sp === 'storeOperatorWork') return 'store';
    if (sp === 'civilWork') return 'civil';
    if (sp === 'telecomWork') return 'telecom';
    return 'survey';
  }

  // COW activity types
  if (task.activityType === 'cow') {
    const workType = task.workType?.toLowerCase() || '';
    if (workType.includes('install')) return 'installation';
    if (workType.includes('transport')) return 'transportation';
    if (workType.includes('invent')) return 'inventory';
    if (workType.includes('survey')) return 'survey';
    return 'survey';
  }

  return 'survey';
}

export function resolveModule(task) {
  if (!task) return null;

  if (task.activityType === 'dismantling') {
    return {
      activityType: 'dismantling',
      phase: resolveDismantlingPhase(task),
      subPhase: null,
    };
  }

  if (task.activityType === 'relocation') {
    return {
      activityType: 'relocation',
      phase: task.siteType === 'source' ? 'sourceSite' : 'destinationSite',
      subPhase: mapRelocationWorkTypeToSubPhase(task.workType, task.myRole),
    };
  }

  if (task.activityType === 'cow') {
    return {
      activityType: 'cow',
      phase: task.siteType === 'source' ? 'sourceSite' : 'destinationSite',
      subPhase: resolveCOWWorkType(task.workType, task.myRole),
    };
  }

  return null;
}

// date -> "yyyy-mm-dd" for <input type="date" />
export function toDateInputValue(dateVal) {
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return '';
  }
}

// Get material type label for display - UPDATED WITH ALL TYPES
export function getMaterialTypeLabel(type) {
  const labels = {
    'survey': 'Survey',
    'civil': 'Civil',
    'telecom': 'Telecom',
    'dismantling': 'Dismantled',
    'store': 'Stored',
    'installation': 'Installation',
    'transportation': 'Transport',
    'inventory': 'Inventory',
    'general': 'General'
  };
  return labels[type] || 'Materials';
}

// Get material icon based on type - UPDATED WITH ALL TYPES
export function getMaterialIcon(type) {
  const iconConfig = {
    'survey': { color: 'text-primary', bgColor: 'bg-primary/10' },
    'civil': { color: 'text-orange-600', bgColor: 'bg-orange-50' },
    'telecom': { color: 'text-purple-600', bgColor: 'bg-purple-50' },
    'dismantling': { color: 'text-sky-600', bgColor: 'bg-sky-50' },
    'store': { color: 'text-green-600', bgColor: 'bg-green-50' },
    'installation': { color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
    'transportation': { color: 'text-sky-600', bgColor: 'bg-sky-50' },
    'inventory': { color: 'text-violet-600', bgColor: 'bg-violet-50' },
    'general': { color: 'text-gray-600', bgColor: 'bg-gray-50' }
  };

  return iconConfig[type] || iconConfig.general;
}

// Get site label for display
export function getSiteLabel(siteType) {
  const siteLabels = {
    'source': 'Source Site',
    'destination': 'Destination Site'
  };
  return siteLabels[siteType] || '';
}

// Get complete material section title
export function getMaterialSectionTitle(materialType, siteType = '') {
  const typeLabel = getMaterialTypeLabel(materialType);
  const siteLabel = getSiteLabel(siteType);

  if (siteLabel) {
    return `${typeLabel} Materials (${siteLabel})`;
  }

  return `${typeLabel} Materials`;
}

// Normalize material type from various inputs - UPDATED WITH ALL TYPES
export function normalizeMaterialType(input) {
  const v = String(input || '').toLowerCase();

  if (v.includes('survey')) return 'survey';
  if (v.includes('civil')) return 'civil';
  if (v.includes('telecom') || v.includes('te')) return 'telecom';
  if (v.includes('dismant')) return 'dismantling';
  if (v.includes('store')) return 'store';
  if (v.includes('invent')) return 'inventory';
  if (v.includes('install')) return 'installation';
  if (v.includes('transport')) return 'transportation';

  return 'general';
}

export function formatAddedByInfo(material) {
  if (!material) return { name: 'Unknown', role: '', date: '' };

  return {
    name: material.addedByName || 'Unknown',
    role: material.addedByRole || '',
    date: material.addedAt ? new Date(material.addedAt).toLocaleDateString() : ''
  };
}

// COW work type mapping
export const COW_WORK_TYPES = {
  'survey': 'surveyWork',
  'inventory': 'inventoryWork',
  'transportation': 'transportationWork',
  'installation': 'installationWork'
};

// Resolve COW phase and subPhase
export function resolveCOWWorkType(workType, myRole) {
  const v = String(workType || myRole || '').toLowerCase();

  // Map to your backend subPhase values
  if (v.includes('survey')) return 'surveyWork';
  if (v.includes('inventory')) return 'inventoryWork';
  if (v.includes('transport')) return 'transportationWork';
  if (v.includes('install')) return 'installationWork';

  // Default
  return 'surveyWork';
}