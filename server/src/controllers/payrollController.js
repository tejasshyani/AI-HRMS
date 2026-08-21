const Store = require('../utils/dataStore');
const { calculateEmployeePayroll, getMonthDaysInfo } = require('../utils/payrollCalculator');

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Run / Generate Payroll for all active employees for a given month and year
exports.generatePayroll = async (req, res) => {
  try {
    const now = new Date();
    const { month = (now.getMonth() + 1), year = now.getFullYear(), employeeIds = [] } = req.body;
    const mNum = Number(month);
    const yNum = Number(year);

    // Only salaried staff (role === 'employee')
    let employees = await Store.findUsers({ isActive: true, role: 'employee' });
    if (employeeIds && employeeIds.length > 0) {
      employees = employees.filter(e => employeeIds.includes(e._id.toString()));
    }

    const holidays = await Store.findHolidays();
    const attendanceRecords = await Store.findAttendance();
    const incentiveRecords = await Store.findIncentives();

    const monthStr = String(mNum).padStart(2, '0');
    const monthName = `${MONTH_NAMES[mNum - 1]} ${yNum}`;

    const generatedResults = [];

    for (const emp of employees) {
      const uId = emp._id.toString();
      const userAttendance = attendanceRecords.filter(a => {
        const aUserId = (a.userId?._id || a.userId)?.toString();
        return aUserId === uId;
      });

      const userIncentives = incentiveRecords.filter(inc => {
        const incUserId = (inc.userId?._id || inc.userId)?.toString();
        return incUserId === uId;
      });

      const calc = calculateEmployeePayroll({
        baseSalary: emp.baseSalary || 50000,
        year: yNum,
        month: mNum,
        attendanceRecords: userAttendance,
        holidayRecords: holidays,
        incentiveRecords: userIncentives,
        approvedLeaves: 0
      });

      const payrollRecord = await Store.upsertPayroll({
        userId: emp._id,
        month: mNum,
        year: yNum,
        monthName,
        totalCalendarDays: calc.totalCalendarDays,
        totalSundays: calc.totalSundays,
        totalWorkingDays: calc.totalWorkingDays,
        presentDays: calc.presentDays,
        halfDays: calc.halfDays,
        paidHolidays: calc.paidHolidays,
        paidLeaves: calc.paidLeaves,
        unpaidLeaves: calc.unpaidLeaves,
        payableDays: calc.payableDays,
        baseSalary: calc.baseSalary,
        perDayRate: calc.perDayRate,
        grossPay: calc.grossPay,
        allowances: calc.allowances,
        deductions: calc.deductions,
        leaveDeduction: calc.leaveDeduction,
        totalLoanDisbursed: calc.totalLoanDisbursed,
        totalIncentive: calc.totalIncentive,
        netSalary: calc.netSalary,
        status: 'Generated',
        generatedAt: new Date(),
        paymentDateStr: `${MONTH_NAMES[mNum - 1]} 30, ${yNum}`
      });

      generatedResults.push({
        ...payrollRecord,
        employee: {
          _id: emp._id,
          fullName: emp.fullName,
          email: emp.email,
          department: emp.department,
          designation: emp.designation,
          avatar: emp.avatar
        }
      });
    }

    const totalPayout = generatedResults.reduce((acc, curr) => acc + curr.netSalary, 0);

    res.json({
      success: true,
      message: `Payroll processed successfully for ${generatedResults.length} employees (${monthName}).`,
      month: mNum,
      year: yNum,
      monthName,
      totalPayout,
      count: generatedResults.length,
      records: generatedResults
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Payroll Overview & Analytics (Dynamically computed from live attendance, holidays & incentives)
exports.getPayrollAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const { month = (now.getMonth() + 1), year = now.getFullYear() } = req.query;
    const mNum = Number(month);
    const yNum = Number(year);

    const employees = await Store.findUsers({ isActive: true, role: 'employee' });
    const holidays = await Store.findHolidays();
    const attendanceRecords = await Store.findAttendance();
    const incentiveRecords = await Store.findIncentives();

    const computedRecords = [];

    for (const emp of employees) {
      const uId = emp._id.toString();
      const userAttendance = attendanceRecords.filter(a => {
        const aUserId = (a.userId?._id || a.userId)?.toString();
        return aUserId === uId;
      });

      const userIncentives = incentiveRecords.filter(inc => {
        const incUserId = (inc.userId?._id || inc.userId)?.toString();
        return incUserId === uId;
      });

      const calc = calculateEmployeePayroll({
        baseSalary: emp.baseSalary || 50000,
        year: yNum,
        month: mNum,
        attendanceRecords: userAttendance,
        holidayRecords: holidays,
        incentiveRecords: userIncentives,
        approvedLeaves: 0
      });

      computedRecords.push({
        _id: emp._id,
        employeeName: emp.fullName || 'Staff Member',
        role: emp.role || 'employee',
        avatar: emp.avatar || '',
        salaryAmount: calc.baseSalary,
        totalWorkingDays: calc.totalWorkingDays,
        presentDays: calc.presentDays,
        halfDays: calc.halfDays,
        paidHolidays: calc.paidHolidays,
        payableDays: calc.payableDays,
        perDayRate: calc.perDayRate,
        leaveDeduction: calc.leaveDeduction,
        employeeDeduction: calc.leaveDeduction,
        totalLoanDisbursed: calc.totalLoanDisbursed,
        totalIncentive: calc.totalIncentive,
        incentiveCount: calc.incentiveCount,
        paymentAmount: calc.netSalary,
        netPayable: calc.netSalary,
        status: 'Calculated'
      });
    }

    const totalProcessed = computedRecords.reduce((sum, r) => sum + (r.netPayable || 0), 0);
    const totalDeductions = computedRecords.reduce((sum, r) => sum + (r.leaveDeduction || 0), 0);
    const totalLoansCompany = computedRecords.reduce((sum, r) => sum + (r.totalLoanDisbursed || 0), 0);
    const totalIncentivesCompany = computedRecords.reduce((sum, r) => sum + (r.totalIncentive || 0), 0);

    // Compliance stats
    const complianceData = {
      jan2026: {
        month: 'Jan - 2026',
        netPayableAmount: totalProcessed,
        challanAmount: totalProcessed,
        differenceAmount: 0,
        isCompliant: true,
        status: 'Compliance'
      },
      feb2026: {
        month: 'Feb - 2026',
        netPayableAmount: totalProcessed,
        challanAmount: totalProcessed,
        differenceAmount: 0,
        isCompliant: true,
        status: 'Compliance'
      }
    };

    res.json({
      success: true,
      month: mNum,
      year: yNum,
      paymentDate: `${MONTH_NAMES[mNum - 1]} 30, ${yNum}`,
      paymentStatus: 'Processed',
      totalEmployees: employees.length,
      newJoiners: employees.length,
      resigned: 0,
      totalLoansCompany,
      totalIncentivesCompany,
      lastSalaryProcessed: totalProcessed,
      nextEstimatedSalary: totalProcessed,
      complianceReport: complianceData,
      taxPayroll: computedRecords,
      records: computedRecords
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Payslip for an Employee (Always computed from live attendance & incentives)
exports.getEmployeePayslip = async (req, res) => {
  try {
    const now = new Date();
    const { userId, month = (now.getMonth() + 1), year = now.getFullYear() } = req.params;
    let targetUserId = userId;

    if (userId === 'me') {
      if (req.user && req.user._id) {
        targetUserId = req.user._id;
      } else {
        const allUsers = await Store.findUsers();
        if (allUsers.length > 0) {
          targetUserId = allUsers[0]._id;
        }
      }
    }

    let user = await Store.findUserById(targetUserId);
    if (!user) {
      const allUsers = await Store.findUsers();
      if (allUsers.length > 0) {
        user = allUsers[0];
        targetUserId = user._id;
      } else {
        return res.status(404).json({ success: false, message: 'Please register at least one profile first.' });
      }
    }

    const holidays = await Store.findHolidays();
    const allAttendance = await Store.findAttendance();
    const attendance = allAttendance.filter(a => {
      const aUserId = (a.userId?._id || a.userId)?.toString();
      return aUserId === targetUserId.toString();
    });

    const allIncentives = await Store.findIncentives();
    const userIncentives = allIncentives.filter(inc => {
      const incUserId = (inc.userId?._id || inc.userId)?.toString();
      return incUserId === targetUserId.toString();
    });

    const calc = calculateEmployeePayroll({
      baseSalary: user.baseSalary || 50000,
      year: Number(year),
      month: Number(month),
      attendanceRecords: attendance,
      holidayRecords: holidays,
      incentiveRecords: userIncentives,
      approvedLeaves: 0
    });

    const payroll = {
      userId: user._id,
      month: Number(month),
      year: Number(year),
      monthName: `${MONTH_NAMES[Number(month) - 1]} ${year}`,
      ...calc,
      status: 'Generated',
      generatedAt: new Date(),
      paymentDateStr: `${MONTH_NAMES[Number(month) - 1]} 30, ${year}`
    };

    const userObj = { ...(user._doc || user) };
    delete userObj.passwordHash;

    res.json({
      success: true,
      payslip: {
        ...payroll,
        employee: userObj,
        company: {
          name: 'FinGoal Financial Technologies Pvt Ltd',
          address: '406, Tapi Arcade, Abrama Road, Mota Varachha - 394101',
          pan: 'AAACF1234K',
          tan: 'MUMB12345F',
          email: 'payroll@fingoal.com',
          website: 'www.fingoal.com'
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Export Payroll CSV (Computed live)
exports.exportPayrollCSV = async (req, res) => {
  try {
    const now = new Date();
    const { month = (now.getMonth() + 1), year = now.getFullYear() } = req.query;
    const mNum = Number(month);
    const yNum = Number(year);

    const employees = await Store.findUsers({ isActive: true, role: 'employee' });
    const holidays = await Store.findHolidays();
    const attendanceRecords = await Store.findAttendance();
    const incentiveRecords = await Store.findIncentives();

    let csv = 'Employee ID,Full Name,Department,Base Salary,Standard Days,Payable Days,Per Day Rate,Gross Pay,Leave Deduction,Loan Disbursed,Incentive,Net Salary,Status\n';

    employees.forEach(emp => {
      const uId = emp._id.toString();
      const userAttendance = attendanceRecords.filter(a => {
        const aUserId = (a.userId?._id || a.userId)?.toString();
        return aUserId === uId;
      });

      const userIncentives = incentiveRecords.filter(inc => {
        const incUserId = (inc.userId?._id || inc.userId)?.toString();
        return incUserId === uId;
      });

      const calc = calculateEmployeePayroll({
        baseSalary: emp.baseSalary || 50000,
        year: yNum,
        month: mNum,
        attendanceRecords: userAttendance,
        holidayRecords: holidays,
        incentiveRecords: userIncentives,
        approvedLeaves: 0
      });

      csv += `"${emp._id || ''}","${emp.fullName || ''}","${emp.department || ''}",${calc.baseSalary || 0},${calc.totalWorkingDays || 0},${calc.payableDays || 0},${calc.perDayRate || 0},${calc.grossPay || 0},${calc.leaveDeduction || 0},${calc.totalLoanDisbursed || 0},${calc.totalIncentive || 0},${calc.netSalary || 0},"Calculated"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=FinGoal_Payroll_${MONTH_NAMES[Number(month) - 1]}_${year}.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
