// routes/dismantlingActivity.routes.js
const express = require('express');
const {
  createDismantlingActivity,
  updateDismantlingActivity,
  getDismantlingActivities,
  getDismantlingActivity,
  softDeleteDismantlingActivity,
} = require('../controllers/dismantlingActivity.controller');

const upload = require('../config/multer');

const { protect, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

// CREATE
router.post(
  '/create',
  authorize('admin', 'manager'),
  upload.array('attachments', 10),
  createDismantlingActivity
);

// UPDATE
router.put(
  '/:id',
  authorize(
    'admin',
    'manager',
    'supervisor',
    'civil-engineer',
    'surveyor',
    'technician'
  ),
  upload.array('attachments', 10),
  updateDismantlingActivity
);

// GET ALL
router.get('/', getDismantlingActivities);

// GET SINGLE
router.get('/:id', getDismantlingActivity);

// SOFT DELETE
router.delete(
  '/:id',
  authorize('admin', 'manager'),
  softDeleteDismantlingActivity
);

module.exports = router;
