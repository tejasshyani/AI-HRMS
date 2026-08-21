const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { authenticate, adminOnly } = require('../middleware/auth');

// All employee routes require authentication
router.use(authenticate);

// Get employee directory
router.get('/', employeeController.getAllEmployees);
router.get('/:id', employeeController.getEmployeeById);

// Admin-only management routes
router.post('/', adminOnly, employeeController.createEmployee);
router.put('/:id', adminOnly, employeeController.updateEmployee);
router.patch('/:id/salary', adminOnly, employeeController.updateBaseSalary);
router.patch('/:id/status', adminOnly, employeeController.toggleEmployeeStatus);
router.delete('/:id', adminOnly, employeeController.deleteEmployee);

module.exports = router;
