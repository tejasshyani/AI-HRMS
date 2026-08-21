import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PayrollService } from '../../../services/payroll.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { PayslipModalComponent } from '../../../components/payslip-modal/payslip-modal.component';

@Component({
  selector: 'app-my-payslips',
  standalone: true,
  imports: [CommonModule, FormsModule, PayslipModalComponent],
  template: `
    <div class="p-6 pb-12 space-y-6 max-w-7xl mx-auto">
      
      <!-- Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-xl font-extrabold text-slate-900 tracking-tight">My Salary Slips & Payroll Records</h1>
          <p class="text-xs text-slate-500 mt-0.5">View and download your official monthly FinGoal salary slips</p>
        </div>
        <div class="flex items-center gap-3">
          <!-- Month Filter Selector -->
          <div class="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs text-xs">
            <span class="text-slate-400 font-bold">Month:</span>
            <select 
              [(ngModel)]="selectedMonth" 
              (change)="loadPayslips()" 
              class="font-bold text-slate-800 bg-transparent border-0 focus:ring-0 cursor-pointer text-xs pr-2">
              <option *ngFor="let m of monthsList" [value]="m.value">{{ m.label }}</option>
            </select>
          </div>

          <button (click)="loadPayslips()" class="btn btn-secondary btn-sm flex items-center gap-1.5">
            <i class="fa-solid fa-rotate-right"></i>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <!-- Payslips Table Card -->
      <div class="card p-6 border border-slate-200 space-y-4">
        
        <div class="table-responsive-wrapper">
          <table class="table-modern text-[11px] sm:text-xs">
            <thead>
              <tr class="text-[11px] whitespace-nowrap">
                <th class="py-2.5 px-2">Pay Period</th>
                <th class="py-2.5 px-2 text-center">Standard Days</th>
                <th class="py-2.5 px-2 text-center">Payable Days</th>
                <th class="py-2.5 px-2">Base Salary</th>
                <th class="py-2.5 px-2">Per-Day Rate</th>
                <th class="py-2.5 px-2">Leave Deduction</th>
                <th class="py-2.5 px-2 text-emerald-700 font-bold">Incentive</th>
                <th class="py-2.5 px-2 font-bold text-slate-900">Net Salary</th>
                <th class="py-2.5 px-2 text-center">Status</th>
                <th class="py-2.5 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium">
              <tr *ngFor="let slip of payslips" class="transition-colors">
                
                <td class="py-3 px-2 font-bold text-slate-900 flex items-center gap-2">
                  <div class="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-[10px] shadow-2xs border border-blue-200 flex-shrink-0">
                    <i class="fa-solid fa-file-invoice-dollar"></i>
                  </div>
                  <div class="min-w-0">
                    <div class="text-xs font-extrabold text-slate-900 truncate">{{ slip.monthName || getMonthName(selectedMonth) }}</div>
                    <div class="text-[9px] text-slate-400 font-normal truncate">Paid on {{ slip.paymentDateStr || (getMonthName(selectedMonth) + ' 30, ' + selectedYear) }}</div>
                  </div>
                </td>

                <td class="py-3 px-2 text-center font-mono text-slate-700 font-bold">{{ slip.totalWorkingDays || 30 }}d</td>
                
                <td class="py-3 px-2 text-center font-mono font-black" [ngClass]="slip.payableDays > 0 ? 'text-emerald-700' : 'text-slate-500'">
                  {{ slip.payableDays }}d
                </td>
                
                <td class="py-3 px-2 font-mono text-slate-800 font-bold">₹{{ slip.baseSalary?.toLocaleString() }}</td>
                
                <td class="py-3 px-2 font-mono text-slate-500">₹{{ slip.perDayRate?.toLocaleString() }}/d</td>
                
                <td class="py-3 px-2 font-mono font-bold" [ngClass]="slip.leaveDeduction > 0 ? 'text-rose-600' : 'text-slate-400'">
                  ₹{{ slip.leaveDeduction?.toLocaleString() }}
                </td>

                <td class="py-3 px-2 font-mono font-bold" [ngClass]="slip.totalIncentive > 0 ? 'text-emerald-700' : 'text-slate-400'">
                  + ₹{{ (slip.totalIncentive || slip.allowances?.incentive || 0)?.toLocaleString() }}
                </td>
                
                <td class="py-3 px-2 font-mono font-black text-sm text-emerald-700">₹{{ slip.netSalary?.toLocaleString() }}</td>
                
                <td class="py-3 px-2 text-center">
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[9px] whitespace-nowrap"
                    [ngClass]="slip.netSalary > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'">
                    <span class="w-1.5 h-1.5 rounded-full" [ngClass]="slip.netSalary > 0 ? 'bg-emerald-500' : 'bg-slate-400'"></span>
                    {{ slip.status || (slip.netSalary > 0 ? 'Processed' : 'Calculated') }}
                  </span>
                </td>
                
                <td class="py-3 px-2 text-right">
                  <button 
                    (click)="openPayslip(slip.month || selectedMonth, slip.year || selectedYear)" 
                    class="btn-action-view whitespace-nowrap text-[11px] py-1 px-2.5">
                    <i class="fa-solid fa-eye text-xs"></i>
                    <span>View Slip</span>
                  </button>
                </td>

              </tr>

              <tr *ngIf="payslips.length === 0">
                <td colspan="10" class="py-12 text-center text-slate-400">
                  <i class="fa-regular fa-file-lines text-2xl mb-2 text-slate-300"></i>
                  <p>No payroll records found for {{ getMonthName(selectedMonth) }} {{ selectedYear }}.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

    </div>

    <!-- Payslip Modal -->
    <app-payslip-modal 
      [isOpen]="showModal" 
      [payslip]="selectedPayslip" 
      (close)="showModal = false">
    </app-payslip-modal>
  `
})
export class MyPayslipsComponent implements OnInit {
  selectedMonth = new Date().getMonth() + 1;
  selectedYear = new Date().getFullYear();
  payslips: any[] = [];
  showModal = false;
  selectedPayslip: any = null;

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
    private payrollService: PayrollService,
    public authService: AuthService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.loadPayslips();
  }

  getMonthName(m: number): string {
    return this.monthNames[m - 1] || 'August';
  }

  loadPayslips() {
    const user = this.authService.currentUser();
    const userId = user?._id || 'me';
    
    this.payrollService.getEmployeePayslip(userId, this.selectedMonth, this.selectedYear).subscribe({
      next: (res) => {
        this.payslips = res.payslip ? [res.payslip] : [];
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to fetch payslips.');
      }
    });
  }

  openPayslip(month: number, year: number) {
    const user = this.authService.currentUser();
    const userId = user?._id || 'me';

    this.payrollService.getEmployeePayslip(userId, month, year).subscribe({
      next: (res) => {
        this.selectedPayslip = res.payslip;
        this.showModal = true;
      },
      error: () => {
        this.toast.error('Could not load payslip document.');
      }
    });
  }
}
