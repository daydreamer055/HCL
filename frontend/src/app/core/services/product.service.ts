import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  PageResponse,
  Product,
  ProductRequest,
  SupplierResponse,
} from '../../models/api.models';
import { ApiService } from './api.service';

export interface ProductQuery {
  name: string;
  sku: string;
  categoryId: string;
  status: string;
  page: number;
  size: number;
  sort: string;
  direction: 'asc' | 'desc';
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly api = inject(ApiService);

  findAll(query: ProductQuery): Observable<PageResponse<Product>> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('size', query.size)
      .set('sort', `${query.sort},${query.direction}`);
    if (query.name.trim()) params = params.set('name', query.name.trim());
    if (query.sku.trim()) params = params.set('sku', query.sku.trim());
    if (query.categoryId.trim()) params = params.set('categoryId', query.categoryId.trim());
    if (query.status) params = params.set('status', query.status);
    return this.api.get<PageResponse<Product>>('products', params);
  }

  findById(id: number): Observable<Product> {
    return this.api.get<Product>(`products/${id}`);
  }

  findSuppliers(): Observable<PageResponse<SupplierResponse>> {
    const params = new HttpParams().set('page', 0).set('size', 100).set('sort', 'companyName,asc');
    return this.api.get<PageResponse<SupplierResponse>>('suppliers', params);
  }

  create(request: ProductRequest): Observable<Product> {
    return this.api.post<Product, ProductRequest>('products', request);
  }

  update(id: number, request: ProductRequest): Observable<Product> {
    return this.api.put<Product, ProductRequest>(`products/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`products/${id}`);
  }
}
