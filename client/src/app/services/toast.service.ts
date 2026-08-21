import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts = signal<ToastMessage[]>([]);

  show(title: string, message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', duration = 4000) {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: ToastMessage = { id, type, title, message };
    
    this.toasts.update(current => [...current, toast]);

    setTimeout(() => {
      this.remove(id);
    }, duration);
  }

  success(message: string, title = 'Success') {
    this.show(title, message, 'success');
  }

  error(message: string, title = 'Error') {
    this.show(title, message, 'error');
  }

  info(message: string, title = 'Notice') {
    this.show(title, message, 'info');
  }

  warning(message: string, title = 'Attention') {
    this.show(title, message, 'warning');
  }

  remove(id: string) {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }
}
