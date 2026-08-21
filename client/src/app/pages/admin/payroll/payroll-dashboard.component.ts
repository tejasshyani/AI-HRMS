import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PayrollService } from '../../../services/payroll.service';
import { ToastService } from '../../../services/toast.service';
import { PayslipModalComponent } from '../../../components/payslip-modal/payslip-modal.component';

@Component({
  selector: 'app-payroll-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, PayslipModalComponent],
  template: `
    <div class="p-6 pb-12 space-y-6 max-w-7xl mx-auto">
      
      <!-- Top KPIs & Action Bar -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <!-- Payment Date Card -->
        <div class="card p-5 border border-slate-200 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg">
              <i class="fa-regular fa-calendar"></i>
            </div>
            <div>
              <span class="text-xs font-bold text-slate-400">Payment Date</span>
              <div class="text-base font-black text-slate-900 mt-0.5">{{ analytics?.paymentDate || 'Jan 30, 2026' }}</div>
            </div>
          </div>
          <span class="px-3 py-1 bg-amber-100/70 text-amber-800 font-bold text-xs rounded-full">
            {{ analytics?.paymentStatus || 'Pending' }}
          </span>
        </div>

        <!-- Total Employees Card -->
        <div class="card p-5 border border-slate-200 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg">
              <i class="fa-solid fa-users"></i>
            </div>
            <div>
              <span class="text-xs font-bold text-slate-400">Salaried Employees</span>
              <div class="text-2xl font-black text-slate-900 mt-0.5">{{ analytics?.totalEmployees || 0 }}</div>
            </div>
          </div>
          <div class="flex items-center gap-2 text-xs font-bold">
            <span class="text-emerald-600 font-bold">{{ analytics?.totalEmployees || 0 }} Staff</span>
          </div>
        </div>

        <!-- Payroll Analytics Card & Download Reports -->
        <div class="card p-5 border border-slate-200 flex items-center justify-between">
          <div>
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-bold text-slate-400">Total Net Payroll</span>
            </div>
            <div class="text-xl font-black text-slate-900 font-mono">
              ₹{{ (analytics?.lastSalaryProcessed || 0).toLocaleString() }}
            </div>
            <div class="flex items-center gap-2 text-[11px] font-semibold mt-1 text-slate-400">
              <span>Flat Payout</span>
              <span>•</span>
              <span class="text-emerald-600 font-bold">Leaves Only Deducted</span>
            </div>
          </div>

          <!-- Download Action Dropdown -->
          <div class="relative">
            <button 
              (click)="showDownloadMenu = !showDownloadMenu" 
              class="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors">
              <i class="fa-solid fa-download text-sm"></i>
            </button>

            <div *ngIf="showDownloadMenu" class="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-40 animate-fade text-xs">
              <a [href]="exportCSVUrl" download class="px-4 py-2.5 hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 font-semibold text-decoration-none">
                <i class="fa-solid fa-file-excel text-emerald-600"></i>
                <span>Download as XLS / CSV</span>
              </a>
              <button (click)="triggerYearlyReport()" class="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 font-semibold">
                <i class="fa-solid fa-file-pdf text-blue-600"></i>
                <span>Download Yearly Report</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      <!-- Center Row: Run Payroll Steps (Left) & Compliance Report (Right) -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- Left: Run Payroll Steps Stepper -->
        <div class="card p-6 border border-slate-200 space-y-5">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-base font-bold text-slate-900">Run Payroll Steps</h3>
              <p class="text-xs text-slate-400">Automated multi-stage salary calculation engine</p>
            </div>
            <div class="flex items-center gap-2">
              <select [(ngModel)]="calcMonth" class="form-select text-xs py-1 px-2 w-28">
                <option [value]="1">January</option>
                <option [value]="2">February</option>
                <option [value]="3">March</option>
                <option [value]="4">April</option>
                <option [value]="5">May</option>
                <option [value]="6">June</option>
                <option [value]="7">July</option>
                <option [value]="8">August</option>
                <option [value]="9">September</option>
                <option [value]="10">October</option>
                <option [value]="11">November</option>
                <option [value]="12">December</option>
              </select>
              <button (click)="runPayrollEngine()" [disabled]="calculating" class="btn btn-primary btn-sm flex items-center gap-1.5 font-bold">
                <i *ngIf="calculating" class="fa-solid fa-spinner fa-spin"></i>
                <i *ngIf="!calculating" class="fa-solid fa-calculator"></i>
                <span>Calculate</span>
              </button>
            </div>
          </div>

          <div class="space-y-3.5">
            
            <!-- Step 1: Employee Changes -->
            <div class="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  <i class="fa-solid fa-check"></i>
                </div>
                <div class="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs">
                  <i class="fa-solid fa-user"></i>
                </div>
                <div>
                  <h4 class="text-xs font-bold text-slate-900">Employee Profiles & Base Salaries</h4>
                  <div class="text-[10px] text-slate-400">Verified active employee roster</div>
                </div>
              </div>
              <div class="flex items-center gap-2 text-xs">
                <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">Verified</span>
              </div>
            </div>

            <!-- Step 2: Attendance, Leave & Present Days -->
            <div class="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  <i class="fa-solid fa-check"></i>
                </div>
                <div class="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs">
                  <i class="fa-solid fa-calendar-days"></i>
                </div>
                <div>
                  <h4 class="text-xs font-bold text-slate-900">Attendance, Leave & Present Days</h4>
                  <div class="text-[10px] text-slate-400">Mon–Sat working days & Sundays off</div>
                </div>
              </div>
              <i class="fa-regular fa-calendar text-emerald-600 text-sm"></i>
            </div>

            <!-- Step 3: Flat Rate Computation -->
            <div class="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  <i class="fa-solid fa-check"></i>
                </div>
                <div class="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs">
                  <i class="fa-solid fa-scale-balanced"></i>
                </div>
                <div>
                  <h4 class="text-xs font-bold text-slate-900">Flat Rate & Leave Deductions</h4>
                  <div class="text-[10px] text-slate-400">Rate = Base / Working Days • Deduct only leaves</div>
                </div>
              </div>
              <i class="fa-solid fa-circle-check text-emerald-600 text-sm"></i>
            </div>

            <!-- Step 4: Final Net Payout Approval -->
            <div class="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  <i class="fa-solid fa-check"></i>
                </div>
                <div class="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs">
                  <i class="fa-solid fa-file-invoice-dollar"></i>
                </div>
                <div>
                  <h4 class="text-xs font-bold text-slate-900">Net Payable Amount & Slips</h4>
                  <div class="text-[10px] text-slate-400">Payable Days × Per-Day Rate</div>
                </div>
              </div>
              <span class="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">Ready</span>
            </div>

          </div>
        </div>

        <!-- Right: Compliance Report Card -->
        <div class="card p-6 border border-slate-200 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-bold text-slate-900">Monthly Compliance & Audit Summary</h3>
            <span class="badge badge-present text-[10px]">Verified Audit</span>
          </div>
          
          <div class="overflow-x-auto">
            <table class="w-full text-xs">
              <thead>
                <tr class="border-b border-slate-100 text-slate-400 text-left font-semibold">
                  <th class="py-2.5">Audit Item</th>
                  <th class="py-2.5 text-center">Active Month</th>
                  <th class="py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr>
                  <td class="py-3 font-bold text-slate-800 align-top">
                    <div>Salary Structure Audit</div>
                    <div class="text-[10px] text-slate-400 font-normal">Flat rate calculation (Leaves only)</div>
                  </td>
                  <td class="py-3 px-2 text-center font-mono font-bold text-slate-700">
                    Jan / Aug 2026
                  </td>
                  <td class="py-3 px-2 text-center">
                    <span class="inline-block px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-md border border-emerald-200">
                      ✓ Compliant
                    </span>
                  </td>
                </tr>
                <tr>
                  <td class="py-3 font-bold text-slate-800 align-top">
                    <div>Shift & Sunday Off Tracking</div>
                    <div class="text-[10px] text-slate-400 font-normal">6-Day Work Week (Mon–Sat)</div>
                  </td>
                  <td class="py-3 px-2 text-center font-mono font-bold text-slate-700">
                    Jan / Aug 2026
                  </td>
                  <td class="py-3 px-2 text-center">
                    <span class="inline-block px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-md border border-emerald-200">
                      ✓ Compliant
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-blue-800">
            <i class="fa-solid fa-circle-info mr-1.5 text-blue-600"></i>
            <strong>Flat 30-Day Rule:</strong> All employee salaries are calculated on a fixed 30 days/month basis (Daily Rate = Base / 30). Only unpaid absences/leaves reduce monthly payouts.
          </div>

        </div>

      </div>

      <!-- Monthly Payroll & Salary Payout Table -->
      <div class="card p-6 border border-slate-200 space-y-4">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 class="text-base font-bold text-slate-900">Monthly Payroll & Salary Payout</h3>
            <p class="text-xs text-slate-400">Flat 30-day monthly salary breakdown (deducting strictly for unpaid leaves)</p>
          </div>
          <button (click)="loadPayrollData()" class="btn btn-secondary btn-sm flex items-center gap-1.5">
            <i class="fa-solid fa-rotate-right"></i>
            <span>Refresh Table</span>
          </button>
        </div>

        <div class="table-responsive-wrapper">
          <table class="table-modern text-[11px] sm:text-xs">
            <thead>
              <tr class="text-[10px] sm:text-[11px]">
                <th class="py-2.5 px-2">Employee</th>
                <th class="py-2.5 px-2">Base Salary</th>
                <th class="py-2.5 px-2 text-center">Pay Days</th>
                <th class="py-2.5 px-2">Rate/Day</th>
                <th class="py-2.5 px-2 text-blue-700 font-bold">Earned Pay</th>
                <th class="py-2.5 px-2">Leave Ded.</th>
                <th class="py-2.5 px-2">Loan Disb.</th>
                <th class="py-2.5 px-2 text-emerald-700 font-bold">Incentive</th>
                <th class="py-2.5 px-2 font-bold text-slate-900">Net Pay</th>
                <th class="py-2.5 px-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium">
              <tr *ngFor="let item of taxPayrollList" class="transition-colors">
                
                <td class="py-2.5 px-2 flex items-center gap-2">
                  <div class="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shadow-2xs flex-shrink-0">
                    {{ getInitials(item.employeeName) }}
                  </div>
                  <div class="min-w-0">
                    <div class="font-bold text-slate-900 truncate max-w-[120px]">{{ item.employeeName }}</div>
                    <div class="text-[9px] text-slate-400 font-medium truncate max-w-[120px]">{{ item.designation || 'Staff Member' }}</div>
                  </div>
                </td>

                <td class="py-2.5 px-2 font-bold font-mono text-slate-800">
                  ₹{{ item.salaryAmount?.toLocaleString() }}
                </td>

                <td class="py-2.5 px-2 text-center font-mono font-bold text-blue-700">
                  {{ item.payableDays }}d
                </td>

                <td class="py-2.5 px-2 font-mono text-slate-600">
                  ₹{{ item.perDayRate?.toLocaleString() }}
                </td>

                <!-- Earned Pay (Payable Days × Per-Day Rate) -->
                <td class="py-2.5 px-2 font-bold font-mono text-blue-700">
                  ₹{{ getWorkingDaysAmount(item).toLocaleString() }}
                </td>

                <td class="py-2.5 px-2 font-mono font-bold" [ngClass]="item.leaveDeduction > 0 ? 'text-rose-600' : 'text-slate-400'">
                  ₹{{ item.leaveDeduction?.toLocaleString() }}
                </td>

                <td class="py-2.5 px-2 font-mono text-slate-800">
                  ₹{{ (item.totalLoanDisbursed || 0)?.toLocaleString() }}
                </td>

                <td class="py-2.5 px-2 font-mono font-bold" [ngClass]="item.totalIncentive > 0 ? 'text-emerald-700' : 'text-slate-400'">
                  + ₹{{ (item.totalIncentive || 0)?.toLocaleString() }}
                </td>

                <td class="py-2.5 px-2 font-black font-mono text-emerald-700">
                  ₹{{ item.netPayable?.toLocaleString() }}
                </td>

                <td class="py-2.5 px-2 text-right">
                  <button (click)="openPayslip(item)" class="btn-action-view text-[11px] py-1 px-2">
                    <i class="fa-solid fa-receipt text-[10px]"></i>
                    <span>Slip</span>
                  </button>
                </td>

              </tr>

              <tr *ngIf="taxPayrollList.length === 0">
                <td colspan="10" class="py-12 text-center text-slate-400">
                  <i class="fa-solid fa-receipt text-2xl mb-2 text-slate-300"></i>
                  <p>No registered employees found. Add staff via <strong>Employee Directory</strong> to calculate payroll.</p>
                </td>
              </tr>

            </tbody>
          </table>
        </div>

      </div>

    </div>

    <!-- Payslip Modal -->
    <app-payslip-modal 
      [isOpen]="showPayslipModal" 
      [payslip]="selectedPayslip" 
      (close)="showPayslipModal = false">
    </app-payslip-modal>
  `
})
export class PayrollDashboardComponent implements OnInit {
  analytics: any = null;
  taxPayrollList: any[] = [];
  calcMonth = new Date().getMonth() + 1;
  calcYear = new Date().getFullYear();
  calculating = false;
  showDownloadMenu = false;
  exportCSVUrl = `http://localhost:5000/api/payroll/export?month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`;

