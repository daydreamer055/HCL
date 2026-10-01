import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { InventoryTransactionResponse } from '../../models/api.models';
import {
  InventoryReportRow,
  InventoryValuationReportRow,
  PagedInventoryReport,
  PagedInventoryValuationReport,
  PagedStockMovementReport,
  PurchaseReportRow,
  ReportFilters,
  SalesReportRow,
  SupplierReportRow,
} from '../../models/report.models';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly api = inject(ApiService);

  inventory(filters: ReportFilters, page: number, size: number): Observable<PagedInventoryReport> {
    return this.api.get<PagedInventoryReport>(
      'reports/inventory',
      this.params(filters).set('page', page).set('size', size).set('sort', 'product.name,asc'),
    );
  }

  lowStock(filters: ReportFilters, page: number, size: number): Observable<PagedInventoryReport> {
    return this.api.get<PagedInventoryReport>(
      'reports/low-stock',
      this.params(filters).set('page', page).set('size', size).set('sort', 'product.name,asc'),
    );
  }

  outOfStock(filters: ReportFilters, page: number, size: number): Observable<PagedInventoryReport> {
    return this.api.get<PagedInventoryReport>(
      'reports/out-of-stock',
      this.params(filters).set('page', page).set('size', size).set('sort', 'product.name,asc'),
    );
  }

  sales(filters: ReportFilters): Observable<SalesReportRow[]> {
    return this.api.get<SalesReportRow[]>('reports/sales', this.params(filters, true));
  }

  purchases(filters: ReportFilters): Observable<PurchaseReportRow[]> {
    return this.api.get<PurchaseReportRow[]>('reports/purchases', this.params(filters, true));
  }

  suppliers(filters: ReportFilters): Observable<SupplierReportRow[]> {
    return this.api.get<SupplierReportRow[]>('reports/suppliers', this.params(filters, true));
  }

  stockMovements(
    filters: ReportFilters,
    page: number,
    size: number,
  ): Observable<PagedStockMovementReport> {
    return this.api.get<PagedStockMovementReport>(
      'reports/stock-movements',
      this.params(filters, true).set('page', page).set('size', size).set('sort', 'transactionAt,desc'),
    );
  }

  inventoryValuation(
    filters: ReportFilters,
    page: number,
    size: number,
  ): Observable<PagedInventoryValuationReport> {
    return this.api.get<PagedInventoryValuationReport>(
      'reports/inventory-valuation',
      this.params(filters, false, false).set('page', page).set('size', size).set('sort', 'product.name,asc'),
    );
  }

  private params(filters: ReportFilters, includeDates = false, includeSupplier = true): HttpParams {
    let params = new HttpParams();
    if (includeDates && filters.startDate) params = params.set('startDate', filters.startDate);
    if (includeDates && filters.endDate) params = params.set('endDate', filters.endDate);
    if (filters.productId) params = params.set('productId', filters.productId);
    if (filters.categoryId) params = params.set('categoryId', filters.categoryId);
    if (includeSupplier && filters.supplierId) params = params.set('supplierId', filters.supplierId);
    if (filters.locationId) params = params.set('locationId', filters.locationId);
    return params;
  }
}
