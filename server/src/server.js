require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { connectDB, getDBStatus } = require('./config/db');
const Store = require('./utils/dataStore');

// Route imports
const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const holidayRoutes = require('./routes/holidayRoutes');
const payrollRoutes = require('./routes/payrollRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const incentiveRoutes = require('./routes/incentiveRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-user-role']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/incentives', incentiveRoutes);

// Health Check & System Status
app.get('/api/health', async (req, res) => {
  const userCount = await Store.countUsers();
  const holidays = await Store.findHolidays();
  const attendance = await Store.findAttendance();

  res.json({
    status: 'online',
    appName: 'FinGoal HRMS REST API (Clean Mode)',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    database: getDBStatus(),
    recordsCount: {
      users: userCount,
      holidays: holidays.length,
      attendance: attendance.length
    }
  });
});

const path = require('path');
const fs = require('fs');

// Serve Angular static frontend in production if built
const clientDistPath = path.join(__dirname, '../../client/dist/fingoal-hrms/browser');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  // SPA fallback for all non-API routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  // Root route fallback if only running backend
  app.get('/', (req, res) => {
    res.json({
      message: 'Welcome to FinGoal HRMS API Engine (Clean Data Mode)',
      docs: '/api/health'
    });
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Initialize DB and Start Server
const startServer = async () => {
  await connectDB();
  
  const userCount = await Store.countUsers();
  console.log(`[FinGoal Server] Running in Clean Data Mode (${userCount} profiles active).`);

  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 FinGoal HRMS Backend API running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
    console.log(`✨ Direct Mode: Ready for actual Admin & Employee profiles`);
    console.log(`====================================================`);
  });
};

startServer();
