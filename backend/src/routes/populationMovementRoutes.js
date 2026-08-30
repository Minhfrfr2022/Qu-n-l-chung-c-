const express = require('express');
const router = express.Router();
const populationMovementController = require('../controllers/populationMovementController');

/**
 * @swagger
 * /population-movements:
 *   post:
 *     summary: Create a new population movement request
 *     tags: [Population Movements]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               resident_id:
 *                 type: string
 *               apt_id:
 *                 type: string
 *               movement_type:
 *                 type: string
 *                 description: Type of movement (temporary_absence, temporary_residency, permanent_move, etc.)
 *               reason:
 *                 type: string
 *               start_date:
 *                 type: string
 *                 format: date
 *               end_date:
 *                 type: string
 *                 format: date
 *               requested_by:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Population movement created
 */
router.post('/', populationMovementController.create);

/**
 * @swagger
 * /population-movements/apartment/{apt_id}:
 *   get:
 *     summary: Get population movements for an apartment
 *     tags: [Population Movements]
 *     parameters:
 *       - in: path
 *         name: apt_id
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status (pending, approved, rejected)
 *     responses:
 *       200:
 *         description: List of movements
 */
router.get('/apartment/:apt_id', populationMovementController.listByApartment);

/**
 * @swagger
 * /population-movements/resident/{resident_id}:
 *   get:
 *     summary: Get population movements for a resident
 *     tags: [Population Movements]
 *     parameters:
 *       - in: path
 *         name: resident_id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: List of movements
 */
router.get('/resident/:resident_id', populationMovementController.listByResident);

/**
 * @swagger
 * /population-movements/pending:
 *   get:
 *     summary: Get all pending movements for admin approval
 *     tags: [Population Movements]
 *     responses:
 *       200:
 *         description: List of pending movements
 */
router.get('/pending', populationMovementController.getPending);

/**
 * @swagger
 * /population-movements:
 *   get:
 *     summary: Get all population movements or filter by status
 *     tags: [Population Movements]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: Filter by status (optional, returns all if not provided)
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', populationMovementController.getByStatus);

/**
 * @swagger
 * /population-movements/{id}:
 *   get:
 *     summary: Get a single population movement
 *     tags: [Population Movements]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Movement details
 */
router.get('/:id', populationMovementController.getById);

/**
 * @swagger
 * /population-movements/{id}/status:
 *   put:
 *     summary: Update movement status (approve/reject)
 *     tags: [Population Movements]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *               approved_by:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated
 */
router.put('/:id/status', populationMovementController.updateStatus);

/**
 * @swagger
 * /population-movements/{id}:
 *   delete:
 *     summary: Delete a population movement
 *     tags: [Population Movements]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Movement deleted
 */
router.delete('/:id', populationMovementController.delete);

module.exports = router;
