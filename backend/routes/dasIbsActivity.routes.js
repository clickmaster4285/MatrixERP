
const express = require('express');

const dasIbsActivity = require('../controllers/DasIbsActivity.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.post('/', dasIbsActivity.createDasIbsActivity);
router.get('/', dasIbsActivity.getDasIbsActivities);
router.get('/:id', dasIbsActivity.getDasIbsActivityById);
router.patch('/:id', dasIbsActivity.updateDasIbsActivity);
router.delete('/:id', dasIbsActivity.softDeleteDasIbsActivity);
router.patch('/:id/restore', dasIbsActivity.restoreDasIbsActivity);
router.patch('/:id/assign', dasIbsActivity.assignDasIbsWork);
module.exports = router;
