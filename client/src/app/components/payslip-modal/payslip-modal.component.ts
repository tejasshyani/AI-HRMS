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
              <div class="font-bold text-slate-900 mt-0.5 font-mono">₹{{ payslip?.baseSalary?.toLocaleString() }}</div>
            </div>
          </div>

          <!-- Work Week & Attendance Metrics Grid -->
          <div class="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <div class="bg-slate-100/70 px-4 py-2 font-bold text-slate-700 border-b border-slate-200 flex justify-between items-center">
              <span>Attendance & Payroll Summary (Fixed 30-Day Basis)</span>
              <span class="text-blue-700 font-mono">Per-Day Rate: ₹{{ payslip?.perDayRate?.toLocaleString() }}/day</span>
            </div>
            <div class="grid grid-cols-3 sm:grid-cols-6 divide-x divide-y sm:divide-y-0 divide-slate-200 bg-white text-center py-2">
              <div class="p-2">
                <div class="text-[10px] text-slate-400 font-medium">Month Days</div>
                <div class="font-bold text-slate-800 text-sm mt-0.5">30</div>
              </div>
              <div class="p-2">
                <div class="text-[10px] text-slate-400 font-medium">Standard Days</div>
                <div class="font-bold text-slate-800 text-sm mt-0.5">{{ payslip?.totalWorkingDays || 30 }}</div>
              </div>
              <div class="p-2">
                <div class="text-[10px] text-emerald-600 font-medium">Present Days</div>
                <div class="font-bold text-emerald-700 text-sm mt-0.5">{{ payslip?.presentDays || 0 }}</div>
              </div>
              <div class="p-2">
                <div class="text-[10px] text-amber-600 font-medium">Half-Days (0.5)</div>
                <div class="font-bold text-amber-700 text-sm mt-0.5">{{ payslip?.halfDays || 0 }}</div>
              </div>
              <div class="p-2">
                <div class="text-[10px] text-blue-600 font-medium">Paid Holidays</div>
                <div class="font-bold text-blue-700 text-sm mt-0.5">{{ payslip?.paidHolidays || 0 }}</div>
              </div>
              <div class="p-2 bg-blue-50/50">
                <div class="text-[10px] text-blue-800 font-bold uppercase">Payable Days</div>
                <div class="font-black text-blue-900 text-sm mt-0.5">{{ payslip?.payableDays }}</div>
              </div>
            </div>
          </div>

          <!-- Flat Salary & Leave Deduction Table -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            
            <!-- Earnings -->
            <div class="border border-slate-200 rounded-xl overflow-hidden">
              <div class="bg-emerald-50 text-emerald-900 font-bold px-4 py-2 border-b border-emerald-100 flex justify-between">
                <span>Monthly Earnings</span>
                <span>Amount (₹)</span>
              </div>
              <div class="divide-y divide-slate-100 p-2 space-y-1">
                <div class="flex justify-between py-1.5 px-2 text-slate-600">
                  <span>Base Monthly Salary</span>
                  <span class="font-semibold text-slate-800 font-mono">₹{{ payslip?.baseSalary?.toLocaleString() }}</span>
                </div>
                <div class="flex justify-between py-1.5 px-2 text-slate-600">
                  <span>Standard Working Days</span>
                  <span class="font-semibold text-slate-800 font-mono">{{ payslip?.totalWorkingDays || 30 }} Days</span>
                </div>
                <div class="flex justify-between py-1.5 px-2 text-slate-600">
                  <span>Per-Day Salary Rate</span>
                  <span class="font-semibold text-slate-800 font-mono">₹{{ payslip?.perDayRate?.toLocaleString() }}</span>
                </div>
                <div class="flex justify-between items-center py-1.5 px-2 text-emerald-700 bg-emerald-50/70 rounded" *ngIf="(payslip?.totalIncentive || payslip?.allowances?.incentive) > 0">
                  <div>
                    <span class="font-bold">Loan Sourcing Incentive</span>
                    <span class="text-[10px] text-emerald-600 block">From ₹{{ (payslip?.totalLoanDisbursed || 0).toLocaleString() }} Disbursed</span>
                  </div>
                  <span class="font-black font-mono text-emerald-700 text-sm">+ ₹{{ (payslip?.totalIncentive || payslip?.allowances?.incentive || 0).toLocaleString() }}</span>
                </div>
                <div class="flex justify-between py-1.5 px-2 font-bold text-emerald-800 bg-emerald-50/50 rounded mt-2">
                  <span>Gross Monthly Total</span>
                  <span class="font-mono">₹{{ ((payslip?.baseSalary || 0) + (payslip?.totalIncentive || payslip?.allowances?.incentive || 0)).toLocaleString() }}</span>
                </div>
              </div>
            </div>

            <!-- Deductions (Only for Leaves) -->
            <div class="border border-slate-200 rounded-xl overflow-hidden">
              <div class="bg-rose-50 text-rose-900 font-bold px-4 py-2 border-b border-rose-100 flex justify-between">
                <span>Leave Deductions</span>
                <span>Amount (₹)</span>
              </div>
              <div class="divide-y divide-slate-100 p-2 space-y-1">
                <div class="flex justify-between py-1.5 px-2 text-slate-600">
                  <span>Days Payable</span>
                  <span class="font-semibold text-slate-800 font-mono">{{ payslip?.payableDays }} / {{ payslip?.totalWorkingDays }} Days</span>
                </div>
                <div class="flex justify-between py-1.5 px-2 text-slate-600">
                  <span>Unpaid Absences / Leaves</span>
                  <span class="font-semibold text-rose-600 font-mono">
                    {{ (payslip?.totalWorkingDays - payslip?.payableDays) > 0 ? ((payslip?.totalWorkingDays - payslip?.payableDays).toFixed(1) + ' Days') : '0 Days' }}
                  </span>
                </div>
                <div class="flex justify-between py-1.5 px-2 text-slate-600">
                  <span>Leave Deduction Rate</span>
                  <span class="font-semibold text-rose-600 font-mono">₹{{ getLeaveDeductionAmount() }}</span>
                </div>
                <div class="flex justify-between py-1.5 px-2 font-bold text-rose-800 bg-rose-50/50 rounded mt-2">
                  <span>Total Deductions (Leaves only)</span>
                  <span class="font-mono">₹{{ getLeaveDeductionAmount() }}</span>
                </div>
              </div>
            </div>

          </div>

          <!-- Net Salary Highlight Card -->
          <div class="p-5 rounded-xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <span class="text-xs uppercase tracking-wider text-blue-200 font-bold">Net Salary Payable</span>
              <p class="text-xs text-blue-300 mt-0.5">Formula: Payable Days × Per-Day Rate (₹{{ payslip?.payableDays }} × ₹{{ payslip?.perDayRate }})</p>
            </div>
            <div class="text-right">
              <div class="text-3xl font-black tracking-tight text-white font-mono">
                ₹{{ payslip?.netSalary?.toLocaleString() }}
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

  getLeaveDeductionAmount(): string {
    if (!this.payslip) return '0';
    const workingDays = this.payslip.totalWorkingDays || 27;
    const payableDays = this.payslip.payableDays !== undefined ? this.payslip.payableDays : workingDays;
    const perDayRate = this.payslip.perDayRate || (this.payslip.baseSalary / workingDays);
    const deduction = Math.max(0, Math.round((workingDays - payableDays) * perDayRate));
    return deduction.toLocaleString();
  }
}
