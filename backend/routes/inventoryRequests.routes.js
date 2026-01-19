const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');

const {
  upsertAllocationRequest,
  getAllocationRequests,
  approveAllocationRequest,
  rejectAllocationRequest,

  directDeductSurveyMaterials,
} = require('../controllers/inventoryRequests.controller');


// Civil / TE → create or update request (on phase update)
router.post('/upsert', protect, upsertAllocationRequest);

// Inventory → list requests (pending / approved / rejected)
router.get('/get', protect, getAllocationRequests);

// Inventory → approve request (allocate materials)
router.post(
  '/:requestId/approve',
  protect,
  approveAllocationRequest
);

// Inventory → reject request
router.post(
  '/:requestId/reject',
  protect,
  rejectAllocationRequest
);


router.post('/direct-allocate-survey', protect, directDeductSurveyMaterials);

module.exports = router;
