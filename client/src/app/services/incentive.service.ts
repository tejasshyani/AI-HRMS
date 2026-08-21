import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { IncentiveRecord } from '../models';

@Injectable({
  providedIn: 'root'
})
export class IncentiveService {
  private apiUrl = `${environment.apiUrl}/incentives`;

  constructor(private http: HttpClient) {}

  // Calculate local tier preview helper
  calculateLocalTier(loanAmount: number) {
    const amount = Math.max(0, Number(loanAmount) || 0);
    let slabPercentage = 0;
    let slabName = 'No Tier (≤ 10 Lakhs)';

    if (amount > 5000000) {
      slabPercentage = 0.50;
      slabName = '> 50 Lakhs (0.50%)';
    } else if (amount > 4000000) {
      slabPercentage = 0.40;
      slabName = '> 40 Lakhs (0.40%)';
    } else if (amount > 3000000) {
      slabPercentage = 0.30;
      slabName = '> 30 Lakhs (0.30%)';
    } else if (amount > 2000000) {
      slabPercentage = 0.20;
      slabName = '> 20 Lakhs (0.20%)';
    } else if (amount > 1000000) {
      slabPercentage = 0.10;
      slabName = '> 10 Lakhs (0.10%)';
    }

    const incentiveAmount = Math.round((amount * slabPercentage) / 100);

    return {
      loanAmount: amount,
      slabPercentage,
      slabName,
      incentiveAmount
    };
  }

  // Submit loan disbursement
  submitIncentive(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  // Get logged-in employee incentives
  getMyIncentives(month?: any, year?: any): Observable<{
    success: boolean;
    totalLoanAmount: number;
    totalIncentive: number;
    count: number;
    monthlySlab: any;
    records: IncentiveRecord[];
  }> {
    let params = new HttpParams();
    if (month) params = params.set('month', month.toString());
    if (year) params = params.set('year', year.toString());
    return this.http.get<any>(`${this.apiUrl}/my-incentives`, { params });
  }

  // Get all company-wide incentives (Admin)
  getAllIncentives(paramsObj?: { employeeId?: string; month?: any; year?: any }): Observable<{
    success: boolean;
    totalLoanAmount: number;
    totalIncentive: number;
    count: number;
    records: IncentiveRecord[];
  }> {
    let params = new HttpParams();
    if (paramsObj?.employeeId && paramsObj.employeeId !== 'All') {
      params = params.set('employeeId', paramsObj.employeeId);
    }
    if (paramsObj?.month && paramsObj.month !== 'All') {
      params = params.set('month', paramsObj.month.toString());
    }
    if (paramsObj?.year && paramsObj.year !== 'All') {
      params = params.set('year', paramsObj.year.toString());
    }
    return this.http.get<any>(`${this.apiUrl}/all`, { params });
  }

  // Update loan disbursement record (Admin)
  updateIncentive(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  // Delete incentive record
  deleteIncentive(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  // Preview API
  calculatePreview(loanAmount: number): Observable<any> {
    const params = new HttpParams().set('loanAmount', loanAmount.toString());
    return this.http.get<any>(`${this.apiUrl}/preview`, { params });
  }
}
