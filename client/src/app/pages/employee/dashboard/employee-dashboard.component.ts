import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { AttendanceService } from '../../../services/attendance.service';
import { HolidayService } from '../../../services/holiday.service';
import { AnalyticsService } from '../../../services/analytics.service';
import { PayrollService } from '../../../services/payroll.service';
import { ToastService } from '../../../services/toast.service';
import { PayslipModalComponent } from '../../../components/payslip-modal/payslip-modal.component';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, PayslipModalComponent],
  template: `
    <div class="p-6 pb-12 space-y-6 max-w-7xl mx-auto">
      
      <!-- Top Welcome Banner & Clock Actions -->
      <div class="card p-6 bg-gradient-to-r from-white via-blue-50/40 to-indigo-50/40 border border-slate-200">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div class="flex items-center gap-4">
            <img 
              [src]="authService.currentUser()?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + (authService.currentUser()?.fullName || 'User')" 
              class="w-16 h-16 rounded-2xl bg-white border-2 border-white shadow-md object-cover" 
              alt="Avatar">
            <div>
              <div class="flex items-center gap-2">
                <h1 class="text-xl font-extrabold text-slate-900">{{ authService.currentUser()?.fullName || 'Employee' }}</h1>
                <span *ngIf="authService.currentUser()?.employeeId" class="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-mono text-xs font-bold border border-blue-200">
                  ID: #{{ authService.currentUser()?.employeeId }}
                </span>
                <span class="badge badge-present text-[10px]">Active</span>
              </div>
              <p class="text-xs text-slate-500 font-medium mt-0.5">
                {{ authService.currentUser()?.designation || 'Staff Member' }} • {{ authService.currentUser()?.department || 'Finance' }}
              </p>
              <div class="flex items-center gap-3 text-xs text-slate-400 mt-2">
                <span><i class="fa-regular fa-envelope mr-1 text-slate-400"></i>{{ authService.currentUser()?.email }}</span>
                <span>•</span>
                <span><i class="fa-solid fa-indian-rupee-sign mr-1 text-blue-600"></i>Base Salary: ₹{{ (authService.currentUser()?.baseSalary || 50000).toLocaleString() }}/mo</span>
              </div>
            </div>
          </div>

          <!-- Quick Action Buttons -->
          <div class="flex items-center gap-3">
            <button 
              (click)="onClockIn()" 
              [disabled]="todayCheckedIn" 
              class="btn btn-success text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs"
              [ngClass]="todayCheckedIn ? 'opacity-90 cursor-default' : ''">
              <i class="fa-solid fa-fingerprint"></i>
              <span>{{ todayCheckedIn ? 'Clocked In (' + checkInTime + ')' : 'Clock In' }}</span>
            </button>
            <button 
              (click)="onClockOut()" 
              [disabled]="todayCheckedOut"
              class="btn btn-secondary text-xs font-bold py-2.5 px-4 rounded-xl border border-slate-200 shadow-xs"
              [ngClass]="todayCheckedOut ? 'opacity-80 bg-slate-100 text-slate-500 cursor-default' : ''">
              <i class="fa-solid fa-arrow-right-from-bracket"></i>
              <span>{{ todayCheckedOut ? 'Clocked Out (' + checkOutTime + ')' : 'Clock Out' }}</span>
            </button>
            <button 
              (click)="openMyPayslip()" 
              class="btn btn-primary text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs">
              <i class="fa-solid fa-receipt"></i>
              <span>View Payslip</span>
            </button>
          </div>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <!-- Card 1: Days Present -->
        <div class="card p-5 flex items-center justify-between">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Days Present (This Month)</span>
            <div class="text-2xl font-black text-slate-900 mt-1">{{ presentDaysCount }} <span class="text-xs font-semibold text-slate-400">Days</span></div>
            <div class="text-[11px] text-emerald-600 font-bold mt-1">
              <i class="fa-solid fa-circle-check mr-1"></i>Logged in System
            </div>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg shadow-xs">
            <i class="fa-solid fa-calendar-check"></i>
          </div>
        </div>

        <!-- Card 2: Upcoming Holidays -->
        <div class="card p-5 flex items-center justify-between">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Upcoming Holiday</span>
            <div class="text-base font-extrabold text-slate-900 mt-1 truncate max-w-[140px]">
              {{ upcomingHolidays.length > 0 ? upcomingHolidays[0].title : 'None Added' }}
            </div>
            <div class="text-[11px] text-blue-600 font-bold mt-1">
              {{ upcomingHolidays.length > 0 ? upcomingHolidays[0].dateStr : 'Add via Holiday Manager' }}
            </div>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg shadow-xs">
            <i class="fa-solid fa-umbrella-beach"></i>
          </div>
        </div>

        <!-- Card 3: Casual Leave Balance -->
        <div class="card p-5 flex items-center justify-between">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Leave Balance</span>
            <div class="text-2xl font-black text-slate-900 mt-1">12 <span class="text-xs font-semibold text-slate-400">/ 12 Casual</span></div>
            <div class="text-[11px] text-amber-600 font-bold mt-1">00 Days Utilized</div>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg shadow-xs">
            <i class="fa-solid fa-plane-departure"></i>
          </div>
        </div>

        <!-- Card 4: Base Salary -->
        <div class="card p-5 flex items-center justify-between">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Base Monthly Salary</span>
            <div class="text-2xl font-black text-slate-900 mt-1">₹{{ (authService.currentUser()?.baseSalary || 50000).toLocaleString() }}</div>
            <div class="text-[11px] text-purple-600 font-bold mt-1">Rate: ₹{{ getPerDayRate() }}/day</div>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg shadow-xs">
            <i class="fa-solid fa-wallet"></i>
          </div>
        </div>

      </div>

      <!-- Main Section: My Attendance Records & Upcoming Holidays & Leave Cards -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Left 2 Cols: My Attendance History & Quick Logging -->
        <div class="lg:col-span-2 space-y-6">
          <div class="card p-6 border border-slate-200">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-base font-bold text-slate-900">My Attendance Logs</h3>
                <p class="text-xs text-slate-400">Your recent biometric and daily check-ins</p>
              </div>
              <a routerLink="/employee/attendance-log" class="text-xs text-blue-600 font-bold hover:underline">Log Attendance →</a>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-xs">
                <thead>
                  <tr class="border-b border-slate-100 text-slate-400 text-left font-semibold">
                    <th class="py-2.5">Date</th>
                    <th class="py-2.5">Check In</th>
                    <th class="py-2.5">Check Out</th>
                    <th class="py-2.5">Status</th>
                    <th class="py-2.5">Remarks</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 font-medium">
                  <tr *ngFor="let rec of myAttendance" class="hover:bg-slate-50/60 transition-colors">
                    <td class="py-3 font-mono font-bold text-slate-800">{{ rec.dateStr }}</td>
                    <td class="py-3 font-mono text-slate-700">{{ rec.checkInTime || '—' }}</td>
                    <td class="py-3 font-mono text-slate-700">{{ rec.checkOutTime || '—' }}</td>
                    <td class="py-3">
                      <span class="badge text-[10px]" [ngClass]="rec.status === 'Present' ? 'badge-present' : (rec.status === 'Half-Day' ? 'badge-halfday' : 'badge-absent')">
                        {{ rec.status }}
                      </span>
                    </td>
                    <td class="py-3 text-slate-500 truncate max-w-[180px]">{{ rec.remarks || 'Clock-in log' }}</td>
                  </tr>
                  <tr *ngIf="myAttendance.length === 0">
                    <td colspan="5" class="py-8 text-center text-slate-400">
                      No attendance logged yet. Click <strong>"Clock In"</strong> above to log your first record!
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Right Col: Holidays & Leave Balances -->
        <div class="space-y-6">
          
          <!-- Upcoming Holidays Widget -->
          <div class="card p-6 border border-slate-200">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-base font-bold text-slate-900">Upcoming Holidays</h3>
              <i class="fa-regular fa-calendar text-slate-400 text-xs"></i>
            </div>
            
            <div class="space-y-3" *ngIf="upcomingHolidays.length > 0">
              <div *ngFor="let h of upcomingHolidays" class="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex flex-col items-center justify-center font-bold">
                    <span class="text-xs leading-none">{{ getDayNum(h.dateStr) }}</span>
                    <span class="text-[9px] uppercase leading-none mt-0.5 font-semibold text-blue-500">{{ getMonthShort(h.dateStr) }}</span>
                  </div>
                  <div>
                    <div class="font-bold text-xs text-slate-800">{{ h.title }}</div>
                    <div class="text-[10px] text-slate-400">{{ h.dateStr }}</div>
                  </div>
                </div>
                <span class="badge badge-holiday text-[9px]">{{ h.category === 'National Holiday' ? 'National' : 'Public' }}</span>
              </div>
            </div>

            <div *ngIf="upcomingHolidays.length === 0" class="text-center py-6 text-xs text-slate-400">
              No holidays added yet. Switch to Admin profile to configure holidays!
            </div>
          </div>

          <!-- Leave Balances Widget -->
          <div class="card p-6 border border-slate-200">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-base font-bold text-slate-900">Leave Balances</h3>
              <span class="text-xs text-slate-400 font-semibold">2026 Cycle</span>
            </div>

            <div class="space-y-3 text-xs">
              <div class="flex items-center justify-between py-1">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <span class="font-semibold text-slate-700">Casual Leave</span>
                </div>
                <span class="font-mono font-bold text-slate-900">00 / 12</span>
              </div>
              <div class="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div class="bg-blue-500 h-full rounded-full" style="width: 0%"></div>
              </div>

              <div class="flex items-center justify-between py-1 pt-2">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span class="font-semibold text-slate-700">Sick Leave</span>
                </div>
                <span class="font-mono font-bold text-slate-900">00 / 06</span>
              </div>
              <div class="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div class="bg-amber-500 h-full rounded-full" style="width: 0%"></div>
              </div>

              <div class="flex items-center justify-between py-1 pt-2">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span class="font-semibold text-slate-700">Earned Leave</span>
                </div>
                <span class="font-mono font-bold text-slate-900">00 / 15</span>
              </div>
              <div class="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div class="bg-emerald-500 h-full rounded-full" style="width: 0%"></div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>

    <!-- Payslip Modal -->
    <app-payslip-modal 
      [isOpen]="showPayslipModal" 
      [payslip]="payslipData" 
      (close)="showPayslipModal = false">
    </app-payslip-modal>
  `
})
export class EmployeeDashboardComponent implements OnInit {
  todayCheckedIn = false;
  todayCheckedOut = false;
  checkInTime = '10:00 AM';
  checkOutTime = '06:00 PM';
  presentDaysCount = 0;
  upcomingHolidays: any[] = [];
  myAttendance: any[] = [];
  showPayslipModal = false;
  payslipData: any = null;

