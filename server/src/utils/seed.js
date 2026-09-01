const { connectDB } = require('../config/db');
const Store = require('./dataStore');

const clearDatabase = async () => {
  await connectDB();
  console.log('[FinGoal HRMS] Resetting database to clean initial state (0 dummy records)...');

  // Reset collections
  Store.memoryStore.users = [];
  Store.memoryStore.attendance = [];
  Store.memoryStore.holidays = [];
  Store.memoryStore.payroll = [];
  Store.memoryStore.leaveRequests = [];

  console.log('[FinGoal HRMS] Database is now clean and ready for actual user registration.');
};

module.exports = clearDatabase;

if (require.main === module) {
  clearDatabase().then(() => process.exit(0));
}
