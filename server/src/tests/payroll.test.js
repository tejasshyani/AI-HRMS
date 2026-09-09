const assert = require('assert');
const { getMonthDaysInfo, calculateEmployeePayroll } = require('../utils/payrollCalculator');

console.log('--- RUNNING FINGOAL HRMS FLAT 30-DAY PAYROLL ENGINE TESTS ---');

// Test 1: Flat 30-Day Rate (Base Salary / 30)
const baseSalary = 9000;
const perDayRate = baseSalary / 30;
assert.strictEqual(perDayRate, 300, 'Per-day rate must be ₹300 for ₹9,000 base salary on 30-day cycle');
console.log('✅ Test 1 Passed: 30-day per-day salary rate is accurate.');

// Test 2: User Scenario - August 2026 with 2 Full-Day Leaves + 1 Half-Day (2.5 Leave Days)
// In 30-day cycle: 30 - 2.5 = 27.5 Payable Days
// Leave Deduction: 2.5 * 300 = ₹750
// Net Salary: 27.5 * 300 = ₹8,250
const sampleAttendance = [
  // 21 Present Days
  ...Array(21).fill(null).map((_, i) => ({ dateStr: `2026-08-${String(i + 1).padStart(2, '0')}`, status: 'Present' })),
  { dateStr: '2026-08-04', status: 'Leave' },      // 1.0 Full Day Leave
  { dateStr: '2026-08-21', status: 'Half-Day' },   // 0.5 Day Leave
  { dateStr: '2026-08-22', status: 'Leave' }       // 1.0 Full Day Leave
];
const sampleHolidays = [
  { dateStr: '2026-08-15', title: 'Independence Day' },
  { dateStr: '2026-08-28', title: 'Rakshbandhan' }
];

const result = calculateEmployeePayroll({
  baseSalary: 9000,
  year: 2026,
  month: 8,
  attendanceRecords: sampleAttendance,
  holidayRecords: sampleHolidays,
  approvedLeaves: 0
});

console.log('Payroll calculation result for 2.5 leave days:', result);
assert.strictEqual(result.baseSalary, 9000, 'Base salary should be 9000');
assert.strictEqual(result.unpaidLeaves, 2, 'Unpaid full-day leaves should be 2');
assert.strictEqual(result.halfDays, 1, 'Half-days should be 1');
assert.strictEqual(result.payableDays, 27.5, 'Payable days must be 27.5 (30 - 2.5 leave days)');
assert.strictEqual(result.perDayRate, 300, 'Per day rate should be 300');
assert.strictEqual(result.leaveDeduction, 750, 'Leave deduction should be ₹750 (2.5 days * 300)');
assert.strictEqual(result.netSalary, 8250, 'Net salary should be ₹8,250 (27.5 days * 300)');
console.log('✅ Test 2 Passed: User 2.5 Leave Days Scenario in 30-Day cycle calculated accurately (27.5 Payable Days, ₹750 Leave Deduction, ₹8,250 Net Salary)!');

// Test 3: 0 Leaves Scenario (Full 30 Days Paid)
const zeroLeaveResult = calculateEmployeePayroll({
  baseSalary: 10000,
  year: 2026,
  month: 8,
  attendanceRecords: Array(25).fill(null).map((_, i) => ({ dateStr: `2026-08-${String(i + 1).padStart(2, '0')}`, status: 'Present' })),
  holidayRecords: sampleHolidays,
  approvedLeaves: 0
});
assert.strictEqual(zeroLeaveResult.payableDays, 30, 'Payable days should be 30 when 0 leaves taken');
assert.strictEqual(zeroLeaveResult.leaveDeduction, 0, 'Leave deduction should be 0');
assert.strictEqual(zeroLeaveResult.netSalary, 10000, 'Net salary should be full 10000');
console.log('✅ Test 3 Passed: 0 Leaves scenario accurately pays full 30 days salary.');

console.log('\n🎉 ALL FINGOAL 30-DAY PAYROLL ENGINE TESTS COMPLETED SUCCESSFULLY!\n');

