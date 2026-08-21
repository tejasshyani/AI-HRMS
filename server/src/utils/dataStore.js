const mongoose = require('mongoose');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Holiday = require('../models/Holiday');
const Payroll = require('../models/Payroll');
const LeaveRequest = require('../models/LeaveRequest');
const Incentive = require('../models/Incentive');
const { isUsingMemory } = require('../config/db');

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../../data');
const dataFilePath = path.join(dataDir, 'hrms_local_db.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  try { fs.mkdirSync(dataDir, { recursive: true }); } catch(e) {}
}

// In-Memory Data Store Collections (Fallback if live MongoDB is not running)
let memoryStore = {
  users: [],
  attendance: [],
  holidays: [],
  payroll: [],
  leaveRequests: [],
  incentives: []
};

const bcrypt = require('bcryptjs');

// Load saved data from file if present
const loadFromFile = () => {
  try {
    if (fs.existsSync(dataFilePath)) {
      const content = fs.readFileSync(dataFilePath, 'utf8');
      if (content) {
        const loaded = JSON.parse(content);
        memoryStore = {
          users: loaded.users || [],
          attendance: loaded.attendance || [],
          holidays: loaded.holidays || [],
          payroll: loaded.payroll || [],
          leaveRequests: loaded.leaveRequests || [],
          incentives: loaded.incentives || []
        };
      }
    }
    if (!memoryStore.users || memoryStore.users.length === 0) {
      const defaultHash = bcrypt.hashSync('Password@123', 10);
      memoryStore.users = [
        {
          _id: '6a86ba71e80d7d3d76d91cbc',
          employeeId: '1001',
          fullName: 'Tejas Patel',
          username: 'admin',
          email: 'admin@gmail.com',
          passwordHash: defaultHash,
          role: 'admin',
          department: 'Executive Management',
          designation: 'Head of HR & Admin',
          baseSalary: 0,
          isActive: true,
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tejas%20Patel',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: '6a86bab9e80d7d3d76d91cca',
          employeeId: '1002',
          fullName: 'Maulik Rupareliya',
          username: 'maulik',
          email: 'maulik@gmail.com',
          passwordHash: defaultHash,
          role: 'employee',
          department: 'Finance & Accounts',
          designation: 'Tally Caller',
          baseSalary: 20000,
          isActive: true,
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maulik%20Rupareliya',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      saveToFile();
    }
  } catch (err) {
    console.error('[DataStore] Error loading local DB file:', err.message);
  }
};

const saveToFile = () => {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(memoryStore, null, 2), 'utf8');
  } catch (err) {
    console.error('[DataStore] Error saving local DB file:', err.message);
  }
};

// Initialize load
loadFromFile();

// Helper ID generator for memory store
const generateId = () => new mongoose.Types.ObjectId().toString();

