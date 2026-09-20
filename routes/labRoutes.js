// routes/labRoutes.js
// Lab In-charge portal routes

const express = require('express');
const router = express.Router();
const labController = require('../controllers/labController');
const { isLoggedIn, isLabIncharge } = require('../middleware/auth');

// Protect all routes with Lab In-charge role
router.use(isLoggedIn, isLabIncharge);

router.get('/dashboard', labController.getDashboard);
router.get('/requests', labController.getPendingRequests);
router.post('/approve', labController.postApproveRequest);
router.post('/reject', labController.postRejectRequest);
router.post('/issue', labController.postRecordIssue);
router.get('/issued', labController.getIssuedEquipment);
router.get('/overdue', labController.getOverdueEquipment);
router.post('/return', labController.postRecordReturn);

module.exports = router;
