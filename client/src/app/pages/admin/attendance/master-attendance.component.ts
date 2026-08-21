import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '../../../services/attendance.service';
import { EmployeeService } from '../../../services/employee.service';
import { ToastService } from '../../../services/toast.service';
import { AttendanceRecord, User } from '../../../models';

@Component({
  selector: 'app-master-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 pb-12 space-y-6 max-w-7xl mx-auto">
      
      <!-- Top Title & Filter Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-xl font-extrabold text-slate-900 tracking-tight">Master Attendance Records & Corrections</h1>
          <p class="text-xs text-slate-500 mt-0.5">Filter, audit, add, and override daily employee punches and attendance logs</p>
        </div>
        <div class="flex items-center gap-2">
          <button (click)="loadRecords()" class="btn btn-secondary btn-sm flex items-center gap-1.5 shadow-xs">
            <i class="fa-solid fa-rotate-right"></i>
            <span>Refresh Grid</span>
          </button>
        </div>
      </div>

      <!-- Advanced Filters Bar (Compact 1-Line Header Bar) -->
      <div class="card p-3 px-4 border border-slate-200 flex flex-row items-center gap-3 overflow-x-auto">
        
        <!-- Employee Filter -->
        <div class="flex items-center gap-1.5 min-w-[200px]">
          <span class="text-[11px] font-bold text-slate-500 whitespace-nowrap">Employee:</span>
          <select [(ngModel)]="selectedEmployee" (change)="loadRecords()" class="form-select text-xs !py-1.5 !px-3 font-semibold flex-1">
            <option value="All">All Staff Members</option>
            <option *ngFor="let emp of employees" [value]="emp._id">
              {{ emp.fullName }} ({{ emp.department || 'Employee' }})
            </option>
          </select>
        </div>

        <!-- Month Filter -->
        <div class="flex items-center gap-1.5 min-w-[150px]">
          <span class="text-[11px] font-bold text-slate-500 whitespace-nowrap">Month:</span>
          <select [(ngModel)]="selectedMonth" (change)="loadRecords()" class="form-select text-xs !py-1.5 !px-3 font-semibold flex-1">
            <option *ngFor="let m of monthNames; let i = index" [value]="i + 1">
              {{ m }}
            </option>
          </select>
        </div>

        <!-- Year Filter -->
        <div class="flex items-center gap-1.5 min-w-[120px]">
          <span class="text-[11px] font-bold text-slate-500 whitespace-nowrap">Year:</span>
          <select [(ngModel)]="selectedYear" (change)="loadRecords()" class="form-select text-xs !py-1.5 !px-3 font-semibold flex-1">
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>
        </div>

        <!-- Status Filter -->
        <div class="flex items-center gap-1.5 min-w-[150px]">
          <span class="text-[11px] font-bold text-slate-500 whitespace-nowrap">Status:</span>
          <select [(ngModel)]="selectedStatus" (change)="loadRecords()" class="form-select text-xs !py-1.5 !px-3 font-semibold flex-1">
            <option value="All">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Half-Day">Half-Day</option>
            <option value="Leave">Leave / Absent</option>
          </select>
        </div>

      </div>

      <!-- Attendance Grid -->
      <div class="card p-6 border border-slate-200">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <div class="flex items-center gap-3">
            <span class="text-xs text-slate-500 font-semibold">
              Found <strong class="text-slate-800">{{ records.length }}</strong> Attendance Logs
            </span>
            <span *ngIf="selectedIds.size > 0" class="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 animate-fade">
              <i class="fa-solid fa-check-double mr-1"></i> {{ selectedIds.size }} selected
            </span>
          </div>

          <div class="flex items-center gap-2">
            <!-- Bulk Delete Action Button -->
            <button 
              *ngIf="selectedIds.size > 0" 
              (click)="bulkDeleteSelected()" 
              class="btn btn-sm bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1.5 shadow-sm transition-all animate-fade">
              <i class="fa-solid fa-trash-can"></i>
              <span>Delete Selected ({{ selectedIds.size }})</span>
            </button>

            <button (click)="openAddModal()" class="btn btn-primary btn-sm flex items-center gap-1.5 shadow-xs">
              <i class="fa-solid fa-plus"></i>
              <span>Add Attendance</span>
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-xs">
            <thead>
              <tr class="border-b border-slate-100 text-slate-400 text-left font-semibold">
                <th class="py-3 px-3 w-8">
                  <input 
                    type="checkbox" 
                    [checked]="isAllSelected()" 
                    (change)="toggleSelectAll()" 
                    class="rounded text-blue-600 focus:ring-blue-500 cursor-pointer">
                </th>
                <th class="py-3 px-3">Employee</th>
                <th class="py-3 px-3">Date</th>
                <th class="py-3 px-3">Check In</th>
                <th class="py-3 px-3">Check Out</th>
                <th class="py-3 px-3 text-center">Status</th>
                <th class="py-3 px-3 text-center">Source</th>
                <th class="py-3 px-3">Remarks</th>
                <th class="py-3 px-3 text-right">Admin Override</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium">
              <tr *ngFor="let rec of records" class="hover:bg-slate-50/70 transition-colors" [ngClass]="{'bg-blue-50/40': selectedIds.has(rec._id)}">
                
                <!-- Checkbox -->
                <td class="py-3.5 px-3 w-8">
                  <input 
                    type="checkbox" 
                    [checked]="selectedIds.has(rec._id)" 
                    (change)="toggleSelect(rec._id)" 
                    class="rounded text-blue-600 focus:ring-blue-500 cursor-pointer">
                </td>

                <!-- Employee -->
                <td class="py-3.5 px-3 flex items-center gap-2.5">
                  <img [src]="getEmpAvatar(rec)" class="w-7 h-7 rounded-full bg-slate-100 border" alt="">
                  <div>
                    <div class="flex items-center gap-1.5">
                      <span class="font-bold text-slate-800">{{ getEmpName(rec) }}</span>
                      <span *ngIf="getEmpCode(rec)" class="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-mono text-[9px] font-bold border border-blue-200">
                        #{{ getEmpCode(rec) }}
                      </span>
                    </div>
                    <div class="text-[10px] text-slate-400">{{ getEmpDept(rec) }}</div>
                  </div>
                </td>

                <!-- Date -->
                <td class="py-3.5 px-3 font-mono text-slate-700">
                  <div>{{ rec.dateStr }}</div>
                  <div class="text-[10px] text-slate-400">{{ getDayName(rec.dateStr) }}</div>
                </td>

                <!-- Check In & Out -->
                <td class="py-3.5 px-3 font-mono text-slate-800">{{ rec.checkInTime || '—' }}</td>
                <td class="py-3.5 px-3 font-mono text-slate-800">{{ rec.checkOutTime || '—' }}</td>

                <!-- Status Badge -->
                <td class="py-3.5 px-3 text-center">
                  <span 
                    class="badge text-[10px]"
                    [ngClass]="{
                      'badge-present': rec.status === 'Present',
                      'badge-halfday': rec.status === 'Half-Day',
                      'badge-absent': rec.status === 'Absent' || rec.status === 'Leave'
                    }">
                    {{ rec.status }}
                  </span>
                </td>

                <!-- Source / LoggedBy -->
                <td class="py-3.5 px-3 text-center">
                  <span class="px-2 py-0.5 rounded text-[10px] font-semibold"
                    [ngClass]="rec.loggedBy === 'Admin' ? 'bg-purple-50 text-purple-700' : 'bg-slate-100 text-slate-600'">
                    {{ rec.loggedBy || 'Self' }}
                  </span>
                </td>

                <!-- Remarks -->
                <td class="py-3.5 px-3 text-slate-500 truncate max-w-[160px]">{{ rec.remarks || 'Biometric punch' }}</td>

                <!-- Actions -->
                <td class="py-3.5 px-3 text-right">
                  <div class="flex items-center justify-end gap-1.5">
                    <button (click)="openOverrideModal(rec)" class="text-blue-600 hover:text-blue-800 font-bold p-1.5 rounded-lg hover:bg-blue-50 text-xs transition-colors">
                      <i class="fa-solid fa-wrench mr-0.5"></i> Override
                    </button>
                    <button (click)="deleteRecord(rec)" title="Delete Attendance" class="text-rose-500 hover:text-rose-700 font-bold p-1.5 rounded-lg hover:bg-rose-50 text-xs transition-colors">
                      <i class="fa-solid fa-trash-can mr-0.5"></i> Delete
                    </button>
                  </div>
                </td>

              </tr>
              <tr *ngIf="records.length === 0">
                <td colspan="8" class="py-8 text-center text-slate-400">
                  No attendance records found matching the filter criteria.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add Attendance Modal (Admin) -->
      <div *ngIf="showAddModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade">
        <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
          <div class="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
            <div>
              <h3 class="font-bold text-base text-slate-900">Log Attendance & Leaves</h3>
              <p class="text-xs text-slate-400">Log single-day punch or multi-day date range on behalf of staff</p>
            </div>
            <button (click)="showAddModal = false" class="text-slate-400 hover:text-slate-600">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <!-- Mode Switcher Toggle (Single Day vs Date Range) -->
          <div class="flex p-1 bg-slate-100 rounded-xl border border-slate-200 gap-1 mb-4">
            <button 
              type="button" 
              (click)="newAttendanceMode = 'single'"
              class="flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
              [ngClass]="newAttendanceMode === 'single' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'">
              <i class="fa-regular fa-calendar"></i>
              <span>Single Date</span>
            </button>
            <button 
              type="button" 
              (click)="newAttendanceMode = 'range'"
              class="flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
              [ngClass]="newAttendanceMode === 'range' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'">
              <i class="fa-solid fa-calendar-days"></i>
              <span>Date Range (Leave / Batch)</span>
            </button>
          </div>

          <form (ngSubmit)="saveNewAttendance()" class="space-y-3.5">
            
            <!-- Employee Selector -->
            <div class="form-group mb-0">
              <label class="form-label">Select Employee <span class="text-rose-500">*</span></label>
              <select [(ngModel)]="newAttendanceData.userId" name="newUserId" class="form-select text-xs font-semibold" required>
                <option value="" disabled>-- Choose Employee --</option>
                <option *ngFor="let emp of employees" [value]="emp._id">
                  {{ emp.fullName }} ({{ emp.designation || 'Staff' }} #{{ emp.employeeId }})
                </option>
              </select>
            </div>

            <!-- Single Date Mode -->
            <div class="form-group mb-0" *ngIf="newAttendanceMode === 'single'">
              <label class="form-label">Date <span class="text-rose-500">*</span></label>
              <div class="relative">
                <input type="date" [(ngModel)]="newAttendanceData.dateStr" name="newDateStr" class="form-control text-xs font-semibold" required>
              </div>
            </div>

            <!-- Date Range Mode -->
            <div *ngIf="newAttendanceMode === 'range'" class="space-y-2.5 p-3.5 bg-blue-50/50 rounded-xl border border-blue-100">
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
                  <i class="fa-solid fa-calculator mr-1"></i>{{ getRangeDaysCount().working }} Working Days to Log
                </span>
              </div>
            </div>

            <!-- Status -->
            <div class="form-group mb-0">
              <label class="form-label">Attendance Status <span class="text-rose-500">*</span></label>
              <select [(ngModel)]="newAttendanceData.status" (change)="onNewStatusChange()" name="newStatus" class="form-select text-xs font-semibold">
                <option value="Present">Present (Full Day: 10:00 AM – 06:00 PM)</option>
                <option value="Half-Day">Half-Day (2:00 PM – 06:00 PM)</option>
                <option value="Leave">Leave (Approved Leave)</option>
                <option value="Absent">Absent (Unpaid Absence)</option>
              </select>
            </div>

            <!-- Times -->
            <div class="grid grid-cols-2 gap-3" *ngIf="newAttendanceData.status === 'Present' || newAttendanceData.status === 'Half-Day'">
              <div class="form-group mb-0">
                <label class="form-label">Check-In Time</label>
                <input type="text" [(ngModel)]="newAttendanceData.checkInTime" name="newInTime" class="form-control text-xs font-mono" placeholder="10:00 AM">
              </div>
              <div class="form-group mb-0">
                <label class="form-label">Check-Out Time</label>
                <input type="text" [(ngModel)]="newAttendanceData.checkOutTime" name="newOutTime" class="form-control text-xs font-mono" placeholder="06:00 PM">
              </div>
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
                <span>{{ addLoading ? 'Processing...' : (newAttendanceMode === 'range' ? 'Apply to Range' : 'Save Attendance') }}</span>
              </button>
            </div>

          </form>
        </div>
      </div>

      <!-- Override Modal -->
      <div *ngIf="showOverrideModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
          <div class="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
            <div>
              <h3 class="font-bold text-base text-slate-900">Admin Attendance Override</h3>
              <p class="text-xs text-slate-400">Editing {{ getEmpName(overrideData) }} for {{ overrideData.dateStr }}</p>
            </div>
            <button (click)="showOverrideModal = false" class="text-slate-400 hover:text-slate-600">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <form (ngSubmit)="saveOverride()" class="space-y-3.5">
            
            <div class="form-group mb-0">
              <label class="form-label">Attendance Status <span class="text-rose-500">*</span></label>
              <select [(ngModel)]="overrideData.status" (change)="onOverrideStatusChange()" name="oStatus" class="form-select text-xs">
                <option value="Present">Present (Full Day: 10:00 AM – 06:00 PM)</option>
                <option value="Half-Day">Half-Day (2:00 PM – 06:00 PM)</option>
                <option value="Leave">Leave (Paid/Approved)</option>
                <option value="Absent">Absent (Unpaid)</option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-3" *ngIf="overrideData.status === 'Present' || overrideData.status === 'Half-Day'">
              <div class="form-group mb-0">
                <label class="form-label">Check-In Time</label>
                <input type="text" [(ngModel)]="overrideData.checkInTime" name="oCheckIn" class="form-control text-xs font-mono" placeholder="10:00 AM">
              </div>
              <div class="form-group mb-0">
                <label class="form-label">Check-Out Time</label>
                <input type="text" [(ngModel)]="overrideData.checkOutTime" name="oCheckOut" class="form-control text-xs font-mono" placeholder="06:00 PM">
              </div>
            </div>

            <div class="form-group mb-0">
              <label class="form-label">Correction Reason / Remarks</label>
              <textarea [(ngModel)]="overrideData.remarks" name="oRemarks" rows="2" class="form-control text-xs" placeholder="Reason for admin override..."></textarea>
            </div>

            <div class="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button type="button" (click)="showOverrideModal = false" class="btn btn-secondary btn-sm">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm font-bold">Save Override</button>
            </div>

          </form>
        </div>
      </div>

    </div>
  `
})
export class MasterAttendanceComponent implements OnInit {
  records: AttendanceRecord[] = [];
  employees: User[] = [];
  selectedEmployee = 'All';
  selectedMonth: any = new Date().getMonth() + 1;
  selectedYear = new Date().getFullYear();
  selectedStatus = 'All';

  selectedIds = new Set<string>();

  showOverrideModal = false;
  overrideData: any = {};

  showAddModal = false;
  addLoading = false;
  newAttendanceMode: 'single' | 'range' = 'single';
  newAttendanceData: any = {
    userId: '',
    dateStr: this.getTodayDateStr(),
    startDate: this.getTodayDateStr(),
    endDate: this.getTodayDateStr(),
    checkInTime: '10:00 AM',
    checkOutTime: '06:00 PM',
    status: 'Present',
    remarks: '',
    excludeSundays: true
  };

  monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  constructor(
    private attendanceService: AttendanceService,
    private employeeService: EmployeeService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.employeeService.getAllEmployees().subscribe({
      next: (res) => {
        this.employees = res.employees || [];
      }
    });
    this.loadRecords();
  }

  toggleSelect(id?: string) {
    if (!id) return;
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
  }

  isAllSelected(): boolean {
    return this.records.length > 0 && this.records.every(r => r._id && this.selectedIds.has(r._id));
  }

  toggleSelectAll() {
    if (this.isAllSelected()) {
      this.selectedIds.clear();
    } else {
      this.records.forEach(r => {
        if (r._id) this.selectedIds.add(r._id);
      });
    }
  }

  bulkDeleteSelected() {
    if (this.selectedIds.size === 0) return;
    const count = this.selectedIds.size;
    if (!confirm(`Are you sure you want to delete ${count} selected attendance record(s)? This will permanently remove them.`)) {
      return;
    }

    const ids = Array.from(this.selectedIds);
    this.attendanceService.bulkDeleteAttendance(ids).subscribe({
      next: (res) => {
        this.toast.success(res.message || `Deleted ${res.count || count} attendance records successfully.`);
        this.selectedIds.clear();
        this.loadRecords();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to delete selected attendance records.');
      }
    });
  }

  getTodayDateStr(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

  loadRecords() {
    this.attendanceService.getMasterAttendance({
      employeeId: this.selectedEmployee,
      month: this.selectedMonth,
      year: this.selectedYear,
      status: this.selectedStatus
    }).subscribe({
      next: (res) => {
        this.records = res.records || [];
      },
      error: () => {
        this.toast.error('Failed to load master attendance logs.');
      }
    });
  }

  openAddModal() {
    this.newAttendanceMode = 'single';
    this.newAttendanceData = {
      userId: this.employees.length > 0 ? this.employees[0]._id : '',
      dateStr: this.getTodayDateStr(),
      startDate: this.getTodayDateStr(),
      endDate: this.getTodayDateStr(),
      checkInTime: '10:00 AM',
      checkOutTime: '06:00 PM',
      status: 'Present',
      remarks: '',
      excludeSundays: true
    };
    this.showAddModal = true;
  }

  saveNewAttendance() {
    if (!this.newAttendanceData.userId) {
      this.toast.error('Please select an employee.');
      return;
    }

    this.addLoading = true;

    if (this.newAttendanceMode === 'range') {
      if (!this.newAttendanceData.startDate || !this.newAttendanceData.endDate) {
        this.toast.error('Please select both Start Date and End Date.');
        this.addLoading = false;
        return;
      }
      this.attendanceService.bulkLogAttendance({
        userId: this.newAttendanceData.userId,
        startDate: this.newAttendanceData.startDate,
        endDate: this.newAttendanceData.endDate,
        status: this.newAttendanceData.status,
        checkInTime: this.newAttendanceData.checkInTime,
        checkOutTime: this.newAttendanceData.checkOutTime,
        remarks: this.newAttendanceData.remarks,
        excludeSundays: this.newAttendanceData.excludeSundays
      }).subscribe({
        next: (res) => {
          this.addLoading = false;
          this.toast.success(res.message || 'Date range attendance logged successfully!');
          this.showAddModal = false;
          this.loadRecords();
        },
        error: (err) => {
          this.addLoading = false;
          this.toast.error(err.error?.message || 'Failed to log date range attendance.');
        }
      });
    } else {
      if (!this.newAttendanceData.dateStr) {
        this.toast.error('Please select a date.');
        this.addLoading = false;
        return;
      }
      this.attendanceService.logAttendance(this.newAttendanceData).subscribe({
        next: () => {
          this.addLoading = false;
          this.toast.success('Attendance record added successfully!');
          this.showAddModal = false;
          this.loadRecords();
        },
        error: (err) => {
          this.addLoading = false;
          this.toast.error(err.error?.message || 'Failed to add attendance record.');
        }
      });
    }
  }

  onNewStatusChange() {
    if (this.newAttendanceData.status === 'Half-Day') {
      this.newAttendanceData.checkInTime = '02:00 PM';
      this.newAttendanceData.checkOutTime = '06:00 PM';
    } else if (this.newAttendanceData.status === 'Present') {
      this.newAttendanceData.checkInTime = '10:00 AM';
      this.newAttendanceData.checkOutTime = '06:00 PM';
    }
  }

  onOverrideStatusChange() {
    if (this.overrideData.status === 'Half-Day') {
      this.overrideData.checkInTime = '02:00 PM';
      this.overrideData.checkOutTime = '06:00 PM';
    } else if (this.overrideData.status === 'Present') {
      this.overrideData.checkInTime = '10:00 AM';
      this.overrideData.checkOutTime = '06:00 PM';
    }
  }

  openOverrideModal(rec: AttendanceRecord) {
    const rawUserId = typeof rec.userId === 'object' ? (rec.userId as any)?._id : rec.userId;
    this.overrideData = {
      _id: rec._id,
      userId: rawUserId,
      dateStr: rec.dateStr,
      checkInTime: rec.checkInTime || '',
      checkOutTime: rec.checkOutTime || '',
      status: rec.status,
      remarks: rec.remarks || 'Admin manual correction'
    };
    this.showOverrideModal = true;
  }

  saveOverride() {
    if (!this.overrideData._id) return;
    this.attendanceService.adminOverride(this.overrideData._id, this.overrideData).subscribe({
      next: () => {
        this.toast.success('Attendance record updated with admin override.');
        this.showOverrideModal = false;
        this.loadRecords();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to override attendance.');
      }
    });
  }

  deleteRecord(rec: AttendanceRecord) {
    if (!rec._id) return;
    if (!confirm(`Are you sure you want to delete the attendance record for ${this.getEmpName(rec)} on ${rec.dateStr}?`)) {
      return;
    }
    this.attendanceService.deleteAttendance(rec._id).subscribe({
      next: (res) => {
        this.toast.success(res.message || 'Attendance record deleted.');
        this.loadRecords();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to delete attendance record.');
      }
    });
  }

  getEmpName(rec: any): string {
    if (!rec) return 'Staff';
    if (typeof rec.userId === 'object' && rec.userId?.fullName) return rec.userId.fullName;
    const emp = this.employees.find(e => e._id === rec.userId);
    return emp ? emp.fullName : 'Staff Member';
  }

  getEmpCode(rec: any): string {
    if (!rec) return '';
    if (typeof rec.userId === 'object' && rec.userId?.employeeId) return rec.userId.employeeId;
    const emp = this.employees.find(e => e._id === rec.userId);
    return emp?.employeeId || '';
  }

  getEmpDept(rec: any): string {
    if (!rec) return '';
    if (typeof rec.userId === 'object' && rec.userId?.department) return rec.userId.department;
    const emp = this.employees.find(e => e._id === rec.userId);
    return emp ? (emp.department || '') : '';
  }

  getEmpAvatar(rec: any): string {
    if (typeof rec.userId === 'object' && rec.userId?.avatar) return rec.userId.avatar;
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.getEmpName(rec)}`;
  }

  getDayName(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  }
}
