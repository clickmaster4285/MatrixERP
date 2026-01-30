// utils/initializeAdmin.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/user.model');

dotenv.config();

const initializeAdmin = async () => {
  try {
    // Validate required admin phone
    if (!process.env.ADMIN_PHONE) {
      console.error('❌ ADMIN_PHONE environment variable is required');
      return;
    }

    console.log('🔍 Checking for admin user...');

    // Check if admin already exists by phone (primary check)
    const adminExists = await User.findOne({ phone: process.env.ADMIN_PHONE });
    
    // If admin exists and is not deleted, skip creation
    if (adminExists && !adminExists.isDeleted) {
      console.log('✅ Admin already exists and is active');
      return;
    }

    // If admin exists but is deleted, restore them
    if (adminExists && adminExists.isDeleted) {
      await User.findByIdAndUpdate(
        adminExists._id,
        {
          $set: {
            isDeleted: false,
            deletedAt: null,
            deletedBy: null,
            password: process.env.ADMIN_PASSWORD,
            name: process.env.ADMIN_NAME ,
            email: process.env.ADMIN_EMAIL,
            department: process.env.ADMIN_DEPARTMENT ,
            employeeId: process.env.ADMIN_EMPLOYEE_ID,
            role: 'admin'
          }
        },
        { new: true }
      );
      console.log('✅ Admin restored successfully (was deleted)');
      return;
    }

    // Also check by email if provided (optional secondary check)
    if (process.env.ADMIN_EMAIL) {
      const adminByEmail = await User.findOne({ email: process.env.ADMIN_EMAIL });
      if (adminByEmail && !adminByEmail.isDeleted) {
        console.log('✅ Admin with this email already exists');
        return;
      }

      // If admin exists by email but is deleted, restore
      if (adminByEmail && adminByEmail.isDeleted) {
        await User.findByIdAndUpdate(
          adminByEmail._id,
          {
            $set: {
              isDeleted: false,
              deletedAt: null,
              deletedBy: null,
              phone: process.env.ADMIN_PHONE,
              password: process.env.ADMIN_PASSWORD,
              name: process.env.ADMIN_NAME ,
              department: process.env.ADMIN_DEPARTMENT ,
              employeeId: process.env.ADMIN_EMPLOYEE_ID,
              role: 'admin'
            }
          },
          { new: true }
        );
        console.log('✅ Admin (by email) restored successfully (was deleted)');
        return;
      }
    }

    // Create new admin user with phone as primary identifier
    const adminData = {
      name: process.env.ADMIN_NAME ,
      phone: process.env.ADMIN_PHONE,
      password: process.env.ADMIN_PASSWORD,
      role: 'admin',
      department: process.env.ADMIN_DEPARTMENT ,
      employeeId: process.env.ADMIN_EMPLOYEE_ID,
      isDeleted: false
    };

    // Add email only if provided
    if (process.env.ADMIN_EMAIL) {
      adminData.email = process.env.ADMIN_EMAIL;
    }

    const admin = await User.create(adminData);
    console.log('✅ Admin user created successfully');

  } catch (error) {
    console.error('❌ Error initializing admin:', error.message);
    
    // More detailed error logging
    if (error.code === 11000) {
      if (error.keyValue?.phone) {
        console.error('❌ Admin phone number already exists in database');
      }
      if (error.keyValue?.email) {
        console.error('❌ Admin email already exists in database');
      }
    }
  }
};

module.exports = initializeAdmin;
