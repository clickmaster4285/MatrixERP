// routes/index.js - UPDATED
const express = require('express');
const router = express.Router();

const auth = require('./auth.routes');
const user = require('./user.routes');
const project = require('./project.routes');
const site = require('./sites.routes');
const dismantlingActivity = require('./dismantlingActivity.routes');
const relocationActivity = require('./relocationActivity.routes.js');
const task = require('./task.routes.js');
const cowActivity = require('./cowActivity.routes.js');
const inventory = require('./inventory.routes.js');
const inventoryRequests = require('./inventoryRequests.routes.js');

const vendor = require('./vendor.routes.js');
const dasIbsActivity = require('./dasIbsActivity.routes.js');

router.use('/auth', auth);
router.use('/user', user);
router.use('/project', project);
router.use('/sites', site);
router.use('/dismantling', dismantlingActivity);
router.use('/relocation-activities', relocationActivity);
router.use('/cow-activities', cowActivity);
router.use('/tasks', task);
router.use('/inventory', inventory);
router.use('/vendors', vendor);
router.use('/dasIbs', dasIbsActivity);
router.use('/request', inventoryRequests);

module.exports = router;
