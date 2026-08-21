export interface User {
  _id: string;
  employeeId?: string;
  fullName: string;
  email: string;
  username: string;
  phone?: string;
  role: 'admin' | 'employee';
  baseSalary: number;
  joiningDate?: string | Date;
  department?: string;
  designation?: string;
  isActive: boolean;
  avatar?: string;
  experienceYears?: number;
  leaveBalances?: {
    casualLeave: number;
    casualLeaveUsed: number;
    sickLeave: number;
    sickLeaveUsed: number;
    earnedLeave: number;
    earnedLeaveUsed: number;
    compOff: number;
    compOffUsed: number;
  };
  punctualityScore?: number;
  riskCategory?: 'Low Risk' | 'Medium Risk' | 'High Risk';
}

export interface AttendanceRecord {
  _id?: string;
  userId: string | Partial<User>;
  date: string | Date;
  dateStr: string; // YYYY-MM-DD
  checkInTime?: string;
  checkOutTime?: string;
  status: 'Present' | 'Half-Day' | 'Leave' | 'Absent';
  remarks?: string;
  breakMinutes?: number;
  overtimeHours?: number;
  loggedBy?: 'Self' | 'Admin' | 'System';
}

export interface Holiday {
  _id?: string;
  title: string;
  date: string | Date;
  dateStr: string;
  isRecurring: boolean;
  category: 'National Holiday' | 'Public Holiday' | 'Company Holiday' | 'Observance';
  description?: string;
}

export interface PayrollRecord {
  _id?: string;
  userId: string | Partial<User>;
  month: number;
  year: number;
  monthName?: string;
  totalCalendarDays: number;
  totalSundays: number;
  totalWorkingDays: number;
  presentDays: number;
  halfDays: number;
  paidHolidays: number;
  paidLeaves: number;
  unpaidLeaves: number;
  payableDays: number;
  baseSalary: number;
  perDayRate: number;
  grossPay: number;
  allowances?: {
    hra: number;
    specialAllowance: number;
    transport: number;
    bonus: number;
    total: number;
  };
  deductions?: {
    pf: number;
    pt: number;
    tds: number;
    lwf: number;
    esic: number;
    unpaidLeaveDeduction: number;
    total: number;
  };
  netSalary: number;
  status: 'Draft' | 'Generated' | 'Paid';
  paymentDateStr?: string;
  generatedAt?: string | Date;
}

export interface IncentiveRecord {
  _id?: string;
  userId: string | Partial<User>;
  month: number;
  year: number;
  loanAmount: number;
  customerName?: string;
  loanAccountNo?: string;
  loanType?: string;
  disbursedDate?: string | Date;
  dateStr: string;
  slabPercentage: number;
  incentiveAmount: number;
  remarks?: string;
  status?: string;
  loggedBy?: string;
  createdAt?: string | Date;
}

