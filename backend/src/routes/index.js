const express = require('express');
const router = express.Router();

const userRoutes = require('./userRoutes');
const billRoutes = require('./billRoutes');
const vehicleRoutes = require('./vehicleRoute');
const apartmentRoutes = require('./apartmentRoutes');
const paymentRoutes = require('./paymentRoutes');
const visitorRoutes = require('./visitorRoutes');
const accessCardRoutes = require('./accessCardRoutes');
const activityLogRoutes = require('./activityLogRoutes');
const notificationRoutes = require('./notificationRoutes');
const residentRoutes = require('./residentRoutes');
const employeeRoutes = require('./employeeRoutes');
const populationMovementRoutes = require('./populationMovementRoutes');

/**
 * @swagger
 * tags:
 *   - name: System
 *     description: System & health check
 *   - name: Users
 *     description: User management APIs
 *   - name: Apartments
 *     description: Apartment management APIs
 *   - name: Payments
 *     description: Payment & billing APIs
 *   - name: Notifications
 *     description: Notification management APIs
 */

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check
 *     description: Check if BlueMoon backend server is running
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             example:
 *               status: OK
 *               message: BlueMoon API is running
 *               timestamp: 2025-12-20T20:00:00.000Z
 */
router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'BlueMoon API is running',
    timestamp: new Date().toISOString()
  });
});

/**
 * @swagger
 * /api/users:
 *   description: User-related APIs
 */
router.use('/users', userRoutes);
router.use('/bills', billRoutes);
router.use('/vehicles', vehicleRoutes);

/**
 * @swagger
 * /api/apartments:
 *   description: Apartment-related APIs
 */
router.use('/apartments', apartmentRoutes);

/**
 * @swagger
 * /api/payments:
 *   description: Payment-related APIs
 */
router.use('/payments', paymentRoutes);
router.use('/visitors', visitorRoutes);
router.use('/access-cards', accessCardRoutes);
router.use('/activity-logs', activityLogRoutes);
router.use('/residents', residentRoutes);
router.use('/population-movements', populationMovementRoutes);
router.use('/employees', employeeRoutes);

/**
 * @swagger
 * /api/notifications:
 *   description: Notification-related APIs
 */
router.use('/notifications', notificationRoutes);

module.exports = router;
