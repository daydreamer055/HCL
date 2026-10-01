import { HttpErrorResponse } from '@angular/common/http';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subscription, debounceTime } from 'rxjs';
import { NotificationService } from '../../core/services/notification.service';
import { ProductService } from '../../core/services/product.service';
import { PageResponse, Product, ProductRequest, SupplierResponse } from '../../models/api.models';
import { ProductDetailsComponent } from './product-details.component';
import { ProductFormComponent } from './product-form.component';

type ProductFilters = {
  name: FormControl<string>;
  sku: FormControl<string>;
  categoryId: FormControl<string>;
  status: FormControl<string>;
};

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [ReactiveFormsModule, ProductFormComponent, ProductDetailsComponent, CurrencyPipe, DecimalPipe],
  template: `
    <section class="page-heading">
      <div>
        <p class="eyebrow">STOCKSMART / CATALOG</p>
        <h1>Products</h1>
        <p class="description">Manage your product catalog, pricing, and stock thresholds.</p>
      </div>
      <button class="primary-button add-button" type="button" (click)="openCreate()">＋ Add product</button>
    </section>

    <section class="catalog-summary">
      <div class="summary-icon" aria-hidden="true">▦</div>
      <div><strong>{{ totalElements() | number }}</strong><span>products in catalog</span></div>
      <div class="summary-divider"></div>
      <div class="summary-note">Product details stay synced with your inventory, purchase, and sales workflows.</div>
    </section>

    <section class="catalog-panel">
      <header class="catalog-header">
        <div><h2>Product catalog</h2><p>Search, filter, and manage products.</p></div>
        @if (loading()) { <span class="loading-label"><i class="spinner"></i> Updating</span> }
      </header>

      <form class="filters" [formGroup]="filters" (submit)="$event.preventDefault()">
        <label class="search-control"><span aria-hidden="true">⌕</span><input formControlName="name" placeholder="Search product name" aria-label="Search by product name"></label>
        <label class="search-control"><span aria-hidden="true">⌕</span><input formControlName="sku" placeholder="Search SKU" aria-label="Search by SKU"></label>
        <label class="filter-control category-filter">
          <span>Category ID</span><input type="number" min="1" step="1" formControlName="categoryId" placeholder="Any">
        </label>
        <label class="filter-control">
          <span>Status</span>
          <select formControlName="status">
            <option value="">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="DISCONTINUED">Discontinued</option>
          </select>
        </label>
        <button class="clear-button" type="button" (click)="clearFilters()" [disabled]="!filters.value.name && !filters.value.sku && !filters.value.categoryId && !filters.value.status">Clear</button>
      </form>

      @if (error(); as errorMessage) {
        <div class="page-error" role="alert">
          <span class="error-icon" aria-hidden="true">!</span><div><strong>Could not load products</strong><p>{{ errorMessage }}</p></div>
          <button class="secondary-button" type="button" (click)="loadProducts()">Retry</button>
        </div>
      } @else if (loading() && !hasLoaded()) {
        <div class="loading-state" role="status" aria-live="polite"><i class="spinner large"></i><strong>Loading products</strong><span>Connecting to your product catalog…</span></div>
      } @else if (!products().length) {
        <div class="empty-state">
          <div class="empty-icon" aria-hidden="true">▦</div>
          @if (hasFilters()) {
            <h3>No matching products</h3><p>Try a different search or clear your filters.</p>
            <button class="secondary-button" type="button" (click)="clearFilters()">Clear filters</button>
          } @else {
            <h3>Your product catalog is empty</h3><p>Add your first product to start managing retail inventory.</p>
            <button class="primary-button" type="button" (click)="openCreate()">Add your first product</button>
          }
        </div>
      } @else {
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th><button class="sort-button" type="button" (click)="sortBy('sku')">SKU {{ sortIndicator('sku') }}</button></th>
                <th><button class="sort-button" type="button" (click)="sortBy('name')">Product {{ sortIndicator('name') }}</button></th>
                <th>Category</th>
                <th>Supplier</th>
                <th><button class="sort-button" type="button" (click)="sortBy('price')">Price {{ sortIndicator('price') }}</button></th>
                <th>Reorder level</th>
                <th><button class="sort-button" type="button" (click)="sortBy('status')">Status {{ sortIndicator('status') }}</button></th>
                <th><span class="visually-hidden">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              @for (product of products(); track product.id) {
                <tr>
                  <td><span class="sku">{{ product.sku }}</span></td>
                  <td class="product-cell"><strong>{{ product.name }}</strong>@if(product.barcode){<small>Barcode · {{ product.barcode }}</small>}</td>
                  <td>{{ product.category }}</td>
                  <td>{{ product.supplier || '—' }}</td>
                  <td class="money">{{ product.price | currency }}</td>
                  <td>{{ product.reorderLevel | number }}</td>
                  <td><span class="status-badge" [class]="'status-' + product.status.toLowerCase()">{{ statusLabel(product.status) }}</span></td>
                  <td>
                    <div class="row-actions">
                      <button class="action-button" type="button" (click)="viewProduct(product)" [attr.aria-label]="'View ' + product.name">View</button>
                      <button class="action-button" type="button" (click)="openEdit(product)" [attr.aria-label]="'Edit ' + product.name">Edit</button>
                      <button class="action-button delete-action" type="button" (click)="deleteProduct(product)" [attr.aria-label]="'Delete ' + product.name">Delete</button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
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

    @if (formOpen()) {
      <app-product-form [product]="editingProduct()" [suppliers]="suppliers()" [saving]="saving()" (save)="saveProduct($event)" (cancel)="closeForm()" />
    }

    @if (viewingProduct(); as product) {
      <app-product-details [product]="product" (close)="viewingProduct.set(null)" (edit)="openEdit($event)" />
    }
  `,
  styleUrl: './products-page.component.css',
})
export class ProductsPageComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);
  private productRequest?: Subscription;

  protected readonly products = signal<Product[]>([]);
  protected readonly suppliers = signal<SupplierResponse[]>([]);
  protected readonly loading = signal(false);
  protected readonly hasLoaded = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly totalElements = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly page = signal(0);
  protected readonly pageSize = signal(20);
  protected readonly sort = signal('name');
  protected readonly direction = signal<'asc' | 'desc'>('asc');
  protected readonly formOpen = signal(false);
  protected readonly saving = signal(false);
  protected readonly editingProduct = signal<Product | null>(null);
  protected readonly viewingProduct = signal<Product | null>(null);

  protected readonly filters = new FormGroup<ProductFilters>({
    name: new FormControl('', { nonNullable: true }),
    sku: new FormControl('', { nonNullable: true }),
    categoryId: new FormControl('', { nonNullable: true }),
    status: new FormControl('', { nonNullable: true }),
  });

  ngOnInit(): void {
    this.loadProducts();
    this.productService.findSuppliers().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => this.suppliers.set(response.content),
      error: (error: unknown) => this.notifications.show(this.errorMessage(error), 'error'),
    });

    this.filters.valueChanges.pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.page.set(0);
      this.loadProducts();
    });
  }

  protected loadProducts(): void {
    this.productRequest?.unsubscribe();
    this.loading.set(true);
    this.error.set(null);
    this.productRequest = this.productService.findAll({
      ...this.filters.getRawValue(),
      page: this.page(),
      size: this.pageSize(),
      sort: this.sort(),
      direction: this.direction(),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response: PageResponse<Product>) => {
        this.products.set(response.content);
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

  protected hasFilters(): boolean {
    const value = this.filters.getRawValue();
    return Boolean(value.name || value.sku || value.categoryId || value.status);
  }

  protected clearFilters(): void {
    this.filters.reset({ name: '', sku: '', categoryId: '', status: '' }, { emitEvent: false });
    this.page.set(0);
    this.loadProducts();
  }

  protected sortBy(field: string): void {
    if (this.sort() === field) this.direction.update((direction) => direction === 'asc' ? 'desc' : 'asc');
    else {
      this.sort.set(field);
      this.direction.set('asc');
    }
    this.page.set(0);
    this.loadProducts();
  }

  protected sortIndicator(field: string): string {
    return this.sort() === field ? (this.direction() === 'asc' ? '↑' : '↓') : '↕';
  }

  protected goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages()) return;
    this.page.set(page);
    this.loadProducts();
  }

  protected changePageSize(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    this.pageSize.set(value);
    this.page.set(0);
    this.loadProducts();
  }

  protected firstItem(): number {
    return this.totalElements() ? this.page() * this.pageSize() + 1 : 0;
  }

  protected lastItem(): number {
    return Math.min((this.page() + 1) * this.pageSize(), this.totalElements());
  }

  protected statusLabel(status: Product['status']): string {
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  protected openCreate(): void {
    this.editingProduct.set(null);
    this.viewingProduct.set(null);
    this.formOpen.set(true);
  }

  protected openEdit(product: Product): void {
    this.viewingProduct.set(null);
    this.editingProduct.set(product);
    this.formOpen.set(true);
  }

  protected closeForm(): void {
    this.formOpen.set(false);
    this.editingProduct.set(null);
    this.saving.set(false);
  }

  protected saveProduct(request: ProductRequest): void {
    if (this.saving()) return;
    const current = this.editingProduct();
    this.saving.set(true);
    const save$ = current
      ? this.productService.update(current.id, request)
      : this.productService.create(request);
    save$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (product) => {
        this.saving.set(false);
        this.notifications.show(current ? 'Product updated successfully.' : 'Product created successfully.', 'success');
        this.closeForm();
        this.loadProducts();
        if (this.viewingProduct()?.id === product.id) this.viewingProduct.set(product);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.notifications.show(this.errorMessage(error), 'error');
      },
    });
  }

  protected viewProduct(product: Product): void {
    this.productService.findById(product.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (details) => this.viewingProduct.set(details),
      error: (error: unknown) => this.notifications.show(this.errorMessage(error), 'error'),
    });
  }

  protected deleteProduct(product: Product): void {
    if (!window.confirm(`Delete "${product.name}" from the product catalog?`)) return;
    this.productService.delete(product.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.notifications.show('Product deleted successfully.', 'success');
        if (this.products().length === 1 && this.page() > 0) this.page.update((page) => page - 1);
        this.loadProducts();
      },
      error: (error: unknown) => this.notifications.show(this.errorMessage(error), 'error'),
    });
  }

  private errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.error && typeof error.error.message === 'string') {
        const message = error.error.message;
        const details = error.error.details;
        if (details && typeof details === 'object' && !Array.isArray(details)) {
          const fieldMessages = Object.entries(details)
            .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
            .map(([field, detail]) => `${field}: ${detail}`);
          if (fieldMessages.length) return `${message} ${fieldMessages.join('; ')}`;
        }
        return message;
      }
      if (error.status === 0) return 'Could not reach the StockSmart API. Check your connection and try again.';
      return `The request failed (HTTP ${error.status}). Please try again.`;
    }
    return 'Something went wrong. Please try again.';
  }
}
