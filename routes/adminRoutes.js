// routes/adminRoutes.js
// Admin portal routes: Full CRUD, audit logs, maintenance, users

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isLoggedIn, isAdmin } = require('../middleware/auth');

// Protect all routes with Admin role
router.use(isLoggedIn, isAdmin);

router.get('/dashboard', adminController.getDashboard);

// Asset Management CRUD
router.get('/assets', adminController.getAssets);
router.get('/assets/add', adminController.getAddAsset);
router.post('/assets/add', adminController.postAddAsset);
router.get('/assets/:id/edit', adminController.getEditAsset);
router.post('/assets/:id/edit', adminController.postEditAsset);
router.post('/assets/:id/delete', adminController.postDeleteAsset);

// Requests Audit Trail
router.get('/requests', adminController.getAllRequests);

// Users Directory
router.get('/users', adminController.getUsers);

// Maintenance Tracking
router.get('/maintenance', adminController.getMaintenance);
router.post('/maintenance/add', adminController.postAddMaintenance);

module.exports = router;
