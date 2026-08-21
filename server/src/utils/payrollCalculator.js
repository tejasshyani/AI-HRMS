/**
 * FinGoal HRMS Flat 30-Day Payroll Calculation Engine with Tiered Loan Incentives
 * 
 * Business Rules & Formulas:
 * - Standard Calculation Basis: Fixed 30 Days per Month
 * - Work Week: Monday to Saturday (10:00 AM – 06:00 PM)
 * - Half-Day Shift: 02:00 PM – 06:00 PM (0.5 Payable Day)
 * - Flat Salary Mode: Base Monthly Salary / 30 Days (Deductions strictly for unpaid leaves)
 * - Loan Incentives Slabs:
 *     > 50 Lakhs: 0.50%
 *     > 40 Lakhs: 0.40%
 *     > 30 Lakhs: 0.30%
 *     > 20 Lakhs: 0.20%
 *     > 10 Lakhs: 0.10%
 * 
 * Formulas:
 * 1. Total Working / Calculation Days = 30 Days (Fixed)
 * 2. Per-Day Salary Rate = Base Monthly Salary / 30
 * 3. Payable Days = Days Present + (0.5 * Half-Days) + Paid Holidays + Paid Leaves
 * 4. Leave Deduction = (30 - Payable Days) * Per-Day Salary Rate
 * 5. Net Monthly Salary = (Payable Days * Per-Day Salary Rate) + Total Incentive Earned
 */

function getMonthDaysInfo(year, month) {
  const daysInMonth = new Date(year, month, 0).getDate();
  let sundaysCount = 0;
  const sundayDates = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    if (date.getDay() === 0) { // 0 is Sunday
      sundaysCount++;
      const mm = String(month).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      sundayDates.push(`${year}-${mm}-${dd}`);
    }
  }

  return {
    totalCalendarDays: 30,
    totalSundays: sundaysCount,
    standardWorkingDays: 30,
    actualDaysInMonth: daysInMonth,
    sundayDates
  };
}

function calculateEmployeePayroll({
  baseSalary,
  year,
  month,
  attendanceRecords = [],
  holidayRecords = [],
  incentiveRecords = [],
  approvedLeaves = 0
}) {
  const standardDays = 30;

  // Fixed 30-Day Per-Day Rate = Base Monthly Salary / 30
  const perDayRate = baseSalary / 30;

  // Tally Attendance Records in that month
  let presentDays = 0;
  let halfDays = 0;
  let unpaidLeaves = 0;

  const monthStr = String(month).padStart(2, '0');
  const monthPrefix = `${year}-${monthStr}`;

  attendanceRecords.forEach(att => {
    if (att.dateStr && att.dateStr.startsWith(monthPrefix)) {
      if (att.status === 'Present') {
        presentDays++;
      } else if (att.status === 'Half-Day') {
        halfDays++;
      } else if (att.status === 'Absent' || att.status === 'Leave') {
        unpaidLeaves++;
      }
    }
  });

  // Count Paid Holidays in the month (excluding Sundays)
  let paidHolidays = 0;
  holidayRecords.forEach(h => {
    const hDateStr = h.dateStr || (h.date ? new Date(h.date).toISOString().split('T')[0] : '');
    if (hDateStr && hDateStr.startsWith(monthPrefix)) {
      const hDate = new Date(hDateStr);
      if (hDate.getDay() !== 0) {
        paidHolidays++;
      }
    }
  });

  const paidLeaves = approvedLeaves;

  // Payable Days = Days Present + (0.5 * Half-Days) + Paid Holidays + Paid Leaves
  const rawPayableDays = presentDays + (0.5 * halfDays) + paidHolidays + paidLeaves;
  const payableDays = Math.min(rawPayableDays, standardDays);

  // Tally Loan Disbursements and Incentives for this month
  let totalLoanDisbursed = 0;
  let totalIncentive = 0;

  incentiveRecords.forEach(inc => {
    const incMonth = Number(inc.month);
    const incYear = Number(inc.year);
    if (incMonth === Number(month) && incYear === Number(year)) {
      totalLoanDisbursed += (Number(inc.loanAmount) || 0);
      totalIncentive += (Number(inc.incentiveAmount) || 0);
    }
  });

  // Flat 30-day calculation: Deduct ONLY for unpaid leaves
  const baseEarned = Math.max(0, Math.round(payableDays * perDayRate));
  const leaveDeduction = Math.max(0, Math.round((standardDays - payableDays) * perDayRate));
  
  // Net Salary = Base Salary Earned + Total Incentive
  const netSalary = baseEarned + totalIncentive;
  const grossPay = baseSalary + totalIncentive;

  return {
    totalCalendarDays: 30,
    totalSundays: 4,
    totalWorkingDays: 30,
    presentDays,
    halfDays,
    paidHolidays,
    paidLeaves,
    unpaidLeaves,
    payableDays: Number(payableDays.toFixed(2)),
    baseSalary,
    perDayRate: Number(perDayRate.toFixed(2)),
    grossPay,
    leaveDeduction,
    totalLoanDisbursed,
    totalIncentive,
    incentiveCount: incentiveRecords.length,
    deductions: {
      leaveDeductions: leaveDeduction,
      pf: 0,
      pt: 0,
      tds: 0,
      lwf: 0,
      esic: 0,
      total: leaveDeduction
    },
    allowances: {
      incentive: totalIncentive,
      hra: 0,
      da: 0,
      special: 0,
      conveyance: 0,
      medical: 0,
      total: totalIncentive
    },
    netSalary
  };
}

module.exports = {
  getMonthDaysInfo,
  calculateEmployeePayroll
};
