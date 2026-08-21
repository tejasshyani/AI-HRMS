import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center gap-3 select-none">
      
      <!-- FinGoal Premium Emblem Icon -->
      <div 
        class="relative flex-shrink-0 flex items-center justify-center transition-transform hover:scale-105 duration-200"
        [ngClass]="{
          'w-9 h-9': size === 'sm',
          'w-11 h-11': size === 'md',
          'w-14 h-14': size === 'lg'
        }">
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full drop-shadow-md">
          <defs>
            <!-- Background Gradient -->
            <linearGradient id="fgBg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#1E40AF" />
              <stop offset="40%" stop-color="#2563EB" />
              <stop offset="100%" stop-color="#4F46E5" />
            </linearGradient>

            <!-- Luminous Golden Goal Spark -->
            <linearGradient id="goalSpark" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#FDE047" />
              <stop offset="100%" stop-color="#F59E0B" />
            </linearGradient>

            <!-- Cyan Velocity Bar -->
            <linearGradient id="cyanGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#38BDF8" />
              <stop offset="100%" stop-color="#06B6D4" />
            </linearGradient>

            <!-- Inner Border Glow -->
            <linearGradient id="borderGlow" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#93C5FD" stop-opacity="0.9" />
              <stop offset="100%" stop-color="#818CF8" stop-opacity="0.4" />
            </linearGradient>
          </defs>

          <!-- Squircle Base with Soft Bevel & Shadow -->
          <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#fgBg)" />
          <rect x="2" y="2" width="44" height="44" rx="12" stroke="url(#borderGlow)" stroke-width="1.5" />

          <!-- Dynamic "F" Monogram & Financial Growth Bars -->
          <!-- Vertical Pillar -->
          <rect x="12" y="11" width="5.5" height="26" rx="2.75" fill="#FFFFFF" />

          <!-- Top Velocity Wing (Cyan) -->
          <path d="M 12 13.75 C 12 12.23 13.23 11 14.75 11 L 30.5 11 C 32.16 11 33.5 12.34 33.5 14 C 33.5 15.66 32.16 17 30.5 17 L 17.5 17 L 12 17 Z" fill="url(#cyanGrad)" />

          <!-- Mid Financial Growth Wing (Pure White) -->
          <rect x="17.5" y="21.5" width="13" height="5.5" rx="2.75" fill="#FFFFFF" fill-opacity="0.95" />

          <!-- Goal Spark (Top-Right Radiant Diamond) -->
          <path d="M 35 7 L 36.3 10.7 L 40 12 L 36.3 13.3 L 35 17 L 33.7 13.3 L 30 12 L 33.7 10.7 Z" fill="url(#goalSpark)" />

          <!-- Bottom-Right Target Dot -->
          <circle cx="34" cy="33" r="3.5" fill="url(#goalSpark)" />
          <circle cx="34" cy="33" r="1.5" fill="#FFFFFF" />
        </svg>
      </div>

      <!-- FinGoal Brand Text & Tagline -->
      <div *ngIf="showText && !collapsed" class="flex flex-col justify-center leading-tight">
        <div class="flex items-center tracking-tight font-sans">
          <span 
            class="font-black text-slate-900"
            [ngClass]="{
              'text-xl': size === 'sm',
              'text-2xl': size === 'md',
              'text-3xl sm:text-4xl': size === 'lg'
            }">
            Fin<span class="text-blue-600">Goal</span>
          </span>
        </div>
        <div 
          class="font-extrabold tracking-tight mt-0.5"
          [ngClass]="{
            'text-[10px]': size === 'sm',
            'text-xs': size === 'md',
            'text-sm': size === 'lg'
          }">
          <span class="text-amber-500">Modern HRMS</span>
        </div>
      </div>

    </div>
  `
})
export class AppLogoComponent {
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() showText = true;
  @Input() collapsed = false;
}
