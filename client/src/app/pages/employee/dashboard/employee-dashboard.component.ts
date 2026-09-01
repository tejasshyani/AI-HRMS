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
    <div class="p-4 sm:p-6 pb-12 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      
      <!-- Top Welcome Banner & Clock Actions -->
      <div class="card p-4 sm:p-5 lg:p-6 bg-gradient-to-r from-white via-blue-50/30 to-indigo-50/30 border border-slate-200/80 shadow-xs">
        
        <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
          <!-- Left: Profile Info -->
          <div class="flex items-center gap-3.5">
            <img 
              [src]="authService.currentUser()?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + (authService.currentUser()?.fullName || 'User')" 
              class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border-2 border-white shadow-md object-cover flex-shrink-0" 
              alt="Avatar">
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <h1 class="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">{{ authService.currentUser()?.fullName || 'Employee' }}</h1>
                <span *ngIf="authService.currentUser()?.employeeId" class="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-mono text-xs font-bold border border-blue-200">
                  #{{ authService.currentUser()?.employeeId }}
                </span>
                <span class="badge badge-present text-[10px]">Active</span>
              </div>
              <p class="text-xs text-slate-500 font-semibold mt-0.5">
                {{ authService.currentUser()?.designation || 'Staff Member' }}
              </p>
              <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400 mt-1.5">
                <span class="truncate max-w-[220px]"><i class="fa-regular fa-envelope mr-1 text-slate-400"></i>{{ authService.currentUser()?.email }}</span>
                <span class="inline-block w-1.5 h-1.5 rounded-full bg-slate-300 mx-1"></span>
                <span><i class="fa-solid fa-indian-rupee-sign mr-1 text-blue-600"></i>Base: &#8377;{{ (authService.currentUser()?.baseSalary || 50000).toLocaleString() }}/mo</span>
              </div>
            </div>
          </div>

          <!-- Right (Desktop): Compact Action Buttons -->
          <div class="hidden md:flex items-center gap-2.5">
            <button 
              (click)="onClockIn()" 
              [disabled]="todayCheckedIn" 
              class="btn btn-success text-xs font-bold py-2 px-3.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
              [ngClass]="todayCheckedIn ? 'opacity-90 cursor-default ring-1 ring-emerald-400' : 'hover:scale-[1.02]'">
              <i class="fa-solid fa-fingerprint text-sm"></i>
              <span>{{ todayCheckedIn ? 'Clocked In (' + checkInTime + ')' : 'Clock In' }}</span>
            </button>
            
            <button 
              (click)="onClockOut()" 
              [disabled]="todayCheckedOut" 
              class="btn btn-secondary text-xs font-bold py-2 px-3.5 rounded-xl border border-slate-200 shadow-xs transition-all flex items-center gap-1.5"
              [ngClass]="todayCheckedOut ? 'opacity-80 bg-slate-100 text-slate-500 cursor-default ring-1 ring-slate-300' : 'hover:scale-[1.02] hover:bg-slate-100'">
              <i class="fa-solid fa-arrow-right-from-bracket text-sm"></i>
              <span>{{ todayCheckedOut ? 'Clocked Out (' + checkOutTime + ')' : 'Clock Out' }}</span>
            </button>

            <button 
              (click)="openMyPayslip()" 
              class="btn btn-primary text-xs font-bold py-2 px-3.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 hover:scale-[1.02]">
              <i class="fa-solid fa-receipt text-sm"></i>
              <span>View Payslip</span>
            </button>
          </div>

        </div>

        <!-- Mobile Action Buttons (Dedicated row on small screens < md) -->
        <div class="md:hidden pt-3 border-t border-slate-200/70 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button 
            (click)="onClockIn()" 
            [disabled]="todayCheckedIn" 
            class="btn btn-success w-full py-3 px-4 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2"
            [ngClass]="todayCheckedIn ? 'opacity-90 cursor-default ring-2 ring-emerald-400/40' : 'hover:scale-[1.01]'">
            <i class="fa-solid fa-fingerprint text-base"></i>
            <span>{{ todayCheckedIn ? 'Clocked In (' + checkInTime + ')' : 'Clock In' }}</span>
          </button>
          
          <button 
            (click)="onClockOut()" 
            [disabled]="todayCheckedOut" 
            class="btn btn-secondary w-full py-3 px-4 rounded-xl text-xs font-bold border border-slate-200 shadow-xs transition-all flex items-center justify-center gap-2"
            [ngClass]="todayCheckedOut ? 'opacity-80 bg-slate-100 text-slate-500 cursor-default ring-2 ring-slate-300' : 'hover:scale-[1.01] hover:bg-slate-100'">
            <i class="fa-solid fa-arrow-right-from-bracket text-base"></i>
            <span>{{ todayCheckedOut ? 'Clocked Out (' + checkOutTime + ')' : 'Clock Out' }}</span>
          </button>

          <button 
            (click)="openMyPayslip()" 
            class="btn btn-primary w-full py-3 px-4 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 hover:scale-[1.01]">
            <i class="fa-solid fa-receipt text-base"></i>
            <span>View Payslip</span>
          </button>
        </div>

      </div>

      <!-- KPI Summary Cards (3 Equally Distributed 1/3 Width Cards) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <!-- Card 1: Days Present (Current Active Month) -->
        <div class="card p-5 flex items-center justify-between">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Days Present ({{ currentMonthName }})</span>
            <div class="text-2xl font-black text-slate-900 mt-1">{{ presentDaysCount }} <span class="text-xs font-semibold text-slate-400">Days</span></div>
            <div class="text-[11px] text-emerald-600 font-bold mt-1">
              <i class="fa-solid fa-circle-check mr-1"></i>Logged for {{ currentMonthName }}
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
            <div class="text-base font-extrabold text-slate-900 mt-1 truncate max-w-[170px]">
              {{ upcomingHolidays.length > 0 ? upcomingHolidays[0].title : 'No Upcoming Holiday' }}
            </div>
            <div class="text-[11px] text-blue-600 font-bold mt-1">
              {{ upcomingHolidays.length > 0 ? upcomingHolidays[0].dateStr : 'Next holiday will appear here' }}
            </div>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg shadow-xs">
            <i class="fa-solid fa-umbrella-beach"></i>
          </div>
        </div>

        <!-- Card 3: Base Monthly Salary -->
        <div class="card p-5 flex items-center justify-between">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Base Monthly Salary</span>
            <div class="text-2xl font-black text-slate-900 mt-1">&#8377;{{ (authService.currentUser()?.baseSalary || 50000).toLocaleString() }}</div>
            <div class="text-[11px] text-purple-600 font-bold mt-1">Rate: &#8377;{{ getPerDayRate() }}/day</div>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg shadow-xs">
            <i class="fa-solid fa-wallet"></i>
          </div>
        </div>

      </div>

      <!-- Main Section: My Attendance Records & Upcoming Holidays Widget -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Left 2 Cols: My Attendance History & Quick Logging -->
        <div class="lg:col-span-2 space-y-6">
          <div class="card p-6 border border-slate-200">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 class="text-base font-bold text-slate-900">My Attendance Logs</h3>
                <p class="text-xs text-slate-400">Showing logs for {{ selectedFilter === 'current' ? (currentMonthName + ' ' + currentYear) : 'All Time' }}</p>
              </div>
              <div class="flex items-center gap-2 self-start sm:self-auto">
                <select 
                  (change)="onFilterChange($event)" 
                  class="text-xs font-bold py-1.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="current" [selected]="selectedFilter === 'current'">Current Month ({{ currentMonthName }})</option>
                  <option value="all" [selected]="selectedFilter === 'all'">All History</option>
                </select>
                <a routerLink="/employee/attendance-log" class="text-xs text-blue-600 font-bold hover:underline whitespace-nowrap ml-1">Log Attendance &rarr;</a>
              </div>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-xs">
                <thead>
                  <tr class="border-b border-slate-100 text-slate-400 text-left font-semibold">
                    <th class="py-2.5">Date</th>
                    <th class="py-2.5">Check In</th>
                    <th class="py-2.5">Check Out</th>
                    <th class="py-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 font-medium">
                  <!-- Loading State -->
                  <tr *ngIf="isLoading">
                    <td colspan="4" class="py-12 text-center">
                      <div class="loading-container !py-6">
                        <div class="loader-spinner-sm"></div>
                        <div class="text-xs font-bold text-slate-700">Loading attendance records...</div>
                      </div>
                    </td>
                  </tr>

                  <ng-container *ngIf="!isLoading">
                    <tr *ngFor="let rec of displayedAttendance" class="hover:bg-slate-50/60 transition-colors">
                      <td class="py-3 font-mono font-bold text-slate-800">{{ rec.dateStr }}</td>
                      <td class="py-3 font-mono text-slate-700">{{ rec.checkInTime || '-' }}</td>
                      <td class="py-3 font-mono text-slate-700">{{ rec.checkOutTime || '-' }}</td>
                      <td class="py-3 text-right">
                        <span class="badge text-[10px]" [ngClass]="rec.status === 'Present' ? 'badge-present' : (rec.status === 'Half-Day' ? 'badge-halfday' : 'badge-absent')">
                          {{ rec.status }}
                        </span>
                      </td>
                    </tr>
                    <tr *ngIf="displayedAttendance.length === 0">
                      <td colspan="4" class="py-10 text-center text-slate-400">
                        <i class="fa-regular fa-calendar-xmark text-2xl text-slate-300 mb-2 block"></i>
                        <p class="font-medium">No attendance records found for <strong>{{ currentMonthName }} {{ currentYear }}</strong>.</p>
                        <p class="text-[11px] text-slate-400 mt-1">Click <strong>"Clock In"</strong> above to record your attendance today!</p>
                      </td>
                    </tr>
                  </ng-container>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Right Col: Upcoming Holidays Widget -->
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
              <i class="fa-regular fa-calendar-check text-2xl text-slate-300 mb-1.5 block"></i>
              No upcoming holidays remaining for {{ currentMonthName }} {{ currentYear }}.
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
  isLoading = false;
  todayCheckedIn = false;
  todayCheckedOut = false;
  checkInTime = '10:00 AM';
  checkOutTime = '06:00 PM';
  presentDaysCount = 0;
  currentMonthName = 'September';
  currentYear = 2026;
  selectedFilter: 'current' | 'all' = 'current';
  upcomingHolidays: any[] = [];
  allAttendanceRecords: any[] = [];
  displayedAttendance: any[] = [];
  showPayslipModal = false;
  payslipData: any = null;

  constructor(
    public authService: AuthService,
    private attendanceService: AttendanceService,
    private holidayService: HolidayService,
    private payrollService: PayrollService,
    private toast: ToastService
  ) {
    const now = new Date();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.currentMonthName = months[now.getMonth()];
    this.currentYear = now.getFullYear();
  }

  ngOnInit() {
    this.authService.fetchCurrentUser().subscribe();
    this.loadUpcomingHolidays();
    this.loadMyAttendance();
  }

  loadUpcomingHolidays() {
    this.holidayService.getUpcomingHolidays().subscribe({
      next: (res) => {
        const d = new Date();
        const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const all = res.holidays || [];
        // Only show upcoming/today holidays
        this.upcomingHolidays = all
          .filter((h: any) => {
            const hDate = h.dateStr || (h.date ? new Date(h.date).toISOString().split('T')[0] : '');
            return hDate >= todayStr;
          })
          .sort((a: any, b: any) => (a.dateStr || '').localeCompare(b.dateStr || ''));
      }
    });
  }

  loadMyAttendance() {
    this.isLoading = true;
    this.attendanceService.getMyAttendance().subscribe({
      next: (res) => {
        this.allAttendanceRecords = res.records || [];
        
        const d = new Date();
        const currentMonthPrefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        
        // Count present days strictly for the ACTIVE CURRENT MONTH (e.g. 2026-09)
        this.presentDaysCount = this.allAttendanceRecords.filter(r => 
          (r.status === 'Present' || r.status === 'Late' || r.status === 'Half-Day' || r.status === 'Half Day') && 
          r.dateStr?.startsWith(currentMonthPrefix)
        ).length;

        // Apply display filter
        this.applyFilter();

        // Check today's check-in status
        const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const todayRec = this.allAttendanceRecords.find(r => r.dateStr === todayStr);
        if (todayRec) {
          if (todayRec.checkInTime && todayRec.checkInTime !== '-') {
            this.todayCheckedIn = true;
            this.checkInTime = todayRec.checkInTime;
          }
          if (todayRec.checkOutTime && todayRec.checkOutTime !== '-') {
            this.todayCheckedOut = true;
            this.checkOutTime = todayRec.checkOutTime;
          }
        } else {
          this.todayCheckedIn = false;
          this.todayCheckedOut = false;
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  onFilterChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedFilter = (target.value as 'current' | 'all') || 'current';
    this.applyFilter();
  }

  applyFilter() {
    const d = new Date();
    const currentMonthPrefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    
    if (this.selectedFilter === 'current') {
      this.displayedAttendance = this.allAttendanceRecords.filter(r => r.dateStr?.startsWith(currentMonthPrefix));
    } else {
      this.displayedAttendance = [...this.allAttendanceRecords];
    }
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
