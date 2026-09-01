import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Holiday } from '../models';

@Injectable({
  providedIn: 'root'
})
export class HolidayService {
  private apiUrl = `${environment.apiUrl}/holidays`;

  constructor(private http: HttpClient) {}

  getAllHolidays(year?: number): Observable<{ success: boolean; count: number; holidays: Holiday[] }> {
    let params = new HttpParams();
    if (year) params = params.set('year', year.toString());
    return this.http.get<{ success: boolean; count: number; holidays: Holiday[] }>(this.apiUrl, { params });
  }

  getUpcomingHolidays(): Observable<{ success: boolean; holidays: Holiday[] }> {
    return this.http.get<{ success: boolean; holidays: Holiday[] }>(`${this.apiUrl}/upcoming`);
  }

  createHoliday(holidayData: Partial<Holiday>): Observable<{ success: boolean; message: string; holiday: Holiday }> {
    return this.http.post<{ success: boolean; message: string; holiday: Holiday }>(this.apiUrl, holidayData);
  }

  updateHoliday(id: string, holidayData: Partial<Holiday>): Observable<{ success: boolean; message: string; holiday: Holiday }> {
    return this.http.put<{ success: boolean; message: string; holiday: Holiday }>(`${this.apiUrl}/${id}`, holidayData);
  }

  deleteHoliday(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }
}
