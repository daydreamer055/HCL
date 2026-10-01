import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreateSalesOrderRequest,
  PageResponse,
  SalesOrder,
  UpdateSalesOrderStatusRequest,
} from '../../models/api.models';
import { ApiService } from './api.service';

export interface SalesOrderQuery {
  orderNumber: string;
  locationId: string;
  status: string;
  page: number;
  size: number;
  sort: string;
  direction: 'asc' | 'desc';
}

@Injectable({ providedIn: 'root' })
export class SalesOrderService {
  private readonly api = inject(ApiService);

  findAll(query: SalesOrderQuery): Observable<PageResponse<SalesOrder>> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('size', query.size)
      .set('sort', `${query.sort},${query.direction}`);
    if (query.orderNumber.trim()) params = params.set('orderNumber', query.orderNumber.trim());
    if (query.locationId) params = params.set('locationId', query.locationId);
    if (query.status) params = params.set('status', query.status);
    return this.api.get<PageResponse<SalesOrder>>('sales-orders', params);
  }

  findById(id: number): Observable<SalesOrder> {
    return this.api.get<SalesOrder>(`sales-orders/${id}`);
  }

  create(request: CreateSalesOrderRequest): Observable<SalesOrder> {
    return this.api.post<SalesOrder, CreateSalesOrderRequest>('sales-orders', request);
  }

  updateStatus(id: number, request: UpdateSalesOrderStatusRequest): Observable<SalesOrder> {
    return this.api.patch<SalesOrder, UpdateSalesOrderStatusRequest>(`sales-orders/${id}/status`, request);
  }

  cancel(id: number): Observable<SalesOrder> {
    return this.api.post<SalesOrder, Record<string, never>>(`sales-orders/${id}/cancel`, {});
  }

  complete(id: number): Observable<SalesOrder> {
    return this.api.post<SalesOrder, Record<string, never>>(`sales-orders/${id}/complete`, {});
  }
}
