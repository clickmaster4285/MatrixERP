// routes/sites.routes.js - UPDATED
const express = require('express');
const {
  createSite,
  getSites,
  getSiteById,
  updateSite,
  deleteSite
} = require('../controllers/site.controller');

const { protect, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.post('/create', authorize('admin', 'manager'), createSite);
router.get('/all', getSites);
router.get('/:id', getSiteById);
router.patch('/:id', authorize('admin', 'manager'), updateSite);
router.delete('/:id', authorize('admin', 'manager'), deleteSite);

module.exports = router;