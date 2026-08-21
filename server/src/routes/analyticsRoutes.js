const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// Operations Dashboard Stats & Punctuality
router.get('/operations', analyticsController.getOperationsDashboard);

module.exports = router;
