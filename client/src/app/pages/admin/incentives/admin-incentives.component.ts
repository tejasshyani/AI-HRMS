import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IncentiveService } from '../../../services/incentive.service';
import { EmployeeService } from '../../../services/employee.service';
import { ToastService } from '../../../services/toast.service';
import { IncentiveRecord, User } from '../../../models';

@Component({
  selector: 'app-admin-incentives',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 pb-12 space-y-6 max-w-7xl mx-auto">
      
      <!-- Top Title & Actions Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-xl font-extrabold text-slate-900 tracking-tight">Loan Sourcing & Incentive Audit</h1>
          <p class="text-xs text-slate-500 mt-0.5">Audit, verify, and manage all employee loan disbursements and calculated incentives</p>
        </div>
        <div class="flex items-center gap-2">
          <button (click)="openAddModal()" class="btn btn-primary btn-sm flex items-center gap-1.5 shadow-xs">
            <i class="fa-solid fa-plus"></i>
            <span>Log Employee Loan</span>
          </button>
          <button (click)="loadIncentives()" class="btn btn-secondary btn-sm flex items-center gap-1.5 shadow-xs">
            <i class="fa-solid fa-rotate-right"></i>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <!-- KPI Overview Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div class="card p-5 flex items-center justify-between border border-slate-200">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Total Loans Disbursed</span>
            <div class="text-xl font-black text-slate-900 mt-1">₹{{ totalLoanAmount?.toLocaleString() }}</div>
            <div class="text-[11px] text-blue-600 font-bold mt-1">
              <i class="fa-solid fa-file-contract mr-1"></i>{{ records.length }} Total Contract(s)
            </div>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg shadow-xs">
            <i class="fa-solid fa-landmark"></i>
          </div>
        </div>

        <div class="card p-5 flex items-center justify-between border border-slate-200">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Total Incentive Payout</span>
            <div class="text-xl font-black text-emerald-700 mt-1">₹{{ totalIncentive?.toLocaleString() }}</div>
            <div class="text-[11px] text-emerald-600 font-bold mt-1">
              <i class="fa-solid fa-coins mr-1"></i>To be paid via Payroll
            </div>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg shadow-xs">
            <i class="fa-solid fa-sack-dollar"></i>
          </div>
        </div>

        <div class="card p-5 flex items-center justify-between border border-slate-200">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Active Performers</span>
            <div class="text-xl font-black text-indigo-700 mt-1">{{ getUniquePerformersCount() }} Staff</div>
            <div class="text-[11px] text-slate-500 font-medium mt-1">
              Generated loan volume
            </div>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg shadow-xs">
            <i class="fa-solid fa-users-viewfinder"></i>
          </div>
        </div>

        <div class="card p-5 flex items-center justify-between border border-slate-200 bg-gradient-to-br from-amber-50/50 to-orange-50/50">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Avg Incentive / Loan</span>
            <div class="text-xl font-black text-amber-900 mt-1">₹{{ records.length > 0 ? (Math.round(totalIncentive / records.length)).toLocaleString() : '0' }}</div>
            <div class="text-[11px] text-amber-700 font-medium mt-1">
              Across all tiers
            </div>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-white text-amber-600 flex items-center justify-center text-lg shadow-xs border border-amber-200">
            <i class="fa-solid fa-percent"></i>
          </div>
        </div>

      </div>

      <!-- Filter Controls (Compact 1-Line Header Bar) -->
      <div class="card p-3 px-4 border border-slate-200 flex flex-row items-center gap-3 overflow-x-auto">
        
        <div class="flex items-center gap-1.5 min-w-[200px]">
          <span class="text-[11px] font-bold text-slate-500 whitespace-nowrap">Employee:</span>
          <select [(ngModel)]="selectedEmployee" (change)="loadIncentives()" class="form-select text-xs !py-1.5 !px-3 font-semibold flex-1">
            <option value="All">All Staff Members</option>
            <option *ngFor="let emp of employees" [value]="emp._id">
              {{ emp.fullName }} ({{ emp.designation || 'Staff' }})
            </option>
          </select>
        </div>

        <div class="flex items-center gap-1.5 min-w-[160px]">
          <span class="text-[11px] font-bold text-slate-500 whitespace-nowrap">Month:</span>
          <select [(ngModel)]="selectedMonth" (change)="loadIncentives()" class="form-select text-xs !py-1.5 !px-3 font-semibold flex-1">
            <option value="All">All Months (YTD)</option>
            <option *ngFor="let m of monthNames; let i = index" [value]="i + 1">
              {{ m }}
            </option>
          </select>
        </div>

        <div class="flex items-center gap-1.5 min-w-[120px]">
          <span class="text-[11px] font-bold text-slate-500 whitespace-nowrap">Year:</span>
          <select [(ngModel)]="selectedYear" (change)="loadIncentives()" class="form-select text-xs !py-1.5 !px-3 font-semibold flex-1">
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>
        </div>

      </div>

      <!-- Master Incentive Grid -->
      <div class="card p-6 border border-slate-200 space-y-4">
        <div class="flex justify-between items-center">
          <span class="text-xs text-slate-500 font-semibold">
            Found <strong class="text-slate-800">{{ records.length }}</strong> Loan Disbursals
          </span>
          <span class="text-xs font-bold text-emerald-700">
            Total Incentive: ₹{{ totalIncentive?.toLocaleString() }}
          </span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-xs">
            <thead>
              <tr class="border-b border-slate-100 text-slate-400 text-left font-semibold">
                <th class="py-3 px-3">Employee</th>
                <th class="py-3 px-3">Date</th>
                <th class="py-3 px-3">Borrower & Category</th>
                <th class="py-3 px-3">Loan Amount</th>
                <th class="py-3 px-3 text-center">Slab Tier</th>
                <th class="py-3 px-3 font-bold text-slate-900">Incentive</th>
                <th class="py-3 px-3 text-center">Source</th>
                <th class="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium">
              <tr *ngFor="let rec of records" class="hover:bg-slate-50/70 transition-colors">
                
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
                    <div class="text-[10px] text-slate-400 font-medium">{{ getEmpDesignation(rec) }}</div>
                  </div>
                </td>

                <!-- Date -->
                <td class="py-3.5 px-3 font-mono text-slate-700">
                  <div>{{ rec.dateStr }}</div>
                </td>

                <!-- Borrower & Details -->
                <td class="py-3.5 px-3">
                  <div class="font-bold text-slate-800">{{ rec.customerName || 'Direct Borrower' }}</div>
                  <div class="text-[10px] text-slate-400">{{ rec.loanType || 'Auto Loan' }}</div>
                </td>

                <!-- Loan Amount -->
                <td class="py-3.5 px-3 font-mono font-bold text-slate-900">
                  ₹{{ rec.loanAmount?.toLocaleString() }}
                </td>

                <!-- Slab Tier -->
                <td class="py-3.5 px-3 text-center">
                  <span class="px-2 py-0.5 rounded-full font-bold text-[10px]"
                    [ngClass]="rec.slabPercentage > 0 ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-500'">
                    {{ rec.slabPercentage > 0 ? (rec.slabPercentage + '%') : '0%' }}
                  </span>
                </td>

                <!-- Incentive Amount -->
                <td class="py-3.5 px-3 font-mono font-black text-sm text-emerald-700">
                  ₹{{ rec.incentiveAmount?.toLocaleString() }}
                </td>

                <!-- Source -->
                <td class="py-3.5 px-3 text-center">
                  <span class="px-2 py-0.5 rounded text-[10px] font-semibold"
                    [ngClass]="rec.loggedBy === 'Admin' ? 'bg-purple-50 text-purple-700' : 'bg-slate-100 text-slate-600'">
                    {{ rec.loggedBy || 'Self' }}
                  </span>
                </td>

                <!-- Actions -->
                <td class="py-3.5 px-3 text-right">
                  <div class="flex items-center justify-end gap-1.5">
                    <button 
                      (click)="selectedDetail = rec" 
                      title="View Full Loan Details & Remarks" 
                      class="text-blue-600 hover:text-blue-800 p-1.5 rounded-lg hover:bg-blue-50 text-xs transition-colors">
                      <i class="fa-solid fa-circle-info text-sm"></i>
                    </button>
                    <button 
                      (click)="openEditModal(rec)" 
                      title="Edit Loan Disbursement" 
                      class="text-amber-600 hover:text-amber-800 p-1.5 rounded-lg hover:bg-amber-50 text-xs transition-colors">
                      <i class="fa-solid fa-pen-to-square text-sm"></i>
                    </button>
                    <button 
                      (click)="deleteRecord(rec)" 
                      title="Delete Record" 
                      class="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 text-xs transition-colors">
                      <i class="fa-solid fa-trash-can text-sm"></i>
                    </button>
                  </div>
                </td>

              </tr>

              <tr *ngIf="records.length === 0">
                <td colspan="8" class="py-12 text-center text-slate-400">
                  <i class="fa-solid fa-landmark text-3xl mb-2 text-slate-300"></i>
                  <p>No loan disbursements found matching the filter criteria.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Loan Details & Remarks Modal -->
      <div *ngIf="selectedDetail" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4">
          
          <div class="flex justify-between items-center border-b border-slate-100 pb-3">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-base">
                <i class="fa-solid fa-car"></i>
              </div>
              <div>
                <h3 class="font-bold text-base text-slate-900">Loan Details & Remarks</h3>
                <p class="text-xs text-slate-400">Complete disbursement breakdown</p>
              </div>
            </div>
            <button (click)="selectedDetail = null" class="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50">
              <i class="fa-solid fa-xmark text-base"></i>
            </button>
          </div>

          <div class="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <div>
              <span class="text-slate-400 block font-semibold text-[10px] uppercase">Staff Member</span>
              <span class="font-bold text-slate-900 text-xs mt-0.5 block">{{ getEmpName(selectedDetail) }}</span>
            </div>
            <div>
              <span class="text-slate-400 block font-semibold text-[10px] uppercase">Designation</span>
              <span class="font-semibold text-slate-700 text-xs mt-0.5 block">{{ getEmpDesignation(selectedDetail) || 'Staff' }}</span>
            </div>
            <div>
              <span class="text-slate-400 block font-semibold text-[10px] uppercase">Borrower Name</span>
              <span class="font-bold text-slate-900 text-xs mt-0.5 block">{{ selectedDetail.customerName || 'Direct Borrower' }}</span>
            </div>
            <div>
              <span class="text-slate-400 block font-semibold text-[10px] uppercase">Category</span>
              <span class="font-bold text-blue-700 text-xs mt-0.5 block">{{ selectedDetail.loanType || 'Auto Loan' }}</span>
            </div>
            <div>
              <span class="text-slate-400 block font-semibold text-[10px] uppercase">Disbursement Date</span>
              <span class="font-mono font-bold text-slate-800 text-xs mt-0.5 block">{{ selectedDetail.dateStr }}</span>
            </div>
            <div>
              <span class="text-slate-400 block font-semibold text-[10px] uppercase">Logged By</span>
              <span class="font-bold text-slate-700 text-xs mt-0.5 block">{{ selectedDetail.loggedBy || 'Self' }}</span>
            </div>
          </div>

          <!-- Financial Card -->
          <div class="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between">
            <div>
              <span class="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">Disbursed Amount</span>
              <div class="font-mono font-black text-slate-900 text-base">₹{{ selectedDetail.loanAmount?.toLocaleString() }}</div>
            </div>
            <div class="text-right">
              <span class="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">Incentive ({{ selectedDetail.slabPercentage }}%)</span>
              <div class="font-mono font-black text-emerald-700 text-base">+ ₹{{ selectedDetail.incentiveAmount?.toLocaleString() }}</div>
            </div>
          </div>

          <!-- Remarks & Notes -->
          <div>
            <label class="font-bold text-xs text-slate-700 block mb-1.5 flex items-center gap-1.5">
              <i class="fa-solid fa-comment-dots text-blue-600"></i>
              <span>Remarks & Notes</span>
            </label>
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed font-medium min-h-[45px]">
              {{ selectedDetail.remarks || 'No remarks provided for this disbursement.' }}
            </div>
          </div>

          <div class="flex justify-end pt-2 border-t border-slate-100">
            <button (click)="selectedDetail = null" class="btn btn-secondary btn-sm font-semibold">
              Close
            </button>
          </div>
        </div>
      </div>

      <!-- Add / Edit Loan Modal (Admin) -->
      <div *ngIf="showAddModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
          <div class="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
            <div>
              <h3 class="font-bold text-base text-slate-900">{{ isEditing ? 'Edit Loan Disbursement' : 'Log Employee Loan Disbursement' }}</h3>
              <p class="text-xs text-slate-400">{{ isEditing ? 'Update loan parameters & recalculate incentive' : 'Record loan closed by an employee' }}</p>
            </div>
            <button (click)="showAddModal = false" class="text-slate-400 hover:text-slate-600">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <form (ngSubmit)="saveNewLoan()" class="space-y-3.5">
            
            <div class="form-group mb-0">
              <label class="form-label text-xs">Select Employee <span class="text-rose-500">*</span></label>
              <select [(ngModel)]="newLoanData.userId" name="nUserId" class="form-select text-xs font-semibold" required>
                <option value="" disabled>-- Choose Employee --</option>
                <option *ngFor="let emp of employees" [value]="emp._id">
                  {{ emp.fullName }} ({{ emp.designation || 'Staff' }} #{{ emp.employeeId }})
                </option>
              </select>
            </div>

            <div class="form-group mb-0">
              <label class="form-label text-xs">Total Loan Amount (₹) <span class="text-rose-500">*</span></label>
              <input 
                type="number" 
                [(ngModel)]="newLoanData.loanAmount" 
                (input)="onModalAmountInput()" 
                name="nLoanAmount" 
                placeholder="e.g. 3500000" 
                required 
                min="1"
                class="form-control font-mono font-bold text-sm">
            </div>

            <div *ngIf="newLoanData.loanAmount > 0" class="p-3.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-xs animate-fade shadow-xs">
              <div class="flex justify-between items-center text-blue-900 font-semibold mb-1">
                <span>Calculated Tier:</span>
                <span class="font-bold px-2 py-0.5 bg-blue-600 text-white rounded-md text-[10px] shadow-xs">{{ modalPreview.slabName }}</span>
              </div>
              <div class="flex justify-between items-center text-blue-950 font-bold">
                <span>Incentive Earned:</span>
                <span class="text-sm font-black text-emerald-700 font-mono">+ ₹{{ modalPreview.incentiveAmount?.toLocaleString() }}</span>
              </div>
            </div>

            <div class="form-group mb-0">
              <label class="form-label text-xs">Borrower / Customer Name</label>
              <input type="text" [(ngModel)]="newLoanData.customerName" name="nCustName" placeholder="e.g. Anand Sharma" class="form-control text-xs font-semibold">
            </div>

            <div class="form-group mb-0">
              <label class="form-label text-xs">Loan Category</label>
              <select [(ngModel)]="newLoanData.loanType" name="nLoanType" class="form-select text-xs font-semibold">
                <option value="Auto Loan">Auto Loan</option>
              </select>
            </div>

            <div class="form-group mb-0">
              <label class="form-label text-xs">Disbursement Date <span class="text-rose-500">*</span></label>
              <input type="date" [(ngModel)]="newLoanData.dateStr" name="nDateStr" required class="form-control text-xs font-semibold">
            </div>

            <div class="form-group mb-0">
              <label class="form-label text-xs">Remarks / Notes</label>
              <textarea 
                [(ngModel)]="newLoanData.remarks" 
                name="nRemarks" 
                rows="2" 
                placeholder="e.g. Direct customer walk-in, disbursed via HDFC bank" 
                class="form-control text-xs leading-relaxed resize-none"></textarea>
            </div>

            <div class="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button type="button" (click)="showAddModal = false" class="btn btn-secondary btn-sm">Cancel</button>
              <button type="submit" [disabled]="!newLoanData.userId || !newLoanData.loanAmount || addLoading" class="btn btn-primary btn-sm font-bold flex items-center gap-1.5">
                <i class="fa-solid fa-check" *ngIf="!addLoading"></i>
                <i class="fa-solid fa-spinner fa-spin" *ngIf="addLoading"></i>
                <span>{{ addLoading ? 'Saving...' : (isEditing ? 'Update Loan Record' : 'Save Loan Record') }}</span>
              </button>
            </div>

          </form>
        </div>
      </div>

    </div>
  `
})
export class AdminIncentivesComponent implements OnInit {
  Math = Math;
  records: IncentiveRecord[] = [];
  employees: User[] = [];
  selectedDetail: IncentiveRecord | null = null;

  selectedEmployee = 'All';
  selectedMonth: any = new Date().getMonth() + 1;
  selectedYear = new Date().getFullYear();

  totalLoanAmount = 0;
  totalIncentive = 0;

  showAddModal = false;
  isEditing = false;
  editingId = '';
  addLoading = false;

  newLoanData: any = {
    userId: '',
    loanAmount: null,
    customerName: '',
    loanType: 'Auto Loan',
    dateStr: this.getTodayDateStr(),
    remarks: ''
  };

  modalPreview: any = {
    slabName: 'No Tier (≤ 10 Lakhs)',
    slabPercentage: 0,
    incentiveAmount: 0
  };

  monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  constructor(
    private incentiveService: IncentiveService,
    private employeeService: EmployeeService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.employeeService.getAllEmployees().subscribe({
      next: (res) => {
        this.employees = res.employees || [];
      }
    });
    this.loadIncentives();
  }

  getTodayDateStr(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  loadIncentives() {
    this.incentiveService.getAllIncentives({
      employeeId: this.selectedEmployee,
      month: this.selectedMonth,
      year: this.selectedYear
    }).subscribe({
      next: (res) => {
        this.records = res.records || [];
        this.totalLoanAmount = res.totalLoanAmount || 0;
        this.totalIncentive = res.totalIncentive || 0;
      },
      error: () => {
        this.toast.error('Failed to load incentive audit records.');
      }
    });
  }

  onModalAmountInput() {
    this.modalPreview = this.incentiveService.calculateLocalTier(this.newLoanData.loanAmount);
  }

  openAddModal() {
    this.isEditing = false;
    this.editingId = '';
    this.newLoanData = {
      userId: this.employees.length > 0 ? this.employees[0]._id : '',
      loanAmount: null,
      customerName: '',
      loanType: 'Auto Loan',
      dateStr: this.getTodayDateStr(),
      remarks: ''
    };
    this.modalPreview = {
      slabName: 'No Tier (≤ 10 Lakhs)',
      slabPercentage: 0,
      incentiveAmount: 0
    };
    this.showAddModal = true;
  }

  openEditModal(rec: IncentiveRecord) {
    this.isEditing = true;
    this.editingId = rec._id || '';
    const uId = typeof rec.userId === 'object' ? (rec.userId as any)?._id : rec.userId;
    this.newLoanData = {
      _id: rec._id,
      userId: uId || (this.employees.length > 0 ? this.employees[0]._id : ''),
      loanAmount: rec.loanAmount,
      customerName: rec.customerName || '',
      loanType: rec.loanType || 'Auto Loan',
      dateStr: rec.dateStr,
      remarks: rec.remarks || ''
    };
    this.modalPreview = this.incentiveService.calculateLocalTier(rec.loanAmount);
    this.showAddModal = true;
  }

  saveNewLoan() {
    if (!this.newLoanData.userId) {
      this.toast.error('Please select an employee.');
      return;
    }
    if (!this.newLoanData.loanAmount || this.newLoanData.loanAmount <= 0) {
      this.toast.error('Please enter a valid loan amount.');
      return;
    }

    this.addLoading = true;
    if (this.isEditing && this.editingId) {
      this.incentiveService.updateIncentive(this.editingId, this.newLoanData).subscribe({
        next: (res) => {
          this.addLoading = false;
          this.toast.success(res.message || 'Loan record updated successfully!');
          this.showAddModal = false;
          this.loadIncentives();
        },
        error: (err) => {
          this.addLoading = false;
          this.toast.error(err.error?.message || 'Failed to update loan record.');
        }
      });
    } else {
      this.incentiveService.submitIncentive(this.newLoanData).subscribe({
        next: (res) => {
          this.addLoading = false;
          this.toast.success(res.message || 'Employee loan record added successfully!');
          this.showAddModal = false;
          this.loadIncentives();
        },
        error: (err) => {
          this.addLoading = false;
          this.toast.error(err.error?.message || 'Failed to save loan record.');
        }
      });
    }
  }

  deleteRecord(rec: IncentiveRecord) {
    if (!rec._id) return;
    if (!confirm(`Are you sure you want to delete this loan record of ₹${rec.loanAmount?.toLocaleString()}?`)) {
      return;
    }
    this.incentiveService.deleteIncentive(rec._id).subscribe({
      next: (res) => {
        this.toast.success(res.message || 'Loan record deleted.');
        this.loadIncentives();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to delete record.');
      }
    });
  }

  getUniquePerformersCount(): number {
    const ids = new Set();
    this.records.forEach(r => {
      const uId = typeof r.userId === 'object' ? (r.userId as any)?._id : r.userId;
      if (uId) ids.add(uId.toString());
    });
    return ids.size;
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

  getEmpDesignation(rec: any): string {
    if (!rec) return '';
    if (typeof rec.userId === 'object' && rec.userId?.designation) return rec.userId.designation;
    const uId = typeof rec.userId === 'object' ? rec.userId?._id : rec.userId;
    const emp = this.employees.find(e => e._id === uId);
    return emp ? (emp.designation || 'Staff') : (rec.userId?.designation || 'Staff');
  }

  getEmpAvatar(rec: any): string {
    if (typeof rec.userId === 'object' && rec.userId?.avatar) return rec.userId.avatar;
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.getEmpName(rec)}`;
  }
}