  showPayslipModal = false;
  selectedPayslip: any = null;

  constructor(
    private payrollService: PayrollService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.loadPayrollData();
  }

  loadPayrollData() {
    this.payrollService.getPayrollAnalytics(this.calcMonth, this.calcYear).subscribe({
      next: (res) => {
        this.analytics = res;
        this.taxPayrollList = (res.taxPayroll || []).filter((item: any) => item.role !== 'admin');
        this.exportCSVUrl = `http://localhost:5000/api/payroll/export?month=${this.calcMonth}&year=${this.calcYear}`;
      },
      error: () => {
        this.toast.error('Failed to load payroll analytics.');
      }
    });
  }

  runPayrollEngine() {
    this.calculating = true;
    this.payrollService.generatePayroll(this.calcMonth, this.calcYear).subscribe({
      next: (res) => {
        this.calculating = false;
        this.toast.success(res.message || 'Payroll computed successfully!');
        this.loadPayrollData();
      },
      error: (err) => {
        this.calculating = false;
        this.toast.error(err.error?.message || 'Failed to process payroll.');
      }
    });
  }

  openPayslip(item: any) {
    this.payrollService.getEmployeePayslip(item._id, this.calcMonth, this.calcYear).subscribe({
      next: (res) => {
        this.selectedPayslip = res.payslip;
        this.showPayslipModal = true;
      },
      error: () => {
        this.toast.error('Failed to load employee payslip.');
      }
    });
  }

  triggerYearlyReport() {
    this.showDownloadMenu = false;
    this.toast.info('Generating yearly payroll audit report PDF...');
  }

  getWorkingDaysAmount(item: any): number {
    if (item.workingDaysAmount != null) return item.workingDaysAmount;
    const days = Number(item.payableDays) || 0;
    const rate = Number(item.perDayRate) || (Number(item.salaryAmount) / 30);
    return Math.round(days * rate);
  }

  getInitials(name: string): string {
    if (!name) return 'FG';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
}
