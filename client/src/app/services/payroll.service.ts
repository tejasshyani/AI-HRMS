import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PayrollRecord } from '../models';

@Injectable({
  providedIn: 'root'
})
export class PayrollService {
  private apiUrl = `${environment.apiUrl}/payroll`;

  constructor(private http: HttpClient) {}

  generatePayroll(month: number, year: number, employeeIds?: string[]): Observable<{
    success: boolean;
    message: string;
    month: number;
    year: number;
    monthName: string;
    totalPayout: number;
    count: number;
    records: PayrollRecord[];
  }> {
    return this.http.post<any>(`${this.apiUrl}/generate`, { month, year, employeeIds });
  }

  getPayrollAnalytics(month: number = 1, year: number = 2026): Observable<any> {
    const params = new HttpParams().set('month', month.toString()).set('year', year.toString());
    return this.http.get<any>(`${this.apiUrl}/analytics`, { params });
  }

  getEmployeePayslip(userId: string, month: number, year: number): Observable<{ success: boolean; payslip: any }> {
    return this.http.get<{ success: boolean; payslip: any }>(`${this.apiUrl}/payslip/${userId}/${month}/${year}`);
  }

  exportPayrollCSVUrl(month: number, year: number): string {
    return `${this.apiUrl}/export/csv?month=${month}&year=${year}`;
  }
}
