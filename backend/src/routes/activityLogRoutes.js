const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin, requireAdminOrManager } = require('../middleware/auth');
const {
  getAllActivityLogs,
  getActivityLog,
  getMyActivityLogs,
  getStats,
  createLog,
  cleanupOldLogs
} = require('../controllers/activityLogController');

/**
 * @swagger
 * /api/activity-logs:
 *   get:
 *     summary: Get all activity logs (Admin/Manager only)
 *     tags: [Activity Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action type
 *       - in: query
 *         name: resourceType
 *         schema:
 *           type: string
 *         description: Filter by resource type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [success, failure, warning]
 *         description: Filter by status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter logs from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter logs until this date
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in username, action, or resource type
 *     responses:
 *       200:
 *         description: Activity logs retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/', verifyToken, requireAdminOrManager, getAllActivityLogs);

/**
 * @swagger
 * /api/activity-logs/me:
 *   get:
 *     summary: Get current user's activity logs
 *     tags: [Activity Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter logs from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter logs until this date
 *     responses:
 *       200:
 *         description: User activity logs retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/me', verifyToken, getMyActivityLogs);

/**
 * @swagger
 * /api/activity-logs/stats:
 *   get:
 *     summary: Get activity statistics (Admin/Manager only)
 *     tags: [Activity Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Statistics from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Statistics until this date
 *     responses:
 *       200:
 *         description: Activity statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/stats', verifyToken, requireAdminOrManager, getStats);

/**
 * @swagger
 * /api/activity-logs/{id}:
 *   get:
 *     summary: Get activity log by ID
 *     tags: [Activity Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Activity log ID
 *     responses:
 *       200:
 *         description: Activity log retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Activity log not found
 */
router.get('/:id', verifyToken, getActivityLog);

/**
 * @swagger
 * /api/activity-logs:
 *   post:
 *     summary: Create a new activity log manually
 *     tags: [Activity Logs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *               - resourceType
 *             properties:
 *               action:
 *                 type: string
 *               resourceType:
 *                 type: string
 *               resourceId:
 *                 type: string
 *               details:
 *                 type: object
 *               status:
 *                 type: string
 *                 enum: [success, failure, warning]
 *     responses:
 *       201:
 *         description: Activity log created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/', verifyToken, createLog);

/**
 * @swagger
 * /api/activity-logs/cleanup:
 *   delete:
 *     summary: Delete old activity logs (Admin only)
 *     tags: [Activity Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: daysToKeep
 *         schema:
 *           type: integer
 *           default: 90
 *         description: Number of days to keep logs
 *     responses:
 *       200:
 *         description: Old logs deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.delete('/cleanup', verifyToken, requireAdmin, cleanupOldLogs);

module.exports = router;
