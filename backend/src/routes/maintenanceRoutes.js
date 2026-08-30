const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');
const { verifyToken } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

// GET statistics
router.get('/stats/summary', maintenanceController.getStatistics);

// GET all maintenance requests
router.get('/', maintenanceController.getAllRequests);

// GET single maintenance request
router.get('/:id', maintenanceController.getRequestById);

// POST new maintenance request
router.post('/', maintenanceController.createRequest);

// PUT update maintenance request
router.put('/:id', maintenanceController.updateRequest);

// POST confirm maintenance request (admin/manager only)
router.post('/:id/confirm', maintenanceController.confirmRequest);

// POST complete maintenance request (admin/manager only)
router.post('/:id/complete', maintenanceController.completeRequest);

// DELETE maintenance request (admin only)
router.delete('/:id', maintenanceController.deleteRequest);

module.exports = router;
