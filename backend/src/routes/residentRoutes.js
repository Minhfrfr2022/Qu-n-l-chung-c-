const express = require('express');
const router = express.Router();
const residentController = require('../controllers/residentController');

/**
 * @swagger
 * /residents/apartment/{apt_id}:
 *   get:
 *     summary: Get residents for an apartment
 *     tags: [Residents]
 *     parameters:
 *       - in: path
 *         name: apt_id
 *         schema:
 *           type: string
 *         required: true
 *         description: Apartment identifier
 *     responses:
 *       200:
 *         description: List of residents
 *       400:
 *         description: Bad request
 */
router.get('/apartment/:apt_id', residentController.list);

/**
 * @swagger
 * /residents/all:
 *   get:
 *     summary: Get all residents
 *     tags: [Residents]
 *     responses:
 *       200:
 *         description: List of residents
 */
router.get('/all', residentController.listAll);

/**
 * @swagger
 * /residents/user/{user_id}:
 *   get:
 *     summary: Get resident by user_id
 *     tags: [Residents]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: Resident data
 *       404:
 *         description: Resident not found
 */
router.get('/user/:user_id', residentController.getByUserId);

/**
 * @swagger
 * /residents:
 *   post:
 *     summary: Create a resident
 *     tags: [Residents]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               apt_id:
 *                 type: string
 *               full_name:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               is_owner:
 *                 type: boolean
 *               year_of_birth:
 *                 type: integer
 *               hometown:
 *                 type: string
 *               gender:
 *                 type: string
 *     responses:
 *       201:
 *         description: Resident created
 *       400:
 *         description: Bad request
 */
router.post('/', residentController.create);

/**
 * @swagger
 * /residents/{id}:
 *   put:
 *     summary: Update a resident
 *     tags: [Residents]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Resident id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               is_owner:
 *                 type: boolean
 *               yearOfBirth:
 *                 type: integer
 *               hometown:
 *                 type: string
 *               gender:
 *                 type: string
 *     responses:
 *       200:
 *         description: Resident updated
 *       400:
 *         description: Bad request
 */
router.put('/:id', residentController.update);

/**
 * @swagger
 * /residents/{id}/link-user:
 *   post:
 *     summary: Link resident to user account
 *     tags: [Residents]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Resident id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Resident linked to user
 *       400:
 *         description: Bad request
 */
router.post('/:id/link-user', residentController.linkToUser);

/**
 * @swagger
 * /residents/{id}:
 *   delete:
 *     summary: Delete a resident
 *     tags: [Residents]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Resident id
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               new_owner_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Resident deleted
 *       400:
 *         description: Bad request or owner transfer required
 */
router.delete('/:id', residentController.delete);

module.exports = router;
