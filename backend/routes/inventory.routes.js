// routes/inventory.routes.js
const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');
const { protect } = require('../middlewares/auth.middleware');

// Apply authentication
router.use(protect);

router.post('/activity-materials', inventoryController.handleActivityMaterials);
router.post('/return-materials', inventoryController.returnActivityMaterials);

router.post('/allocate-materials', inventoryController.allocateActivityMaterials);

router.get('/overview', inventoryController.getInventoryOverview);
router.post('/manual-add', inventoryController.manualBulkAddToInventory);
router.put('/manual-update', inventoryController.manualBulkUpdateInventory);

router.put('/update/:id', inventoryController.updateInventoryById);

// Read operations
router.get('/available', inventoryController.getAvailableMaterials);

router.get('/allocations', inventoryController.getActivityAllocations);

router.delete('/delete/:id', inventoryController.softDeleteInventoryById);


// routes/inventory.routes.js
router.get('/dropdown', inventoryController.getInventoryDropdown);

module.exports = router;
