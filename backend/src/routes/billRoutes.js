const express = require("express")
const {BillController} = require("../controllers/billController")
const {requireAdminOrManager, verifyToken} = require("../middleware/auth");
const { route } = require("./userRoutes");

const router = express.Router();
const controller = new BillController();


// TODO: add a middleware to check access for insert and update
router.post("/insert", controller.insert_new_bill.bind(controller));
router.patch("/update", controller.update_exist_bill.bind(controller));
router.patch("/reset", controller.reset.bind(controller));
router.post("/collect-bill", controller.collect_bill.bind(controller));

router.get("/query-one", controller.query_a_bill.bind(controller));
router.get("/query-all", controller.query_all_bills.bind(controller));
router.get("/query-by-owner", controller.query_by_owner.bind(controller));
router.get("/query-with-filter", controller.query_with_filter.bind(controller));
router.get("/query-all-collected", controller.query_sum_all.bind(controller));

// Bill Configuration Routes (Admin/Manager only)
/**
 * @swagger
 * /bills/setup:
 *   post:
 *     summary: Create a new bill configuration (admin/manager only)
 *     tags: [Bills]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [period, services]
 *             properties:
 *               period:
 *                 type: string
 *                 example: "2025-01"
 *               services:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "Điện"
 *                     unit_cost:
 *                       type: number
 *                       example: 3500
 *                     number_of_units:
 *                       type: number
 *                       example: 150
 *                     unit:
 *                       type: string
 *                       example: "kWh"
 *     responses:
 *       200:
 *         description: Bill configuration created successfully
 *       500:
 *         description: Error creating configuration
 */
router.post("/setup", verifyToken, requireAdminOrManager, controller.setupBills.bind(controller));

/**
 * @swagger
 * /bills/publish:
 *   post:
 *     summary: Publish bill configuration and notify all clients
 *     tags: [Bills]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [configId]
 *             properties:
 *               configId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Configuration published and clients notified
 *       500:
 *         description: Error publishing configuration
 */
router.post("/publish", verifyToken, requireAdminOrManager, controller.publishBillConfiguration.bind(controller));

// Residents submit measured units for configurable services (e.g., water, parking)
router.post('/submit-units', verifyToken, controller.submitUnits.bind(controller));
// Bulk submit measured units (CSV/Excel import -> parsed on client)
router.post('/submit-bills', verifyToken, controller.submitBulk.bind(controller));

// Export bills (CSV) - admin/manager only
router.get('/export', verifyToken, requireAdminOrManager, controller.exportBills.bind(controller));

// Enhanced bill analytics and management routes
router.get('/analytics', verifyToken, requireAdminOrManager, controller.getBillAnalytics.bind(controller));
router.get('/payment-stats', verifyToken, controller.getPaymentStats.bind(controller));
router.get('/apartment-history/:apt_id', verifyToken, controller.getApartmentBillHistory.bind(controller));
router.get('/overdue', verifyToken, requireAdminOrManager, controller.getOverdueBills.bind(controller));

router.patch('/mark-paid', verifyToken, requireAdminOrManager, controller.markBillAsPaid.bind(controller));
router.patch('/add-late-fee', verifyToken, requireAdminOrManager, controller.addLateFee.bind(controller));
router.patch('/apply-discount', verifyToken, requireAdminOrManager, controller.applyDiscount.bind(controller));
router.post('/send-reminder', verifyToken, requireAdminOrManager, controller.sendReminder.bind(controller));
router.patch('/update-status', verifyToken, requireAdminOrManager, controller.updateBillStatus.bind(controller));

/**
 * @swagger
 * /bills/config/{configId}:
 *   get:
 *     summary: Get a specific bill configuration
 *     tags: [Bills]
 *     parameters:
 *       - in: path
 *         name: configId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Bill configuration retrieved
 *       500:
 *         description: Configuration not found
 */
router.get("/config/:configId", controller.getBillConfiguration.bind(controller));

/**
 * @swagger
 * /bills/configs:
 *   get:
 *     summary: Get all bill configurations (optional status filter)
 *     tags: [Bills]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, active, completed]
 *     responses:
 *       200:
 *         description: List of bill configurations
 *       500:
 *         description: Error retrieving configurations
 */
router.get("/configs", controller.getAllBillConfigurations.bind(controller));

// Return available billing periods
router.get("/periods", controller.getAvailablePeriods.bind(controller));

// Aggregated summary per period
router.get("/summary", controller.summary.bind(controller));

/**
 * @swagger
 * /bills/config/{configId}:
 *   patch:
 *     summary: Update bill configuration (admin/manager only, draft status only)
 *     tags: [Bills]
 *     parameters:
 *       - in: path
 *         name: configId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               period:
 *                 type: string
 *               services:
 *                 type: array
 *     responses:
 *       200:
 *         description: Configuration updated
 *       500:
 *         description: Error updating configuration
 */
router.patch("/config/:configId", verifyToken, requireAdminOrManager, controller.updateBillConfiguration.bind(controller));

/**
 * @swagger
 * /bills/config/{configId}:
 *   delete:
 *     summary: Delete bill configuration (admin/manager only, draft status only)
 *     tags: [Bills]
 *     parameters:
 *       - in: path
 *         name: configId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Configuration deleted
 *       500:
 *         description: Error deleting configuration
 */
router.delete("/config/:configId", verifyToken, requireAdminOrManager, controller.deleteBillConfiguration.bind(controller));

module.exports = router;