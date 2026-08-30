const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword
} = require('../controllers/userController');

// All routes require authentication and admin privileges
router.use(verifyToken);
router.use(requireAdmin);

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination and filters
 * @access  Admin
 * @query   page, limit, search, role
 */
router.get('/', getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Admin
 */
router.get('/:id', getUserById);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Admin
 * @body    email, password, username, full_name, role, apartment_number
 */
router.post('/', createUser);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Admin
 * @body    username, full_name, role, apartment_number, email, password
 */
router.put('/:id', updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Admin
 */
router.delete('/:id', deleteUser);

/**
 * @route   POST /api/users/:id/reset-password
 * @desc    Reset user password
 * @access  Admin
 * @body    password
 */
router.post('/:id/reset-password', resetUserPassword);

module.exports = router;
