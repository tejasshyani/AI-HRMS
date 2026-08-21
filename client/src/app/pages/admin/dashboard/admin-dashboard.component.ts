import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AnalyticsService } from '../../../services/analytics.service';
import { EmployeeService } from '../../../services/employee.service';
import { PayrollService } from '../../../services/payroll.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="p-6 pb-12 space-y-6 max-w-7xl mx-auto">
      
      <!-- Top Admin Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-xl font-extrabold text-slate-900 tracking-tight">FinGoal Admin Overview & Operations</h1>
          <p class="text-xs text-slate-500 mt-0.5">Real-time attendance pulse, punctuality compliance, and firm metrics</p>
        </div>
        <div class="flex items-center gap-3">
          <a routerLink="/admin/payroll" class="btn btn-primary btn-sm">
            <i class="fa-solid fa-play"></i> Run Payroll Wizard
          </a>
          <a routerLink="/admin/employees" class="btn btn-secondary btn-sm">
            <i class="fa-solid fa-user-plus"></i> Add Employee
          </a>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <!-- Total Active Staff -->
        <div class="card p-5 flex items-center justify-between">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Total Registered Staff</span>
            <div class="text-2xl font-black text-slate-900 mt-1">
              {{ summary?.totalEmployees || 0 }} <span class="text-xs font-semibold text-slate-400">Active</span>
            </div>
            <div class="text-[11px] text-blue-600 font-bold mt-1">
              {{ summary?.departments || 1 }} Department(s)
            </div>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg shadow-xs">
            <i class="fa-solid fa-users"></i>
          </div>
        </div>

        <!-- Present Today -->
        <div class="card p-5 flex items-center justify-between">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Present Today</span>
            <div class="text-2xl font-black text-emerald-700 mt-1">
              {{ summary?.presentToday || 0 }} <span class="text-xs font-semibold text-slate-400">/ {{ summary?.totalEmployees || 0 }}</span>
            </div>
            <div class="text-[11px] text-emerald-600 font-bold mt-1">
              {{ getPresenceRate() }}% Presence Rate
            </div>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg shadow-xs">
            <i class="fa-solid fa-user-check"></i>
          </div>
        </div>

        <!-- On Leave / Absent -->
        <div class="card p-5 flex items-center justify-between">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-slate-400">On Leave / Absent</span>
            <div class="text-2xl font-black text-rose-700 mt-1">
              {{ summary?.onLeaveToday || 0 }} <span class="text-xs font-semibold text-slate-400">Today</span>
            </div>
            <div class="text-[11px] text-rose-600 font-bold mt-1">Daily Absences</div>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-lg shadow-xs">
            <i class="fa-solid fa-user-xmark"></i>
          </div>
        </div>

        <!-- Monthly Payroll Payout -->
        <div class="card p-5 flex items-center justify-between">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Total Net Payroll</span>
            <div class="text-2xl font-black text-slate-900 mt-1">
              ₹{{ totalPayrollAmount.toLocaleString() }}
            </div>
            <div class="text-[11px] text-purple-600 font-bold mt-1">Computed Payout</div>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg shadow-xs">
            <i class="fa-solid fa-file-invoice-dollar"></i>
          </div>
        </div>

      </div>

      <!-- Main Admin Grid: Punctuality Report & Absent Staff -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Left 2 Cols: Punctuality Compliance Risk Report -->
        <div class="lg:col-span-2 space-y-6">
          <div class="card p-6 border border-slate-200">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 class="text-base font-bold text-slate-900">Punctuality & Shift Compliance Report</h3>
                <p class="text-xs text-slate-400">Tracking registered employee punctuality and compliance metrics</p>
              </div>

              <!-- Risk Count Badges -->
              <div class="flex items-center gap-2 text-xs font-bold">
                <span class="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-rose-500"></span> {{ punctualitySummary?.highRiskCount || 0 }} High Risk
                </span>
                <span class="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-amber-500"></span> {{ punctualitySummary?.mediumRiskCount || 0 }} Medium Risk
                </span>
                <span class="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-emerald-500"></span> {{ punctualitySummary?.lowRiskCount || 0 }} Low Risk
                </span>
              </div>
            </div>

            <!-- Table of Punctuality Scores -->
            <div class="overflow-x-auto">
              <table class="w-full text-xs">
                <thead>
                  <tr class="border-b border-slate-100 text-slate-400 text-left font-semibold">
                    <th class="py-2.5">Employee Name</th>
                    <th class="py-2.5 w-1/3">Punctuality Score</th>
                    <th class="py-2.5 text-center">Risk Level</th>
                    <th class="py-2.5 text-right">Leaves Taken</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 font-medium">
                  <tr *ngFor="let emp of punctualityList" class="hover:bg-slate-50/70 transition-colors">
                    <td class="py-3.5 flex items-center gap-3">
                      <img [src]="emp.avatar" class="w-8 h-8 rounded-full bg-slate-100" alt="">
                      <div>
                        <span class="font-bold text-slate-800">{{ emp.name }}</span>
                        <div class="text-[10px] text-slate-400">{{ emp.role || 'Staff' }}</div>
                      </div>
                    </td>
                    <td class="py-3.5">
                      <div class="flex items-center gap-3">
                        <div class="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div class="h-full rounded-full" [style.background-color]="emp.riskColor" [style.width.%]="emp.score"></div>
                        </div>
                        <span class="font-bold font-mono text-slate-700 w-8 text-right">{{ emp.score }}%</span>
                      </div>
                    </td>
                    <td class="py-3.5 text-center">
                      <span class="inline-flex items-center gap-1 text-[11px] font-bold" [style.color]="emp.riskColor">
                        • {{ emp.risk }}
                      </span>
                    </td>
                    <td class="py-3.5 text-right font-mono font-bold text-slate-700">
                      {{ emp.leaves }}
                    </td>
                  </tr>
                  <tr *ngIf="punctualityList.length === 0">
                    <td colspan="4" class="py-8 text-center text-slate-400">
                      No staff profiles registered yet. Use <strong>"Add Employee"</strong> above to register profiles.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Right Col: Absent Today & Overtime tracker -->
        <div class="space-y-6">
          
          <!-- Absent Today Widget -->
          <div class="card p-6 border border-slate-200">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-base font-bold text-slate-900">Absent Today</h3>
              <span class="badge badge-absent text-[10px]">{{ absentToday.length }} Staff</span>
            </div>

            <div class="space-y-3" *ngIf="absentToday.length > 0">
              <div *ngFor="let ab of absentToday" class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div class="flex items-center gap-3">
                  <img [src]="ab.avatar" class="w-9 h-9 rounded-full bg-white border" alt="">
                  <div>
                    <div class="font-bold text-xs text-slate-800">{{ ab.name }}</div>
                    <div class="text-[10px] text-slate-400">{{ ab.role }}</div>
                  </div>
                </div>
                <span class="text-[10px] font-bold text-rose-600 uppercase">Absent</span>
              </div>
            </div>

            <div *ngIf="absentToday.length === 0" class="text-center py-6 text-xs text-slate-400">
              <i class="fa-solid fa-circle-check text-emerald-500 text-base mb-1"></i>
              <p>No absences recorded for today.</p>
            </div>
          </div>

          <!-- Overtime Counter Widget -->
          <div class="card p-6 border border-slate-200">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-base font-bold text-slate-900">Overtime Log</h3>
              <i class="fa-solid fa-clock text-blue-500"></i>
            </div>

            <div class="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-200/60 mb-2">
              <span class="text-[11px] uppercase tracking-wider text-blue-800 font-bold">Total Overtime This Month</span>
              <div class="text-2xl font-black text-blue-900 mt-1 font-mono">00H : 00M</div>
            </div>
            <p class="text-[11px] text-slate-400">Standard Work Week: Monday to Saturday (6 days).</p>
          </div>

        </div>

      </div>

    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  summary: any = null;
  punctualitySummary: any = null;
  punctualityList: any[] = [];
  absentToday: any[] = [];
  totalPayrollAmount = 0;

  constructor(
    private analyticsService: AnalyticsService,
    private employeeService: EmployeeService,
    private payrollService: PayrollService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.loadOperationsData();
    this.loadPayrollSummary();
  }

  loadOperationsData() {
    this.analyticsService.getOperationsDashboard().subscribe({
      next: (res) => {
        this.summary = res.hrmsSummary;
        this.punctualitySummary = res.punctualitySummary;
        this.punctualityList = res.punctualitySummary?.employees || [];
        this.absentToday = res.absentToday || [];
      }
    });
  }

  loadPayrollSummary() {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    this.payrollService.getPayrollAnalytics(currentMonth, currentYear).subscribe({
      next: (res) => {
        this.totalPayrollAmount = res.lastSalaryProcessed || 0;
      }
    });
  }

  getPresenceRate(): number {
    if (!this.summary || !this.summary.totalEmployees) return 0;
    return Math.round((this.summary.presentToday / this.summary.totalEmployees) * 100);
  }
}
