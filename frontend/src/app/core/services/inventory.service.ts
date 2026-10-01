import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  InventoryResponse,
  InventoryTransactionResponse,
  LocationResponse,
  PageResponse,
  Product,
} from '../../models/api.models';
import { ApiService } from './api.service';

export interface InventoryQuery {
  search: string;
  locationId: string;
  lowStock: boolean;
  outOfStock: boolean;
  page: number;
  size: number;
  sort: string;
  direction: 'asc' | 'desc';
}

export interface InventoryTransactionQuery {
  productId?: number;
  locationId?: number;
  page: number;
  size: number;
  direction: 'asc' | 'desc';
}

export interface StockAdjustmentRequest {
  productId: number;
  locationId: number;
  quantityDelta: number;
  notes: string | null;
}

export interface StockTransferRequest {
  productId: number;
  sourceLocationId: number;
  destinationLocationId: number;
  quantity: number;
  notes: string | null;
}

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly api = inject(ApiService);

  findAll(query: InventoryQuery): Observable<PageResponse<InventoryResponse>> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('size', query.size)
      .set('sort', `${query.sort},${query.direction}`)
      .set('lowStock', query.lowStock)
      .set('outOfStock', query.outOfStock);
    if (query.search.trim()) params = params.set('search', query.search.trim());
    if (query.locationId) params = params.set('locationId', query.locationId);
    return this.api.get<PageResponse<InventoryResponse>>('inventory', params);
  }

  findByProduct(productId: number, page = 0, size = 20): Observable<PageResponse<InventoryResponse>> {
    return this.api.get<PageResponse<InventoryResponse>>(
      `inventory/product/${productId}`,
      new HttpParams().set('page', page).set('size', size).set('sort', 'location.name,asc'),
    );
  }

  findByLocation(locationId: number, page = 0, size = 20): Observable<PageResponse<InventoryResponse>> {
    return this.api.get<PageResponse<InventoryResponse>>(
      `inventory/location/${locationId}`,
      new HttpParams().set('page', page).set('size', size).set('sort', 'product.name,asc'),
    );
  }

  findLowStock(page = 0, size = 20): Observable<PageResponse<InventoryResponse>> {
    return this.api.get<PageResponse<InventoryResponse>>(
      'inventory/low-stock',
      new HttpParams().set('page', page).set('size', size),
    );
  }

  findOutOfStock(page = 0, size = 20): Observable<PageResponse<InventoryResponse>> {
    return this.api.get<PageResponse<InventoryResponse>>(
      'inventory/out-of-stock',
      new HttpParams().set('page', page).set('size', size),
    );
  }

  findTransactions(query: InventoryTransactionQuery): Observable<PageResponse<InventoryTransactionResponse>> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('size', query.size)
      .set('sort', `transactionAt,${query.direction}`);
    if (query.productId !== undefined) params = params.set('productId', query.productId);
    if (query.locationId !== undefined) params = params.set('locationId', query.locationId);
    return this.api.get<PageResponse<InventoryTransactionResponse>>('inventory/transactions', params);
  }

  adjust(request: StockAdjustmentRequest): Observable<InventoryResponse> {
    return this.api.post<InventoryResponse, StockAdjustmentRequest>('inventory/adjustments', request);
  }

  transfer(request: StockTransferRequest): Observable<void> {
    return this.api.post<void, StockTransferRequest>('inventory/transfers', request);
  }

  findProducts(): Observable<PageResponse<Product>> {
    const params = new HttpParams().set('page', 0).set('size', 1000).set('sort', 'name,asc');
    return this.api.get<PageResponse<Product>>('products', params);
  }

  findLocations(): Observable<PageResponse<LocationResponse>> {
    const params = new HttpParams().set('page', 0).set('size', 1000).set('sort', 'name,asc');
    return this.api.get<PageResponse<LocationResponse>>('locations', params);
  }
}
