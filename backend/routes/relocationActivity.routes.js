// routes/relocationActivity.routes.js
const express = require('express');
const router = express.Router();
const {
   createRelocationActivity,
   getAllRelocationActivities,
   getRelocationActivityById,
   updateRelocationActivity,  
   softDeleteRelocationActivity,
} = require('../controllers/relocationActivity.controller');

// Authentication middleware
const { protect } = require('../middlewares/auth.middleware');

// Apply authentication to all routes
router.use(protect);

// Main CRUD routes
router.post('/', createRelocationActivity);
router.get('/', getAllRelocationActivities);
router.get('/:id', getRelocationActivityById);
router.put('/:id', updateRelocationActivity);  // Handles ALL updates
router.delete('/:id', softDeleteRelocationActivity);

module.exports = router;