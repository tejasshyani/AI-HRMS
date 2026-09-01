import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AttendanceRecord } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private apiUrl = `${environment.apiUrl}/attendance`;

  constructor(private http: HttpClient) {}

  clockIn(data?: { checkInTime?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/clock-in`, data || {});
  }

  clockOut(data?: { checkOutTime?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/clock-out`, data || {});
  }

  logAttendance(record: Partial<AttendanceRecord>): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/log`, record);
  }

  bulkLogAttendance(data: {
    userId?: string;
    startDate: string;
    endDate: string;
    status: string;
    checkInTime?: string;
    checkOutTime?: string;
    remarks?: string;
    excludeSundays?: boolean;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/bulk-log`, data);
  }

  getMyAttendance(params?: { month?: number; year?: number; startDate?: string; endDate?: string }): Observable<{ success: boolean; count: number; records: AttendanceRecord[] }> {
    let httpParams = new HttpParams();
    if (params?.month) httpParams = httpParams.set('month', params.month.toString());
    if (params?.year) httpParams = httpParams.set('year', params.year.toString());
    if (params?.startDate) httpParams = httpParams.set('startDate', params.startDate);
    if (params?.endDate) httpParams = httpParams.set('endDate', params.endDate);

    return this.http.get<{ success: boolean; count: number; records: AttendanceRecord[] }>(`${this.apiUrl}/my-attendance`, { params: httpParams });
  }

  getMasterAttendance(filters?: { employeeId?: string; month?: any; year?: any; status?: string; dateStr?: string }): Observable<{ success: boolean; count: number; records: AttendanceRecord[] }> {
    let httpParams = new HttpParams();
    if (filters?.employeeId) httpParams = httpParams.set('employeeId', filters.employeeId);
    if (filters?.month) httpParams = httpParams.set('month', filters.month.toString());
    if (filters?.year) httpParams = httpParams.set('year', filters.year.toString());
    if (filters?.status) httpParams = httpParams.set('status', filters.status);
    if (filters?.dateStr) httpParams = httpParams.set('dateStr', filters.dateStr);

    return this.http.get<{ success: boolean; count: number; records: AttendanceRecord[] }>(`${this.apiUrl}/master`, { params: httpParams });
  }

  adminOverride(id: string, overrideData: Partial<AttendanceRecord>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/override/${id}`, overrideData);
  }

  getTodaySummary(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/today-summary`);
  }

  deleteAttendance(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }

  bulkDeleteAttendance(ids: string[]): Observable<{ success: boolean; message: string; count: number }> {
    return this.http.post<{ success: boolean; message: string; count: number }>(`${this.apiUrl}/bulk-delete`, { ids });
  }
}
