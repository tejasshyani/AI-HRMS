import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HolidayService } from '../../../services/holiday.service';
import { ToastService } from '../../../services/toast.service';
import { Holiday } from '../../../models';

@Component({
  selector: 'app-holiday-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 pb-12 space-y-6 max-w-7xl mx-auto">
      
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-xl font-extrabold text-slate-900 tracking-tight">Company Holiday Management</h1>
          <p class="text-xs text-slate-500 mt-0.5">Configure National & Public paid holidays factored into payroll standard calculations</p>
        </div>
        <button (click)="openAddModal()" class="btn btn-primary btn-sm flex items-center gap-2">
          <i class="fa-solid fa-plus"></i>
          <span>Add New Holiday</span>
        </button>
      </div>

      <!-- Holidays Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div *ngFor="let h of holidays" class="card p-5 border border-slate-200 hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div class="flex items-start justify-between gap-2">
              <span 
                class="badge text-[10px]"
                [ngClass]="h.category === 'National Holiday' ? 'badge-present' : 'badge-holiday'">
                {{ h.category }}
              </span>
              <span *ngIf="h.isRecurring" class="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                <i class="fa-solid fa-repeat mr-1"></i> Annual
              </span>
            </div>

            <div class="flex items-center gap-3.5 mt-4">
              <div class="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex flex-col items-center justify-center font-bold shadow-xs">
                <span class="text-sm leading-none">{{ getDayNum(h.dateStr) }}</span>
                <span class="text-[10px] uppercase font-semibold text-blue-500 mt-0.5">{{ getMonthShort(h.dateStr) }}</span>
              </div>
              <div>
                <h3 class="font-bold text-slate-900 text-sm leading-tight">{{ h.title }}</h3>
                <div class="text-xs text-slate-400 font-mono mt-0.5">{{ h.dateStr }} ({{ getDayName(h.dateStr) }})</div>
              </div>
            </div>

            <p class="text-xs text-slate-500 mt-3 leading-relaxed">
              {{ h.description || 'Official company-wide paid non-working day.' }}
            </p>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-2 pt-4 mt-4 border-t border-slate-100">
            <button (click)="openEditModal(h)" class="text-blue-600 hover:text-blue-800 text-xs font-bold p-1 rounded hover:bg-blue-50">
              <i class="fa-solid fa-pen-to-square mr-1"></i> Edit
            </button>
            <button (click)="deleteHoliday(h)" class="text-rose-600 hover:text-rose-800 text-xs font-bold p-1 rounded hover:bg-rose-50">
              <i class="fa-solid fa-trash mr-1"></i> Delete
            </button>
          </div>

        </div>
      </div>

      <!-- Add/Edit Modal -->
      <div *ngIf="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
          
          <div class="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
            <h3 class="font-bold text-base text-slate-900">{{ isEditing ? 'Edit Holiday' : 'Add Official Holiday' }}</h3>
            <button (click)="showModal = false" class="text-slate-400 hover:text-slate-600">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <form (ngSubmit)="saveHoliday()" class="space-y-3.5">
            
            <div class="form-group mb-0">
              <label class="form-label">Holiday Title <span class="text-rose-500">*</span></label>
              <input type="text" [(ngModel)]="modalData.title" name="title" required placeholder="e.g. Republic Day" class="form-control text-xs">
            </div>

            <div class="form-group mb-0">
              <label class="form-label">Date <span class="text-rose-500">*</span></label>
              <input type="date" [(ngModel)]="modalData.dateStr" name="dateStr" required class="form-control text-xs">
            </div>

            <div class="form-group mb-0">
              <label class="form-label">Category</label>
              <select [(ngModel)]="modalData.category" name="category" class="form-select text-xs">
                <option value="National Holiday">National Holiday</option>
                <option value="Public Holiday">Public Holiday</option>
                <option value="Company Holiday">Company Holiday</option>
                <option value="Observance">Observance</option>
              </select>
            </div>

            <div class="form-group mb-0">
              <label class="form-label">Description / Remarks</label>
              <textarea [(ngModel)]="modalData.description" name="description" rows="2" placeholder="Official description..." class="form-control text-xs"></textarea>
            </div>

            <!-- Recurring Annual Toggle -->
            <div class="flex items-center justify-between pt-2">
              <div>
                <div class="font-bold text-xs text-slate-800">Recurring Annual Holiday</div>
                <div class="text-[10px] text-slate-400">Automatically applies each calendar year</div>
              </div>
              <input type="checkbox" [(ngModel)]="modalData.isRecurring" name="isRecurring" class="w-4 h-4 rounded text-blue-600">
            </div>

            <div class="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button type="button" (click)="showModal = false" class="btn btn-secondary btn-sm">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm font-bold">
                {{ isEditing ? 'Save Changes' : 'Create Holiday' }}
              </button>
            </div>

          </form>

        </div>
      </div>

    </div>
  `
})
export class HolidayManagerComponent implements OnInit {
  holidays: Holiday[] = [];
  showModal = false;
  isEditing = false;
  modalData: any = {};

  constructor(
    private holidayService: HolidayService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.loadHolidays();
  }

  loadHolidays() {
    this.holidayService.getAllHolidays(2026).subscribe({
      next: (res) => {
        this.holidays = res.holidays || [];
      },
      error: () => {
        this.toast.error('Failed to load holiday list.');
      }
    });
  }

  openAddModal() {
    this.isEditing = false;
    this.modalData = {
      title: '',
      dateStr: new Date().toISOString().split('T')[0],
      category: 'Public Holiday',
      isRecurring: true,
      description: ''
    };
    this.showModal = true;
  }

  openEditModal(h: Holiday) {
    this.isEditing = true;
    this.modalData = {
      _id: h._id,
      title: h.title,
      dateStr: h.dateStr,
      category: h.category,
      isRecurring: h.isRecurring,
      description: h.description || ''
    };
    this.showModal = true;
  }

  saveHoliday() {
    if (!this.modalData.title || !this.modalData.dateStr) {
      this.toast.error('Title and Date are required.');
      return;
    }

    if (this.isEditing) {
      this.holidayService.updateHoliday(this.modalData._id, this.modalData).subscribe({
        next: () => {
          this.toast.success('Holiday updated successfully.');
          this.showModal = false;
          this.loadHolidays();
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Failed to update holiday.');
        }
      });
    } else {
      this.holidayService.createHoliday(this.modalData).subscribe({
        next: () => {
          this.toast.success('Holiday created successfully.');
          this.showModal = false;
          this.loadHolidays();
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Failed to create holiday.');
        }
      });
    }
  }

  deleteHoliday(h: Holiday) {
    if (!confirm(`Are you sure you want to remove ${h.title}?`)) return;
    if (!h._id) return;

    this.holidayService.deleteHoliday(h._id).subscribe({
      next: () => {
        this.toast.success('Holiday deleted.');
        this.loadHolidays();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to delete holiday.');
      }
    });
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

  getDayName(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'long' });
  }
}
