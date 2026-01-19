// controllers/userController.js
const User = require('../models/user.model');
const { prepareUserUpdateData, validateUniqueFields } = require('../utils/userUtils');

exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
};

exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    // Clean the data - remove empty email
    const cleanData = { ...req.body };
    if (cleanData.email === '') {
      delete cleanData.email;
    }

    const uniqueErrors = await validateUniqueFields(User, cleanData);

    if (uniqueErrors) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate field(s) found',
        errors: uniqueErrors,
        // Add a formatted error message for frontend
        error: Object.values(uniqueErrors).join(', ')
      });
    }

    // Clean data again for the create operation
    const createData = { ...cleanData };
    if (!createData.email) {
      delete createData.email;
    }

    const user = await User.create(createData);

    // Remove password from response
    user.password = undefined;

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    console.error('❌ Error creating user:', error);

    // Handle MongoDB duplicate key errors specifically
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const value = error.keyValue[field];
      const errorMessage = `The ${field} "${value}" is already in use`;

      return res.status(400).json({
        success: false,
        message: `Duplicate ${field} found`,
        error: errorMessage,
        errors: { [field]: errorMessage }
      });
    }

    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    // Clean the data - remove empty email
    const cleanData = { ...req.body };
    if (cleanData.email === '') {
      delete cleanData.email;
    }

    // Validate unique fields (excluding current user)
    const uniqueErrors = await validateUniqueFields(User, cleanData, req.params.id);

    if (uniqueErrors) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate field(s) found',
        errors: uniqueErrors,
        error: Object.values(uniqueErrors).join(', ')
      });
    }

    // Prepare update data
    const updateData = await prepareUserUpdateData(cleanData);

    // Find and update user
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update user fields
    Object.assign(user, updateData);
    await user.save();

    // Remove password from response
    user.password = undefined;

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('❌ Error updating user:', error);

    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const value = error.keyValue[field];
      const errorMessage = `The ${field} "${value}" is already in use`;

      return res.status(400).json({
        success: false,
        message: `Duplicate ${field} found`,
        error: errorMessage,
        errors: { [field]: errorMessage }
      });
    }

    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await user.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};