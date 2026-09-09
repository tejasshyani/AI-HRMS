import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppLogoComponent } from '../logo/app-logo.component';

@Component({
  selector: 'app-payslip-modal',
  standalone: true,
  imports: [CommonModule, AppLogoComponent],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade overflow-y-auto">
      <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200 my-8">
        
        <!-- Action Header -->
        <div class="flex justify-between items-center pb-4 border-b border-slate-100 mb-6">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span class="font-bold text-xs text-slate-500 uppercase tracking-wider">Salary Payslip & Breakdown</span>
          </div>
          <div class="flex items-center gap-2">
            <button (click)="printPayslip()" class="btn btn-secondary btn-sm flex items-center gap-1.5">
              <i class="fa-solid fa-print text-slate-600"></i>
              <span>Print Slip</span>
            </button>
            <button (click)="close.emit()" class="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        <!-- Printable Payslip Document -->
        <div id="printable-payslip" class="space-y-6">
          
          <!-- Corporate Header -->
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b-2 border-slate-800 gap-4">
            <div>
              <div class="mb-1">
                <app-logo size="md"></app-logo>
              </div>
              <p class="text-xs text-slate-500 mt-1">{{ payslip?.company?.address || '406, Tapi Arcade, Abrama Road, Mota Varachha - 394101' }}</p>
            </div>
            <div class="text-left sm:text-right">
              <span class="text-xs font-bold uppercase tracking-widest text-blue-600">Monthly Payslip</span>
              <div class="text-base font-extrabold text-slate-900 mt-0.5">{{ payslip?.monthName || 'August 2026' }}</div>
            </div>
          </div>

          <!-- Employee Summary Card -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <div>
              <span class="text-slate-400 font-medium">Employee Name:</span>
              <div class="font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                <span>{{ payslip?.employee?.fullName || 'Staff Member' }}</span>
                <span *ngIf="payslip?.employee?.employeeId" class="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-mono text-[10px] font-bold border border-blue-200">
                  #{{ payslip?.employee?.employeeId }}
                </span>
              </div>
            </div>
            <div>
              <span class="text-slate-400 font-medium">Department:</span>
              <div class="font-bold text-slate-900 mt-0.5">{{ payslip?.employee?.department || 'Finance' }}</div>
            </div>
            <div>
              <span class="text-slate-400 font-medium">Designation:</span>
              <div class="font-bold text-slate-900 mt-0.5">{{ payslip?.employee?.designation || 'Financial Analyst' }}</div>
            </div>
            <div>
              <span class="text-slate-400 font-medium">Base Monthly Salary:</span>
              <div class="font-bold text-slate-900 mt-0.5 font-mono">&#8377;{{ payslip?.baseSalary?.toLocaleString() }}</div>
            </div>
          </div>

          <!-- Work Week & Attendance Metrics Grid -->
          <div class="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <div class="bg-slate-100/70 px-4 py-2 font-bold text-slate-700 border-b border-slate-200 flex justify-between items-center">
              <span>Attendance & Payroll Summary (Fixed 30-Day Basis)</span>
              <span class="text-blue-700 font-mono">Per-Day Rate: &#8377;{{ payslip?.perDayRate?.toLocaleString() }}/day</span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-slate-200 bg-white text-center py-2">
              <div class="p-2">
                <div class="text-[10px] text-slate-400 font-medium">Payment Cycle</div>
                <div class="font-bold text-slate-800 text-sm mt-0.5">30 Days</div>
              </div>
              <div class="p-2">
                <div class="text-[10px] text-amber-600 font-medium">Half-Days (0.5)</div>
                <div class="font-bold text-amber-700 text-sm mt-0.5">{{ payslip?.halfDays || 0 }}</div>
              </div>
              <div class="p-2">
                <div class="text-[10px] text-blue-600 font-medium">Paid Holidays</div>
                <div class="font-bold text-blue-700 text-sm mt-0.5">{{ payslip?.paidHolidays || 0 }}</div>
              </div>
              <div class="p-2 bg-rose-50/40">
                <div class="text-[10px] text-rose-600 font-bold">Unpaid Leaves</div>
                <div class="font-black text-rose-700 text-sm mt-0.5">{{ getUnpaidLeavesCount() }}d</div>
              </div>
              <div class="p-2 bg-blue-50/70">
                <div class="text-[10px] text-blue-800 font-bold uppercase">Payable Days</div>
                <div class="font-black text-blue-900 text-sm mt-0.5">{{ payslip?.payableDays }}d</div>
              </div>
            </div>
          </div>

          <!-- Single Unified Salary Breakdown Table -->
          <div class="border border-slate-200 rounded-xl overflow-hidden text-xs shadow-2xs bg-white">
            <table class="w-full text-xs">
              <thead>
                <tr class="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200 text-left">
                  <th class="py-3 px-4">Salary Component</th>
                  <th class="py-3 px-4 text-center">Calculation Basis</th>
                  <th class="py-3 px-4 text-right">Amount (&#8377;)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-medium">
                
                <!-- 1. Base Monthly Salary -->
                <tr class="hover:bg-slate-50/50 transition-colors">
                  <td class="py-3 px-4">
                    <div class="font-bold text-slate-900 text-sm">Base Monthly Salary</div>
                    <div class="text-[10px] text-slate-400">Fixed rate of &#8377;{{ payslip?.perDayRate?.toLocaleString() }}/day (30-Day Cycle)</div>
                  </td>
                  <td class="py-3 px-4 text-center font-mono text-slate-600 font-semibold">
                    30 Days
                  </td>
                  <td class="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                    &#8377;{{ payslip?.baseSalary?.toLocaleString() }}
                  </td>
                </tr>

                <!-- 2. Unpaid Leave Deductions (if leaves > 0) -->
                <tr *ngIf="getUnpaidLeavesCount() !== '0' && getUnpaidLeavesCount() !== '0.0'" class="bg-rose-50/40 text-rose-900 hover:bg-rose-50/60 transition-colors">
                  <td class="py-3 px-4">
                    <div class="font-bold text-rose-800 text-sm">Unpaid Leave Deduction</div>
                    <div class="text-[10px] text-rose-600">Deduction for absences & half-days</div>
                  </td>
                  <td class="py-3 px-4 text-center font-mono font-semibold text-rose-700">
                    - {{ getUnpaidLeavesCount() }} Days × &#8377;{{ payslip?.perDayRate }}
                  </td>
                  <td class="py-3 px-4 text-right font-mono font-bold text-rose-700 text-sm">
                    - &#8377;{{ getLeaveDeductionAmount() }}
                  </td>
                </tr>

                <!-- 3. Earned Basic Salary -->
                <tr class="bg-slate-50/60 hover:bg-slate-50 transition-colors">
                  <td class="py-3 px-4">
                    <div class="font-bold text-slate-900 text-sm">Earned Basic Pay</div>
                    <div class="text-[10px] text-slate-400">Base Salary minus Leave Deductions</div>
                  </td>
                  <td class="py-3 px-4 text-center font-mono font-bold text-blue-700">
                    {{ payslip?.payableDays }} Payable Days
                  </td>
                  <td class="py-3 px-4 text-right font-mono font-extrabold text-slate-900 text-sm">
                    &#8377;{{ getEarnedBasicPay() }}
                  </td>
                </tr>

                <!-- 4. Loan Sourcing Incentive (if any) -->
                <tr *ngIf="(payslip?.totalIncentive || payslip?.allowances?.incentive) > 0" class="bg-emerald-50/40 text-emerald-900 hover:bg-emerald-50/60 transition-colors">
                  <td class="py-3 px-4">
                    <div class="font-bold text-emerald-900 text-sm">Loan Sourcing Incentive</div>
                    <div class="text-[10px] text-emerald-600">Sourcing commission from &#8377;{{ (payslip?.totalLoanDisbursed || 0).toLocaleString() }} disbursed</div>
                  </td>
                  <td class="py-3 px-4 text-center font-mono font-semibold text-emerald-700">
                    Monthly Sourcing Tier
                  </td>
                  <td class="py-3 px-4 text-right font-mono font-black text-emerald-700 text-sm">
                    + &#8377;{{ (payslip?.totalIncentive || payslip?.allowances?.incentive || 0).toLocaleString() }}
                  </td>
                </tr>

              </tbody>
            </table>
          </div>

          <!-- Net Salary Highlight Card -->
          <div class="p-5 rounded-xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <span class="text-xs uppercase tracking-wider text-blue-200 font-bold">Net Salary Payable</span>
              <p class="text-xs text-blue-200 mt-0.5" *ngIf="(payslip?.totalIncentive || payslip?.allowances?.incentive) > 0">
                Formula: Earned Pay ({{ payslip?.payableDays }}d × &#8377;{{ payslip?.perDayRate }}) + Incentive (&#8377;{{ (payslip?.totalIncentive || payslip?.allowances?.incentive || 0).toLocaleString() }})
              </p>
              <p class="text-xs text-blue-200 mt-0.5" *ngIf="!(payslip?.totalIncentive || payslip?.allowances?.incentive)">
                Formula: Payable Days × Per-Day Rate ({{ payslip?.payableDays }} Days × &#8377;{{ payslip?.perDayRate }})
              </p>
            </div>
            <div class="text-right">
              <div class="text-3xl font-black tracking-tight text-white font-mono">
                &#8377;{{ payslip?.netSalary?.toLocaleString() }}
              </div>
              <span class="text-[10px] text-emerald-300 font-semibold">● Paid in Full</span>
            </div>
          </div>

        </div>

        <!-- Modal Close Button -->
        <div class="flex justify-end pt-4 border-t border-slate-100 mt-6">
          <button (click)="close.emit()" class="btn btn-secondary btn-sm">Close</button>
        </div>

      </div>
    </div>
  `
})
export class PayslipModalComponent {
  @Input() isOpen = false;
  @Input() payslip: any = null;
  @Output() close = new EventEmitter<void>();

  printPayslip() {
    window.print();
  }

  getUnpaidLeavesCount(): string {
    if (!this.payslip) return '0';
    const totalWorkingDays = 30;
    const payableDays = this.payslip.payableDays !== undefined ? this.payslip.payableDays : totalWorkingDays;
    const leaveDays = Math.max(0, totalWorkingDays - payableDays);
    return leaveDays % 1 === 0 ? leaveDays.toString() : leaveDays.toFixed(1);
  }

  getEarnedBasicPay(): string {
    if (!this.payslip) return '0';
    const payableDays = this.payslip.payableDays !== undefined ? this.payslip.payableDays : 30;
    const perDayRate = this.payslip.perDayRate || (this.payslip.baseSalary / 30);
    return Math.max(0, Math.round(payableDays * perDayRate)).toLocaleString();
  }

  getLeaveDeductionAmount(): string {
    if (!this.payslip) return '0';
    if (this.payslip.leaveDeduction != null) {
      return Number(this.payslip.leaveDeduction).toLocaleString();
    }
    const workingDays = 30;
    const payableDays = this.payslip.payableDays !== undefined ? this.payslip.payableDays : workingDays;
    const perDayRate = this.payslip.perDayRate || (this.payslip.baseSalary / 30);
    const deduction = Math.max(0, Math.round((workingDays - payableDays) * perDayRate));
    return deduction.toLocaleString();
  }
}
