// routes/auth.js
const express = require('express');
const {
  login,
  getMe,
  updateProfile,
} = require('../controllers/auth.controller');

const router = express.Router();

const { protect } = require('../middlewares/auth.middleware');

router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

module.exports = router;