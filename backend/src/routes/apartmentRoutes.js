const express = require('express');
const router = express.Router();
const {
  getAll,
  search,
  getById,
  create,
  update,
  delete: deleteApartment
} = require('../controllers/apartmentController');

/**
 * @swagger
 * tags:
 *   name: Apartments
 *   description: Quản lý thông tin căn hộ và cư dân
 */

/**
 * @swagger
 * /api/apartments:
 *   get:
 *     summary: Lấy danh sách tất cả căn hộ (phân trang)
 *     tags: [Apartments]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: page_size
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Danh sách căn hộ
 */
router.get('/', getAll);

/**
 * @swagger
 * /api/apartments/search:
 *   get:
 *     summary: Tìm kiếm căn hộ theo mã, tên chủ hộ hoặc số điện thoại
 *     tags: [Apartments]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Từ khóa tìm kiếm
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: page_size
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Kết quả tìm kiếm
 */
router.get('/search', search);

/**
 * @swagger
 * /api/apartments/{apt_id}:
 *   get:
 *     summary: Lấy thông tin chi tiết một căn hộ
 *     tags: [Apartments]
 *     parameters:
 *       - in: path
 *         name: apt_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thông tin căn hộ
 *       404:
 *         description: Căn hộ không tồn tại
 */
router.get('/:apt_id', getById);

/**
 * @swagger
 * /api/apartments:
 *   post:
 *     summary: Thêm mới một căn hộ
 *     tags: [Apartments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - apt_id
 *               - owner_name
 *             properties:
 *               apt_id:
 *                 type: string
 *                 example: "A101"
 *               floor:
 *                 type: integer
 *                 example: 10
 *               area:
 *                 type: number
 *                 example: 85.5
 *               owner_name:
 *                 type: string
 *               owner_phone:
 *                 type: string
 *               owner_email:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [occupied, vacant, rented]
 *     responses:
 *       201:
 *         description: Thêm căn hộ thành công
 */
router.post('/', create);

/**
 * @swagger
 * /api/apartments/{apt_id}:
 *   put:
 *     summary: Cập nhật thông tin căn hộ
 *     tags: [Apartments]
 *     parameters:
 *       - in: path
 *         name: apt_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/:apt_id', update);

/**
 * @swagger
 * /api/apartments/{apt_id}:
 *   delete:
 *     summary: Xóa một căn hộ
 *     tags: [Apartments]
 *     parameters:
 *       - in: path
 *         name: apt_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/:apt_id', deleteApartment);

module.exports = router;