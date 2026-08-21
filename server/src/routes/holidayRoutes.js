const express = require('express');
const router = express.Router();
const holidayController = require('../controllers/holidayController');
const { authenticate, adminOnly } = require('../middleware/auth');

router.use(authenticate);

// View Holidays (All authenticated users)
router.get('/', holidayController.getAllHolidays);
router.get('/upcoming', holidayController.getUpcomingHolidays);

// Admin Holidays Management
router.post('/', adminOnly, holidayController.createHoliday);
router.put('/:id', adminOnly, holidayController.updateHoliday);
router.delete('/:id', adminOnly, holidayController.deleteHoliday);

module.exports = router;
