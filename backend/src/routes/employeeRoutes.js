const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  resetEmployeePassword,
  getEmployeeByUserId
} = require('../controllers/employeeController');

// All routes require authentication and admin privileges
router.use(verifyToken);
router.use(requireAdmin);

/**
 * @route   GET /api/employees
 * @desc    Get all employees with pagination and filters
 * @access  Admin
 * @query   page, limit, search, role, status
 */
router.get('/', getAllEmployees);

/**
 * @route   GET /api/employees/:id
 * @desc    Get employee by ID
 * @access  Admin
 */
router.get('/:id', getEmployeeById);

/**
 * @route   GET /api/employees/user/:userId
 * @desc    Get employee by user_id
 * @access  Admin
 */
router.get('/user/:userId', getEmployeeByUserId);

/**
 * @route   POST /api/employees
 * @desc    Create new employee
 * @access  Admin
 * @body    email, password, full_name, phone, role, notes
 */
router.post('/', createEmployee);

/**
 * @route   PUT /api/employees/:id
 * @desc    Update employee
 * @access  Admin
 * @body    full_name, phone, role, status, notes
 */
router.put('/:id', updateEmployee);

/**
 * @route   DELETE /api/employees/:id
 * @desc    Delete employee
 * @access  Admin
 */
router.delete('/:id', deleteEmployee);

/**
 * @route   POST /api/employees/:id/reset-password
 * @desc    Reset employee password
 * @access  Admin
 * @body    password
 */
router.post('/:id/reset-password', resetEmployeePassword);

module.exports = router;
