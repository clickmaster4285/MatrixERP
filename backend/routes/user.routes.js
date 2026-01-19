// routes/users.js
const express = require('express');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/user.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(protect);
router.post('/create', authorize('admin'), createUser);
router.get('/all', authorize('admin', 'manager', 'supervisor'), getUsers);
router.get('/:id', authorize('admin', 'manager', 'supervisor'), getUser);
router.put('/:id/update', authorize('admin'), updateUser);
router.delete('/:id/delete', authorize('admin'), deleteUser);

module.exports = router;
