import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { AppLogoComponent } from '../../components/logo/app-logo.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AppLogoComponent],
  template: `
    <div class="min-h-screen bg-[#f8f9fb] flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8 relative selection:bg-blue-100">
      
      <!-- Background subtle grid -->
      <div class="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f015_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f015_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none"></div>

      <!-- Top Brand -->
      <div class="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center justify-center text-center z-10">
        <app-logo size="lg"></app-logo>
      </div>

      <!-- Login Card (matching Image 4) -->
      <div class="sm:mx-auto sm:w-full sm:max-w-md z-10 mt-6">
        <div class="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-slate-100">
          
          <div class="text-center mb-6">
            <h2 class="text-xl font-extrabold text-slate-900 tracking-tight">Sign in to your account</h2>
            <p class="text-xs text-slate-500 mt-1">Access your employee portal or HR management dashboard</p>
          </div>

          <!-- Form -->
          <form (ngSubmit)="onLogin()" class="space-y-4">
            
            <div class="form-group mb-0">
              <label class="form-label flex justify-between">
                <span>Email Address or Employee ID (4-digit) <span class="text-rose-500">*</span></span>
              </label>
              <input 
                type="text" 
                [(ngModel)]="identifier" 
                name="identifier" 
                required 
                placeholder="e.g. maulik@gmail.com or 1002" 
                class="form-control text-sm">
            </div>

            <div class="form-group mb-0">
              <div class="flex justify-between items-center">
                <label class="form-label">Password <span class="text-rose-500">*</span></label>
                <a href="javascript:void(0)" (click)="toast.info('Please contact your administrator if you forgot your password.')" class="text-xs text-blue-600 hover:text-blue-700 font-semibold">Forgot Password?</a>
              </div>
              <div class="relative">
                <input 
                  [type]="showPassword ? 'text' : 'password'" 
                  [(ngModel)]="password" 
                  name="password" 
                  required 
                  placeholder="••••••••" 
                  class="form-control text-sm pr-10">
                <button 
                  type="button" 
                  (click)="showPassword = !showPassword" 
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-xs">
                  <i class="fa-solid" [ngClass]="showPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              [disabled]="loading || !identifier || !password" 
              class="w-full btn btn-primary py-3 rounded-xl font-bold shadow-md flex items-center justify-center gap-2 mt-4">
              <i *ngIf="loading" class="fa-solid fa-spinner fa-spin"></i>
              <span>{{ loading ? 'Signing in...' : 'Login' }}</span>
            </button>

          </form>

          <!-- Bottom Switch to Register -->
          <div class="text-center mt-6 text-xs text-slate-500">
            Don't have an account? 
            <a routerLink="/register" class="text-blue-600 font-bold hover:underline">Sign Up</a>
          </div>

        </div>
      </div>

      <!-- Footer copyright (matching Image 4) -->
      <div class="text-center text-xs text-slate-400 z-10 mt-8">
        Copyright © 2020-2026 FinGoal Technologies. All rights reserved.
      </div>

    </div>
  `
})
export class LoginComponent {
  identifier = '';
  password = '';
  showPassword = false;
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    public toast: ToastService
  ) {}

  onLogin() {
    if (!this.identifier || !this.password) return;
    this.loading = true;

    this.authService.login({ identifier: this.identifier, password: this.password }).subscribe({
      next: (res) => {
        this.loading = false;
        this.toast.success(`Welcome back, ${res.user.fullName}!`);
        if (res.user.role === 'admin') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/employee/dashboard']);
        }
      },
      error: (err) => {
        this.loading = false;
        const msg = err.error?.message || 'Login failed. Please check your credentials.';
        this.toast.error(msg);
      }
    });
  }
}
