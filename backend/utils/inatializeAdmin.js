// utils/InitializeAdmin.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/user.model');

dotenv.config();

const InitializeAdmin = async () => {
  try {
    // Check if admin already exists by phone (primary check)
    const adminExists = await User.findOne({ phone: process.env.ADMIN_PHONE });
    if (adminExists) {
      return;
    }

    // Also check by email if provided (optional secondary check)
    if (process.env.ADMIN_EMAIL) {
      const adminByEmail = await User.findOne({ email: process.env.ADMIN_EMAIL });
      if (adminByEmail) {
        return;
      }
    }

    // Validate required admin phone
    if (!process.env.ADMIN_PHONE) {
      console.error('ADMIN_PHONE environment variable is required');
      return;
    }

    // Create admin user with phone as primary identifier
    const adminData = {
      name: process.env.ADMIN_NAME || 'System Admin',
      phone: process.env.ADMIN_PHONE,
      password: process.env.ADMIN_PASSWORD || 'admin123',
      role: 'admin',
      department: process.env.ADMIN_DEPARTMENT || 'planning',
      employeeId: process.env.ADMIN_EMPLOYEE_ID || 'ADMIN001',
    };

    // Add email only if provided
    if (process.env.ADMIN_EMAIL) {
      adminData.email = process.env.ADMIN_EMAIL;
    }

    const admin = await User.create(adminData);


  } catch (error) {
    console.error('Error seeding admin:', error.message);
    
    // More detailed error logging
    if (error.code === 11000) {
      if (error.keyValue?.phone) {
        console.error('Admin phone number already exists');
      }
      if (error.keyValue?.email) {
        console.error('Admin email already exists');
      }
    }
  }
};

module.exports = InitializeAdmin;