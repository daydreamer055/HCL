import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { InventoryService, StockAdjustmentRequest, StockTransferRequest } from '../../core/services/inventory.service';
import { NotificationService } from '../../core/services/notification.service';
import { InventoryResponse, LocationResponse, PageResponse, Product } from '../../models/api.models';
import { InventoryAdjustmentFormComponent } from './inventory-adjustment-form.component';
import { InventoryTransactionsComponent } from './inventory-transactions.component';
import { StockTransferFormComponent } from './stock-transfer-form.component';

type InventoryFilterControls = {
  search: FormControl<string>;
  locationId: FormControl<string>;
};
type StockFilter = 'ALL' | 'LOW' | 'OUT';
type SortField = 'product.name' | 'sku' | 'location.name' | 'quantityOnHand' | 'reservedQuantity' | 'reorderLevel' | 'updatedAt';

@Component({
  selector: 'app-inventory-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    DecimalPipe,
    InventoryAdjustmentFormComponent,
    StockTransferFormComponent,
    InventoryTransactionsComponent,
  ],
  template: `
    <section class="page-heading">
      <div>
        <p class="eyebrow">STOCKSMART / OPERATIONS</p>
        <h1>Inventory</h1>
        <p class="description">Monitor stock across locations, review movements, and manage stock levels.</p>
      </div>
      <div class="heading-actions">
        <button class="secondary-button" type="button" (click)="openTransfer()">⇄ Transfer stock</button>
        <button class="primary-button" type="button" (click)="openAdjustment()">＋ Adjust stock</button>
      </div>
    </section>

    <section class="inventory-summary">
      <button class="summary-card" [class.selected]="stockFilter() === 'ALL'" type="button" (click)="setStockFilter('ALL')">
        <span class="summary-icon all-icon">▦</span><span><strong>{{ totalElements() | number }}</strong><small>Inventory records</small></span>
      </button>
      <button class="summary-card" [class.selected]="stockFilter() === 'LOW'" type="button" (click)="setStockFilter('LOW')">
        <span class="summary-icon low-icon">!</span><span><strong>{{ lowStockCount() | number }}</strong><small>Low stock</small></span>
      </button>
      <button class="summary-card" [class.selected]="stockFilter() === 'OUT'" type="button" (click)="setStockFilter('OUT')">
        <span class="summary-icon out-icon">×</span><span><strong>{{ outOfStockCount() | number }}</strong><small>Out of stock</small></span>
      </button>
      <div class="summary-note">Available stock is calculated after reserved quantities.</div>
    </section>

    <section class="inventory-panel">
      <header class="panel-header">
        <div><h2>Stock by location</h2><p>Search products or SKUs; filters and stock changes use the Inventory API.</p></div>
        @if (loading()) { <span class="loading-label"><i class="spinner"></i> Updating</span> }
      </header>
      <form class="filters" [formGroup]="filters" (submit)="$event.preventDefault()">
        <label class="search-control"><span aria-hidden="true">⌕</span><input formControlName="search" placeholder="Search product name or SKU" aria-label="Search by product name or SKU"></label>
        <label class="filter-control"><span>Location</span>
          <select formControlName="locationId"><option value="">All locations</option>
            @for (location of locations(); track location.id) { <option [value]="location.id">{{ location.name }}</option> }
          </select>
        </label>
        <label class="filter-control"><span>Stock status</span>
          <select [value]="stockFilter()" (change)="onStockFilterChange($event)">
            <option value="ALL">All stock</option><option value="LOW">Low stock</option><option value="OUT">Out of stock</option>
          </select>
        </label>
        <button class="clear-button" type="button" (click)="clearFilters()" [disabled]="!filters.value.search && !filters.value.locationId && stockFilter() === 'ALL'">Clear</button>
      </form>

      @if (error(); as errorMessage) {
        <div class="page-error" role="alert"><span class="error-icon">!</span><div><strong>Could not load inventory</strong><p>{{ errorMessage }}</p></div><button class="secondary-button" type="button" (click)="loadInventory()">Retry</button></div>
      } @else if (loading() && !hasLoaded()) {
        <div class="loading-state" role="status" aria-live="polite"><i class="spinner large"></i><strong>Loading inventory</strong><span>Connecting to StockSmart inventory…</span></div>
      } @else if (!inventory().length) {
        <div class="empty-state"><div class="empty-icon">▦</div>
          @if (hasFilters()) { <h3>No matching inventory</h3><p>Try another search or reset your filters.</p><button class="secondary-button" type="button" (click)="clearFilters()">Clear filters</button> }
          @else { <h3>No inventory records yet</h3><p>Inventory is created when stock is received or adjusted.</p><button class="primary-button" type="button" (click)="openAdjustment()">Adjust stock</button> }
        </div>
      } @else {
        <div class="table-scroll">
          <table>
            <thead><tr>
              <th><button class="sort-button" type="button" (click)="sortBy('product.name')">Product {{ sortIndicator('product.name') }}</button></th>
              <th><button class="sort-button" type="button" (click)="sortBy('sku')">SKU {{ sortIndicator('sku') }}</button></th>
              <th><button class="sort-button" type="button" (click)="sortBy('location.name')">Location {{ sortIndicator('location.name') }}</button></th>
              <th><button class="sort-button" type="button" (click)="sortBy('quantityOnHand')">Quantity {{ sortIndicator('quantityOnHand') }}</button></th>
              <th><button class="sort-button" type="button" (click)="sortBy('reservedQuantity')">Reserved {{ sortIndicator('reservedQuantity') }}</button></th>
              <th>Available</th>
              <th><button class="sort-button" type="button" (click)="sortBy('reorderLevel')">Reorder level {{ sortIndicator('reorderLevel') }}</button></th>
              <th>Stock status</th>
              <th><button class="sort-button" type="button" (click)="sortBy('updatedAt')">Last updated {{ sortIndicator('updatedAt') }}</button></th>
              <th><span class="visually-hidden">Actions</span></th>
            </tr></thead>
            <tbody>
              @for (item of inventory(); track item.id) {
                <tr>
                  <td class="product-cell"><strong>{{ item.productName }}</strong><small>{{ item.locationCode }}</small></td>
                  <td><span class="sku">{{ item.sku }}</span></td>
                  <td>{{ item.locationName }}</td>
                  <td class="quantity">{{ item.quantity | number:'1.0-3' }}</td>
                  <td>{{ item.reservedQuantity | number:'1.0-3' }}</td>
                  <td class="available">{{ item.availableQuantity | number:'1.0-3' }}</td>
                  <td>{{ item.reorderLevel | number:'1.0-3' }}</td>
                  <td><span class="status-badge" [class]="'status-' + stockStatus(item).toLowerCase().replace(' ', '-')">{{ stockStatus(item) }}</span></td>
                  <td>{{ item.lastUpdated | date:'mediumDate' }}</td>
                  <td><button class="action-button" type="button" (click)="viewDetails(item)" [attr.aria-label]="'View inventory for ' + item.productName">Details</button></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <footer class="pagination">
          <span>Showing <strong>{{ firstItem() | number }}–{{ lastItem() | number }}</strong> of <strong>{{ totalElements() | number }}</strong></span>
          <div class="pagination-controls">
            <label>Rows <select [value]="pageSize()" (change)="changePageSize($event)"><option value="10">10</option><option value="20">20</option><option value="50">50</option></select></label>
            <button type="button" (click)="goToPage(page() - 1)" [disabled]="page() === 0" aria-label="Previous page">‹</button>
            <span>Page {{ page() + 1 }} of {{ totalPages() || 1 }}</span>
            <button type="button" (click)="goToPage(page() + 1)" [disabled]="page() + 1 >= totalPages()" aria-label="Next page">›</button>
          </div>
        </footer>
      }
    </section>

    <app-inventory-transactions [refreshKey]="historyRefresh()" />

    @if (selectedInventory(); as item) {
      <div class="dialog-backdrop" (click)="selectedInventory.set(null)">
        <section class="details-dialog" role="dialog" aria-modal="true" aria-labelledby="inventory-details-title" (click)="$event.stopPropagation()">
          <header class="details-heading"><div><p class="eyebrow">INVENTORY DETAILS</p><h2 id="inventory-details-title">{{ item.productName }}</h2><p class="detail-subtitle">{{ item.sku }} · {{ item.locationName }} ({{ item.locationCode }})</p></div><button class="icon-button" type="button" aria-label="Close details" (click)="selectedInventory.set(null)">×</button></header>
          <div class="details-grid">
            <div><span>Quantity on hand</span><strong>{{ item.quantity | number:'1.0-3' }}</strong></div>
            <div><span>Reserved quantity</span><strong>{{ item.reservedQuantity | number:'1.0-3' }}</strong></div>
            <div><span>Available quantity</span><strong>{{ item.availableQuantity | number:'1.0-3' }}</strong></div>
            <div><span>Reorder level</span><strong>{{ item.reorderLevel | number:'1.0-3' }}</strong></div>
            <div><span>Stock status</span><strong>{{ stockStatus(item) }}</strong></div>
            <div><span>Last updated</span><strong>{{ item.lastUpdated | date:'medium' }}</strong></div>
          </div>
          <footer class="details-actions"><button class="secondary-button" type="button" (click)="selectedInventory.set(null)">Close</button><button class="primary-button" type="button" (click)="openAdjustment(item)">Adjust this stock</button></footer>
        </section>
      </div>
    }

    @if (adjustmentOpen()) {
      <app-inventory-adjustment-form [products]="products()" [locations]="locations()" [inventoryItem]="adjustmentInventory()" [saving]="saving()" (save)="adjustStock($event)" (cancel)="closeAdjustment()" />
    }
    @if (transferOpen()) {
      <app-stock-transfer-form [products]="products()" [locations]="locations()" [saving]="saving()" (save)="transferStock($event)" (cancel)="transferOpen.set(false)" />
    }
  `,
  styleUrls: ['./inventory-page.component.css', './inventory-page-details.component.css'],
})
export class InventoryPageComponent implements OnInit {
  private readonly inventoryService = inject(InventoryService);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly inventory = signal<InventoryResponse[]>([]);
  protected readonly products = signal<Product[]>([]);
  protected readonly locations = signal<LocationResponse[]>([]);
  protected readonly loading = signal(false);
  protected readonly hasLoaded = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly totalElements = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly lowStockCount = signal(0);
  protected readonly outOfStockCount = signal(0);
  protected readonly page = signal(0);
  protected readonly pageSize = signal(20);
  protected readonly sort = signal<SortField>('product.name');
  protected readonly direction = signal<'asc' | 'desc'>('asc');
  protected readonly stockFilter = signal<StockFilter>('ALL');
  protected readonly selectedInventory = signal<InventoryResponse | null>(null);
  protected readonly adjustmentInventory = signal<InventoryResponse | null>(null);
  protected readonly adjustmentOpen = signal(false);
  protected readonly transferOpen = signal(false);
  protected readonly saving = signal(false);
  protected readonly historyRefresh = signal(0);

