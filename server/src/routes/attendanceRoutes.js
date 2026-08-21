const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticate, adminOnly } = require('../middleware/auth');

router.use(authenticate);

// Employee Quick Actions
router.post('/clock-in', attendanceController.clockIn);
router.post('/clock-out', attendanceController.clockOut);
router.post('/log', attendanceController.logAttendance);

// View Queries
router.get('/my-attendance', attendanceController.getMyAttendance);
router.get('/master', adminOnly, attendanceController.getMasterAttendance);
router.get('/today-summary', attendanceController.getTodaySummary);

// Admin Override
router.put('/override/:id', adminOnly, attendanceController.adminOverride);

// Delete Attendance Record
router.delete('/:id', attendanceController.deleteAttendance);

module.exports = router;
