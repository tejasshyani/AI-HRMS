import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { EmployeeDashboardComponent } from './pages/employee/dashboard/employee-dashboard.component';
import { AttendanceLogComponent } from './pages/employee/attendance-log/attendance-log.component';
import { AttendanceCalendarComponent } from './pages/employee/calendar/attendance-calendar.component';
import { MyPayslipsComponent } from './pages/employee/payslips/my-payslips.component';
import { AdminDashboardComponent } from './pages/admin/dashboard/admin-dashboard.component';
import { EmployeeDirectoryComponent } from './pages/admin/employees/employee-directory.component';
import { HolidayManagerComponent } from './pages/admin/holidays/holiday-manager.component';
import { MasterAttendanceComponent } from './pages/admin/attendance/master-attendance.component';
import { AdminCalendarComponent } from './pages/admin/calendar/admin-calendar.component';
import { PayrollDashboardComponent } from './pages/admin/payroll/payroll-dashboard.component';
import { AdminIncentivesComponent } from './pages/admin/incentives/admin-incentives.component';
import { EmployeeIncentivesComponent } from './pages/employee/incentives/employee-incentives.component';
import { authGuard, adminGuard, employeeGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Public Auth Routes
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // Admin Portal Routes
  { path: 'admin/dashboard', component: AdminDashboardComponent, canActivate: [adminGuard] },
  { path: 'admin/employees', component: EmployeeDirectoryComponent, canActivate: [adminGuard] },
  { path: 'admin/attendance', component: MasterAttendanceComponent, canActivate: [adminGuard] },
  { path: 'admin/calendar', component: AdminCalendarComponent, canActivate: [adminGuard] },
  { path: 'admin/holidays', component: HolidayManagerComponent, canActivate: [adminGuard] },
  { path: 'admin/payroll', component: PayrollDashboardComponent, canActivate: [adminGuard] },
  { path: 'admin/incentives', component: AdminIncentivesComponent, canActivate: [adminGuard] },

  // Employee Portal Routes
  { path: 'employee/dashboard', component: EmployeeDashboardComponent, canActivate: [employeeGuard] },
  { path: 'employee/attendance-log', component: AttendanceLogComponent, canActivate: [employeeGuard] },
  { path: 'employee/calendar', component: AttendanceCalendarComponent, canActivate: [employeeGuard] },
  { path: 'employee/incentives', component: EmployeeIncentivesComponent, canActivate: [employeeGuard] },
  { path: 'employee/payslips', component: MyPayslipsComponent, canActivate: [employeeGuard] },

  // Default redirect to login
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];
