// task utils
export const normalizeWorkType = (workTypeString) => {
   const wt = String(workTypeString || '').toLowerCase();

   const workTypeMap = [
      { keywords: ['survey'], value: 'survey' },
      { keywords: ['dismant'], value: 'dismantling' },
      { keywords: ['store', 'inventory'], value: 'store' }, // Group similar
      { keywords: ['civil'], value: 'civil' },
      { keywords: ['tele'], value: 'telecom' },
      { keywords: ['transport'], value: 'transportation' },
      { keywords: ['install'], value: 'installation' },
      { keywords: ['pack'], value: 'packing' },
      { keywords: ['dispatch', 'ship'], value: 'dispatch' },
   ];

   for (const { keywords, value } of workTypeMap) {
      if (keywords.some(keyword => wt.includes(keyword))) {
         return value;
      }
   }

   return 'other';
};

export const resolveTaskById = (id, tasks) => {
   if (!Array.isArray(tasks) || !id) return undefined;

   // 1. Exact match
   const exactMatch = tasks.find(t => t._id === id);
   if (exactMatch) return exactMatch;

   const parts = String(id).split('_');
   if (!parts.length) return undefined;

   const parentActivityId = parts[0];

   // 2. Pattern-based matching for structured IDs
   // CHANGE THIS LINE: from >= 4 to >= 3
   if (parts.length >= 3 && (parts[1] === 'sourceSite' || parts[1] === 'destinationSite')) {
      const siteTypeFromId = parts[1] === 'sourceSite' ? 'source' : 'destination';
      const workFromId = normalizeWorkType(parts[2]);

      // Try COW first, then Relocation
      for (const activityType of ['cow', 'relocation']) {
         const task = tasks.find((t) => {
            if (t.parentActivityId !== parentActivityId) return false;
            if (t.activityType !== activityType) return false;

            const normalizedSiteType = t.siteType || t.site?.siteType;
            const normalizedWorkType = normalizeWorkType(t.workType);

            return normalizedSiteType === siteTypeFromId &&
               normalizedWorkType === workFromId;
         });

         if (task) return task;
      }
   }

   // 3. Dismantling tasks
   if (parts.length >= 3) {
      const idStr = parts.slice(1).join('_').toLowerCase();
      const assignedInFromId = normalizeWorkType(idStr);

      if (assignedInFromId !== 'other') {
         return tasks.find((t) => {
            if (t.parentActivityId !== parentActivityId) return false;
            if (t.activityType !== 'dismantling') return false;

            const normalizedAssignedIn = normalizeWorkType(t.assignedIn);
            return normalizedAssignedIn === assignedInFromId;
         });
      }
   }

   return undefined;
};