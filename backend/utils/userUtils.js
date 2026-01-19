// utils/userUtils.js
const bcrypt = require('bcryptjs');

exports.prepareUserUpdateData = async (data) => {
   const updateData = { ...data };

   // Remove undefined fields
   Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
         
         delete updateData[key];
      }
   });

   // Handle password field
   if (updateData.password) {
      if (updateData.password.trim() === '') {
         // Remove password if it's just whitespace
         delete updateData.password;
      } else {
      }
   } else {
   }
   return updateData;
};

exports.validateUniqueFields = async (User, data, excludeUserId = null) => {
   // Normalize the data - convert empty strings to undefined
   const normalizedData = { ...data };
   if (normalizedData.email === '') normalizedData.email = undefined;
   if (normalizedData.phone === '') normalizedData.phone = undefined;

   const errors = {};
   const queryOptions = {};

   // Build exclusion query if we have a user ID to exclude
   if (excludeUserId) {
      queryOptions._id = { $ne: excludeUserId };
   }

   // Check email uniqueness (only if email exists)
   if (normalizedData.email && normalizedData.email.trim()) {
      const existingEmail = await User.findOne({
         email: normalizedData.email,
         ...queryOptions
      });

      if (existingEmail) {
         errors.email = `Email "${normalizedData.email}" is already registered to user: ${existingEmail.name} (ID: ${existingEmail._id})`;
      } else {
      }
   }

   // Check phone uniqueness (only if phone exists)
   if (normalizedData.phone && normalizedData.phone.trim()) {
      const existingPhone = await User.findOne({
         phone: normalizedData.phone,
         ...queryOptions
      });

      if (existingPhone) {
         errors.phone = `Phone number "${normalizedData.phone}" is already registered to user: ${existingPhone.name} (ID: ${existingPhone._id})`;
      } else {
      }
   }
   return Object.keys(errors).length > 0 ? errors : null;
};