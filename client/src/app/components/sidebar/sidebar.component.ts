import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UiService } from '../../services/ui.service';
import { AppLogoComponent } from '../logo/app-logo.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, AppLogoComponent],
  template: `
    <aside class="w-full h-full md:w-64 bg-white md:border-r border-slate-200 flex flex-col justify-between p-4 min-h-[calc(100vh-61px)] overflow-y-auto">
      
      <!-- Top Nav Items -->
      <div class="space-y-4 sm:space-y-6">
        
        <!-- Mobile Drawer Header (Visible only on mobile drawer) -->
        <div class="md:hidden flex items-center justify-between pb-3 border-b border-slate-100">
          <a [routerLink]="authService.isAdmin() ? '/admin/dashboard' : '/employee/dashboard'" (click)="uiService.closeMobileSidebar()" class="flex items-center gap-2 text-decoration-none">
            <app-logo size="sm"></app-logo>
            <span class="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider" 
              [ngClass]="authService.isAdmin() ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'">
              {{ authService.isAdmin() ? 'Admin' : 'Employee' }}
            </span>
          </a>
          <button 
            (click)="uiService.closeMobileSidebar()" 
            class="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors">
            <i class="fa-solid fa-xmark text-base"></i>
          </button>
        </div>

        <!-- Role Specific Menu Section -->
        <div>
          <div class="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
            {{ authService.isAdmin() ? 'HR & Administration' : 'My Workspace' }}
          </div>

          <!-- ADMIN NAV LINKS -->
          <nav *ngIf="authService.isAdmin()" class="space-y-1">
            <a 
              routerLink="/admin/dashboard" 
              routerLinkActive="bg-blue-50 text-blue-700 font-bold" 
              [routerLinkActiveOptions]="{exact: true}"
              (click)="uiService.closeMobileSidebar()"
              class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              <i class="fa-solid fa-chart-pie w-4 text-center text-sm"></i>
              <span>Admin Overview</span>
            </a>

            <a 
              routerLink="/admin/employees" 
              routerLinkActive="bg-blue-50 text-blue-700 font-bold" 
              (click)="uiService.closeMobileSidebar()"
              class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              <i class="fa-solid fa-users w-4 text-center text-sm"></i>
              <span>Employee Directory</span>
            </a>

            <a 
              routerLink="/admin/attendance" 
              routerLinkActive="bg-blue-50 text-blue-700 font-bold" 
              (click)="uiService.closeMobileSidebar()"
              class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              <i class="fa-solid fa-calendar-check w-4 text-center text-sm"></i>
              <span>Master Attendance</span>
            </a>

            <a 
              routerLink="/admin/calendar" 
              routerLinkActive="bg-blue-50 text-blue-700 font-bold" 
              (click)="uiService.closeMobileSidebar()"
              class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              <i class="fa-solid fa-calendar-days w-4 text-center text-sm"></i>
              <span>Attendance Calendar</span>
            </a>

            <a 
              routerLink="/admin/holidays" 
              routerLinkActive="bg-blue-50 text-blue-700 font-bold" 
              (click)="uiService.closeMobileSidebar()"
              class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              <i class="fa-solid fa-calendar-day w-4 text-center text-sm"></i>
              <span>Holiday Manager</span>
            </a>

            <a 
              routerLink="/admin/payroll" 
              routerLinkActive="bg-blue-50 text-blue-700 font-bold" 
              (click)="uiService.closeMobileSidebar()"
              class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              <i class="fa-solid fa-file-invoice-dollar w-4 text-center text-sm"></i>
              <span>Payroll Engine</span>
            </a>

            <a 
              routerLink="/admin/incentives" 
              routerLinkActive="bg-blue-50 text-blue-700 font-bold" 
              (click)="uiService.closeMobileSidebar()"
              class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              <i class="fa-solid fa-car w-4 text-center text-sm"></i>
              <span>Incentive Audit</span>
            </a>
          </nav>

          <!-- EMPLOYEE NAV LINKS -->
          <nav *ngIf="!authService.isAdmin()" class="space-y-1">
            <a 
              routerLink="/employee/dashboard" 
              routerLinkActive="bg-blue-50 text-blue-700 font-bold" 
              [routerLinkActiveOptions]="{exact: true}"
              (click)="uiService.closeMobileSidebar()"
              class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              <i class="fa-solid fa-house-user w-4 text-center text-sm"></i>
              <span>Employee Dashboard</span>
            </a>

            <a 
              routerLink="/employee/attendance-log" 
              routerLinkActive="bg-blue-50 text-blue-700 font-bold" 
              (click)="uiService.closeMobileSidebar()"
              class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              <i class="fa-solid fa-clock w-4 text-center text-sm"></i>
              <span>Daily Attendance Log</span>
            </a>

            <a 
              routerLink="/employee/calendar" 
              routerLinkActive="bg-blue-50 text-blue-700 font-bold" 
              (click)="uiService.closeMobileSidebar()"
              class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              <i class="fa-solid fa-calendar-days w-4 text-center text-sm"></i>
              <span>Attendance Calendar</span>
            </a>

            <a 
              routerLink="/employee/incentives" 
              routerLinkActive="bg-blue-50 text-blue-700 font-bold" 
              (click)="uiService.closeMobileSidebar()"
              class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              <i class="fa-solid fa-car w-4 text-center text-sm"></i>
              <span>Loans & Incentives</span>
            </a>

            <a 
              routerLink="/employee/payslips" 
              routerLinkActive="bg-blue-50 text-blue-700 font-bold" 
              (click)="uiService.closeMobileSidebar()"
              class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              <i class="fa-solid fa-receipt w-4 text-center text-sm"></i>
              <span>My Salary Slips</span>
            </a>
          </nav>

        </div>

        <!-- Quick Info Box -->
        <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <div class="flex items-center gap-2 text-xs font-bold text-slate-800 mb-1">
            <i class="fa-solid fa-shield-halved text-blue-600"></i>
            <span>FinGoal Business Rules</span>
          </div>
          <p class="text-[11px] text-slate-500 leading-relaxed">
            • <strong>Shift: 10:00 AM – 6:00 PM</strong><br>
            • <strong>Half-Day: 2:00 PM – 6:00 PM</strong><br>
            • <strong>Fixed 30-Day Payroll</strong><br>
            • <strong>Loan Sourcing: 0.10% – 0.50%</strong><br>
            • Paid National Holidays
          </p>
        </div>

      </div>

      <!-- Bottom Card: Current User badge -->
      <div class="pt-4 border-t border-slate-100">
        <div class="flex items-center justify-between text-xs text-slate-400">
          <span>Version 1.0.0</span>
          <span class="inline-flex items-center gap-1 text-emerald-600 font-bold">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> API Online
          </span>
        </div>
      </div>

    </aside>
  `
})
export class SidebarComponent {
  constructor(
    public authService: AuthService,
    public uiService: UiService
  ) {}
}
