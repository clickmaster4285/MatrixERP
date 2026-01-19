const express = require('express');
const router = express.Router();
const cowActivityController = require('../controllers/COWActivity.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const upload = require('../config/multer');
// All routes require authentication
router.use(protect);

// CRUD Routes
router.post('/', authorize('admin', 'project-manager'), cowActivityController.createCOWActivity);
router.get('/', cowActivityController.getAllCOWActivities);
router.get('/:id', cowActivityController.getCOWActivityById);
router.put('/:id', authorize('admin', 'project-manager'), cowActivityController.updateCOWActivity);
router.delete('/:id', authorize('admin'), cowActivityController.softDeleteCOWActivity);

// Work Phase Update Route
router.put('/:id/work-phase', authorize('admin', 'project-manager', 'team-lead'), cowActivityController.updateWorkPhase);

router.post(
  '/:activityId/missing-materials',
  upload.array('receipts', 10),
  cowActivityController.addMissingInventoryMaterials
);
module.exports = router;