import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PageResponse, Supplier, SupplierRequest } from '../../models/api.models';
import { ApiService } from './api.service';

export interface SupplierQuery {
  name: string;
  supplierCode: string;
  status: string;
  page: number;
  size: number;
  sort: string;
  direction: 'asc' | 'desc';
}

@Injectable({ providedIn: 'root' })
export class SupplierService {
  private readonly api = inject(ApiService);

  findAll(query: SupplierQuery): Observable<PageResponse<Supplier>> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('size', query.size)
      .set('sort', `${query.sort},${query.direction}`);
    if (query.name.trim()) params = params.set('name', query.name.trim());
    if (query.supplierCode.trim()) params = params.set('supplierCode', query.supplierCode.trim());
    if (query.status) params = params.set('status', query.status);
    return this.api.get<PageResponse<Supplier>>('suppliers', params);
  }

  findById(id: number): Observable<Supplier> {
    return this.api.get<Supplier>(`suppliers/${id}`);
  }

  create(request: SupplierRequest): Observable<Supplier> {
    return this.api.post<Supplier, SupplierRequest>('suppliers', request);
  }

  update(id: number, request: SupplierRequest): Observable<Supplier> {
    return this.api.put<Supplier, SupplierRequest>(`suppliers/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`suppliers/${id}`);
  }
}
