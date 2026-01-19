const express = require('express');
const router = express.Router();

const taskController = require('../controllers/task.controller');


const { protect } = require('../middlewares/auth.middleware');
const upload = require('../config/multer');

// All calls require user to be logged in
router.get('/', protect, taskController.getActivities);
router.patch(
   '/:activityType/:activityId/phase',
   protect,
   upload.array('attachments', 10),
   taskController.checkAssignmentOrGlobal,
   taskController.updatePhase
);

module.exports = router;