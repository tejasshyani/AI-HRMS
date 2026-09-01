import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from './services/auth.service';
import { UiService } from './services/ui.service';
import { NavbarComponent } from './components/navbar/navbar.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { ToastComponent } from './components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    NavbarComponent, 
    SidebarComponent, 
    ToastComponent
  ],
  template: `
    <!-- Notification Toasts -->
    <app-toast></app-toast>

    <!-- Layout when user is logged in & not on auth screens -->
    <div *ngIf="authService.isLoggedIn() && !isAuthRoute()" class="min-h-screen flex flex-col bg-[#f6f7fb]">
      
      <!-- Top Navbar -->
      <app-navbar></app-navbar>

      <!-- Mobile Drawer Backdrop & Slide-over Sidebar -->
      <div 
        *ngIf="uiService.isMobileSidebarOpen()" 
        class="md:hidden fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs animate-fade"
        (click)="uiService.closeMobileSidebar()">
      </div>

      <div 
        class="md:hidden fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white shadow-2xl transition-transform duration-300 ease-in-out"
        [ngClass]="uiService.isMobileSidebarOpen() ? 'translate-x-0' : '-translate-x-full'">
        <app-sidebar></app-sidebar>
      </div>

      <!-- Main Workspace Body: Desktop Sidebar + Router Views -->
      <div class="flex flex-1">
        <app-sidebar class="hidden md:block flex-shrink-0"></app-sidebar>
        <main class="flex-1 overflow-y-auto min-h-[calc(100vh-61px)] w-full">
          <router-outlet></router-outlet>
        </main>
      </div>

    </div>

    <!-- Layout for Auth screens (Login / Register) -->
    <div *ngIf="!authService.isLoggedIn() || isAuthRoute()" class="min-h-screen">
      <router-outlet></router-outlet>
    </div>
  `
})
export class AppComponent {
  constructor(
    public authService: AuthService, 
    public uiService: UiService,
    private router: Router
  ) {}

  isAuthRoute(): boolean {
    const url = this.router.url;
    return url.includes('/login') || url.includes('/register');
  }
}
