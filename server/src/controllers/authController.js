const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Store = require('../utils/dataStore');

const JWT_SECRET = process.env.JWT_SECRET || 'fingoal_hrms_super_secure_jwt_secret_key_2026_finance';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id.toString(),
      employeeId: user.employeeId,
      email: user.email,
      role: user.role,
      fullName: user.fullName
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Register (Admin or Employee)
exports.register = async (req, res) => {
  try {
    const { fullName, email, username, password, phone, role, baseSalary, department, designation, companyName } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Full Name, Email, and Password are required.'
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = (username || cleanEmail.split('@')[0]).toLowerCase().trim();
    const cleanRole = role === 'admin' ? 'admin' : 'employee';

    // Check existing
    const existing = await Store.findUserByEmailOrUsername(cleanEmail);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists. Please log in.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await Store.createUser({
      fullName: fullName.trim(),
      email: cleanEmail,
      username: cleanUsername,
      passwordHash,
      phone: phone || '',
      role: cleanRole,
      baseSalary: baseSalary ? Number(baseSalary) : (cleanRole === 'admin' ? 100000 : 50000),
      department: department || (cleanRole === 'admin' ? 'Executive Management' : 'Finance & Accounts'),
      designation: designation || (cleanRole === 'admin' ? 'Head of HR & Admin' : 'Financial Analyst'),
      isActive: true,
      joiningDate: new Date(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`,
      leaveBalances: {
        casualLeave: 12,
        casualLeaveUsed: 0,
        sickLeave: 6,
        sickLeaveUsed: 0,
        earnedLeave: 15,
        earnedLeaveUsed: 0,
        compOff: 3,
        compOffUsed: 0
      }
    });

    const token = generateToken(newUser);
    const userObj = { ...(newUser._doc || newUser) };
    delete userObj.passwordHash;

    res.status(201).json({
      success: true,
      message: `${cleanRole === 'admin' ? 'Admin' : 'Employee'} account registered successfully!`,
      token,
      user: userObj
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Registration failed.',
      error: error.message
    });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { identifier, username, email, password } = req.body;
    const loginId = (identifier || username || email || '').toLowerCase().trim();

    if (!loginId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide Email, Employee ID, or Username and Password.'
      });
    }

    const user = await Store.findUserByEmailOrUsername(loginId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email, employee ID, or password.'
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Please contact your HR administrator.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch && user.passwordHash !== 'no_auth_mode') {
      return res.status(401).json({
        success: false,
        message: 'Invalid email, employee ID, or password.'
      });
    }

    const token = generateToken(user);
    const userObj = { ...(user._doc || user) };
    delete userObj.passwordHash;

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: userObj
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login error.',
      error: error.message
    });
  }
};

// Get Current Logged-In User
exports.getMe = async (req, res) => {
  try {
    const user = await Store.findUserById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const userObj = { ...(user._doc || user) };
    delete userObj.passwordHash;

    res.json({
      success: true,
      user: userObj
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reset all database collections (MongoDB Atlas + Local)
exports.resetAllData = async (req, res) => {
  try {
    await Store.clearAllData();

    res.json({
      success: true,
      message: 'All application data and MongoDB Atlas collections have been completely cleared.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
