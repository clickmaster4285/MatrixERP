/**
 * Format date to readable string
 */
export const formatDate = (dateString) => {
   if (!dateString) return '—';
   try {
      return new Date(dateString).toLocaleDateString('en-US', {
         year: 'numeric',
         month: 'short',
         day: 'numeric',
         hour: '2-digit',
         minute: '2-digit'
      });
   } catch {
      return '—';
   }
};

/**
 * Format date to short string
 */
export const formatShortDate = (dateString) => {
   if (!dateString) return '—';
   try {
      return new Date(dateString).toLocaleDateString('en-US', {
         month: 'short',
         day: 'numeric'
      });
   } catch {
      return '—';
   }
};

/**
 * Format duration between two dates
 */
export const formatDuration = (startDate, endDate) => {
   if (!startDate || !endDate) return '—';
   try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffMs = Math.abs(end - start);
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
   } catch {
      return '—';
   }
};

/**
 * Format material condition to readable text
 */
export const formatMaterialCondition = (condition) => {
   const conditions = {
      'excellent': 'Excellent',
      'good': 'Good',
      'fair': 'Fair',
      'poor': 'Poor',
      'scrap': 'Scrap'
   };
   return conditions[condition] || condition;
};

/**
 * Format work status to readable text
 */
export const formatWorkStatus = (status) => {
   const statuses = {
      'not-started': 'Not Started',
      'in-progress': 'In Progress',
      'completed': 'Completed',
      'loading': 'Loading',
      'in-transit': 'In Transit',
      'unloading': 'Unloading'
   };
   return statuses[status] || status;
};

/**
 * Format purpose to readable text
 */
export const formatPurpose = (purpose) => {
   const purposes = {
      'event-coverage': 'Event Coverage',
      'disaster-recovery': 'Disaster Recovery',
      'network-expansion': 'Network Expansion',
      'maintenance': 'Maintenance',
      'testing': 'Testing',
      'other': 'Other'
   };
   return purposes[purpose] || purpose;
};

/**
 * Format location type to readable text
 */
export const formatLocationType = (type) => {
   const types = {
      'source': 'Source',
      'destination': 'Destination',
      'storage': 'Storage',
      'other': 'Other'
   };
   return types[type] || type;
};

/**
 * Format file size
 */
export const formatFileSize = (bytes) => {
   if (bytes === 0) return '0 Bytes';
   const k = 1024;
   const sizes = ['Bytes', 'KB', 'MB', 'GB'];
   const i = Math.floor(Math.log(bytes) / Math.log(k));
   return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text, maxLength = 100) => {
   if (!text) return '';
   if (text.length <= maxLength) return text;
   return text.substring(0, maxLength) + '...';
};

/**
 * Format address to single line
 */
export const formatAddress = (address) => {
   if (!address) return '—';
   const parts = [];
   if (address.street) parts.push(address.street);
   if (address.city) parts.push(address.city);
   if (address.state) parts.push(address.state);
   return parts.join(', ') || '—';
};

/**
 * Format percentage with sign
 */
export const formatPercentage = (value) => {
   if (value == null) return '0%';
   return `${Math.round(value)}%`;
};

/**
 * Format number with commas
 */
export const formatNumber = (num) => {
   if (num == null) return '0';
   return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};