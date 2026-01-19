// controllers/authController.js
const User = require('../models/user.model');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middlewares/asyncHandler.middleware');
const { validateUniqueFields } = require('../utils/userUtils');


exports.login = asyncHandler(async (req, res, next) => {
  const { phone, email, password, employeeId } = req.body;

  // Validate credentials
  if ((!phone && !email && !employeeId) || !password) {
    console.warning('Missing credentials');
    return next(new ErrorResponse('Please provide either phone number or email and password', 400));
  }

  if (phone && email && employeeId) {
    console.warning('Both phone and email provided');
    return next(new ErrorResponse('Please provide either phone number OR email, not both', 400));
  }

  // Build query
let query = {};
if (phone) query = { phone };
else if (email) query = { email: email.toLowerCase() };
else if (employeeId) query = { employeeId };



  const user = await User.findOne(query).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if user is active
  if (!user.isActive) {
    return next(new ErrorResponse('Account is deactivated', 401));
  }

  // Check password - ADD DEBUG
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Update last login
  user.lastLogin = Date.now();
  await user.save();

  sendTokenResponse(user, 200, res);
});

exports.getMe = asyncHandler(async (req, res, next) => {
  // Check if req.user exists
  if (!req.user || !req.user.id) {
    return next(new ErrorResponse('Not authenticated', 401));
  }

  const user = await User.findById(req.user.id).select('-password');

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  res.status(200).json({ success: true, data: user });
});

exports.updateProfile = asyncHandler(async (req, res, next) => {
  const { name, email, phone, department } = req.body;

  // Prepare update data
  const updateData = { name, email, phone, department };

  // Validate unique fields (excluding current user)
  const uniqueErrors = await validateUniqueFields(User, updateData, req.user.id);
  if (uniqueErrors) {
    const errorMessage = Object.values(uniqueErrors).join(', ');
    return next(new ErrorResponse(errorMessage, 400));
  }

  // Update user
  const user = await User.findById(req.user.id);
  Object.assign(user, updateData);
  await user.save();

  // Remove password from response
  user.password = undefined;

  res.status(200).json({ success: true, data: user });
});

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
};