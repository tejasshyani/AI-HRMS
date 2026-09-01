import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UiService {
  isMobileSidebarOpen = signal<boolean>(false);

  toggleMobileSidebar() {
    this.isMobileSidebarOpen.update(v => !v);
  }

  openMobileSidebar() {
    this.isMobileSidebarOpen.set(true);
  }

  closeMobileSidebar() {
    this.isMobileSidebarOpen.set(false);
  }
}
