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
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
              <i class="fa-solid fa-pen-to-square text-blue-600"></i>
              <span>{{ isEditing ? 'Edit Attendance Log' : 'Add Daily Attendance' }}</span>
            </h3>
            <span *ngIf="isEditing" (click)="resetForm()" class="text-xs text-rose-600 font-bold hover:underline cursor-pointer">
              Cancel Edit
            </span>
          </div>

          <form (ngSubmit)="saveAttendance()" class="space-y-4">
            
            <div class="form-group mb-0">
              <label class="form-label">Date <span class="text-rose-500">*</span></label>
              <input 
                type="date" 
                [(ngModel)]="formData.dateStr" 
                name="dateStr" 
                required 
                class="form-control text-sm font-semibold">
            </div>

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
              <label class="form-label">Attendance Status <span class="text-rose-500">*</span></label>
              <select [(ngModel)]="formData.status" (change)="onStatusChange()" name="status" class="form-select text-sm font-semibold">
                <option value="Present">Present (Full Day: 10:00 AM – 06:00 PM)</option>
                <option value="Half-Day">Half-Day (2:00 PM – 06:00 PM)</option>
                <option value="Leave">Leave (Approved)</option>
                <option value="Absent">Absent (Unpaid)</option>
              </select>
            </div>

            <div class="form-group mb-0">
              <label class="form-label">Notes / Remarks</label>
              <textarea 
                [(ngModel)]="formData.remarks" 
                name="remarks" 
                rows="3" 
                placeholder="e.g. Daily office attendance, remote work, sprint release..." 
                class="form-control text-sm"></textarea>
            </div>

            <button 
              type="submit" 
              [disabled]="loading || !formData.dateStr" 
              class="w-full btn btn-primary py-2.5 font-bold rounded-xl shadow-sm flex items-center justify-center gap-2">
              <i *ngIf="loading" class="fa-solid fa-spinner fa-spin"></i>
              <span>{{ isEditing ? 'Update Record' : 'Save Attendance' }}</span>
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
  formData: any = {
    dateStr: this.getTodayDateStr(),
    checkInTime: '10:00 AM',
    checkOutTime: '06:00 PM',
    status: 'Present',
    remarks: 'Daily office attendance'
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

  loadMyAttendance() {
    // Fetch all attendance records for this user (not restricted to month 1)
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
    if (!this.formData.dateStr) {
      this.toast.error('Please select a date.');
      return;
    }

    this.loading = true;
    this.attendanceService.logAttendance(this.formData).subscribe({
      next: (res) => {
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
      checkInTime: '10:00 AM',
      checkOutTime: '06:00 PM',
      status: 'Present',
      remarks: 'Daily office attendance'
    };
  }

  getWeekday(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  }
}