// Data Store Unified Facade
const Store = {
  get memoryStore() {
    return memoryStore;
  },
  saveToFile,
  
  // ================= USERS =================
  async findUsers(filter = {}) {
    if (!isUsingMemory()) {
      return await User.find(filter).sort({ createdAt: -1 });
    }
    return memoryStore.users.filter(u => {
      if (filter.role && u.role !== filter.role) return false;
      if (filter.isActive !== undefined && u.isActive !== filter.isActive) return false;
      if (filter.email && u.email.toLowerCase() !== filter.email.toLowerCase()) return false;
      if (filter.username && u.username.toLowerCase() !== filter.username.toLowerCase()) return false;
      return true;
    });
  },

  async findUserById(id) {
    if (!isUsingMemory()) {
      return await User.findById(id);
    }
    const idStr = id?.toString();
    return memoryStore.users.find(u => u._id.toString() === idStr) || null;
  },

  async generateUniqueEmployeeId() {
    let empId = '';
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 100) {
      empId = Math.floor(1000 + Math.random() * 9000).toString();
      const existing = await this.findUserByEmailOrUsername(empId);
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }
    return empId;
  },

  async findUserByEmailOrUsername(identifier) {
    if (!identifier) return null;
    const idClean = identifier.toString().trim();
    const idLower = idClean.toLowerCase();
    if (!isUsingMemory()) {
      return await User.findOne({
        $or: [
          { email: idLower },
          { username: idLower },
          { employeeId: idClean }
        ]
      });
    }
    return memoryStore.users.find(
      u => u.email.toLowerCase() === idLower || 
           u.username.toLowerCase() === idLower ||
           (u.employeeId && u.employeeId.toString() === idClean)
    ) || null;
  },

  async createUser(userData) {
    if (!userData.employeeId) {
      userData.employeeId = await this.generateUniqueEmployeeId();
    }
    if (!isUsingMemory()) {
      return await User.create(userData);
    }
    const user = {
      _id: userData._id || generateId(),
      employeeId: userData.employeeId,
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      department: userData.department || 'Finance',
      designation: userData.designation || 'Staff Member',
      baseSalary: userData.baseSalary || 50000,
      experienceYears: userData.experienceYears || 2.5,
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    memoryStore.users.push(user);
    saveToFile();
    return user;
  },

  async updateUserById(id, updateData) {
    if (!isUsingMemory()) {
      return await User.findByIdAndUpdate(id, updateData, { new: true });
    }
    const idStr = id?.toString();
    const index = memoryStore.users.findIndex(u => u._id.toString() === idStr);
    if (index === -1) return null;
    memoryStore.users[index] = {
      ...memoryStore.users[index],
      ...updateData,
      updatedAt: new Date()
    };
    saveToFile();
    return memoryStore.users[index];
  },

  async countUsers(filter = {}) {
    if (!isUsingMemory()) {
      return await User.countDocuments(filter);
    }
    return (await this.findUsers(filter)).length;
  },

  async deleteUserById(id) {
    if (!isUsingMemory()) {
      return await User.findByIdAndDelete(id);
    }
    const idStr = id?.toString();
    const index = memoryStore.users.findIndex(u => u._id.toString() === idStr);
    if (index !== -1) {
      const deleted = memoryStore.users.splice(index, 1)[0];
      // Clean associated attendance and payroll
      memoryStore.attendance = memoryStore.attendance.filter(a => a.userId.toString() !== idStr);
      memoryStore.payroll = memoryStore.payroll.filter(p => p.userId.toString() !== idStr);
      saveToFile();
      return deleted;
    }
    return null;
  },

  // ================= ATTENDANCE =================
  async findAttendance(filter = {}) {
    if (!isUsingMemory()) {
      const q = Attendance.find(filter).populate('userId', 'fullName email department designation avatar');
      return await q.sort({ dateStr: -1 });
    }
    return memoryStore.attendance
      .filter(a => {
        if (filter.userId && a.userId.toString() !== filter.userId.toString()) return false;
        if (filter.dateStr && a.dateStr !== filter.dateStr) return false;
        if (filter.status && a.status !== filter.status) return false;
        return true;
      })
      .map(a => {
        const user = memoryStore.users.find(u => u._id.toString() === a.userId.toString());
        return {
          ...a,
          userId: user ? {
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            department: user.department,
            designation: user.designation,
            avatar: user.avatar
          } : a.userId
        };
      });
  },

  async findAttendanceRecord(userId, dateStr) {
    if (!isUsingMemory()) {
      return await Attendance.findOne({ userId, dateStr });
    }
    const uStr = userId?.toString();
    return memoryStore.attendance.find(
      a => a.userId.toString() === uStr && a.dateStr === dateStr
    ) || null;
  },

  async upsertAttendance(attendanceData) {
    const rawUserId = (attendanceData.userId?._id || attendanceData.userId)?.toString();
    const cleanData = {
      ...attendanceData,
      userId: rawUserId
    };

    if (!isUsingMemory()) {
      let query;
      if (attendanceData._id && mongoose.Types.ObjectId.isValid(attendanceData._id)) {
        query = { _id: attendanceData._id };
      } else {
        query = { userId: rawUserId, dateStr: attendanceData.dateStr };
      }
      return await Attendance.findOneAndUpdate(
        query,
        { $set: cleanData },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    const uStr = rawUserId;
    const index = memoryStore.attendance.findIndex(
      a => (attendanceData._id && a._id.toString() === attendanceData._id.toString()) ||
           (a.userId.toString() === uStr && a.dateStr === attendanceData.dateStr)
    );
    let result;
    if (index >= 0) {
      memoryStore.attendance[index] = {
        ...memoryStore.attendance[index],
        ...cleanData,
        updatedAt: new Date()
      };
      result = memoryStore.attendance[index];
    } else {
      const record = {
        _id: attendanceData._id || generateId(),
        ...cleanData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      memoryStore.attendance.push(record);
      result = record;
    }
    saveToFile();
    return result;
  },

  async deleteAttendanceById(id) {
    if (!isUsingMemory()) {
      return await Attendance.findByIdAndDelete(id);
    }
    const idStr = id?.toString();
    const index = memoryStore.attendance.findIndex(a => a._id.toString() === idStr);
    if (index !== -1) {
      const deleted = memoryStore.attendance.splice(index, 1);
      saveToFile();
      return deleted[0];
    }
    return null;
  },

  // ================= HOLIDAYS =================
  async findHolidays(filter = {}) {
    if (!isUsingMemory()) {
      return await Holiday.find(filter).sort({ date: 1 });
    }
    return [...memoryStore.holidays].sort((a, b) => new Date(a.date) - new Date(b.date));
  },

  async findHolidayById(id) {
    if (!isUsingMemory()) {
      return await Holiday.findById(id);
    }
    const idStr = id?.toString();
    return memoryStore.holidays.find(h => h._id.toString() === idStr) || null;
  },

  async createHoliday(holidayData) {
    if (!isUsingMemory()) {
      return await Holiday.create(holidayData);
    }
    const holiday = {
      _id: holidayData._id || generateId(),
      ...holidayData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    memoryStore.holidays.push(holiday);
    saveToFile();
    return holiday;
  },

  async updateHolidayById(id, updateData) {
    if (!isUsingMemory()) {
      return await Holiday.findByIdAndUpdate(id, updateData, { new: true });
    }
    const idStr = id?.toString();
    const index = memoryStore.holidays.findIndex(h => h._id.toString() === idStr);
    if (index === -1) return null;
    memoryStore.holidays[index] = {
      ...memoryStore.holidays[index],
      ...updateData,
      updatedAt: new Date()
    };
    saveToFile();
    return memoryStore.holidays[index];
  },

  async deleteHolidayById(id) {
    if (!isUsingMemory()) {
      return await Holiday.findByIdAndDelete(id);
    }
    const idStr = id?.toString();
    const index = memoryStore.holidays.findIndex(h => h._id.toString() === idStr);
    if (index !== -1) {
      const deleted = memoryStore.holidays.splice(index, 1)[0];
      saveToFile();
      return deleted;
    }
    return null;
  },

  // ================= PAYROLL =================
  async findPayroll(filter = {}) {
    if (!isUsingMemory()) {
      return await Payroll.find(filter).populate('userId', 'fullName email department designation baseSalary avatar').sort({ createdAt: -1 });
    }
    return memoryStore.payroll
      .filter(p => {
        if (filter.month && p.month !== Number(filter.month)) return false;
        if (filter.year && p.year !== Number(filter.year)) return false;
        if (filter.userId && p.userId.toString() !== filter.userId.toString()) return false;
        return true;
      })
      .map(p => {
        const user = memoryStore.users.find(u => u._id.toString() === p.userId.toString());
        return {
          ...p,
          userId: user ? {
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            department: user.department,
            designation: user.designation,
            baseSalary: user.baseSalary,
            avatar: user.avatar
          } : p.userId
        };
      });
  },

  async findPayrollRecord(userId, month, year) {
    if (!isUsingMemory()) {
      return await Payroll.findOne({ userId, month, year }).populate('userId');
    }
    const uStr = userId?.toString();
    const rec = memoryStore.payroll.find(
      p => p.userId.toString() === uStr && p.month === Number(month) && p.year === Number(year)
    );
    if (!rec) return null;
    const user = memoryStore.users.find(u => u._id.toString() === uStr);
    return {
      ...rec,
      userId: user || rec.userId
    };
  },

  async upsertPayroll(payrollData) {
    if (!isUsingMemory()) {
      return await Payroll.findOneAndUpdate(
        { userId: payrollData.userId, month: payrollData.month, year: payrollData.year },
        payrollData,
        { upsert: true, new: true }
      ).populate('userId');
    }
    const uStr = payrollData.userId?.toString();
    const index = memoryStore.payroll.findIndex(
      p => p.userId.toString() === uStr && p.month === payrollData.month && p.year === payrollData.year
    );
    let result;
    if (index >= 0) {
      memoryStore.payroll[index] = {
        ...memoryStore.payroll[index],
        ...payrollData,
        updatedAt: new Date()
      };
      result = memoryStore.payroll[index];
    } else {
      const record = {
        _id: payrollData._id || generateId(),
        ...payrollData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      memoryStore.payroll.push(record);
      result = record;
    }
    saveToFile();
    return result;
  },

  // ================= LEAVE REQUESTS =================
  async findLeaveRequests(filter = {}) {
    if (!isUsingMemory()) {
      return await LeaveRequest.find(filter).populate('userId', 'fullName email department designation').sort({ createdAt: -1 });
    }
    return memoryStore.leaveRequests.map(l => {
      const user = memoryStore.users.find(u => u._id.toString() === l.userId.toString());
      return {
        ...l,
        userId: user ? {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          department: user.department,
          designation: user.designation
        } : l.userId
      };
    });
  },

  async createLeaveRequest(leaveData) {
    if (!isUsingMemory()) {
      return await LeaveRequest.create(leaveData);
    }
    const leave = {
      _id: leaveData._id || generateId(),
      ...leaveData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    memoryStore.leaveRequests.push(leave);
    saveToFile();
    return leave;
  },

  async updateLeaveRequest(id, updateData) {
    if (!isUsingMemory()) {
      return await LeaveRequest.findByIdAndUpdate(id, updateData, { new: true });
    }
    const idStr = id?.toString();
    const index = memoryStore.leaveRequests.findIndex(l => l._id.toString() === idStr);
    if (index === -1) return null;
    memoryStore.leaveRequests[index] = {
      ...memoryStore.leaveRequests[index],
      ...updateData,
      updatedAt: new Date()
    };
    saveToFile();
    return memoryStore.leaveRequests[index];
  },

  // ================= INCENTIVES & LOANS =================
  calculateIncentiveSlab(loanAmount) {
    const amount = Math.max(0, Number(loanAmount) || 0);
    let slabPercentage = 0;
    let slabName = 'No Tier (≤ 10 Lakhs)';

    if (amount > 5000000) {
      slabPercentage = 0.50;
      slabName = '> 50 Lakhs (0.50%)';
    } else if (amount > 4000000) {
      slabPercentage = 0.40;
      slabName = '> 40 Lakhs (0.40%)';
    } else if (amount > 3000000) {
      slabPercentage = 0.30;
      slabName = '> 30 Lakhs (0.30%)';
    } else if (amount > 2000000) {
      slabPercentage = 0.20;
      slabName = '> 20 Lakhs (0.20%)';
    } else if (amount > 1000000) {
      slabPercentage = 0.10;
      slabName = '> 10 Lakhs (0.10%)';
    }

    const incentiveAmount = Math.round((amount * slabPercentage) / 100);

    return {
      loanAmount: amount,
      slabPercentage,
      slabName,
      incentiveAmount
    };
  },

  async findIncentives(filter = {}) {
    if (!isUsingMemory()) {
      return await Incentive.find(filter).populate('userId', 'fullName email department designation avatar').sort({ dateStr: -1, createdAt: -1 });
    }
    return (memoryStore.incentives || [])
      .filter(inc => {
        if (filter.userId && inc.userId.toString() !== filter.userId.toString()) return false;
        if (filter.month && Number(inc.month) !== Number(filter.month)) return false;
        if (filter.year && Number(inc.year) !== Number(filter.year)) return false;
        return true;
      })
      .map(inc => {
        const user = memoryStore.users.find(u => u._id.toString() === inc.userId.toString());
        return {
          ...inc,
          userId: user ? {
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            department: user.department,
            designation: user.designation,
            avatar: user.avatar
          } : inc.userId
        };
      });
  },

  async saveIncentive(data) {
    const rawUserId = (data.userId?._id || data.userId)?.toString();
    const slab = this.calculateIncentiveSlab(data.loanAmount);

    const cleanData = {
      ...data,
      userId: rawUserId,
      slabPercentage: slab.slabPercentage,
      incentiveAmount: slab.incentiveAmount
    };

    if (!isUsingMemory()) {
      return await Incentive.create(cleanData);
    }

    const record = {
      _id: generateId(),
      ...cleanData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    memoryStore.incentives.push(record);
    saveToFile();
    return record;
  },

  async updateIncentiveById(id, data) {
    const rawUserId = (data.userId?._id || data.userId)?.toString();
    const slab = this.calculateIncentiveSlab(data.loanAmount);

    let month = data.month;
    let year = data.year;
    if (data.dateStr) {
      const parts = data.dateStr.split('-');
      if (parts.length === 3) {
        year = Number(parts[0]);
        month = Number(parts[1]);
      }
    }

    const cleanData = {
      ...data,
      userId: rawUserId,
      month: month || new Date().getMonth() + 1,
      year: year || new Date().getFullYear(),
      slabPercentage: slab.slabPercentage,
      incentiveAmount: slab.incentiveAmount,
      updatedAt: new Date()
    };

    if (!isUsingMemory()) {
      return await Incentive.findByIdAndUpdate(id, cleanData, { new: true });
    }

    const idStr = id?.toString();
    const index = memoryStore.incentives.findIndex(inc => inc._id.toString() === idStr);
    if (index !== -1) {
      memoryStore.incentives[index] = {
        ...memoryStore.incentives[index],
        ...cleanData
      };
      saveToFile();
      return memoryStore.incentives[index];
    }
    return null;
  },

  async deleteIncentiveById(id) {
    if (!isUsingMemory()) {
      return await Incentive.findByIdAndDelete(id);
    }
    const idStr = id?.toString();
    const index = memoryStore.incentives.findIndex(inc => inc._id.toString() === idStr);
    if (index !== -1) {
      const deleted = memoryStore.incentives.splice(index, 1);
      saveToFile();
      return deleted[0];
    }
    return null;
  },

  async getMonthlyIncentivesForUser(userId, month, year) {
    const filter = {
      userId,
      month: Number(month),
      year: Number(year)
    };
    const rawRecords = await this.findIncentives(filter);
    const totalLoanAmount = rawRecords.reduce((sum, r) => sum + (Number(r.loanAmount) || 0), 0);
    const slab = this.calculateIncentiveSlab(totalLoanAmount);
    const totalIncentive = slab.incentiveAmount;

    const records = rawRecords.map(r => {
      const loanAmt = Number(r.loanAmount) || 0;
      const loanIncentive = Math.round((loanAmt * slab.slabPercentage) / 100);
      const rObj = typeof r.toObject === 'function' ? r.toObject() : { ...r };
      return {
        ...rObj,
        slabPercentage: slab.slabPercentage,
        incentiveAmount: loanIncentive
      };
    });

    return {
      records,
      totalLoanAmount,
      totalIncentive,
      count: records.length
    };
  },

  // ================= RESET / CLEAR ALL =================
  async clearAllData() {
    if (!isUsingMemory()) {
      await User.deleteMany({});
      await Attendance.deleteMany({});
      await Holiday.deleteMany({});
      await Payroll.deleteMany({});
      await LeaveRequest.deleteMany({});
      await Incentive.deleteMany({});
    }
    memoryStore = {
      users: [],
      attendance: [],
      holidays: [],
      payroll: [],
      leaveRequests: [],
      incentives: []
    };
    saveToFile();
    return true;
  }
};

module.exports = Store;
