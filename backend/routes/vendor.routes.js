// routes/vendor.routes.js
const express = require('express');
const router = express.Router();

const vendorController = require('../controllers/vendor.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);

router.post('/add', vendorController.createVendor);
router.get('/', vendorController.getVendors);
router.get('/dropdown', vendorController.getVendorDropdown);
router.get('/:id', vendorController.getVendorById);

router.put('/:id', vendorController.updateVendor);
router.delete('/:id', vendorController.deleteVendor);



module.exports = router;
