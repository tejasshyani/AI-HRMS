import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from './services/auth.service';
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

      <!-- Main Workspace Body: Sidebar + Router Views -->
      <div class="flex flex-1">
        <app-sidebar class="hidden md:block"></app-sidebar>
        <main class="flex-1 overflow-y-auto min-h-[calc(100vh-61px)]">
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
  constructor(public authService: AuthService, private router: Router) {}

  isAuthRoute(): boolean {
    const url = this.router.url;
    return url.includes('/login') || url.includes('/register');
  }
}
