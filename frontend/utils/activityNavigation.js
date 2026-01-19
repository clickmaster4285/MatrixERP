// utils/activityNavigation.js
export const activityNavigation = {
   // Store pending activity creation data
   setPendingActivity(siteId) {
      if (typeof window !== 'undefined') {
         localStorage.setItem('pendingActivitySiteId', siteId);
         localStorage.setItem('pendingActivityTimestamp', Date.now().toString());
      }
   },

   getPendingActivity() {
      if (typeof window !== 'undefined') {
         const siteId = localStorage.getItem('pendingActivitySiteId');
         const timestamp = localStorage.getItem('pendingActivityTimestamp');

         // Clear if it's older than 5 minutes
         if (timestamp && Date.now() - parseInt(timestamp) > 5 * 60 * 1000) {
            this.clearPendingActivity();
            return null;
         }

         return siteId;
      }
      return null;
   },

   clearPendingActivity() {
      if (typeof window !== 'undefined') {
         localStorage.removeItem('pendingActivitySiteId');
         localStorage.removeItem('pendingActivityTimestamp');
      }
   },

   // Check if we should open activity dialog automatically
   shouldOpenActivityDialog() {
      const siteId = this.getPendingActivity();
      return !!siteId;
   },
};