  constructor(
    public authService: AuthService,
    private attendanceService: AttendanceService,
    private holidayService: HolidayService,
    private payrollService: PayrollService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.authService.fetchCurrentUser().subscribe();
    this.loadUpcomingHolidays();
    this.loadMyAttendance();
  }

  loadUpcomingHolidays() {
    this.holidayService.getUpcomingHolidays().subscribe({
      next: (res) => {
        this.upcomingHolidays = res.holidays || [];
      }
    });
  }

  loadMyAttendance() {
    this.attendanceService.getMyAttendance().subscribe({
      next: (res) => {
        this.myAttendance = res.records || [];
        this.presentDaysCount = this.myAttendance.filter(r => r.status === 'Present').length;
        
        const todayStr = new Date().toISOString().split('T')[0];
        const todayRec = this.myAttendance.find(r => r.dateStr === todayStr);
        if (todayRec) {
          if (todayRec.checkInTime) {
            this.todayCheckedIn = true;
            this.checkInTime = todayRec.checkInTime;
          }
          if (todayRec.checkOutTime) {
            this.todayCheckedOut = true;
            this.checkOutTime = todayRec.checkOutTime;
          }
        }
      }
    });
  }

  onClockIn() {
    this.attendanceService.clockIn().subscribe({
      next: (res) => {
        this.todayCheckedIn = true;
        this.checkInTime = res.record?.checkInTime || '10:00 AM';
        this.toast.success(`Clock-in recorded at ${this.checkInTime}`);
        this.loadMyAttendance();
      },
      error: (err) => {
        this.toast.info(err.error?.message || 'Already checked in today.');
      }
    });
  }

