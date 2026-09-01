import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../models';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private apiUrl = `${environment.apiUrl}/employees`;

  constructor(private http: HttpClient) {}

  getAllEmployees(filters?: { search?: string; department?: string; role?: string; isActive?: any }): Observable<{ success: boolean; count: number; employees: User[] }> {
    let params = new HttpParams();
    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.department) params = params.set('department', filters.department);
    if (filters?.role) params = params.set('role', filters.role);
    if (filters?.isActive !== undefined) params = params.set('isActive', filters.isActive);

    return this.http.get<{ success: boolean; count: number; employees: User[] }>(this.apiUrl, { params });
  }

  getEmployeeById(id: string): Observable<{ success: boolean; employee: User }> {
    return this.http.get<{ success: boolean; employee: User }>(`${this.apiUrl}/${id}`);
  }

  createEmployee(employeeData: any): Observable<{ success: boolean; message: string; employee: User }> {
    return this.http.post<{ success: boolean; message: string; employee: User }>(this.apiUrl, employeeData);
  }

  updateEmployee(id: string, employeeData: any): Observable<{ success: boolean; message: string; employee: User }> {
    return this.http.put<{ success: boolean; message: string; employee: User }>(`${this.apiUrl}/${id}`, employeeData);
  }

  updateBaseSalary(id: string, baseSalary: number): Observable<{ success: boolean; message: string; employee: any }> {
    return this.http.patch<{ success: boolean; message: string; employee: any }>(`${this.apiUrl}/${id}/salary`, { baseSalary });
  }

  toggleEmployeeStatus(id: string): Observable<{ success: boolean; message: string; isActive: boolean }> {
    return this.http.patch<{ success: boolean; message: string; isActive: boolean }>(`${this.apiUrl}/${id}/status`, {});
  }

  deleteEmployee(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }
}
