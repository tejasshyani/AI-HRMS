import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '../../../services/attendance.service';
import { EmployeeService } from '../../../services/employee.service';
import { HolidayService } from '../../../services/holiday.service';
import { ToastService } from '../../../services/toast.service';
import { AttendanceRecord, Holiday, User } from '../../../models';

interface CalendarDay {
  dayNumber: number;
  dateStr: string;
  isCurrentMonth: boolean;
  isSunday: boolean;
  status: 'Present' | 'Half-Day' | 'Absent' | 'Leave' | 'Holiday' | 'Sunday' | 'Not Logged' | 'Upcoming';
  holidayTitle?: string;
  checkInTime?: string;
  checkOutTime?: string;
  remarks?: string;
  recordId?: string;
  rawRecord?: AttendanceRecord;
}

@Component({
  selector: 'app-admin-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 pb-12 space-y-6 max-w-7xl mx-auto">
      
      <!-- Top Title & Global Controls -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 class="text-xl font-extrabold text-slate-900 tracking-tight">Staff Attendance Calendar & Matrix</h1>
          <p class="text-xs text-slate-500 mt-0.5">Visual calendar matrix auditing daily punches, leaves, holidays, and Sunday shifts</p>
        </div>

        <div class="flex flex-wrap items-center gap-2.5">
          <button (click)="openAddModal()" class="btn btn-primary btn-sm flex items-center gap-1.5 shadow-xs">
            <i class="fa-solid fa-plus"></i>
            <span>Log Attendance / Leave</span>
          </button>
          <button (click)="loadCalendarData()" class="btn btn-secondary btn-sm flex items-center gap-1.5 shadow-xs">
            <i class="fa-solid fa-rotate-right"></i>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <!-- Advanced Filter & Navigation Bar -->
      <div class="card p-4 border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        
        <!-- Employee Selector -->
        <div class="flex items-center gap-2 min-w-[260px] w-full md:w-auto">
          <span class="text-xs font-bold text-slate-500 whitespace-nowrap flex items-center gap-1.5">
            <i class="fa-solid fa-user-tie text-blue-600"></i>
            <span>Employee:</span>
          </span>
          <select 
            [(ngModel)]="selectedEmployeeId" 
            (change)="onEmployeeChange()" 
            class="form-select text-xs !py-1.5 !px-3 font-bold text-slate-800 flex-1">
            <option *ngFor="let emp of employees" [value]="emp._id">
              {{ emp.fullName }} ({{ emp.designation || 'Staff' }} #{{ emp.employeeId }})
            </option>
          </select>
        </div>

        <!-- Controls: View Switcher & Month Nav -->
        <div class="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          
          <!-- View Selector Tabs -->
          <div class="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/60 text-xs font-bold">
            <button 
              (click)="viewMode = 'monthly'" 
              class="px-3 py-1.5 rounded-lg transition-all"
              [ngClass]="viewMode === 'monthly' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'">
              Monthly
            </button>
            <button 
              (click)="viewMode = 'weekly'" 
              class="px-3 py-1.5 rounded-lg transition-all"
              [ngClass]="viewMode === 'weekly' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'">
              Weekly
            </button>
            <button 
              (click)="viewMode = 'yearly'" 
              class="px-3 py-1.5 rounded-lg transition-all"
              [ngClass]="viewMode === 'yearly' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'">
              Yearly
            </button>
          </div>

          <!-- Month Navigator -->
          <div class="flex items-center gap-1.5 bg-white px-3 py-1 rounded-xl border border-slate-200 shadow-xs">
            <button (click)="prevMonth()" class="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors">
              <i class="fa-solid fa-chevron-left text-xs"></i>
            </button>
            <span class="text-xs font-extrabold text-slate-800 min-w-[120px] text-center font-mono">
              {{ monthNames[selectedMonth - 1] }} {{ selectedYear }}
            </span>
            <button (click)="nextMonth()" class="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors">
              <i class="fa-solid fa-chevron-right text-xs"></i>
            </button>
          </div>

        </div>

      </div>

      <!-- KPI Summary Cards for Selected Employee -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        <div class="card p-3.5 border border-slate-200 bg-white">
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Present Days</span>
          <div class="text-lg font-black text-emerald-600 mt-0.5">{{ stats.presentDays }} Days</div>
          <span class="text-[10px] text-emerald-600 font-semibold">100% Payable</span>
        </div>

        <div class="card p-3.5 border border-slate-200 bg-white">
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Half-Days</span>
          <div class="text-lg font-black text-amber-600 mt-0.5">{{ stats.halfDays }} Days</div>
          <span class="text-[10px] text-amber-600 font-semibold">0.5 Day Rate</span>
        </div>

        <div class="card p-3.5 border border-slate-200 bg-white">
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Leaves / Absent</span>
          <div class="text-lg font-black text-rose-600 mt-0.5">{{ stats.leaves }} Days</div>
          <span class="text-[10px] text-rose-500 font-semibold">Unpaid Deduction</span>
        </div>

        <div class="card p-3.5 border border-slate-200 bg-white">
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Paid Holidays</span>
          <div class="text-lg font-black text-blue-600 mt-0.5">{{ stats.holidays }} Days</div>
          <span class="text-[10px] text-blue-500 font-semibold">Public Holidays</span>
        </div>

        <div class="card p-3.5 border border-slate-200 bg-white">
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Weekly Offs</span>
          <div class="text-lg font-black text-slate-700 mt-0.5">{{ stats.sundays }} Sundays</div>
          <span class="text-[10px] text-slate-400 font-semibold">Fixed Off</span>
        </div>

        <div class="card p-3.5 border border-slate-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <span class="text-[10px] font-bold uppercase tracking-wider text-blue-600">Payable Days</span>
          <div class="text-lg font-black text-blue-950 mt-0.5">{{ stats.payableDays }} / 30</div>
          <span class="text-[10px] text-blue-700 font-semibold">Fixed 30-Day Basis</span>
        </div>

      </div>

      <!-- Color Legend Bar -->
      <div class="flex flex-wrap items-center gap-2.5 text-xs">
        <span class="font-bold text-slate-400 text-[11px] uppercase tracking-wider">Legend:</span>
        <span class="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200 text-[11px] font-bold">
          <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Present
        </span>
        <span class="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 px-2.5 py-1 rounded-lg border border-amber-200 text-[11px] font-bold">
          <span class="w-2 h-2 rounded-full bg-amber-500"></span> Half-Day
        </span>
        <span class="inline-flex items-center gap-1.5 bg-rose-50 text-rose-800 px-2.5 py-1 rounded-lg border border-rose-200 text-[11px] font-bold">
          <span class="w-2 h-2 rounded-full bg-rose-500"></span> Leave / Absent
        </span>
        <span class="inline-flex items-center gap-1.5 bg-blue-50 text-blue-800 px-2.5 py-1 rounded-lg border border-blue-200 text-[11px] font-bold">
          <span class="w-2 h-2 rounded-full bg-blue-500"></span> Public Holiday
        </span>
        <span class="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-bold">
          <span class="w-2 h-2 rounded-full bg-slate-400"></span> Sunday (Off)
        </span>
        <span class="text-[11px] text-slate-400 ml-auto italic">
          <i class="fa-solid fa-hand-pointer mr-1"></i>Click any date to view details, override or delete
        </span>
      </div>

      <!-- MONTHLY CALENDAR GRID -->
      <div *ngIf="viewMode === 'monthly'" class="card p-4 sm:p-6 border border-slate-200 overflow-x-auto">
        <div class="min-w-[640px]">
          <!-- Day Headers (Mon - Sat, Sun) -->
          <div class="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
            <div class="py-2">Mon</div>
            <div class="py-2">Tue</div>
            <div class="py-2">Wed</div>
            <div class="py-2">Thu</div>
            <div class="py-2">Fri</div>
            <div class="py-2 text-blue-600">Sat</div>
            <div class="py-2 text-slate-400 bg-slate-50/70 rounded-t-lg">Sun (Off)</div>
          </div>

          <!-- Days Grid -->
          <div class="grid grid-cols-7 gap-2">
            <div 
              *ngFor="let day of calendarDays" 
              (click)="selectDay(day)"
              class="min-h-[105px] p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between hover:shadow-md hover:scale-[1.01]"
              [ngClass]="getDayClasses(day)">
              
              <div class="flex justify-between items-start">
                <span class="font-extrabold text-xs font-mono" [ngClass]="day.isCurrentMonth ? 'text-slate-800' : 'text-slate-300'">
                  {{ day.dayNumber }}
                </span>
                <span 
                  *ngIf="day.isCurrentMonth && day.status !== 'Upcoming' && day.status !== 'Not Logged'"
                  class="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                  [ngClass]="getStatusPillClasses(day)">
                  {{ getStatusLabel(day) }}
                </span>
              </div>

              <!-- Day Info / Holiday or Times -->
              <div class="text-[10px] space-y-0.5 mt-1" *ngIf="day.isCurrentMonth">
                <div *ngIf="day.status === 'Holiday'" class="font-bold text-blue-800 truncate">
                  🎉 {{ day.holidayTitle }}
                </div>
                <div *ngIf="day.status === 'Present'" class="font-mono text-emerald-700 font-semibold">
                  <i class="fa-regular fa-clock text-[9px] mr-0.5"></i>{{ day.checkInTime || '10:00 AM' }}
                </div>
                <div *ngIf="day.status === 'Half-Day'" class="font-mono text-amber-700 font-semibold">
                  <i class="fa-regular fa-clock text-[9px] mr-0.5"></i>{{ day.checkInTime || '02:00 PM' }}
                </div>
                <div *ngIf="day.status === 'Sunday'" class="text-slate-400 italic">
                  Weekly Off
                </div>
                <div *ngIf="day.status === 'Leave' || day.status === 'Absent'" class="text-rose-600 font-semibold truncate">
                  {{ day.remarks || 'Absent' }}
                </div>
                <div *ngIf="day.status === 'Not Logged'" class="text-slate-300 italic text-[9px]">
                  No Log
                </div>
                <div *ngIf="day.status === 'Upcoming'" class="text-slate-300 italic text-[9px]">
                  Upcoming
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      <!-- WEEKLY VIEW -->
      <div *ngIf="viewMode === 'weekly'" class="card p-6 border border-slate-200 space-y-4">
        <h3 class="text-sm font-bold text-slate-800">Weekly Shift Breakdown</h3>
        <div class="grid grid-cols-1 sm:grid-cols-7 gap-3">
          <div *ngFor="let day of calendarDays.slice(0, 7)" class="p-4 rounded-xl border" [ngClass]="getDayClasses(day)" (click)="selectDay(day)">
            <div class="font-bold text-xs text-slate-500 mb-1 font-mono">{{ day.dateStr }}</div>
            <div class="font-black text-base text-slate-900">{{ day.dayNumber }}</div>
            <div class="mt-3">
              <span class="badge text-[10px]" [ngClass]="getStatusPillClasses(day)">{{ day.status }}</span>
            </div>
            <div class="text-xs text-slate-600 mt-2 font-mono" *ngIf="day.checkInTime">
              In: {{ day.checkInTime }}<br>Out: {{ day.checkOutTime || '06:00 PM' }}
            </div>
          </div>
        </div>
      </div>

      <!-- YEARLY VIEW SUMMARY MATRIX -->
      <div *ngIf="viewMode === 'yearly'" class="card p-6 border border-slate-200">
        <h3 class="text-sm font-bold text-slate-800 mb-4">{{ selectedYear }} Annual Attendance Matrix</h3>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <div *ngFor="let m of monthNames; let i = index" class="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all cursor-pointer" (click)="selectedMonth = i + 1; viewMode = 'monthly'; generateCalendar()">
            <div class="flex justify-between items-center mb-2">
              <span class="font-bold text-sm text-slate-800">{{ m }}</span>
              <span class="text-xs text-blue-600 font-semibold">Month {{ i + 1 }}</span>
            </div>
            <div class="space-y-1 text-xs text-slate-500">
              <div class="flex justify-between"><span>Active Month:</span><strong class="text-slate-800 font-mono">{{ m }} {{ selectedYear }}</strong></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Selected Day Override / Edit Modal -->
      <div *ngIf="selectedDayModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
          <div class="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
            <div>
              <h3 class="font-bold text-base text-slate-900">Attendance: {{ selectedDayModal.dateStr }}</h3>
              <p class="text-xs text-slate-400">Managing {{ getSelectedEmpName() }}</p>
            </div>
            <button (click)="selectedDayModal = null" class="text-slate-400 hover:text-slate-600">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <form (ngSubmit)="saveDayAttendance()" class="space-y-3.5">
            
            <div class="form-group mb-0">
              <label class="form-label">Attendance Status <span class="text-rose-500">*</span></label>
              <select [(ngModel)]="dayModalData.status" (change)="onDayModalStatusChange()" name="dStatus" class="form-select text-xs font-semibold">
                <option value="Present">Present (Full Day: 10:00 AM – 06:00 PM)</option>
                <option value="Half-Day">Half-Day (02:00 PM – 06:00 PM)</option>
                <option value="Leave">Leave (Approved Leave)</option>
                <option value="Absent">Absent (Unpaid Absence)</option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-3" *ngIf="dayModalData.status === 'Present' || dayModalData.status === 'Half-Day'">
              <div class="form-group mb-0">
                <label class="form-label">Check-In Time</label>
                <input type="text" [(ngModel)]="dayModalData.checkInTime" name="dInTime" class="form-control text-xs font-mono" placeholder="10:00 AM">
              </div>
              <div class="form-group mb-0">
                <label class="form-label">Check-Out Time</label>
                <input type="text" [(ngModel)]="dayModalData.checkOutTime" name="dOutTime" class="form-control text-xs font-mono" placeholder="06:00 PM">
              </div>
            </div>

            <div class="form-group mb-0">
              <label class="form-label">Remarks / Note</label>
              <textarea [(ngModel)]="dayModalData.remarks" name="dRemarks" rows="2" class="form-control text-xs resize-none" placeholder="Reason for status / override..."></textarea>
            </div>

            <div class="flex justify-between items-center pt-4 border-t border-slate-100">
              <div>
                <button 
                  type="button" 
                  *ngIf="selectedDayModal.recordId" 
                  (click)="deleteDayRecord(selectedDayModal.recordId)" 
                  class="btn btn-sm bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 flex items-center gap-1">
                  <i class="fa-solid fa-trash-can"></i>
                  <span>Delete</span>
                </button>
              </div>

              <div class="flex gap-2">
                <button type="button" (click)="selectedDayModal = null" class="btn btn-secondary btn-sm">Cancel</button>
                <button type="submit" [disabled]="dayModalLoading" class="btn btn-primary btn-sm font-bold flex items-center gap-1.5">
                  <i class="fa-solid fa-check" *ngIf="!dayModalLoading"></i>
                  <i class="fa-solid fa-spinner fa-spin" *ngIf="dayModalLoading"></i>
                  <span>{{ dayModalLoading ? 'Saving...' : 'Save Record' }}</span>
                </button>
              </div>
            </div>

          </form>
        </div>
      </div>

      <!-- Add Attendance Modal (Single / Range) -->
      <div *ngIf="showAddModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade">
        <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
          <div class="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
            <div>
              <h3 class="font-bold text-base text-slate-900">Log Attendance & Leaves</h3>
              <p class="text-xs text-slate-400">Log single-day or multi-day date range</p>
            </div>
            <button (click)="showAddModal = false" class="text-slate-400 hover:text-slate-600">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <!-- Mode Switcher Toggle -->
          <div class="flex p-1 bg-slate-100 rounded-xl border border-slate-200 gap-1 mb-4">
            <button 
              type="button" 
              (click)="addMode = 'single'"
              class="flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
              [ngClass]="addMode === 'single' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'">
              <i class="fa-regular fa-calendar"></i>
              <span>Single Date</span>
            </button>
            <button 
              type="button" 
              (click)="addMode = 'range'"
              class="flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
              [ngClass]="addMode === 'range' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'">
              <i class="fa-solid fa-calendar-days"></i>
              <span>Date Range (Leave / Batch)</span>
            </button>
          </div>

          <form (ngSubmit)="saveNewAttendance()" class="space-y-3.5">
            
            <!-- Employee Selector -->
            <div class="form-group mb-0">
              <label class="form-label">Select Employee <span class="text-rose-500">*</span></label>
              <select [(ngModel)]="newAttendanceData.userId" name="newUserId" class="form-select text-xs font-semibold" required>
                <option *ngFor="let emp of employees" [value]="emp._id">
                  {{ emp.fullName }} ({{ emp.designation || 'Staff' }} #{{ emp.employeeId }})
                </option>
              </select>
            </div>

            <!-- Single Date Mode -->
            <div class="form-group mb-0" *ngIf="addMode === 'single'">
              <label class="form-label">Date <span class="text-rose-500">*</span></label>
              <input type="date" [(ngModel)]="newAttendanceData.dateStr" name="newDateStr" class="form-control text-xs font-semibold" required>
            </div>

            <!-- Date Range Mode -->
            <div *ngIf="addMode === 'range'" class="space-y-2.5 p-3.5 bg-blue-50/50 rounded-xl border border-blue-100">
              <div class="grid grid-cols-2 gap-3">
                <div class="form-group mb-0">
                  <label class="form-label text-blue-900 font-bold">Start Date <span class="text-rose-500">*</span></label>
                  <input type="date" [(ngModel)]="newAttendanceData.startDate" name="newStartDate" class="form-control text-xs font-semibold" required>
                </div>
                <div class="form-group mb-0">
                  <label class="form-label text-blue-900 font-bold">End Date <span class="text-rose-500">*</span></label>
                  <input type="date" [(ngModel)]="newAttendanceData.endDate" name="newEndDate" class="form-control text-xs font-semibold" required>
                </div>
              </div>

              <!-- Exclude Sundays & Live Counter Badge -->
              <div class="flex items-center justify-between pt-1">
                <label class="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium">
                  <input type="checkbox" [(ngModel)]="newAttendanceData.excludeSundays" name="excludeSundays" class="rounded text-blue-600 focus:ring-blue-500">
                  <span>Exclude Sundays</span>
                </label>
                <span class="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                  <i class="fa-solid fa-calculator mr-1"></i>{{ getRangeDaysCount().working }} Working Days
                </span>
              </div>
            </div>

            <!-- Status -->
            <div class="form-group mb-0">
              <label class="form-label">Attendance Status <span class="text-rose-500">*</span></label>
              <select [(ngModel)]="newAttendanceData.status" name="newStatus" class="form-select text-xs font-semibold">
                <option value="Present">Present (Full Day: 10:00 AM – 06:00 PM)</option>
                <option value="Half-Day">Half-Day (2:00 PM – 06:00 PM)</option>
                <option value="Leave">Leave (Approved Leave)</option>
                <option value="Absent">Absent (Unpaid Absence)</option>
              </select>
            </div>

            <!-- Remarks -->
            <div class="form-group mb-0">
              <label class="form-label">Reason / Remarks</label>
              <textarea [(ngModel)]="newAttendanceData.remarks" name="newRemarks" rows="2" class="form-control text-xs resize-none" placeholder="e.g. Annual leave, sick leave, client onsite..."></textarea>
            </div>

            <!-- Modal Actions -->
            <div class="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button type="button" (click)="showAddModal = false" class="btn btn-secondary btn-sm">Cancel</button>
              <button type="submit" [disabled]="!newAttendanceData.userId || addLoading" class="btn btn-primary btn-sm font-bold flex items-center gap-1.5 shadow-xs">
                <i class="fa-solid fa-check" *ngIf="!addLoading"></i>
                <i class="fa-solid fa-spinner fa-spin" *ngIf="addLoading"></i>
                <span>{{ addLoading ? 'Processing...' : (addMode === 'range' ? 'Apply to Range' : 'Save Attendance') }}</span>
              </button>
            </div>

          </form>
        </div>
      </div>

    </div>
  `
})
export class AdminCalendarComponent implements OnInit {
  employees: User[] = [];
  selectedEmployeeId = '';

  selectedMonth = new Date().getMonth() + 1;
  selectedYear = new Date().getFullYear();
  viewMode: 'weekly' | 'monthly' | 'yearly' = 'monthly';

  attendanceRecords: AttendanceRecord[] = [];
  holidays: Holiday[] = [];
  calendarDays: CalendarDay[] = [];

  stats = {
    presentDays: 0,
    halfDays: 0,
    leaves: 0,
    holidays: 0,
    sundays: 0,
    payableDays: 0
  };

  selectedDayModal: CalendarDay | null = null;
  dayModalData: any = {};
  dayModalLoading = false;

  showAddModal = false;
  addMode: 'single' | 'range' = 'single';
  addLoading = false;
  newAttendanceData: any = {};

  monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  constructor(
    private attendanceService: AttendanceService,
    private employeeService: EmployeeService,
    private holidayService: HolidayService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.employeeService.getAllEmployees().subscribe({
      next: (res) => {
        this.employees = res.employees || [];
        if (this.employees.length > 0) {
          this.selectedEmployeeId = this.employees[0]._id;
        }
        this.loadCalendarData();
      },
      error: () => {
        this.toast.error('Failed to load employees list.');
      }
    });
  }

  onEmployeeChange() {
    this.loadCalendarData();
  }

  getSelectedEmpName(): string {
    const emp = this.employees.find(e => e._id === this.selectedEmployeeId);
    return emp ? emp.fullName : 'Selected Staff';
  }

  getTodayDateStr(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  prevMonth() {
    if (this.selectedMonth === 1) {
      this.selectedMonth = 12;
      this.selectedYear--;
    } else {
      this.selectedMonth--;
    }
    this.loadCalendarData();
  }

  nextMonth() {
    if (this.selectedMonth === 12) {
      this.selectedMonth = 1;
      this.selectedYear++;
    } else {
      this.selectedMonth++;
    }
    this.loadCalendarData();
  }

  loadCalendarData() {
    if (!this.selectedEmployeeId) return;

    this.holidayService.getAllHolidays(this.selectedYear).subscribe({
      next: (hRes) => {
        this.holidays = hRes.holidays || [];
        this.attendanceService.getMasterAttendance({
          employeeId: this.selectedEmployeeId,
          month: this.selectedMonth,
          year: this.selectedYear
        }).subscribe({
          next: (aRes) => {
            this.attendanceRecords = aRes.records || [];
            this.generateCalendar();
          },
          error: () => {
            this.generateCalendar();
          }
        });
      },
      error: () => {
        this.generateCalendar();
      }
    });
  }

  generateCalendar() {
    const year = this.selectedYear;
    const month = this.selectedMonth;

    const firstDayOfMonth = new Date(year, month - 1, 1);
    const lastDayOfMonth = new Date(year, month, 0);
    const totalDaysInMonth = lastDayOfMonth.getDate();

    let startDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sun, 1 is Mon...
    // Adjust so Monday is column 0 and Sunday is column 6
    let startingEmptyCols = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const prevMonthLastDay = new Date(year, month - 1, 0).getDate();
    const days: CalendarDay[] = [];

    // 1. Previous month filler days
    for (let i = startingEmptyCols - 1; i >= 0; i--) {
      const prevDate = prevMonthLastDay - i;
      const prevM = month === 1 ? 12 : month - 1;
      const prevY = month === 1 ? year - 1 : year;
      const dateStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(prevDate).padStart(2, '0')}`;
      days.push({
        dayNumber: prevDate,
        dateStr,
        isCurrentMonth: false,
        isSunday: new Date(dateStr).getDay() === 0,
        status: 'Not Logged'
      });
    }

    // Tally stats for this month
    let presentCount = 0;
    let halfDayCount = 0;
    let leaveCount = 0;
    let holidayCount = 0;
    let sundayCount = 0;

    // 2. Current Month Days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayDate = new Date(year, month - 1, d);
      const isSun = dayDate.getDay() === 0;

      // Find attendance record
      const attRec = this.attendanceRecords.find(r => r.dateStr === dateStr);

      // Find public holiday
      const hol = this.holidays.find(h => {
        const hStr = h.dateStr || (h.date ? new Date(h.date).toISOString().split('T')[0] : '');
        return hStr === dateStr;
      });

      let status: CalendarDay['status'] = 'Not Logged';
      let checkInTime: string | undefined;
      let checkOutTime: string | undefined;
      let remarks: string | undefined;
      let holidayTitle: string | undefined;

      if (hol && !isSun) {
        status = 'Holiday';
        holidayTitle = hol.title;
        holidayCount++;
      } else if (isSun) {
        status = 'Sunday';
        sundayCount++;
      } else if (attRec) {
        if (attRec.status === 'Present') {
          status = 'Present';
          presentCount++;
        } else if (attRec.status === 'Half-Day') {
          status = 'Half-Day';
          halfDayCount++;
        } else if (attRec.status === 'Leave' || attRec.status === 'Absent') {
          status = 'Leave';
          leaveCount++;
        }
        checkInTime = attRec.checkInTime;
        checkOutTime = attRec.checkOutTime;
        remarks = attRec.remarks;
      }

      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: true,
        isSunday: isSun,
        status,
        holidayTitle,
        checkInTime,
        checkOutTime,
        remarks,
        recordId: attRec?._id,
        rawRecord: attRec
      });
    }

    // 3. Next month filler days (fill up to 35 or 42 grid cells)
    const remainingCols = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remainingCols; i++) {
      const nextM = month === 12 ? 1 : month + 1;
      const nextY = month === 12 ? year + 1 : year;
      const dateStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        dayNumber: i,
        dateStr,
        isCurrentMonth: false,
        isSunday: new Date(dateStr).getDay() === 0,
        status: 'Upcoming'
      });
    }

    this.calendarDays = days;

    const payableDays = Math.min(30, Number((presentCount + (0.5 * halfDayCount) + holidayCount).toFixed(2)));
    this.stats = {
      presentDays: presentCount,
      halfDays: halfDayCount,
      leaves: leaveCount,
      holidays: holidayCount,
      sundays: sundayCount,
      payableDays
    };
  }

  getDayClasses(day: CalendarDay): string {
    if (!day.isCurrentMonth) {
      return 'bg-slate-50/50 border-slate-100 opacity-40 cursor-not-allowed';
    }
    if (day.status === 'Holiday') {
      return 'bg-blue-50/70 border-blue-200 text-blue-900';
    }
    if (day.status === 'Sunday') {
      return 'bg-slate-100/70 border-slate-200 text-slate-500';
    }
    if (day.status === 'Present') {
      return 'bg-emerald-50/60 border-emerald-200 text-emerald-900';
    }
    if (day.status === 'Half-Day') {
      return 'bg-amber-50/60 border-amber-200 text-amber-900';
    }
    if (day.status === 'Leave' || day.status === 'Absent') {
      return 'bg-rose-50/60 border-rose-200 text-rose-900';
    }
    return 'bg-white border-slate-200 hover:border-blue-400';
  }

  getStatusPillClasses(day: CalendarDay): string {
    if (day.status === 'Holiday') return 'bg-blue-100 text-blue-800 border border-blue-300';
    if (day.status === 'Sunday') return 'bg-slate-200 text-slate-600';
    if (day.status === 'Present') return 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-300';
    if (day.status === 'Half-Day') return 'bg-amber-100 text-amber-800 font-bold border border-amber-300';
    if (day.status === 'Leave' || day.status === 'Absent') return 'bg-rose-100 text-rose-800 font-bold border border-rose-300';
    return 'bg-slate-100 text-slate-500';
  }

  getStatusLabel(day: CalendarDay): string {
    if (day.status === 'Holiday') return 'HOLIDAY';
    if (day.status === 'Sunday') return 'OFF';
    if (day.status === 'Present') return 'PRESENT';
    if (day.status === 'Half-Day') return 'HALF-DAY';
    if (day.status === 'Leave' || day.status === 'Absent') return 'LEAVE';
    return '';
  }

  selectDay(day: CalendarDay) {
    if (!day.isCurrentMonth || day.isSunday) return;

    this.selectedDayModal = day;
    this.dayModalData = {
      _id: day.recordId,
      userId: this.selectedEmployeeId,
      dateStr: day.dateStr,
      status: day.status === 'Not Logged' || day.status === 'Holiday' ? 'Present' : day.status,
      checkInTime: day.checkInTime || '10:00 AM',
      checkOutTime: day.checkOutTime || '06:00 PM',
      remarks: day.remarks || ''
    };
  }

  onDayModalStatusChange() {
    if (this.dayModalData.status === 'Half-Day') {
      this.dayModalData.checkInTime = '02:00 PM';
      this.dayModalData.checkOutTime = '06:00 PM';
    } else if (this.dayModalData.status === 'Present') {
      this.dayModalData.checkInTime = '10:00 AM';
      this.dayModalData.checkOutTime = '06:00 PM';
    } else {
      this.dayModalData.checkInTime = '—';
      this.dayModalData.checkOutTime = '—';
    }
  }

  saveDayAttendance() {
    this.dayModalLoading = true;
    this.attendanceService.logAttendance(this.dayModalData).subscribe({
      next: () => {
        this.dayModalLoading = false;
        this.toast.success(`Attendance updated for ${this.dayModalData.dateStr}`);
        this.selectedDayModal = null;
        this.loadCalendarData();
      },
      error: (err) => {
        this.dayModalLoading = false;
        this.toast.error(err.error?.message || 'Failed to save attendance.');
      }
    });
  }

  deleteDayRecord(recordId: string) {
    if (!confirm('Are you sure you want to delete this attendance record?')) return;
    this.attendanceService.deleteAttendance(recordId).subscribe({
      next: (res) => {
        this.toast.success(res.message || 'Attendance deleted successfully.');
        this.selectedDayModal = null;
        this.loadCalendarData();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to delete attendance record.');
      }
    });
  }

  openAddModal() {
    this.addMode = 'single';
    this.newAttendanceData = {
      userId: this.selectedEmployeeId,
      dateStr: this.getTodayDateStr(),
      startDate: this.getTodayDateStr(),
      endDate: this.getTodayDateStr(),
      status: 'Present',
      remarks: '',
      excludeSundays: true
    };
    this.showAddModal = true;
  }

  getRangeDaysCount(): { total: number; sundays: number; working: number } {
    if (!this.newAttendanceData.startDate || !this.newAttendanceData.endDate) {
      return { total: 0, sundays: 0, working: 0 };
    }
    const sParts = this.newAttendanceData.startDate.split('-').map(Number);
    const eParts = this.newAttendanceData.endDate.split('-').map(Number);
    const s = new Date(sParts[0], sParts[1] - 1, sParts[2]);
    const e = new Date(eParts[0], eParts[1] - 1, eParts[2]);
    if (s > e) return { total: 0, sundays: 0, working: 0 };
    
    let total = 0;
    let sundays = 0;
    let cur = new Date(s);
    while (cur <= e) {
      total++;
      if (cur.getDay() === 0) sundays++;
      cur.setDate(cur.getDate() + 1);
    }
    const working = this.newAttendanceData.excludeSundays ? (total - sundays) : total;
    return { total, sundays, working };
  }

  saveNewAttendance() {
    this.addLoading = true;
    if (this.addMode === 'range') {
      this.attendanceService.bulkLogAttendance(this.newAttendanceData).subscribe({
        next: (res) => {
          this.addLoading = false;
          this.toast.success(res.message || 'Date range attendance saved.');
          this.showAddModal = false;
          this.loadCalendarData();
        },
        error: (err) => {
          this.addLoading = false;
          this.toast.error(err.error?.message || 'Failed to save date range.');
        }
      });
    } else {
      this.attendanceService.logAttendance(this.newAttendanceData).subscribe({
        next: () => {
          this.addLoading = false;
          this.toast.success('Attendance record added successfully!');
          this.showAddModal = false;
          this.loadCalendarData();
        },
        error: (err) => {
          this.addLoading = false;
          this.toast.error(err.error?.message || 'Failed to add attendance.');
        }
      });
    }
  }
}
