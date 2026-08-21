const express = require('express');
const router = express.Router();
const incentiveController = require('../controllers/incentiveController');
const { authenticate, authorize } = require('../middleware/auth');

// Public preview calculation
router.get('/preview', incentiveController.calculatePreview);

// Protected routes
router.use(authenticate);

// Employee: View my incentives (Read-only)
router.get('/my-incentives', incentiveController.getMyIncentives);

// Admin Only: Submit new loan disbursement on behalf of any employee
router.post('/', authorize('admin'), incentiveController.submitIncentive);

// Admin Only: Update loan disbursement record
router.put('/:id', authorize('admin'), incentiveController.updateIncentive);

// Admin Only: View all company-wide incentives
router.get('/all', authorize('admin'), incentiveController.getAllIncentives);

// Admin Only: Delete incentive record
router.delete('/:id', authorize('admin'), incentiveController.deleteIncentive);

module.exports = router;
