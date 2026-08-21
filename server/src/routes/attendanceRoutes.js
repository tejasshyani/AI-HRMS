const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticate, adminOnly } = require('../middleware/auth');

router.use(authenticate);

// Employee Quick Actions
router.post('/clock-in', attendanceController.clockIn);
router.post('/clock-out', attendanceController.clockOut);
router.post('/log', attendanceController.logAttendance);
router.post('/bulk-log', attendanceController.bulkLogAttendance);

// View Queries
router.get('/my-attendance', attendanceController.getMyAttendance);
router.get('/master', adminOnly, attendanceController.getMasterAttendance);
router.get('/today-summary', attendanceController.getTodaySummary);

// Admin Override
router.put('/override/:id', adminOnly, attendanceController.adminOverride);

// Delete Attendance Record
router.delete('/:id', attendanceController.deleteAttendance);
router.post('/bulk-delete', attendanceController.bulkDeleteAttendance);

module.exports = router;
