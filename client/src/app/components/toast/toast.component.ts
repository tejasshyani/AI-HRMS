import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      <div 
        *ngFor="let toast of toastService.toasts()" 
        class="pointer-events-auto p-4 rounded-xl shadow-lg border flex items-start gap-3 transition-all transform duration-300 animate-fade"
        [ngClass]="{
          'bg-emerald-50 border-emerald-200 text-emerald-900': toast.type === 'success',
          'bg-rose-50 border-rose-200 text-rose-900': toast.type === 'error',
          'bg-amber-50 border-amber-200 text-amber-900': toast.type === 'warning',
          'bg-blue-50 border-blue-200 text-blue-900': toast.type === 'info'
        }"
      >
        <div class="text-lg mt-0.5">
          <i *ngIf="toast.type === 'success'" class="fa-solid fa-circle-check text-emerald-600"></i>
          <i *ngIf="toast.type === 'error'" class="fa-solid fa-circle-xmark text-rose-600"></i>
          <i *ngIf="toast.type === 'warning'" class="fa-solid fa-triangle-exclamation text-amber-600"></i>
          <i *ngIf="toast.type === 'info'" class="fa-solid fa-circle-info text-blue-600"></i>
        </div>
        <div class="flex-1 min-w-0">
          <div class="font-bold text-xs uppercase tracking-wider opacity-80">{{ toast.title }}</div>
          <div class="text-sm font-medium mt-0.5">{{ toast.message }}</div>
        </div>
        <button (click)="toastService.remove(toast.id)" class="text-gray-400 hover:text-gray-700 text-sm">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    </div>
  `
})
export class ToastComponent {
  constructor(public toastService: ToastService) {}
}
