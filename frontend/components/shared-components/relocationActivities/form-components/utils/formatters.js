// formatter
export const getRelocationTypeConfig = (type) => {
   const types = {
      B2S: {
         label: 'B2S',
         color: 'bg-sky-500',
         description: 'Base Station to Site',
      },
      OMO: {
         label: 'OMO',
         color: 'bg-green-500',
         description: 'Operator Maintenance Operation',
      },
      StandAlone: {
         label: 'Stand Alone',
         color: 'bg-purple-500',
         description: 'Standalone Site',
      },
      Custom: {
         label: 'Custom',
         color: 'bg-gray-500',
         description: 'Custom Relocation',
      }
   };

   return types[type] || { label: type, color: 'bg-gray-500', description: 'Unknown' };
};

export const formatAddress = (address) => {
   if (!address) return 'N/A';

   const parts = [
      address.street,
      address.city,
      address.state,
   ].filter(Boolean);

   return parts.join(', ') || 'Address not specified';
};

export const formatDate = (dateString) => {
   if (!dateString) return 'Not scheduled';

   try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
         year: 'numeric',
         month: 'short',
         day: 'numeric',
      });
   } catch (error) {
      return 'Invalid date';
   }
};

export const formatUserName = (user) => {
   if (!user) return 'N/A';
   if (typeof user === 'string') return user;
   return user.name || user.email || 'Unknown User';
};