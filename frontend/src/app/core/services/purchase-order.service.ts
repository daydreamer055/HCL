import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreatePurchaseOrderRequest,
  PageResponse,
  PurchaseOrder,
  UpdatePurchaseOrderStatusRequest,
} from '../../models/api.models';
import { ApiService } from './api.service';

export interface PurchaseOrderQuery {
  orderNumber: string;
  supplierId: string;
  locationId: string;
  status: string;
  page: number;
  size: number;
  sort: string;
  direction: 'asc' | 'desc';
}

@Injectable({ providedIn: 'root' })
export class PurchaseOrderService {
  private readonly api = inject(ApiService);

  findAll(query: PurchaseOrderQuery): Observable<PageResponse<PurchaseOrder>> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('size', query.size)
      .set('sort', `${query.sort},${query.direction}`);
    if (query.orderNumber.trim()) params = params.set('orderNumber', query.orderNumber.trim());
    if (query.supplierId) params = params.set('supplierId', query.supplierId);
    if (query.locationId) params = params.set('locationId', query.locationId);
    if (query.status) params = params.set('status', query.status);
    return this.api.get<PageResponse<PurchaseOrder>>('purchase-orders', params);
  }

  findById(id: number): Observable<PurchaseOrder> {
    return this.api.get<PurchaseOrder>(`purchase-orders/${id}`);
  }

  create(request: CreatePurchaseOrderRequest): Observable<PurchaseOrder> {
    return this.api.post<PurchaseOrder, CreatePurchaseOrderRequest>('purchase-orders', request);
  }

  updateStatus(id: number, request: UpdatePurchaseOrderStatusRequest): Observable<PurchaseOrder> {
    return this.api.patch<PurchaseOrder, UpdatePurchaseOrderStatusRequest>(`purchase-orders/${id}/status`, request);
  }

  cancel(id: number): Observable<PurchaseOrder> {
    return this.api.post<PurchaseOrder, Record<string, never>>(`purchase-orders/${id}/cancel`, {});
  }

  receive(id: number): Observable<PurchaseOrder> {
    return this.api.post<PurchaseOrder, Record<string, never>>(`purchase-orders/${id}/receive`, {});
  }
}
