import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private tokenKey = 'fingoal_jwt_token';
  private userKey = 'fingoal_user_data';

  currentUser = signal<User | null>(this.getSavedUser());
  token = signal<string | null>(this.getSavedToken());

  isLoggedIn = computed(() => !!this.currentUser() && !!this.token());
  isAdmin = computed(() => this.currentUser()?.role === 'admin');
  isEmployee = computed(() => this.currentUser()?.role === 'employee');

  constructor(private http: HttpClient, private router: Router) {
    // Check if token exists, validate quietly in background without logging out on transient errors
    if (this.token()) {
      this.fetchCurrentUser().subscribe();
    }
  }

  private getSavedUser(): User | null {
    try {
      const saved = localStorage.getItem(this.userKey);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }

  private getSavedToken(): string | null {
    try {
      return localStorage.getItem(this.tokenKey);
    } catch {
      return null;
    }
  }

  login(credentials: { identifier?: string; email?: string; username?: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => {
        if (res.success && res.token && res.user) {
          localStorage.setItem(this.tokenKey, res.token);
          localStorage.setItem(this.userKey, JSON.stringify(res.user));
          this.token.set(res.token);
          this.currentUser.set(res.user);
        }
      })
    );
  }

  register(userData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, userData).pipe(
      tap(res => {
        if (res.success && res.token && res.user) {
          localStorage.setItem(this.tokenKey, res.token);
          localStorage.setItem(this.userKey, JSON.stringify(res.user));
          this.token.set(res.token);
          this.currentUser.set(res.user);
        }
      })
    );
  }

  fetchCurrentUser(): Observable<any> {
    const currentTkn = this.token();
    if (!currentTkn) {
      return of(null);
    }

    return this.http.get<any>(`${this.apiUrl}/me`).pipe(
      tap(res => {
        if (res && res.success && res.user) {
          localStorage.setItem(this.userKey, JSON.stringify(res.user));
          this.currentUser.set(res.user);
        }
      }),
      catchError((err) => {
        // ONLY log out if backend returns 401 (token truly invalid/expired)
        if (err && (err.status === 401 || err.status === 403)) {
          this.logout();
        }
        // If it's a network glitch or server rebooting, keep existing localStorage user intact!
        return of(null);
      })
    );
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.token.set(null);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }
}
