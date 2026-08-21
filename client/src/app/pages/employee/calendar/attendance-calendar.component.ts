import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AttendanceService } from '../../../services/attendance.service';
import { HolidayService } from '../../../services/holiday.service';
import { AttendanceRecord, Holiday } from '../../../models';

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
}

@Component({
  selector: 'app-attendance-calendar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6 pb-12 space-y-6 max-w-7xl mx-auto">
      
      <!-- Top Header Card -->
      <div class="card p-6 border border-slate-200">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 class="text-xl font-extrabold text-slate-900 tracking-tight">Interactive Attendance Calendar</h1>
            <p class="text-xs text-slate-500 mt-0.5">Multi-view calendar tracking Mon–Sat shifts, public holidays, and live attendance data</p>
          </div>

          <!-- Controls: View Switcher (Weekly/Monthly/Yearly) & Month Nav -->
          <div class="flex flex-wrap items-center gap-3">
            
            <!-- View Selector Tabs -->
            <div class="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/60 text-xs font-bold">
              <button 
                (click)="viewMode = 'weekly'" 
                class="px-3 py-1.5 rounded-lg transition-all"
                [ngClass]="viewMode === 'weekly' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'">
                Weekly
              </button>
              <button 
                (click)="viewMode = 'monthly'" 
                class="px-3 py-1.5 rounded-lg transition-all"
                [ngClass]="viewMode === 'monthly' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'">
                Monthly
              </button>
              <button 
                (click)="viewMode = 'yearly'" 
                class="px-3 py-1.5 rounded-lg transition-all"
                [ngClass]="viewMode === 'yearly' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'">
                Yearly
              </button>
            </div>

            <!-- Month Navigator -->
            <div class="flex items-center gap-2 bg-white px-3 py-1 rounded-xl border border-slate-200 shadow-xs">
              <button (click)="prevMonth()" class="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600">
                <i class="fa-solid fa-chevron-left text-xs"></i>
              </button>
              <span class="text-xs font-extrabold text-slate-800 min-w-[110px] text-center font-mono">
                {{ monthNames[selectedMonth - 1] }} {{ selectedYear }}
              </span>
              <button (click)="nextMonth()" class="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600">
                <i class="fa-solid fa-chevron-right text-xs"></i>
              </button>
            </div>

          </div>
        </div>

        <!-- Color Legend Badges Bar -->
        <div class="flex flex-wrap items-center gap-3 pt-5 mt-5 border-t border-slate-100 text-xs">
          <span class="font-bold text-slate-400 text-[11px] uppercase tracking-wider">Legend:</span>
          
          <div class="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200 font-semibold text-[11px]">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Green = Present (Logged)</span>
          </div>

          <div class="flex items-center gap-1.5 bg-blue-50 text-blue-800 px-2.5 py-1 rounded-lg border border-blue-200 font-semibold text-[11px]">
            <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <span>Blue = Public / National Holiday</span>
          </div>

          <div class="flex items-center gap-1.5 bg-amber-50 text-amber-800 px-2.5 py-1 rounded-lg border border-amber-200 font-semibold text-[11px]">
            <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>Orange = Half-Day</span>
          </div>

          <div class="flex items-center gap-1.5 bg-rose-50 text-rose-800 px-2.5 py-1 rounded-lg border border-rose-200 font-semibold text-[11px]">
            <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span>Red = Absent / Leave</span>
          </div>

          <div class="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 font-semibold text-[11px]">
            <span class="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
            <span>Gray = Sunday (Weekly Off)</span>
          </div>

          <div class="flex items-center gap-1.5 bg-white text-slate-500 px-2.5 py-1 rounded-lg border border-slate-200 font-semibold text-[11px]">
            <span class="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
            <span>White = No Log / Upcoming</span>
          </div>
        </div>

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
              class="min-h-[105px] p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between"
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
                  <i class="fa-regular fa-clock text-[9px] mr-0.5"></i>{{ day.checkInTime || '10:00 AM' }}
                </div>
                <div *ngIf="day.status === 'Sunday'" class="text-slate-400 italic">
                  Weekly Off
                </div>
                <div *ngIf="day.status === 'Leave' || day.status === 'Absent'" class="text-rose-600 font-semibold truncate">
                  {{ day.remarks || 'Leave' }}
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
          <div *ngFor="let day of calendarDays.slice(0, 7)" class="p-4 rounded-xl border" [ngClass]="getDayClasses(day)">
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
        <h3 class="text-sm font-bold text-slate-800 mb-4">{{ selectedYear }} Annual Attendance & Holiday Calendar</h3>
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

      <!-- Selected Day Detail Modal -->
      <div *ngIf="selectedDayModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
          <div class="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
            <div>
              <h3 class="font-bold text-base text-slate-900">Day Details: {{ selectedDayModal.dateStr }}</h3>
              <p class="text-xs text-slate-400">Shift & Biometric Attendance Record</p>
            </div>
            <button (click)="selectedDayModal = null" class="text-slate-400 hover:text-slate-600">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="space-y-3 text-xs">
            <div class="flex justify-between py-1 border-b border-slate-100">
              <span class="text-slate-500">Status</span>
              <span class="badge" [ngClass]="getStatusPillClasses(selectedDayModal)">{{ selectedDayModal.status }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-100" *ngIf="selectedDayModal.checkInTime">
              <span class="text-slate-500">Check-In Time</span>
              <span class="font-mono font-bold text-slate-800">{{ selectedDayModal.checkInTime }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-100" *ngIf="selectedDayModal.checkOutTime">
              <span class="text-slate-500">Check-Out Time</span>
              <span class="font-mono font-bold text-slate-800">{{ selectedDayModal.checkOutTime }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-100" *ngIf="selectedDayModal.holidayTitle">
              <span class="text-slate-500">Holiday Title</span>
              <span class="font-bold text-blue-700">{{ selectedDayModal.holidayTitle }}</span>
            </div>
            <div class="py-1">
              <span class="text-slate-500">Remarks / Note</span>
              <p class="font-medium text-slate-800 mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                {{ selectedDayModal.remarks || (selectedDayModal.status === 'Present' ? 'Regular office attendance' : 'No extra notes recorded.') }}
              </p>
            </div>
          </div>

          <div class="mt-6">
            <button (click)="selectedDayModal = null" class="w-full btn btn-primary py-2 text-xs font-bold rounded-xl">
              Close
            </button>
          </div>
        </div>
      </div>

    </div>
  `
})
export class AttendanceCalendarComponent implements OnInit {
  viewMode: 'weekly' | 'monthly' | 'yearly' = 'monthly';
  selectedMonth = new Date().getMonth() + 1;
  selectedYear = new Date().getFullYear();
  calendarDays: CalendarDay[] = [];
  records: AttendanceRecord[] = [];
  holidays: Holiday[] = [];
  selectedDayModal: CalendarDay | null = null;

  monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  constructor(
    private attendanceService: AttendanceService,
    private holidayService: HolidayService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.holidayService.getAllHolidays(this.selectedYear).subscribe({
      next: (hRes) => {
        this.holidays = hRes.holidays || [];
        this.attendanceService.getMyAttendance({ month: this.selectedMonth, year: this.selectedYear }).subscribe({
          next: (aRes) => {
            this.records = aRes.records || [];
            this.generateCalendar();
          }
        });
      }
    });
  }

  prevMonth() {
    if (this.selectedMonth === 1) {
      this.selectedMonth = 12;
      this.selectedYear--;
    } else {
      this.selectedMonth--;
    }
    this.loadData();
  }

  nextMonth() {
    if (this.selectedMonth === 12) {
      this.selectedMonth = 1;
      this.selectedYear++;
    } else {
      this.selectedMonth++;
    }
    this.loadData();
  }

  generateCalendar() {
    const daysInMonth = new Date(this.selectedYear, this.selectedMonth, 0).getDate();
    const firstDayIndex = new Date(this.selectedYear, this.selectedMonth - 1, 1).getDay();
    // Monday as 0: (dayIndex + 6) % 7
    const startingOffset = (firstDayIndex + 6) % 7;

    const days: CalendarDay[] = [];
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
    const todayDay = String(today.getDate()).padStart(2, '0');
    const todayStr = `${todayYear}-${todayMonth}-${todayDay}`;

    // Previous month padding days
    const prevMonthDays = new Date(this.selectedYear, this.selectedMonth - 1, 0).getDate();
    for (let i = startingOffset - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      days.push({
        dayNumber: dayNum,
        dateStr: `${this.selectedYear}-${String(this.selectedMonth - 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`,
        isCurrentMonth: false,
        isSunday: false,
        status: 'Upcoming'
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(this.selectedYear, this.selectedMonth - 1, day);
      const isSunday = dateObj.getDay() === 0;
      const mm = String(this.selectedMonth).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      const dateStr = `${this.selectedYear}-${mm}-${dd}`;

      // Check if holiday
      const holiday = this.holidays.find(h => h.dateStr === dateStr);
      // Check actual logged attendance record
      const record = this.records.find(r => r.dateStr === dateStr);

      let status: 'Present' | 'Half-Day' | 'Absent' | 'Leave' | 'Holiday' | 'Sunday' | 'Not Logged' | 'Upcoming';
      
      if (isSunday) {
        status = 'Sunday';
      } else if (holiday) {
        status = 'Holiday';
      } else if (record) {
        status = record.status as any;
      } else if (dateStr > todayStr) {
        status = 'Upcoming';
      } else {
        status = 'Not Logged';
      }

      days.push({
        dayNumber: day,
        dateStr,
        isCurrentMonth: true,
        isSunday,
        status,
        holidayTitle: holiday?.title,
        checkInTime: record?.checkInTime,
        checkOutTime: record?.checkOutTime,
        remarks: record?.remarks || holiday?.description
      });
    }

    this.calendarDays = days;
  }

  getDayClasses(day: CalendarDay): any {
    if (!day.isCurrentMonth) {
      return 'bg-slate-50/40 border-slate-100 text-slate-300 opacity-40';
    }
    if (day.status === 'Sunday') {
      return 'bg-slate-50 border-slate-200 text-slate-500';
    }
    if (day.status === 'Holiday') {
      return 'bg-blue-50/70 border-blue-200 text-blue-900 shadow-xs';
    }
    if (day.status === 'Present') {
      return 'bg-emerald-50/70 border-emerald-300 text-emerald-950 hover:bg-emerald-50';
    }
    if (day.status === 'Half-Day') {
      return 'bg-amber-50/70 border-amber-300 text-amber-950 hover:bg-amber-50';
    }
    if (day.status === 'Absent' || day.status === 'Leave') {
      return 'bg-rose-50/70 border-rose-300 text-rose-950 hover:bg-rose-50';
    }
    if (day.status === 'Upcoming') {
      return 'bg-slate-50/20 border-slate-200/80 text-slate-400';
    }
    // Not Logged
    return 'bg-white border-slate-200 text-slate-600 hover:border-slate-300';
  }

  getStatusPillClasses(day: CalendarDay): any {
    if (day.status === 'Sunday') return 'bg-slate-200 text-slate-600';
    if (day.status === 'Holiday') return 'bg-blue-600 text-white';
    if (day.status === 'Present') return 'bg-emerald-600 text-white';
    if (day.status === 'Half-Day') return 'bg-amber-500 text-white';
    if (day.status === 'Absent' || day.status === 'Leave') return 'bg-rose-600 text-white';
    return 'bg-slate-100 text-slate-500';
  }

  getStatusLabel(day: CalendarDay): string {
    if (day.status === 'Sunday') return 'SUN';
    if (day.status === 'Holiday') return 'HOLIDAY';
    if (day.status === 'Present') return 'P';
    if (day.status === 'Half-Day') return 'HD';
    if (day.status === 'Leave') return 'LEAVE';
    if (day.status === 'Absent') return 'ABSENT';
    return '';
  }

  selectDay(day: CalendarDay) {
    if (day.isCurrentMonth) {
      this.selectedDayModal = day;
    }
  }
}
