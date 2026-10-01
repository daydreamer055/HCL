import { HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import {
  DashboardDateTotal,
  DashboardResponse,
  DashboardSummary,
  InventoryByCategory,
  InventoryByLocation,
  InventoryTransactionResponse,
  LowStockProduct,
  PageResponse,
} from '../../models/api.models';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = inject(ApiService);

  readonly data = signal<DashboardResponse | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    const firstPage = new HttpParams().set('page', 0).set('size', 8);

    forkJoin({
      summary: this.api.get<DashboardSummary>('dashboard/summary'),
      inventoryByCategory: this.api.get<InventoryByCategory[]>('dashboard/inventory-by-category'),
      inventoryByLocation: this.api.get<InventoryByLocation[]>('dashboard/inventory-by-location'),
      salesSummary: this.api.get<DashboardDateTotal[]>('dashboard/sales-summary'),
      purchaseSummary: this.api.get<DashboardDateTotal[]>('dashboard/purchase-summary'),
      recentTransactions: this.api.get<PageResponse<InventoryTransactionResponse>>(
        'dashboard/recent-transactions',
        firstPage,
      ),
      lowStock: this.api.get<PageResponse<LowStockProduct>>('dashboard/low-stock', firstPage),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (dashboard) => this.data.set(dashboard),
        error: (error: unknown) => {
          this.error.set(this.getErrorMessage(error));
        },
      });
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'The dashboard could not reach the server. Check that the StockSmart API is running.';
      }
      if (typeof error.error?.message === 'string' && error.error.message.trim()) {
        return error.error.message;
      }
      return `The dashboard could not be loaded (HTTP ${error.status}). Please try again.`;
    }
    return 'The dashboard could not be loaded. Please try again.';
  }
}
