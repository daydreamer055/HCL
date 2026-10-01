import { CurrencyPipe, DecimalPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { EMPTY, Observable, expand, forkJoin, reduce } from 'rxjs';
import { LocationService } from '../../core/services/location.service';
import { ProductService } from '../../core/services/product.service';
import { ReportsService } from '../../core/services/reports.service';
import { SupplierService } from '../../core/services/supplier.service';
import {
  InventoryTransactionResponse,
  Location,
  PageResponse,
  Product,
  Supplier,
} from '../../models/api.models';
import {
  InventoryReportRow,
  InventoryValuationReportRow,
  PurchaseReportRow,
  ReportFilters,
  ReportKey,
  SalesReportRow,
  SupplierReportRow,
} from '../../models/report.models';

type FilterForm = {
  startDate: FormControl<string>;
  endDate: FormControl<string>;
  productId: FormControl<string>;
  categoryId: FormControl<string>;
  supplierId: FormControl<string>;
  locationId: FormControl<string>;
};

interface ReportOption {
  key: ReportKey;
  label: string;
  icon: string;
  description: string;
}

interface ReportMetric {
  label: string;
  value: number;
  format: 'currency' | 'number';
  note: string;
}

interface CategoryOption {
  id: number;
  name: string;
}

@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe, DecimalPipe, DatePipe],
  template: `
    <section class="page-heading">
      <div>
        <p class="eyebrow">STOCKSMART / INSIGHTS</p>
        <h1>Reports</h1>
        <p class="description">Explore inventory, sales, purchasing, and stock movement data.</p>
      </div>
    </section>

    <nav class="report-tabs" aria-label="Report type">
      @for (option of reportOptions; track option.key) {
        <button
          class="report-tab"
          type="button"
          [class.active]="activeReport() === option.key"
          [attr.aria-pressed]="activeReport() === option.key"
          (click)="selectReport(option.key)"
        >
          <span class="tab-icon" aria-hidden="true">{{ option.icon }}</span>
          <span>{{ option.label }}</span>
        </button>
      }
    </nav>

    <section class="report-panel">
      <header class="panel-header">
        <div>
          <h2>{{ activeOption().label }}</h2>
          <p>{{ activeOption().description }}</p>
        </div>
        @if (loading()) {
          <span class="loading-label"><i class="spinner"></i> Updating report</span>
        }
      </header>

      <form class="filters" [formGroup]="filters" (ngSubmit)="applyFilters()">
        @if (supportsDates()) {
          <label class="filter-control date-filter">
            <span>Start date</span>
            <input type="date" formControlName="startDate">
          </label>
          <label class="filter-control date-filter">
            <span>End date</span>
            <input type="date" formControlName="endDate">
          </label>
        }
        <label class="filter-control">
          <span>Product</span>
          <select formControlName="productId">
            <option value="">All products</option>
            @for (product of products(); track product.id) {
              <option [value]="product.id">{{ product.sku }} · {{ product.name }}</option>
            }
          </select>
        </label>
        <label class="filter-control">
          <span>Category</span>
          <select formControlName="categoryId">
            <option value="">All categories</option>
            @for (category of categories(); track category.id) {
              <option [value]="category.id">{{ category.name }}</option>
            }
          </select>
        </label>
        @if (supportsSupplier()) {
          <label class="filter-control">
            <span>Supplier</span>
            <select formControlName="supplierId">
              <option value="">All suppliers</option>
              @for (supplier of suppliers(); track supplier.id) {
                <option [value]="supplier.id">{{ supplier.name }}</option>
              }
            </select>
          </label>
        }
        <label class="filter-control">
          <span>Location</span>
          <select formControlName="locationId">
            <option value="">All locations</option>
            @for (location of locations(); track location.id) {
              <option [value]="location.id">{{ location.name }}</option>
            }
          </select>
        </label>
        <button class="primary-button apply-button" type="submit" [disabled]="loading()">Apply filters</button>
        <button class="clear-button" type="button" (click)="resetFilters()" [disabled]="loading()">Reset</button>
      </form>

      @if (loadingOptions()) {
        <div class="options-warning" role="status"><i class="spinner"></i> Loading filter options…</div>
      }
      @if (optionsError(); as message) {
        <div class="options-warning" role="status">
          <span>{{ message }}</span>
          <button type="button" (click)="loadOptions()">Retry filter lists</button>
        </div>
      }
      @if (dateError(); as message) {
        <p class="filter-error" role="alert">{{ message }}</p>
      }

      @if (error(); as message) {
        <div class="page-error" role="alert">
          <span class="error-icon" aria-hidden="true">!</span>
          <div><strong>Could not load {{ activeOption().label.toLowerCase() }}</strong><p>{{ message }}</p></div>
          <button class="secondary-button" type="button" (click)="loadReport()">Retry</button>
        </div>
      } @else if (loading() && !hasLoaded()) {
        <div class="loading-state" role="status" aria-live="polite">
          <i class="spinner large"></i><strong>Building your report</strong>
          <span>Loading the latest data from StockSmart…</span>
        </div>
      } @else if (!loading() && hasLoaded() && isEmpty()) {
        <div class="empty-state">
          <div class="empty-icon" aria-hidden="true">▤</div>
          @if (hasFilters()) {
            <h3>No matching records</h3>
            <p>Try adjusting your report filters or reset them to see all available data.</p>
            <button class="secondary-button" type="button" (click)="resetFilters()">Reset filters</button>
          } @else {
            <h3>No report data yet</h3>
            <p>There is no data available for this report.</p>
          }
        </div>
      } @else if (hasLoaded() && !error()) {
        <div class="metrics-grid">
          @for (metric of metrics(); track metric.label) {
            <article class="metric-card">
              <span class="metric-label">{{ metric.label }}</span>
              <strong>
                @if (metric.format === 'currency') {
                  {{ metric.value | currency }}
                } @else {
                  {{ metric.value | number:'1.0-2' }}
                }
              </strong>
              <small>{{ metric.note }}</small>
            </article>
          }
        </div>

        @if (activeReport() === 'sales' && salesRows().length) {
          <section class="chart-card" aria-label="Sales trend chart">
            <div class="chart-heading"><div><h3>Sales trend</h3><p>Daily sales amount</p></div><span class="chart-key"><i></i> Sales</span></div>
            <div class="bar-chart">
              @for (row of salesRows(); track row.date) {
                <div class="bar-row">
                  <time>{{ row.date | date:'MMM d, y' }}</time>
                  <div class="bar-track"><span class="sales-bar" [style.width.%]="barWidth(row.totalAmount, salesRows())"></span></div>
                  <strong>{{ row.totalAmount | currency }}</strong>
                </div>
              }
            </div>
          </section>
        }
        @if (activeReport() === 'purchases' && purchaseRows().length) {
          <section class="chart-card" aria-label="Purchase trend chart">
            <div class="chart-heading"><div><h3>Purchase trend</h3><p>Daily purchasing amount</p></div><span class="chart-key purchase-key"><i></i> Purchases</span></div>
            <div class="bar-chart">
              @for (row of purchaseRows(); track row.date) {
                <div class="bar-row">
                  <time>{{ row.date | date:'MMM d, y' }}</time>
                  <div class="bar-track"><span class="purchase-bar" [style.width.%]="barWidth(row.totalAmount, purchaseRows())"></span></div>
                  <strong>{{ row.totalAmount | currency }}</strong>
                </div>
              }
            </div>
          </section>
        }

        <section class="table-card">
          <header class="table-heading">
            <div><h3>{{ activeOption().label }} details</h3><p>{{ resultDescription() }}</p></div>
            @if (isPagedReport()) {
              <span class="row-count">{{ totalElements() | number }} records</span>
            }
          </header>

          @switch (activeReport()) {
            @case ('inventory') {
              <div class="table-scroll"><table>
                <thead><tr><th>SKU</th><th>Product</th><th>Category</th><th>Supplier</th><th>Location</th><th>On hand</th><th>Reserved</th><th>Available</th><th>Reorder level</th><th>Inventory value</th></tr></thead>
                <tbody>@for (row of inventoryRows(); track row.inventoryId) {
                  <tr><td><span class="sku">{{ row.sku }}</span></td><td class="product-cell"><strong>{{ row.productName }}</strong></td><td>{{ row.categoryName }}</td><td>{{ row.supplierName || '—' }}</td><td>{{ row.locationName }}</td><td>{{ row.quantity | number:'1.0-2' }}</td><td>{{ row.reservedQuantity | number:'1.0-2' }}</td><td class="strong-value">{{ row.availableQuantity | number:'1.0-2' }}</td><td>{{ row.reorderLevel | number:'1.0-2' }}</td><td class="money">{{ row.inventoryValue | currency }}</td></tr>
                }</tbody>
              </table></div>
            }
            @case ('low-stock') {
              <div class="table-scroll"><table>
                <thead><tr><th>SKU</th><th>Product</th><th>Category</th><th>Supplier</th><th>Location</th><th>On hand</th><th>Reserved</th><th>Available</th><th>Reorder level</th><th>Inventory value</th></tr></thead>
                <tbody>@for (row of inventoryRows(); track row.inventoryId) {
                  <tr><td><span class="sku">{{ row.sku }}</span></td><td class="product-cell"><strong>{{ row.productName }}</strong></td><td>{{ row.categoryName }}</td><td>{{ row.supplierName || '—' }}</td><td>{{ row.locationName }}</td><td>{{ row.quantity | number:'1.0-2' }}</td><td>{{ row.reservedQuantity | number:'1.0-2' }}</td><td class="low-value">{{ row.availableQuantity | number:'1.0-2' }}</td><td>{{ row.reorderLevel | number:'1.0-2' }}</td><td class="money">{{ row.inventoryValue | currency }}</td></tr>
                }</tbody>
              </table></div>
            }
            @case ('out-of-stock') {
              <div class="table-scroll"><table>
                <thead><tr><th>SKU</th><th>Product</th><th>Category</th><th>Supplier</th><th>Location</th><th>On hand</th><th>Reserved</th><th>Available</th><th>Reorder level</th><th>Inventory value</th></tr></thead>
                <tbody>@for (row of inventoryRows(); track row.inventoryId) {
                  <tr><td><span class="sku">{{ row.sku }}</span></td><td class="product-cell"><strong>{{ row.productName }}</strong></td><td>{{ row.categoryName }}</td><td>{{ row.supplierName || '—' }}</td><td>{{ row.locationName }}</td><td>{{ row.quantity | number:'1.0-2' }}</td><td>{{ row.reservedQuantity | number:'1.0-2' }}</td><td class="out-value">{{ row.availableQuantity | number:'1.0-2' }}</td><td>{{ row.reorderLevel | number:'1.0-2' }}</td><td class="money">{{ row.inventoryValue | currency }}</td></tr>
                }</tbody>
              </table></div>
            }
            @case ('sales') {
              <div class="table-scroll"><table>
                <thead><tr><th>Date</th><th>Orders</th><th>Items sold</th><th>Sales amount</th></tr></thead>
                <tbody>@for (row of salesRows(); track row.date) {
                  <tr><td>{{ row.date | date:'MMM d, y' }}</td><td>{{ row.orderCount | number }}</td><td>{{ row.itemQuantity | number:'1.0-2' }}</td><td class="money">{{ row.totalAmount | currency }}</td></tr>
                }</tbody>
              </table></div>
            }
            @case ('purchases') {
              <div class="table-scroll"><table>
                <thead><tr><th>Date</th><th>Orders</th><th>Items purchased</th><th>Purchase amount</th></tr></thead>
                <tbody>@for (row of purchaseRows(); track row.date) {
                  <tr><td>{{ row.date | date:'MMM d, y' }}</td><td>{{ row.orderCount | number }}</td><td>{{ row.itemQuantity | number:'1.0-2' }}</td><td class="money">{{ row.totalAmount | currency }}</td></tr>
                }</tbody>
              </table></div>
            }
            @case ('suppliers') {
              <div class="table-scroll"><table>
                <thead><tr><th>Supplier code</th><th>Supplier</th><th>Email</th><th>Phone</th><th>Purchase orders</th><th>Purchase amount</th></tr></thead>
                <tbody>@for (row of supplierRows(); track row.supplierId) {
                  <tr><td><span class="sku">{{ row.supplierCode }}</span></td><td class="product-cell"><strong>{{ row.supplierName }}</strong></td><td>{{ row.email || '—' }}</td><td>{{ row.phone || '—' }}</td><td>{{ row.purchaseOrderCount | number }}</td><td class="money">{{ row.purchaseAmount | currency }}</td></tr>
                }</tbody>
              </table></div>
            }
            @case ('stock-movements') {
              <div class="table-scroll"><table>
                <thead><tr><th>Date &amp; time</th><th>Type</th><th>SKU</th><th>Product</th><th>Location</th><th>Destination</th><th>Quantity</th><th>Notes</th></tr></thead>
                <tbody>@for (row of movementRows(); track row.id) {
                  <tr><td>{{ row.transactionAt | date:'MMM d, y, h:mm a' }}</td><td><span class="movement-type">{{ movementLabel(row.type) }}</span></td><td><span class="sku">{{ row.sku }}</span></td><td class="product-cell"><strong>{{ row.productName }}</strong></td><td>{{ row.locationName }}</td><td>{{ row.destinationLocationName || '—' }}</td><td class="strong-value">{{ row.quantity | number:'1.0-2' }}</td><td class="notes-cell">{{ row.notes || '—' }}</td></tr>
                }</tbody>
              </table></div>
            }
            @case ('inventory-valuation') {
              <div class="table-scroll"><table>
                <thead><tr><th>SKU</th><th>Product</th><th>Category</th><th>Location</th><th>Quantity</th><th>Unit cost</th><th>Total value</th></tr></thead>
                <tbody>@for (row of valuationRows(); track $index) {
                  <tr><td><span class="sku">{{ row.sku }}</span></td><td class="product-cell"><strong>{{ row.productName }}</strong></td><td>{{ row.categoryName }}</td><td>{{ row.locationName }}</td><td>{{ row.quantity | number:'1.0-2' }}</td><td>{{ row.unitCost | currency }}</td><td class="money">{{ row.totalValue | currency }}</td></tr>
                }</tbody>
              </table></div>
            }
          }

          @if (isPagedReport()) {
            <footer class="pagination">
              <span>Showing <strong>{{ firstItem() | number }}–{{ lastItem() | number }}</strong> of <strong>{{ totalElements() | number }}</strong></span>
              <div class="pagination-controls">
                <label>Rows
                  <select [value]="pageSize()" (change)="changePageSize($event)">
                    <option value="10">10</option><option value="20">20</option><option value="50">50</option>
                  </select>
                </label>
                <button type="button" (click)="goToPage(page() - 1)" [disabled]="page() === 0" aria-label="Previous page">‹</button>
                <span>Page {{ page() + 1 }} of {{ totalPages() || 1 }}</span>
                <button type="button" (click)="goToPage(page() + 1)" [disabled]="page() + 1 >= totalPages()" aria-label="Next page">›</button>
              </div>
            </footer>
          }
        </section>
      }
    </section>
  `,
  styleUrl: './reports-page.component.css',
})
export class ReportsPageComponent implements OnInit {
  private readonly reportsService = inject(ReportsService);
  private readonly productService = inject(ProductService);
  private readonly supplierService = inject(SupplierService);
  private readonly locationService = inject(LocationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly reportOptions: ReportOption[] = [
    { key: 'inventory', label: 'Inventory', icon: '▦', description: 'On-hand stock, availability, and inventory value by location.' },
    { key: 'low-stock', label: 'Low stock', icon: '⌁', description: 'Products at or below their configured reorder level.' },
    { key: 'out-of-stock', label: 'Out of stock', icon: '◌', description: 'Products with no available quantity.' },
    { key: 'sales', label: 'Sales', icon: '↗', description: 'Daily sales orders, item quantities, and sales amounts.' },
    { key: 'purchases', label: 'Purchases', icon: '↙', description: 'Daily purchase orders, received item quantities, and amounts.' },
    { key: 'suppliers', label: 'Suppliers', icon: '♧', description: 'Supplier purchase order counts and purchase amounts.' },
    { key: 'stock-movements', label: 'Stock movements', icon: '⇄', description: 'A chronological history of inventory transactions.' },
    { key: 'inventory-valuation', label: 'Valuation', icon: '＄', description: 'Current stock quantities and backend-calculated inventory values.' },
  ];

  protected readonly activeReport = signal<ReportKey>('inventory');
  protected readonly products = signal<Product[]>([]);
  protected readonly suppliers = signal<Supplier[]>([]);
  protected readonly locations = signal<Location[]>([]);
  protected readonly categories = signal<CategoryOption[]>([]);
  protected readonly inventoryRows = signal<InventoryReportRow[]>([]);
  protected readonly salesRows = signal<SalesReportRow[]>([]);
  protected readonly purchaseRows = signal<PurchaseReportRow[]>([]);
  protected readonly supplierRows = signal<SupplierReportRow[]>([]);
  protected readonly movementRows = signal<InventoryTransactionResponse[]>([]);
  protected readonly valuationRows = signal<InventoryValuationReportRow[]>([]);
  protected readonly loading = signal(false);
  protected readonly hasLoaded = signal(false);
  protected readonly loadingOptions = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly optionsError = signal<string | null>(null);
  protected readonly dateError = signal<string | null>(null);
  protected readonly totalElements = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly page = signal(0);
  protected readonly pageSize = signal(20);

  protected readonly filters = new FormGroup<FilterForm>({
    startDate: new FormControl('', { nonNullable: true }),
    endDate: new FormControl('', { nonNullable: true }),
    productId: new FormControl('', { nonNullable: true }),
    categoryId: new FormControl('', { nonNullable: true }),
    supplierId: new FormControl('', { nonNullable: true }),
    locationId: new FormControl('', { nonNullable: true }),
  });

  ngOnInit(): void {
    this.loadOptions();
    this.loadReport();
  }

  protected activeOption(): ReportOption {
    return this.reportOptions.find((option) => option.key === this.activeReport()) ?? this.reportOptions[0];
  }

  protected selectReport(report: ReportKey): void {
    if (report === this.activeReport()) return;
    this.activeReport.set(report);
    this.page.set(0);
    this.dateError.set(null);
    this.loadReport();
  }

  protected supportsDates(): boolean {
    return ['sales', 'purchases', 'suppliers', 'stock-movements'].includes(this.activeReport());
  }

  protected supportsSupplier(): boolean {
    return this.activeReport() !== 'inventory-valuation';
  }

  protected isPagedReport(): boolean {
    return ['inventory', 'low-stock', 'out-of-stock', 'stock-movements', 'inventory-valuation'].includes(this.activeReport());
  }

  protected applyFilters(): void {
    this.dateError.set(null);
    const { startDate, endDate } = this.filters.getRawValue();
    if (this.supportsDates() && startDate && endDate && endDate < startDate) {
      this.dateError.set('End date must be on or after the start date.');
      return;
    }
    this.page.set(0);
    this.loadReport();
  }

  protected resetFilters(): void {
    this.filters.reset({
      startDate: '',
      endDate: '',
      productId: '',
      categoryId: '',
      supplierId: '',
      locationId: '',
    });
    this.dateError.set(null);
    this.page.set(0);
    this.loadReport();
  }

  protected loadReport(): void {
    const filters = this.filters.getRawValue();
    const report = this.activeReport();
    this.loading.set(true);
    this.hasLoaded.set(false);
    this.error.set(null);
    this.totalElements.set(0);
    this.totalPages.set(0);

    switch (report) {
      case 'inventory':
        this.request(this.reportsService.inventory(filters, this.page(), this.pageSize()), (response) => {
          this.inventoryRows.set(response.content);
          this.setPage(response);
        });
        break;
      case 'low-stock':
        this.request(this.reportsService.lowStock(filters, this.page(), this.pageSize()), (response) => {
          this.inventoryRows.set(response.content);
          this.setPage(response);
        });
        break;
      case 'out-of-stock':
        this.request(this.reportsService.outOfStock(filters, this.page(), this.pageSize()), (response) => {
          this.inventoryRows.set(response.content);
          this.setPage(response);
        });
        break;
      case 'sales':
        this.request(this.reportsService.sales(filters), (response) => {
          this.salesRows.set(response);
          this.setListCount(response.length);
        });
        break;
      case 'purchases':
        this.request(this.reportsService.purchases(filters), (response) => {
          this.purchaseRows.set(response);
          this.setListCount(response.length);
        });
        break;
      case 'suppliers':
        this.request(this.reportsService.suppliers(filters), (response) => {
          this.supplierRows.set(response);
          this.setListCount(response.length);
        });
        break;
      case 'stock-movements':
        this.request(this.reportsService.stockMovements(filters, this.page(), this.pageSize()), (response) => {
          this.movementRows.set(response.content);
          this.setPage(response);
        });
        break;
      case 'inventory-valuation':
        this.request(this.reportsService.inventoryValuation(filters, this.page(), this.pageSize()), (response) => {
          this.valuationRows.set(response.content);
          this.setPage(response);
        });
        break;
    }
  }

  protected metrics(): ReportMetric[] {
    const sum = <T>(rows: T[], value: (row: T) => number): number =>
      rows.reduce((total, row) => total + value(row), 0);
    const pageNote = 'on this page';
    switch (this.activeReport()) {
      case 'inventory':
        return [
          this.metric('Inventory records', this.totalElements(), 'number', 'matching all filters'),
          this.metric('Available units', sum(this.inventoryRows(), (row) => row.availableQuantity), 'number', pageNote),
          this.metric('Inventory value', sum(this.inventoryRows(), (row) => row.inventoryValue), 'currency', 'backend values · current page'),
        ];
      case 'low-stock':
        return [
          this.metric('Low stock records', this.totalElements(), 'number', 'matching all filters'),
          this.metric('Available units', sum(this.inventoryRows(), (row) => row.availableQuantity), 'number', pageNote),
          this.metric('Products on this page', new Set(this.inventoryRows().map((row) => row.productId)).size, 'number', pageNote),
        ];
      case 'out-of-stock':
        return [
          this.metric('Out of stock records', this.totalElements(), 'number', 'matching all filters'),
          this.metric('Products', new Set(this.inventoryRows().map((row) => row.productId)).size, 'number', pageNote),
          this.metric('Locations affected', new Set(this.inventoryRows().map((row) => row.locationId)).size, 'number', pageNote),
        ];
      case 'sales':
        return [
          this.metric('Sales amount', sum(this.salesRows(), (row) => row.totalAmount), 'currency', 'backend daily totals'),
          this.metric('Orders', sum(this.salesRows(), (row) => row.orderCount), 'number', 'in selected date range'),
          this.metric('Items sold', sum(this.salesRows(), (row) => row.itemQuantity), 'number', 'in selected date range'),
        ];
      case 'purchases':
        return [
          this.metric('Purchase amount', sum(this.purchaseRows(), (row) => row.totalAmount), 'currency', 'backend daily totals'),
          this.metric('Purchase orders', sum(this.purchaseRows(), (row) => row.orderCount), 'number', 'in selected date range'),
          this.metric('Items purchased', sum(this.purchaseRows(), (row) => row.itemQuantity), 'number', 'in selected date range'),
        ];
      case 'suppliers':
        return [
          this.metric('Suppliers', this.supplierRows().length, 'number', 'matching all filters'),
          this.metric('Purchase orders', sum(this.supplierRows(), (row) => row.purchaseOrderCount), 'number', 'backend report totals'),
          this.metric('Purchase amount', sum(this.supplierRows(), (row) => row.purchaseAmount), 'currency', 'backend report totals'),
        ];
      case 'stock-movements':
        return [
          this.metric('Transactions', this.totalElements(), 'number', 'matching all filters'),
          this.metric('Transactions on this page', this.movementRows().length, 'number', pageNote),
          this.metric('Movement types', new Set(this.movementRows().map((row) => row.type)).size, 'number', pageNote),
        ];
      case 'inventory-valuation':
        return [
          this.metric('Valuation records', this.totalElements(), 'number', 'matching all filters'),
          this.metric('Quantity', sum(this.valuationRows(), (row) => row.quantity), 'number', pageNote),
          this.metric('Inventory value', sum(this.valuationRows(), (row) => row.totalValue), 'currency', 'backend values · current page'),
        ];
    }
  }

  protected resultDescription(): string {
    return this.isPagedReport()
      ? 'Results from the report API, paginated for easier review.'
      : 'Grouped results and totals returned by the report API.';
  }

  protected isEmpty(): boolean {
    switch (this.activeReport()) {
      case 'inventory':
      case 'low-stock':
      case 'out-of-stock':
        return this.inventoryRows().length === 0;
      case 'sales':
        return this.salesRows().length === 0;
      case 'purchases':
        return this.purchaseRows().length === 0;
      case 'suppliers':
        return this.supplierRows().length === 0;
      case 'stock-movements':
        return this.movementRows().length === 0;
      case 'inventory-valuation':
        return this.valuationRows().length === 0;
    }
  }

  protected hasFilters(): boolean {
    const filters = this.filters.getRawValue();
    return Boolean(
      filters.productId
      || filters.categoryId
      || filters.locationId
      || (this.supportsSupplier() && filters.supplierId)
      || (this.supportsDates() && (filters.startDate || filters.endDate)),
    );
  }

  protected barWidth(value: number, rows: SalesReportRow[] | PurchaseReportRow[]): number {
    const maximum = Math.max(...rows.map((row) => row.totalAmount), 0);
    return maximum > 0 ? Math.max((value / maximum) * 100, 1) : 0;
  }

  protected movementLabel(type: InventoryTransactionResponse['type']): string {
    return type.charAt(0) + type.slice(1).toLowerCase();
  }

  protected goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages()) return;
    this.page.set(page);
    this.loadReport();
  }

  protected changePageSize(event: Event): void {
    this.pageSize.set(Number((event.target as HTMLSelectElement).value));
    this.page.set(0);
    this.loadReport();
  }

  protected firstItem(): number {
    return this.totalElements() ? this.page() * this.pageSize() + 1 : 0;
  }

  protected lastItem(): number {
    return Math.min((this.page() + 1) * this.pageSize(), this.totalElements());
  }

  protected loadOptions(): void {
    this.loadingOptions.set(true);
    this.optionsError.set(null);
    forkJoin({
      products: this.loadAllPages((page, size) =>
        this.productService.findAll({
          name: '', sku: '', categoryId: '', status: '', page, size, sort: 'name', direction: 'asc',
        })),
      suppliers: this.loadAllPages((page, size) =>
        this.supplierService.findAll({
          name: '', supplierCode: '', status: '', page, size, sort: 'companyName', direction: 'asc',
        })),
      locations: this.loadAllPages((page, size) =>
        this.locationService.findAll({
          search: '', type: '', status: '', page, size, sort: 'name', direction: 'asc',
        })),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ products, suppliers, locations }) => {
        this.products.set(products);
        this.suppliers.set(suppliers);
        this.locations.set(locations);
        const categories = new Map<number, string>();
        for (const product of products) {
          if (product.categoryId && product.category) categories.set(product.categoryId, product.category);
        }
        this.categories.set(
          [...categories.entries()]
            .map(([id, name]) => ({ id, name }))
            .sort((left, right) => left.name.localeCompare(right.name)),
        );
        this.loadingOptions.set(false);
      },
      error: (error: unknown) => {
        this.optionsError.set(this.errorMessage(error));
        this.loadingOptions.set(false);
      },
    });
  }

  private loadAllPages<T>(
    fetchPage: (page: number, size: number) => Observable<PageResponse<T>>,
  ): Observable<T[]> {
    const size = 200;
    return fetchPage(0, size).pipe(
      expand((response) => response.last ? EMPTY : fetchPage(response.number + 1, size)),
      reduce((items, response) => items.concat(response.content), [] as T[]),
    );
  }

  private request<T>(observable: Observable<T>, onSuccess: (response: T) => void): void {
    observable.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        onSuccess(response);
        this.hasLoaded.set(true);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.error.set(this.errorMessage(error));
        this.hasLoaded.set(true);
        this.loading.set(false);
      },
    });
  }

  private setPage<T>(response: PageResponse<T>): void {
    this.totalElements.set(response.totalElements);
    this.totalPages.set(response.totalPages);
  }

  private setListCount(count: number): void {
    this.totalElements.set(count);
    this.totalPages.set(count ? 1 : 0);
  }

  private metric(
    label: string,
    value: number,
    format: ReportMetric['format'],
    note: string,
  ): ReportMetric {
    return { label, value, format, note };
  }

  private errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'Could not reach the StockSmart API. Check that the server is running and try again.';
      }
      if (typeof error.error?.message === 'string' && error.error.message.trim()) {
        return error.error.message;
      }
      return `The request failed (HTTP ${error.status}). Please try again.`;
    }
    return 'The report could not be loaded. Please try again.';
  }
}
