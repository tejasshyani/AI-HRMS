const assert = require('assert');
const { getMonthDaysInfo, calculateEmployeePayroll } = require('../utils/payrollCalculator');

console.log('--- RUNNING FINGOAL HRMS PAYROLL ENGINE TESTS ---');

// Test 1: Month Days & Sundays for January 2026
// Jan 2026 has 31 days. Sundays in Jan 2026: Jan 4, 11, 18, 25 (4 Sundays)
const janInfo = getMonthDaysInfo(2026, 1);
console.log('Jan 2026 Info:', janInfo);
assert.strictEqual(janInfo.totalCalendarDays, 31, 'January 2026 must have 31 days');
assert.strictEqual(janInfo.totalSundays, 4, 'January 2026 must have 4 Sundays');
assert.strictEqual(janInfo.standardWorkingDays, 27, 'January 2026 standard working days must be 27 (31 - 4)');
console.log('✅ Test 1 Passed: Month Days and Sundays calculation is accurate.');

// Test 2: Per-Day Salary Rate
// For Base Salary ₹54,000 and 27 standard working days -> 54000 / 27 = ₹2,000 per day
const baseSalary = 54000;
const perDayRate = baseSalary / janInfo.standardWorkingDays;
assert.strictEqual(perDayRate, 2000, 'Per day rate must be ₹2,000 for ₹54,000 base salary in Jan 2026');
console.log('✅ Test 2 Passed: Per-day salary rate is accurate.');

// Test 3: Payable Days with Present, Half-Day, Public Holiday
// Present: 23 days, Half-Day: 2 (1 day equivalent), Paid Holiday: 1 (Jan 26 Republic Day), Paid Leaves: 1
// Expected Payable Days: 23 + (0.5 * 2) + 1 + 1 = 26 days
const sampleAttendance = [
  ...Array(23).fill(null).map((_, i) => ({ dateStr: `2026-01-${String(i + 1).padStart(2, '0')}`, status: 'Present' })),
  { dateStr: '2026-01-24', status: 'Half-Day' },
  { dateStr: '2026-01-27', status: 'Half-Day' },
  { dateStr: '2026-01-28', status: 'Leave' } // Unpaid or absent
];
const sampleHolidays = [
  { dateStr: '2026-01-26', title: 'Republic Day' }
];

const result = calculateEmployeePayroll({
  baseSalary: 54000,
  year: 2026,
  month: 1,
  attendanceRecords: sampleAttendance,
  holidayRecords: sampleHolidays,
  approvedLeaves: 1
});

console.log('Payroll calculation result:', result);
assert.strictEqual(result.totalWorkingDays, 27, 'Standard working days should be 27');
assert.strictEqual(result.presentDays, 23, 'Present days should be 23');
assert.strictEqual(result.halfDays, 2, 'Half-days should be 2');
assert.strictEqual(result.paidHolidays, 1, 'Paid holidays should be 1');
assert.strictEqual(result.paidLeaves, 1, 'Paid leaves should be 1');
assert.strictEqual(result.payableDays, 26, 'Payable days should be 26 (23 + 1 + 1 + 1)');
assert.strictEqual(result.perDayRate, 2000, 'Per day rate should be 2000');
assert.strictEqual(result.grossPay, 52000, 'Gross pay should be 26 * 2000 = 52000');
console.log('✅ Test 3 Passed: Comprehensive Payroll & Attendance formula passed all assertions!');

console.log('\n🎉 ALL FINGOAL PAYROLL ENGINE TESTS COMPLETED SUCCESSFULLY!\n');
