import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IncentiveService } from '../../../services/incentive.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { IncentiveRecord } from '../../../models';

@Component({
  selector: 'app-employee-incentives',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 space-y-6 max-w-7xl mx-auto">
      
      <!-- Top Header & Filter -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-xl font-extrabold text-slate-900 tracking-tight">My Loan Sourcing & Tiered Incentives</h1>
          <p class="text-xs text-slate-500 mt-0.5">Log loan disbursements, view your active incentive slab tier, and monitor monthly earnings</p>
        </div>
        <div class="flex items-center gap-3">
          <!-- Month Filter -->
          <div class="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs text-xs">
            <span class="text-slate-400 font-bold">Month:</span>
            <select 
              [(ngModel)]="selectedMonth" 
              (change)="loadIncentives()" 
              class="font-bold text-slate-800 bg-transparent border-0 focus:ring-0 cursor-pointer text-xs pr-2">
              <option *ngFor="let m of monthsList" [value]="m.value">{{ m.label }}</option>
            </select>
          </div>

          <button (click)="loadIncentives()" class="btn btn-secondary btn-sm flex items-center gap-1.5">
            <i class="fa-solid fa-rotate-right"></i>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <!-- Card 1: Total Disbursed Loans -->
        <div class="card p-5 flex items-center justify-between border border-slate-200">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Total Loans Disbursed</span>
            <div class="text-xl font-black text-slate-900 mt-1">₹{{ totalLoanAmount?.toLocaleString() }}</div>
            <div class="text-[11px] text-blue-600 font-bold mt-1">
              <i class="fa-solid fa-file-contract mr-1"></i>{{ records.length }} Loan(s) in {{ getMonthName(selectedMonth) }}
            </div>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg shadow-xs">
            <i class="fa-solid fa-hand-holding-dollar"></i>
          </div>
        </div>

        <!-- Card 2: Active Incentive Tier -->
        <div class="card p-5 flex items-center justify-between border border-slate-200">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Monthly Slab Tier</span>
            <div class="text-lg font-black mt-1" [ngClass]="monthlySlab?.slabPercentage > 0 ? 'text-indigo-600' : 'text-slate-500'">
              {{ monthlySlab?.slabPercentage > 0 ? (monthlySlab.slabPercentage + '% Tier') : 'No Tier' }}
            </div>
            <div class="text-[11px] font-semibold text-slate-500 mt-1">
              {{ monthlySlab?.slabName || '≤ 10 Lakhs' }}
            </div>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg shadow-xs">
            <i class="fa-solid fa-chart-line"></i>
          </div>
        </div>

        <!-- Card 3: Total Incentive Earned -->
        <div class="card p-5 flex items-center justify-between border border-slate-200">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Total Incentive Earned</span>
            <div class="text-xl font-black text-emerald-700 mt-1">₹{{ totalIncentive?.toLocaleString() }}</div>
            <div class="text-[11px] text-emerald-600 font-bold mt-1">
              <i class="fa-solid fa-plus-circle mr-1"></i>Added to Salary Payout
            </div>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg shadow-xs">
            <i class="fa-solid fa-sack-dollar"></i>
          </div>
        </div>

        <!-- Card 4: Base Salary + Incentive -->
        <div class="card p-5 flex items-center justify-between border border-slate-200 bg-gradient-to-br from-blue-50/40 to-indigo-50/40">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Base + Incentive Gross</span>
            <div class="text-xl font-black text-blue-900 mt-1">₹{{ ((authService.currentUser()?.baseSalary || 20000) + totalIncentive).toLocaleString() }}</div>
            <div class="text-[11px] text-slate-500 mt-1">
              Base: ₹{{ (authService.currentUser()?.baseSalary || 20000).toLocaleString() }} + ₹{{ totalIncentive?.toLocaleString() }}
            </div>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-white text-blue-700 flex items-center justify-center text-lg shadow-xs border border-blue-100">
            <i class="fa-solid fa-wallet"></i>
          </div>
        </div>

      </div>

      <!-- Tier Slabs Visual Guide Strip -->
      <div class="card p-4 border border-slate-200 bg-slate-50/70">
        <div class="text-xs font-bold text-slate-700 mb-2 flex items-center gap-2">
          <i class="fa-solid fa-award text-amber-500"></i>
          <span>FinGoal Tiered Incentive Slabs</span>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
          
          <div class="p-2.5 rounded-xl bg-white border" [ngClass]="totalLoanAmount > 1000000 && totalLoanAmount <= 2000000 ? 'border-blue-500 bg-blue-50/40 shadow-xs ring-1 ring-blue-400' : 'border-slate-200'">
            <div class="font-bold text-slate-800">> 10 Lakhs</div>
            <div class="text-emerald-700 font-extrabold text-sm">0.10%</div>
            <div class="text-[10px] text-slate-400 mt-0.5">₹1,000 / 10L</div>
          </div>

          <div class="p-2.5 rounded-xl bg-white border" [ngClass]="totalLoanAmount > 2000000 && totalLoanAmount <= 3000000 ? 'border-blue-500 bg-blue-50/40 shadow-xs ring-1 ring-blue-400' : 'border-slate-200'">
            <div class="font-bold text-slate-800">> 20 Lakhs</div>
            <div class="text-emerald-700 font-extrabold text-sm">0.20%</div>
            <div class="text-[10px] text-slate-400 mt-0.5">₹4,000 / 20L</div>
          </div>

          <div class="p-2.5 rounded-xl bg-white border" [ngClass]="totalLoanAmount > 3000000 && totalLoanAmount <= 4000000 ? 'border-blue-500 bg-blue-50/40 shadow-xs ring-1 ring-blue-400' : 'border-slate-200'">
            <div class="font-bold text-slate-800">> 30 Lakhs</div>
            <div class="text-emerald-700 font-extrabold text-sm">0.30%</div>
            <div class="text-[10px] text-slate-400 mt-0.5">₹9,000 / 30L</div>
          </div>

          <div class="p-2.5 rounded-xl bg-white border" [ngClass]="totalLoanAmount > 4000000 && totalLoanAmount <= 5000000 ? 'border-blue-500 bg-blue-50/40 shadow-xs ring-1 ring-blue-400' : 'border-slate-200'">
            <div class="font-bold text-slate-800">> 40 Lakhs</div>
            <div class="text-emerald-700 font-extrabold text-sm">0.40%</div>
            <div class="text-[10px] text-slate-400 mt-0.5">₹16,000 / 40L</div>
          </div>

          <div class="p-2.5 rounded-xl bg-white border" [ngClass]="totalLoanAmount > 5000000 ? 'border-blue-500 bg-blue-50/40 shadow-xs ring-1 ring-blue-400' : 'border-slate-200'">
            <div class="font-bold text-slate-800">> 50 Lakhs</div>
            <div class="text-emerald-700 font-extrabold text-sm">0.50%</div>
            <div class="text-[10px] text-slate-400 mt-0.5">₹25,000+ / 50L</div>
          </div>

        </div>
      </div>

      <!-- Disbursed Loans & Incentive Breakdown (Full Width View) -->
      <div class="card p-6 border border-slate-200 space-y-4">
        
        <div class="flex justify-between items-center">
          <div>
            <h3 class="font-bold text-slate-900 text-sm">Disbursed Loans & Incentive Breakdown</h3>
            <p class="text-[11px] text-slate-400">All loans logged for {{ getMonthName(selectedMonth) }} {{ selectedYear }}</p>
          </div>
          <span class="text-xs text-slate-500 font-semibold">
            Total Incentive: <strong class="text-emerald-700 font-bold">₹{{ totalIncentive?.toLocaleString() }}</strong>
          </span>
        </div>

        <div class="table-responsive-wrapper">
          <table class="table-modern text-xs">
            <thead>
              <tr>
                <th class="py-3 px-3">Date</th>
                <th class="py-3 px-3">Borrower & Category</th>
                <th class="py-3 px-3">Loan Amount</th>
                <th class="py-3 px-3 text-center">Slab Tier</th>
                <th class="py-3 px-3 font-bold text-slate-900">Incentive</th>
                <th class="py-3 px-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium">
              <tr *ngFor="let rec of records" class="transition-colors">
                
                <td class="py-3.5 px-3 font-mono font-bold text-slate-800">
                  {{ rec.dateStr }}
                </td>

                <td class="py-3.5 px-3">
                  <div class="font-bold text-slate-800">{{ rec.customerName || 'Direct Borrower' }}</div>
                  <div class="text-[10px] text-slate-400 font-semibold">{{ rec.loanType || 'Auto Loan' }}</div>
                </td>

                <td class="py-3.5 px-3 font-mono font-bold text-slate-900">
                  ₹{{ rec.loanAmount?.toLocaleString() }}
                </td>

                <td class="py-3.5 px-3 text-center">
                  <span class="px-2.5 py-0.5 rounded-full font-bold text-[10px]"
                    [ngClass]="rec.slabPercentage > 0 ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-500'">
                    {{ rec.slabPercentage > 0 ? (rec.slabPercentage + '%') : '0%' }}
                  </span>
                </td>

                <td class="py-3.5 px-3 font-mono font-black text-sm text-emerald-700">
                  ₹{{ rec.incentiveAmount?.toLocaleString() }}
                </td>

                <td class="py-3.5 px-3 text-right">
                  <button 
                    (click)="selectedDetail = rec" 
                    title="View Full Loan Details & Remarks" 
                    class="btn-action-view">
                    <i class="fa-solid fa-circle-info text-xs"></i> View
                  </button>
                </td>

              </tr>

              <tr *ngIf="records.length === 0">
                <td colspan="6" class="py-12 text-center text-slate-400">
                  <i class="fa-solid fa-car text-3xl mb-2 text-slate-300"></i>
                  <p>No loan disbursements recorded for {{ getMonthName(selectedMonth) }} {{ selectedYear }}.</p>
                  <p class="text-[11px] text-slate-400 mt-1">Disbursements recorded by HR will appear here and be credited in payroll.</p>
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

    </div>
  `
})
export class EmployeeIncentivesComponent implements OnInit {
  selectedMonth = new Date().getMonth() + 1;
  selectedYear = new Date().getFullYear();

  records: IncentiveRecord[] = [];
  selectedDetail: IncentiveRecord | null = null;
  totalLoanAmount = 0;
  totalIncentive = 0;
  monthlySlab: any = null;

  monthsList = [
    { value: 1, label: 'January 2026' },
    { value: 2, label: 'February 2026' },
    { value: 3, label: 'March 2026' },
    { value: 4, label: 'April 2026' },
    { value: 5, label: 'May 2026' },
    { value: 6, label: 'June 2026' },
    { value: 7, label: 'July 2026' },
    { value: 8, label: 'August 2026' },
    { value: 9, label: 'September 2026' },
    { value: 10, label: 'October 2026' },
    { value: 11, label: 'November 2026' },
    { value: 12, label: 'December 2026' }
  ];

  monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  constructor(
    private incentiveService: IncentiveService,
    public authService: AuthService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.loadIncentives();
  }

  getMonthName(m: number): string {
    return this.monthNames[m - 1] || 'August';
  }

  loadIncentives() {
    this.incentiveService.getMyIncentives(this.selectedMonth, this.selectedYear).subscribe({
      next: (res) => {
        this.records = res.records || [];
        this.totalLoanAmount = res.totalLoanAmount || 0;
        this.totalIncentive = res.totalIncentive || 0;
        this.monthlySlab = res.monthlySlab;
      },
      error: () => {
        this.toast.error('Failed to load incentive records.');
      }
    });
  }
}
