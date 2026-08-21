import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { AppLogoComponent } from '../logo/app-logo.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, AppLogoComponent],
  template: `
    <header class="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-2.5 flex items-center justify-between shadow-xs">
      
      <!-- Brand & Left section -->
      <div class="flex items-center gap-4">
        <a routerLink="/" class="flex items-center gap-3 text-decoration-none">
          <app-logo size="sm"></app-logo>
          <span class="text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider hidden sm:inline-block" 
            [ngClass]="authService.isAdmin() ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'">
            {{ authService.isAdmin() ? 'Admin Portal' : 'Employee Portal' }}
          </span>
        </a>
      </div>

      <!-- Center: Real-time Clock & Break Tracker Widget -->
      <div class="hidden md:flex items-center gap-6 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-200/80 text-xs">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span class="text-slate-500 font-medium">Live Clock:</span>
          <span class="font-mono font-bold text-slate-800">{{ liveTime }}</span>
        </div>
        <div class="h-3.5 w-px bg-slate-300"></div>
        <div class="flex items-center gap-2">
          <i class="fa-solid fa-mug-hot text-amber-500"></i>
          <span class="text-slate-500 font-medium">Break Time:</span>
          <span class="font-mono font-bold" [ngClass]="isOnBreak ? 'text-amber-600' : 'text-slate-700'">{{ breakTimeStr }}</span>
          <button 
            (click)="toggleBreak()" 
            class="ml-1 px-2 py-0.5 text-[10px] font-bold rounded-full transition-colors"
            [ngClass]="isOnBreak ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'">
            {{ isOnBreak ? 'End Break' : 'Take Break' }}
          </button>
        </div>
      </div>

      <!-- Right Section: Profile & Logout -->
      <div class="flex items-center gap-3">
        
        <div class="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <img 
            [src]="authService.currentUser()?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + (authService.currentUser()?.fullName || 'User')" 
            alt="Avatar" 
            class="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 object-cover">
          <div class="hidden lg:block text-left">
            <div class="font-bold text-xs text-slate-800 leading-tight">{{ authService.currentUser()?.fullName || 'User' }}</div>
            <div class="text-[10px] text-slate-400 font-medium">{{ authService.currentUser()?.designation || authService.currentUser()?.role }}</div>
          </div>
          <button (click)="logout()" title="Logout" class="w-8 h-8 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors">
            <i class="fa-solid fa-arrow-right-from-bracket text-xs"></i>
          </button>
        </div>

      </div>

    </header>
  `
})
export class NavbarComponent implements OnInit, OnDestroy {
  liveTime = '';
  breakSeconds = 0;
  isOnBreak = false;
  private timeInterval: any;
  private breakInterval: any;

  constructor(
    public authService: AuthService,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.updateClock();
    this.timeInterval = setInterval(() => this.updateClock(), 1000);
  }

  ngOnDestroy() {
    if (this.timeInterval) clearInterval(this.timeInterval);
    if (this.breakInterval) clearInterval(this.breakInterval);
  }

  get breakTimeStr(): string {
    const hrs = Math.floor(this.breakSeconds / 3600);
    const mins = Math.floor((this.breakSeconds % 3600) / 60);
    const secs = this.breakSeconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  updateClock() {
    const now = new Date();
    this.liveTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  }

  toggleBreak() {
    this.isOnBreak = !this.isOnBreak;
    if (this.isOnBreak) {
      this.toast.info('Break timer started.');
      this.breakInterval = setInterval(() => {
        this.breakSeconds++;
      }, 1000);
    } else {
      if (this.breakInterval) clearInterval(this.breakInterval);
      this.toast.success('Break ended. Resumed work timer.');
    }
  }

  logout() {
    this.authService.logout();
    this.toast.info('Signed out successfully.');
  }
}