  onClockOut() {
    this.attendanceService.clockOut({ checkOutTime: '06:00 PM' }).subscribe({
      next: (res) => {
        this.todayCheckedOut = true;
        this.checkOutTime = res.record?.checkOutTime || '06:00 PM';
        this.toast.success(`Clock-out recorded at ${this.checkOutTime}`);
        this.loadMyAttendance();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to record clock-out.');
      }
    });
  }

  openMyPayslip() {
    const active = this.authService.currentUser();
    if (!active) {
      this.toast.info('Please select or create an employee profile.');
      return;
    }
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    this.payrollService.getEmployeePayslip(active._id, currentMonth, currentYear).subscribe({
      next: (res) => {
        this.payslipData = res.payslip;
        this.showPayslipModal = true;
      },
      error: () => {
        this.toast.error('Failed to load payslip.');
      }
    });
  }

  getPerDayRate(): string {
    const salary = this.authService.currentUser()?.baseSalary || 50000;
    return Math.round(salary / 30).toLocaleString();
  }

  getDayNum(dateStr: string): string {
    return dateStr ? (dateStr.split('-')[2] || '01') : '01';
  }

  getMonthShort(dateStr: string): string {
    if (!dateStr) return 'Jan';
    const monthIndex = parseInt(dateStr.split('-')[1], 10) - 1;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[monthIndex] || 'Jan';
  }
}
