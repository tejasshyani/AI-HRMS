const bcrypt = require('bcryptjs');
const Store = require('../utils/dataStore');

// Get all employees (Admin & Employee directory)
exports.getAllEmployees = async (req, res) => {
  try {
    const { search, department, role, isActive } = req.query;
    let users = await Store.findUsers();

    if (search) {
      const q = search.toLowerCase();
      users = users.filter(u =>
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.designation && u.designation.toLowerCase().includes(q)) ||
        (u.department && u.department.toLowerCase().includes(q))
      );
    }

    if (department && department !== 'All') {
      users = users.filter(u => u.department === department);
    }

    if (role && role !== 'All') {
      users = users.filter(u => u.role === role);
    }

    if (isActive !== undefined && isActive !== 'All') {
      const activeBool = isActive === 'true' || isActive === true;
      users = users.filter(u => u.isActive === activeBool);
    }

    // Strip passwords
    const sanitized = users.map(u => {
      const copy = { ...(u._doc || u) };
      delete copy.passwordHash;
      return copy;
    });

    res.json({
      success: true,
      count: sanitized.length,
      employees: sanitized
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get employee by ID
exports.getEmployeeById = async (req, res) => {
  try {
    const user = await Store.findUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const copy = { ...(user._doc || user) };
    delete copy.passwordHash;

    res.json({
      success: true,
      employee: copy
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create new employee (Admin)
exports.createEmployee = async (req, res) => {
  try {
    const {
      fullName,
      email,
      username,
      employeeId,
      password,
      phone,
      role = 'employee',
      baseSalary = 50000,
      department = 'Finance',
      designation = 'Financial Analyst',
      experienceYears = 2.5,
      joiningDate
    } = req.body;

    if (!fullName || !email || !username) {
      return res.status(400).json({
        success: false,
        message: 'Full Name, Email, and Username are required.'
      });
    }

    const existing = await Store.findUserByEmailOrUsername(email);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email or username already exists.'
      });
    }

    const finalEmpId = employeeId ? employeeId.toString().trim() : await Store.generateUniqueEmployeeId();

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password || 'FinGoal@123', salt);

    const newUser = await Store.createUser({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      username: username.toLowerCase().trim(),
      employeeId: finalEmpId,
      passwordHash,
      phone: phone || '',
      role: role || 'employee',
      baseSalary: Number(baseSalary) || 50000,
      department,
      designation,
      experienceYears: Number(experienceYears) || 2.5,
      joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
      isActive: true,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`
    });

    const copy = { ...(newUser._doc || newUser) };
    delete copy.passwordHash;

    res.status(201).json({
      success: true,
      message: `Employee created successfully with ID #${finalEmpId}.`,
      employee: copy
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update employee
exports.updateEmployee = async (req, res) => {
  try {
    const {
      fullName,
      email,
      employeeId,
      phone,
      role,
      baseSalary,
      department,
      designation,
      isActive,
      experienceYears,
      password,
      newPassword
    } = req.body;

    const updateData = {};
    if (fullName) updateData.fullName = fullName.trim();
    if (email) updateData.email = email.toLowerCase().trim();
    if (employeeId) updateData.employeeId = employeeId.toString().trim();
    if (phone !== undefined) updateData.phone = phone;
    if (role) updateData.role = role;
    if (baseSalary !== undefined) updateData.baseSalary = Number(baseSalary);
    if (department) updateData.department = department;
    if (designation) updateData.designation = designation;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (experienceYears !== undefined) updateData.experienceYears = Number(experienceYears);

    // If new password is provided, hash and update
    const pwdToUpdate = password || newPassword;
    if (pwdToUpdate && pwdToUpdate.trim()) {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(pwdToUpdate.trim(), salt);
    }

    const updated = await Store.updateUserById(req.params.id, updateData);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const copy = { ...(updated._doc || updated) };
    delete copy.passwordHash;

    res.json({
      success: true,
      message: 'Employee updated successfully.',
      employee: copy
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Configure Base Monthly Salary (Dedicated Admin Endpoint)
exports.updateBaseSalary = async (req, res) => {
  try {
    const { baseSalary } = req.body;
    if (baseSalary === undefined || isNaN(baseSalary) || Number(baseSalary) < 0) {
      return res.status(400).json({
        success: false,
        message: 'A valid positive Base Monthly Salary amount is required.'
      });
    }

    const updated = await Store.updateUserById(req.params.id, {
      baseSalary: Number(baseSalary)
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.json({
      success: true,
      message: `Base monthly salary updated to ₹${Number(baseSalary).toLocaleString()}`,
      employee: {
        _id: updated._id,
        fullName: updated.fullName,
        baseSalary: updated.baseSalary
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle Active Status
exports.toggleEmployeeStatus = async (req, res) => {
  try {
    const user = await Store.findUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const newStatus = !user.isActive;
    const updated = await Store.updateUserById(req.params.id, { isActive: newStatus });

    res.json({
      success: true,
      message: `Employee ${updated.fullName} is now ${newStatus ? 'Active' : 'Inactive'}`,
      isActive: newStatus
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Employee
exports.deleteEmployee = async (req, res) => {
  try {
    const deleted = await Store.deleteUserById(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.json({
      success: true,
      message: `Employee '${deleted.fullName}' deleted successfully.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
