const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');
const { authenticate, adminOnly } = require('../middleware/auth');

router.use(authenticate);

// Generate / Run Payroll (Admin)
router.post('/generate', adminOnly, payrollController.generatePayroll);

// Analytics & Dashboard Widgets (Admin & Overview)
router.get('/analytics', adminOnly, payrollController.getPayrollAnalytics);

// Export CSV (Admin)
router.get('/export/csv', adminOnly, payrollController.exportPayrollCSV);

// Payslip (Employee self-view 'me' or Admin view by userId)
router.get('/payslip/:userId/:month/:year', payrollController.getEmployeePayslip);

module.exports = router;
