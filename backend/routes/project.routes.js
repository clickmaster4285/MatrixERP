// routes/project.routes.js
const express = require('express');
const {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
} = require('../controllers/project.controller');

const { protect, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

// 🔐 Protect all routes
router.use(protect);

router.post('/create', authorize('admin', 'manager'), createProject);
router.get('/all', getProjects);
router.get('/:id', getProject);
router.put('/:id', authorize('admin'), updateProject);
router.delete('/:id', authorize('admin'), deleteProject);

module.exports = router;