import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '../../../services/attendance.service';
import { ToastService } from '../../../services/toast.service';
import { AttendanceRecord } from '../../../models';

@Component({
  selector: 'app-attendance-log',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 pb-12 space-y-6 max-w-7xl mx-auto">
      
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-xl font-extrabold text-slate-900 tracking-tight">Daily Attendance Logging</h1>
          <p class="text-xs text-slate-500 mt-0.5">Record and edit your daily work check-in, check-out, and status</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="badge badge-present text-xs py-1 px-3">
            <i class="fa-solid fa-clock mr-1"></i> Mon–Sat Work Week
          </span>
        </div>
      </div>

      <!-- Main Grid: Form on Left, History on Right -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Log/Edit Form Card -->
        <div class="card p-6 border border-slate-200 lg:col-span-1">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
              <i class="fa-solid fa-pen-to-square text-blue-600"></i>
              <span>{{ isEditing ? 'Edit Attendance Log' : 'Add Attendance / Leave' }}</span>
            </h3>
            <span *ngIf="isEditing" (click)="resetForm()" class="text-xs text-rose-600 font-bold hover:underline cursor-pointer">
              Cancel Edit
            </span>
          </div>

          <!-- Mode Toggle Switcher -->
          <div *ngIf="!isEditing" class="flex p-1 bg-slate-100 rounded-xl border border-slate-200 gap-1 mb-4">
            <button 
              type="button" 
              (click)="attendanceMode = 'single'"
              class="flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
              [ngClass]="attendanceMode === 'single' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'">
              <i class="fa-regular fa-calendar"></i>
              <span>Single Date</span>
            </button>
            <button 
              type="button" 
              (click)="attendanceMode = 'range'"
              class="flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
              [ngClass]="attendanceMode === 'range' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'">
              <i class="fa-solid fa-calendar-days"></i>
              <span>Date Range</span>
            </button>
          </div>

          <form (ngSubmit)="saveAttendance()" class="space-y-4">
            
            <!-- Single Date Input -->
            <div class="form-group mb-0" *ngIf="attendanceMode === 'single' || isEditing">
              <label class="form-label">Date <span class="text-rose-500">*</span></label>
              <input 
                type="date" 
                [(ngModel)]="formData.dateStr" 
                name="dateStr" 
                required 
                class="form-control text-sm font-semibold">
            </div>

            <!-- Date Range Inputs -->
            <div *ngIf="attendanceMode === 'range' && !isEditing" class="space-y-2.5 p-3.5 bg-blue-50/50 rounded-xl border border-blue-100">
              <div class="grid grid-cols-2 gap-3">
                <div class="form-group mb-0">
                  <label class="form-label text-blue-900 font-bold">Start Date <span class="text-rose-500">*</span></label>
                  <input 
                    type="date" 
                    [(ngModel)]="formData.startDate" 
                    name="startDate" 
                    required 
                    class="form-control text-xs font-semibold">
                </div>

                <div class="form-group mb-0">
                  <label class="form-label text-blue-900 font-bold">End Date <span class="text-rose-500">*</span></label>
                  <input 
                    type="date" 
                    [(ngModel)]="formData.endDate" 
                    name="endDate" 
                    required 
                    class="form-control text-xs font-semibold">
                </div>
              </div>

              <!-- Exclude Sundays & Live Counter Badge -->
              <div class="flex items-center justify-between pt-1">
                <label class="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium">
                  <input type="checkbox" [(ngModel)]="formData.excludeSundays" name="excludeSundays" class="rounded text-blue-600 focus:ring-blue-500">
                  <span>Exclude Sundays</span>
                </label>
                <span class="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                  <i class="fa-solid fa-calculator mr-1"></i>{{ getRangeDaysCount().working }} Working Days
                </span>
              </div>
            </div>

            <!-- Attendance Status -->
            <div class="form-group mb-0">
              <label class="form-label">Attendance Status <span class="text-rose-500">*</span></label>
              <select [(ngModel)]="formData.status" (change)="onStatusChange()" name="status" class="form-select text-sm font-semibold">
                <option value="Present">Present (Full Day: 10:00 AM – 06:00 PM)</option>
                <option value="Half-Day">Half-Day (2:00 PM – 06:00 PM)</option>
                <option value="Leave">Leave (Approved Leave)</option>
                <option value="Absent">Absent (Unpaid Absence)</option>
              </select>
            </div>

            <!-- Times -->
            <div class="grid grid-cols-2 gap-3" *ngIf="formData.status === 'Present' || formData.status === 'Half-Day'">
              <div class="form-group mb-0">
                <label class="form-label">Check-In Time</label>
                <input 
                  type="text" 
                  [(ngModel)]="formData.checkInTime" 
                  name="checkInTime" 
                  placeholder="10:00 AM" 
                  class="form-control text-sm font-mono">
              </div>

              <div class="form-group mb-0">
                <label class="form-label">Check-Out Time</label>
                <input 
                  type="text" 
                  [(ngModel)]="formData.checkOutTime" 
                  name="checkOutTime" 
                  placeholder="06:00 PM" 
                  class="form-control text-sm font-mono">
              </div>
            </div>

            <div class="form-group mb-0">
              <label class="form-label">Notes / Remarks</label>
              <textarea 
                [(ngModel)]="formData.remarks" 
                name="remarks" 
                rows="2" 
                placeholder="e.g. Vacation, medical leave, sprint release..." 
                class="form-control text-sm resize-none"></textarea>
            </div>

            <button 
              type="submit" 
              [disabled]="loading" 
              class="w-full btn btn-primary py-2.5 font-bold rounded-xl shadow-xs flex items-center justify-center gap-2">
              <i *ngIf="loading" class="fa-solid fa-spinner fa-spin"></i>
              <span>{{ loading ? 'Saving...' : (isEditing ? 'Update Record' : (attendanceMode === 'range' ? 'Apply to Date Range' : 'Save Attendance')) }}</span>
            </button>

          </form>
        </div>

        <!-- History Table Card -->
        <div class="card p-6 border border-slate-200 lg:col-span-2">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <div>
              <h3 class="text-sm font-bold text-slate-900">Recent Attendance History</h3>
              <p class="text-xs text-slate-400">Showing latest attendance records and check-in times ({{ records.length }} total)</p>
            </div>
            <div class="flex items-center gap-2">
              <button (click)="loadMyAttendance()" class="btn btn-secondary btn-sm flex items-center gap-1.5">
                <i class="fa-solid fa-rotate-right"></i>
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-xs">
              <thead>
                <tr class="border-b border-slate-100 text-slate-400 text-left font-semibold">
                  <th class="py-2.5">Date</th>
                  <th class="py-2.5">Day</th>
                  <th class="py-2.5">Check In</th>
                  <th class="py-2.5">Check Out</th>
                  <th class="py-2.5">Status</th>
                  <th class="py-2.5">Remarks</th>
                  <th class="py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-medium">
                <tr *ngFor="let rec of records" class="hover:bg-slate-50/70 transition-colors">
                  <td class="py-3 font-mono font-bold text-slate-800">{{ rec.dateStr }}</td>
                  <td class="py-3 text-slate-500">{{ getWeekday(rec.dateStr) }}</td>
                  <td class="py-3 text-slate-700 font-mono">{{ rec.checkInTime || '—' }}</td>
                  <td class="py-3 text-slate-700 font-mono">{{ rec.checkOutTime || '—' }}</td>
                  <td class="py-3">
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
                  <td class="py-3 text-slate-500 truncate max-w-[150px]">{{ rec.remarks || 'Daily log' }}</td>
                  <td class="py-3 text-right">
                    <div class="flex items-center justify-end gap-2">
                      <button 
                        (click)="editRecord(rec)" 
                        class="text-blue-600 hover:text-blue-800 font-bold p-1 rounded hover:bg-blue-50 text-xs">
                        <i class="fa-solid fa-pen-to-square mr-0.5"></i> Edit
                      </button>
                      <button 
                        (click)="deleteRecord(rec)" 
                        title="Delete Attendance"
                        class="text-rose-500 hover:text-rose-700 font-bold p-1 rounded hover:bg-rose-50 text-xs">
                        <i class="fa-solid fa-trash-can mr-0.5"></i> Delete
                      </button>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="records.length === 0">
                  <td colspan="7" class="py-12 text-center text-slate-400">
                    <i class="fa-regular fa-calendar-xmark text-2xl mb-2 text-slate-300"></i>
                    <p>No attendance records logged yet. Fill out the form on the left to save your first record!</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  `
})
export class AttendanceLogComponent implements OnInit {
  records: AttendanceRecord[] = [];
  attendanceMode: 'single' | 'range' = 'single';
  formData: any = {
    dateStr: this.getTodayDateStr(),
    startDate: this.getTodayDateStr(),
    endDate: this.getTodayDateStr(),
    checkInTime: '10:00 AM',
    checkOutTime: '06:00 PM',
    status: 'Present',
    remarks: '',
    excludeSundays: true
  };
  isEditing = false;
  editingId: string | null = null;
  loading = false;

  constructor(
    private attendanceService: AttendanceService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.loadMyAttendance();
  }

  getTodayDateStr(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getRangeDaysCount(): { total: number; sundays: number; working: number } {
    if (!this.formData.startDate || !this.formData.endDate) {
      return { total: 0, sundays: 0, working: 0 };
    }
    const sParts = this.formData.startDate.split('-').map(Number);
    const eParts = this.formData.endDate.split('-').map(Number);
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
    const working = this.formData.excludeSundays ? (total - sundays) : total;
    return { total, sundays, working };
  }

  loadMyAttendance() {
    // Fetch all attendance records for this user
    this.attendanceService.getMyAttendance().subscribe({
      next: (res) => {
        this.records = res.records || [];
      },
      error: () => {
        this.toast.error('Failed to load attendance records.');
      }
    });
  }

  saveAttendance() {
    this.loading = true;

    if (this.attendanceMode === 'range' && !this.isEditing) {
      if (!this.formData.startDate || !this.formData.endDate) {
        this.toast.error('Please select both Start Date and End Date.');
        this.loading = false;
        return;
      }
      this.attendanceService.bulkLogAttendance({
        startDate: this.formData.startDate,
        endDate: this.formData.endDate,
        status: this.formData.status,
        checkInTime: this.formData.checkInTime,
        checkOutTime: this.formData.checkOutTime,
        remarks: this.formData.remarks,
        excludeSundays: this.formData.excludeSundays
      }).subscribe({
        next: (res) => {
          this.loading = false;
          this.toast.success(res.message || 'Date range attendance saved successfully!');
          this.resetForm();
          this.loadMyAttendance();
        },
        error: (err) => {
          this.loading = false;
          this.toast.error(err.error?.message || 'Failed to save date range attendance.');
        }
      });
    } else {
      if (!this.formData.dateStr) {
        this.toast.error('Please select a date.');
        this.loading = false;
        return;
      }

      this.attendanceService.logAttendance(this.formData).subscribe({
        next: () => {
          this.loading = false;
          this.toast.success(this.isEditing ? 'Attendance updated successfully!' : 'Attendance logged successfully!');
          this.resetForm();
          this.loadMyAttendance();
        },
        error: (err) => {
          this.loading = false;
          this.toast.error(err.error?.message || 'Failed to save attendance record.');
        }
      });
    }
  }

  onStatusChange() {
    if (this.formData.status === 'Half-Day') {
      this.formData.checkInTime = '02:00 PM';
      this.formData.checkOutTime = '06:00 PM';
    } else if (this.formData.status === 'Present') {
      this.formData.checkInTime = '10:00 AM';
      this.formData.checkOutTime = '06:00 PM';
    }
  }

  editRecord(rec: AttendanceRecord) {
    this.isEditing = true;
    this.attendanceMode = 'single';
    this.editingId = rec._id || null;
    this.formData = {
      dateStr: rec.dateStr,
      checkInTime: rec.checkInTime || '10:00 AM',
      checkOutTime: rec.checkOutTime || '06:00 PM',
      status: rec.status,
      remarks: rec.remarks || ''
    };
  }

  deleteRecord(rec: AttendanceRecord) {
    if (!rec._id) return;
    if (!confirm(`Are you sure you want to delete your attendance record for ${rec.dateStr}?`)) {
      return;
    }
    this.attendanceService.deleteAttendance(rec._id).subscribe({
      next: (res) => {
        this.toast.success(res.message || 'Attendance record deleted successfully.');
        if (this.editingId === rec._id) {
          this.resetForm();
        }
        this.loadMyAttendance();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to delete attendance record.');
      }
    });
  }

  resetForm() {
    this.isEditing = false;
    this.editingId = null;
    this.formData = {
      dateStr: this.getTodayDateStr(),
      startDate: this.getTodayDateStr(),
      endDate: this.getTodayDateStr(),
      checkInTime: '10:00 AM',
      checkOutTime: '06:00 PM',
      status: 'Present',
      remarks: '',
      excludeSundays: true
    };
  }

  getWeekday(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  }
}
