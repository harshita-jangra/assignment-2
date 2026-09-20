// routes/requesterRoutes.js
// Requester portal routes (Students & Staff)

const express = require('express');
const router = express.Router();
const requesterController = require('../controllers/requesterController');
const { isLoggedIn, isRequester } = require('../middleware/auth');

// Apply middleware so only logged-in requesters can access these routes
router.use(isLoggedIn, isRequester);

router.get('/dashboard', requesterController.getDashboard);
router.get('/browse', requesterController.getBrowseAssets);
router.get('/assets/:id', requesterController.getAssetDetails);
router.post('/request', requesterController.postRequestEquipment);
router.get('/my-requests', requesterController.getMyRequests);

module.exports = router;
