import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { AppLogoComponent } from '../../components/logo/app-logo.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AppLogoComponent],
  template: `
    <div class="min-h-screen bg-[#f8f9fb] flex flex-col justify-between py-10 px-4 sm:px-6 lg:px-8 relative">
      
      <!-- Subtle background grid -->
      <div class="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f015_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f015_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none"></div>

      <!-- Top Brand -->
      <div class="sm:mx-auto sm:w-full sm:max-w-lg flex flex-col items-center justify-center text-center z-10">
        <app-logo size="lg"></app-logo>
      </div>

      <!-- Registration Card -->
      <div class="sm:mx-auto sm:w-full sm:max-w-lg z-10 mt-4">
        <div class="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-slate-100">
          
          <div class="text-center mb-6">
            <h2 class="text-xl font-extrabold text-slate-900 tracking-tight">Create your FinGoal account</h2>
            <p class="text-xs text-slate-500 mt-1">Register an Admin profile or an Employee profile</p>
          </div>

          <form (ngSubmit)="onRegister()" class="space-y-4">
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div class="form-group mb-0">
                <label class="form-label">Full Name <span class="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  [(ngModel)]="formData.fullName" 
                  name="fullName" 
                  required 
                  placeholder="e.g. Tejas Shah" 
                  class="form-control text-sm">
              </div>

              <div class="form-group mb-0">
                <label class="form-label">Username <span class="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  [(ngModel)]="formData.username" 
                  name="username" 
                  required 
                  placeholder="e.g. tejas" 
                  class="form-control text-sm">
              </div>
            </div>

            <div class="form-group mb-0">
              <label class="form-label">Email Address <span class="text-rose-500">*</span></label>
              <input 
                type="email" 
                [(ngModel)]="formData.email" 
                name="email" 
                required 
                placeholder="tejas@fingoal.com" 
                class="form-control text-sm">
            </div>

            <div class="form-group mb-0">
              <label class="form-label">Password <span class="text-rose-500">*</span></label>
              <input 
                type="password" 
                [(ngModel)]="formData.password" 
                name="password" 
                required 
                placeholder="••••••••" 
                class="form-control text-sm">
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div class="form-group mb-0">
                <label class="form-label">Phone Number</label>
                <input 
                  type="tel" 
                  [(ngModel)]="formData.phone" 
                  name="phone" 
                  placeholder="+91 98765 43210" 
                  class="form-control text-sm">
              </div>

              <div class="form-group mb-0">
                <label class="form-label">Account Role <span class="text-rose-500">*</span></label>
                <select [(ngModel)]="formData.role" name="role" class="form-select text-sm font-semibold">
                  <option value="admin">Admin</option>
                  <option value="employee">Employee</option>
                </select>
              </div>
            </div>

            <!-- Terms & Condition Toggle -->
            <div class="flex items-center gap-3 pt-2">
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" [(ngModel)]="agreeTerms" name="agreeTerms" class="sr-only peer">
                <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
              <span class="text-xs text-slate-600">
                Agree with <span class="text-rose-500 font-medium">Terms & Condition</span> and <span class="text-rose-500 font-medium">Privacy Policy</span>
              </span>
            </div>

            <button 
              type="submit" 
              [disabled]="loading || !agreeTerms || !formData.fullName || !formData.email || !formData.password" 
              class="w-full btn btn-primary py-3 rounded-xl font-bold shadow-md flex items-center justify-center gap-2 mt-4">
              <i *ngIf="loading" class="fa-solid fa-spinner fa-spin"></i>
              <span>{{ loading ? 'Registering Account...' : 'Sign Up' }}</span>
            </button>

          </form>

          <div class="text-center mt-6 text-xs text-slate-500">
            Already have an account? 
            <a routerLink="/login" class="text-blue-600 font-bold hover:underline">Sign In</a>
          </div>

        </div>
      </div>

      <!-- Footer copyright -->
      <div class="text-center text-xs text-slate-400 z-10 mt-6">
        Copyright © 2020-2026 FinGoal Company. All rights reserved.
      </div>

    </div>
  `
})
export class RegisterComponent {
  formData = {
    fullName: '',
    username: '',
    email: '',
    password: '',
    phone: '',
    role: 'admin'
  };

  agreeTerms = true;
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toast: ToastService
  ) {}

  onRegister() {
    if (!this.formData.fullName || !this.formData.email || !this.formData.password) {
      this.toast.error('Please fill in all required fields.');
      return;
    }

    this.loading = true;
    this.authService.register(this.formData).subscribe({
      next: (res) => {
        this.loading = false;
        this.toast.success('Registration successful! Welcome to FinGoal.');
        if (res.user.role === 'admin') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/employee/dashboard']);
        }
      },
      error: (err) => {
        this.loading = false;
        this.toast.error(err.error?.message || 'Registration failed.');
      }
    });
  }
}