  protected readonly filters = new FormGroup<InventoryFilterControls>({
    search: new FormControl('', { nonNullable: true }),
    locationId: new FormControl('', { nonNullable: true }),
  });

  ngOnInit(): void {
    this.loadInventory();
    this.loadSummaryCounts();
    this.inventoryService.findProducts().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => this.products.set(response.content),
      error: (error: unknown) => this.notifications.show(this.errorMessage(error), 'error'),
    });
    this.inventoryService.findLocations().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => this.locations.set(response.content),
      error: (error: unknown) => this.notifications.show(this.errorMessage(error), 'error'),
    });
    this.filters.valueChanges.pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.page.set(0);
      this.loadInventory();
    });
  }

  protected loadInventory(): void {
    this.loading.set(true);
    this.error.set(null);
    this.inventoryService.findAll({
      ...this.filters.getRawValue(),
      lowStock: this.stockFilter() === 'LOW',
      outOfStock: this.stockFilter() === 'OUT',
      page: this.page(),
      size: this.pageSize(),
      sort: this.sort(),
      direction: this.direction(),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response: PageResponse<InventoryResponse>) => {
        this.inventory.set(response.content);
        this.totalElements.set(response.totalElements);
        this.totalPages.set(response.totalPages);
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

  protected stockStatus(item: InventoryResponse): 'IN STOCK' | 'LOW STOCK' | 'OUT OF STOCK' {
    if (item.availableQuantity <= 0) return 'OUT OF STOCK';
    if (item.availableQuantity <= item.reorderLevel) return 'LOW STOCK';
    return 'IN STOCK';
  }

  protected setStockFilter(filter: StockFilter): void {
    this.stockFilter.set(filter);
    this.page.set(0);
    this.loadInventory();
  }

  protected onStockFilterChange(event: Event): void {
    this.setStockFilter((event.target as HTMLSelectElement).value as StockFilter);
  }

  protected hasFilters(): boolean {
    return Boolean(this.filters.controls.search.value || this.filters.controls.locationId.value || this.stockFilter() !== 'ALL');
  }

  protected clearFilters(): void {
    this.filters.reset({ search: '', locationId: '' }, { emitEvent: false });
    this.stockFilter.set('ALL');
    this.page.set(0);
    this.loadInventory();
  }

  protected sortBy(field: SortField): void {
    if (this.sort() === field) this.direction.update((direction) => direction === 'asc' ? 'desc' : 'asc');
    else {
      this.sort.set(field);
      this.direction.set('asc');
    }
    this.page.set(0);
    this.loadInventory();
  }

  protected sortIndicator(field: SortField): string {
    return this.sort() === field ? (this.direction() === 'asc' ? '↑' : '↓') : '↕';
  }

  protected goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages()) return;
    this.page.set(page);
    this.loadInventory();
  }

  protected changePageSize(event: Event): void {
    this.pageSize.set(Number((event.target as HTMLSelectElement).value));
    this.page.set(0);
    this.loadInventory();
  }

  protected firstItem(): number {
    return this.totalElements() ? this.page() * this.pageSize() + 1 : 0;
  }

  protected lastItem(): number {
    return Math.min((this.page() + 1) * this.pageSize(), this.totalElements());
  }

  protected viewDetails(item: InventoryResponse): void {
    this.selectedInventory.set(item);
  }

  protected openAdjustment(item?: InventoryResponse): void {
    this.selectedInventory.set(null);
    this.adjustmentInventory.set(item ?? null);
    this.adjustmentOpen.set(true);
  }

  protected closeAdjustment(): void {
    this.adjustmentOpen.set(false);
    this.adjustmentInventory.set(null);
  }

  protected openTransfer(): void {
    this.transferOpen.set(true);
  }

  protected adjustStock(request: StockAdjustmentRequest): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.inventoryService.adjust(request).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeAdjustment();
        this.notifications.show('Stock adjustment recorded successfully.', 'success');
        this.historyRefresh.update((refresh) => refresh + 1);
        this.loadInventory();
        this.loadSummaryCounts();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.notifications.show(this.errorMessage(error), 'error');
      },
    });
  }

  protected transferStock(request: StockTransferRequest): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.inventoryService.transfer(request).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.transferOpen.set(false);
        this.notifications.show('Stock transfer completed successfully.', 'success');
        this.historyRefresh.update((refresh) => refresh + 1);
        this.loadInventory();
        this.loadSummaryCounts();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.notifications.show(this.errorMessage(error), 'error');
      },
    });
  }

  private loadSummaryCounts(): void {
    this.inventoryService.findLowStock(0, 1).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => this.lowStockCount.set(response.totalElements),
      error: (error: unknown) => this.notifications.show(this.errorMessage(error), 'error'),
    });
    this.inventoryService.findOutOfStock(0, 1).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => this.outOfStockCount.set(response.totalElements),
      error: (error: unknown) => this.notifications.show(this.errorMessage(error), 'error'),
    });
  }

  private errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error?.message === 'string') return error.error.message;
      if (error.status === 0) return 'Could not reach the StockSmart API. Check your connection and try again.';
      return `The request failed (HTTP ${error.status}). Please try again.`;
    }
    return 'Something went wrong. Please try again.';
  }
}
