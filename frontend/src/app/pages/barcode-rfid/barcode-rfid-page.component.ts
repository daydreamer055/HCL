import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  Barcode,
  Location,
  Product,
  RfidTag,
} from '../../models/api.models';
import { BarcodeRfidService } from '../../core/services/barcode-rfid.service';
import { LocationService } from '../../core/services/location.service';
import { NotificationService } from '../../core/services/notification.service';
import { ProductService } from '../../core/services/product.service';

type Section = 'barcode' | 'rfid';

@Component({
  selector: 'app-barcode-rfid-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <main class="page">
      <header class="page-header">
        <div>
          <p class="eyebrow">PRODUCT IDENTIFICATION</p>
          <h1>Barcode &amp; RFID</h1>
          <p class="subtitle">Manage product barcodes and software-simulated RFID tags.</p>
        </div>
        <button class="primary" type="button" (click)="openCreate()">
          {{ section() === 'barcode' ? '＋ Add barcode' : '＋ Register RFID tag' }}
        </button>
      </header>

      <div class="tabs" role="tablist" aria-label="Identification type">
        <button type="button" role="tab" [attr.aria-selected]="section() === 'barcode'"
          [class.selected]="section() === 'barcode'" (click)="switchSection('barcode')">Barcode Management</button>
        <button type="button" role="tab" [attr.aria-selected]="section() === 'rfid'"
          [class.selected]="section() === 'rfid'" (click)="switchSection('rfid')">RFID Management</button>
      </div>

      <section class="panel scan-panel" *ngIf="section() === 'barcode'">
        <div>
          <h2>Manual barcode lookup</h2>
          <p>Enter or scan a barcode number to look up its assigned product.</p>
        </div>
        <form class="scan-form" [formGroup]="scanForm" (ngSubmit)="scanBarcode()">
          <input formControlName="barcodeNumber" aria-label="Barcode number" placeholder="Enter barcode number">
          <button class="secondary" [disabled]="scanning() || scanForm.invalid">
            {{ scanning() ? 'Searching…' : 'Search barcode' }}
          </button>
        </form>
        <div class="scan-result" *ngIf="scanProduct() as product">
          <span class="result-mark">✓</span>
          <div><strong>{{ product.name }}</strong><span>{{ product.sku }} · {{ product.category }}</span></div>
        </div>
      </section>

      <section class="panel">
        <div class="filters">
          <form class="search-form" [formGroup]="filterForm" (ngSubmit)="loadCurrent()">
            <label class="search-box">
              <span>⌕</span><input formControlName="search" [placeholder]="section() === 'barcode' ? 'Search barcode number' : 'Search tag code'">
            </label>
            <select formControlName="status" aria-label="Filter by status">
              <option value="">All statuses</option>
              <ng-container *ngIf="section() === 'barcode'">
                <option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option>
              </ng-container>
              <ng-container *ngIf="section() === 'rfid'">
                <option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option>
                <option value="LOST">Lost</option><option value="UNASSIGNED">Unassigned</option>
              </ng-container>
            </select>
            <button class="secondary" type="submit">Apply filters</button>
          </form>
        </div>

        <div class="loading" *ngIf="loading()"><span class="spinner"></span>Loading {{ section() === 'barcode' ? 'barcodes' : 'RFID tags' }}…</div>
        <div class="error-state" *ngIf="!loading() && error()"><strong>Could not load records</strong><span>{{ error() }}</span>
          <button class="secondary" type="button" (click)="loadCurrent()">Try again</button></div>

        <div class="table-wrap" *ngIf="!loading() && !error()">
          <table *ngIf="section() === 'barcode'">
            <thead><tr><th>Barcode</th><th>Type</th><th>Product</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>
              <tr *ngFor="let item of barcodes()">
                <td class="strong">{{ item.barcodeNumber }}</td><td>{{ item.barcodeType }}</td>
                <td><span *ngIf="item.productName; else noProduct">{{ item.productName }}<small>{{ item.sku }}</small></span>
                  <ng-template #noProduct><span class="muted">Not assigned</span></ng-template></td>
                <td><span class="badge" [class.active]="item.status === 'ACTIVE'">{{ item.status }}</span></td>
                <td>{{ item.createdAt | date:'mediumDate' }}</td>
                <td class="actions">
                  <select aria-label="Assign barcode to product" [value]="item.productId || ''" (change)="assignBarcode(item, $event)">
                    <option value="">Assign product…</option><option *ngFor="let product of products()" [value]="product.id">{{ product.name }} ({{ product.sku }})</option>
                  </select>
                  <button class="text-button" type="button" (click)="toggleBarcodeStatus(item)">{{ item.status === 'ACTIVE' ? 'Deactivate' : 'Activate' }}</button>
                  <button class="text-button" type="button" (click)="viewBarcode(item)">View</button>
                </td>
              </tr>
            </tbody>
          </table>

          <table *ngIf="section() === 'rfid'">
            <thead><tr><th>Tag code</th><th>Product</th><th>Location</th><th>Status</th><th>Last seen</th><th>Actions</th></tr></thead>
            <tbody>
              <tr *ngFor="let item of tags()">
                <td class="strong">{{ item.tagCode }}</td>
                <td>{{ item.productName || '—' }}<small *ngIf="item.sku">{{ item.sku }}</small></td>
                <td>{{ item.locationName || '—' }}<small *ngIf="item.locationCode">{{ item.locationCode }}</small></td>
                <td><span class="badge" [class.active]="item.status === 'ACTIVE'" [class.lost]="item.status === 'LOST'">{{ item.status }}</span></td>
                <td>{{ item.lastSeenAt ? (item.lastSeenAt | date:'medium') : '—' }}</td>
                <td class="actions">
                  <select aria-label="Assign RFID tag to product" [value]="item.productId || ''" (change)="assignTagProduct(item, $event)">
                    <option value="">Assign product…</option><option *ngFor="let product of products()" [value]="product.id">{{ product.name }} ({{ product.sku }})</option>
                  </select>
                  <select aria-label="Assign RFID tag to location" [value]="item.locationId || ''" (change)="assignTagLocation(item, $event)">
                    <option value="">Assign location…</option><option *ngFor="let location of locations()" [value]="location.id">{{ location.name }}</option>
                  </select>
                  <select aria-label="Update RFID tag status" [value]="item.status" (change)="setTagStatus(item, $event)">
                    <option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="UNASSIGNED">Unassigned</option><option value="LOST">Lost</option>
                  </select>
                  <button class="text-button danger" type="button" (click)="removeTagAssignment(item)" *ngIf="item.productId || item.locationId">Remove assignment</button>
                  <button class="text-button" type="button" (click)="scanTag(item)" [disabled]="item.status !== 'ACTIVE'">Simulate scan</button>
                  <button class="text-button" type="button" (click)="viewTag(item)">View</button>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="empty-state" *ngIf="section() === 'barcode' && !barcodes().length"><span>▤</span><strong>No barcodes found</strong><p>Create a barcode or change your search filters.</p></div>
          <div class="empty-state" *ngIf="section() === 'rfid' && !tags().length"><span>◉</span><strong>No RFID tags found</strong><p>Register a tag or change your search filters.</p></div>
        </div>

        <footer class="pagination" *ngIf="!loading() && !error() && totalPages() > 0">
          <span>{{ totalElements() }} records · Page {{ page() + 1 }} of {{ totalPages() }}</span>
          <div><button class="secondary" type="button" (click)="changePage(-1)" [disabled]="page() === 0">Previous</button>
            <button class="secondary" type="button" (click)="changePage(1)" [disabled]="page() + 1 >= totalPages()">Next</button></div>
        </footer>
      </section>

      <div class="modal-backdrop" *ngIf="showCreate()" (click)="closeCreate()">
        <section class="modal" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
          <header><div><p class="eyebrow">{{ section() === 'barcode' ? 'BARCODE' : 'RFID TAG' }}</p><h2>{{ section() === 'barcode' ? 'Add barcode' : 'Register RFID tag' }}</h2></div>
            <button class="close" type="button" aria-label="Close" (click)="closeCreate()">×</button></header>
          <p class="modal-note" *ngIf="section() === 'rfid'">RFID tags are managed as a software simulation. No physical reader is required.</p>
          <form [formGroup]="createForm" (ngSubmit)="createRecord()">
            <ng-container *ngIf="section() === 'barcode'">
              <label>Barcode number<input formControlName="barcodeNumber" placeholder="Enter barcode number"></label>
              <label>Barcode type<select formControlName="barcodeType"><option value="UPC">UPC</option><option value="EAN">EAN</option><option value="CODE128">CODE128</option><option value="OTHER">OTHER</option></select></label>
            </ng-container>
            <label *ngIf="section() === 'rfid'">Tag code<input formControlName="tagCode" placeholder="Enter unique tag code"></label>
            <div class="form-error" *ngIf="formError()">{{ formError() }}</div>
            <footer><button class="secondary" type="button" (click)="closeCreate()">Cancel</button>
              <button class="primary" [disabled]="saving() || createForm.invalid">{{ saving() ? 'Saving…' : (section() === 'barcode' ? 'Create barcode' : 'Register tag') }}</button></footer>
          </form>
        </section>
      </div>

      <div class="modal-backdrop" *ngIf="detail() as selected" (click)="detail.set(null)">
        <section class="modal details" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
          <header><div><p class="eyebrow">{{ isBarcodeDetail(selected) ? 'BARCODE DETAILS' : 'RFID TAG DETAILS' }}</p>
            <h2>{{ isBarcodeDetail(selected) ? selected.barcodeNumber : selected.tagCode }}</h2></div>
            <button class="close" type="button" aria-label="Close" (click)="detail.set(null)">×</button></header>
          <dl *ngIf="isBarcodeDetail(selected)">
            <dt>Type</dt><dd>{{ selected.barcodeType }}</dd><dt>Status</dt><dd>{{ selected.status }}</dd>
            <dt>Product</dt><dd>{{ selected.productName || 'Not assigned' }}<span *ngIf="selected.sku"> · {{ selected.sku }}</span></dd>
            <dt>Created</dt><dd>{{ selected.createdAt | date:'medium' }}</dd><dt>Updated</dt><dd>{{ selected.updatedAt | date:'medium' }}</dd>
          </dl>
          <dl *ngIf="!isBarcodeDetail(selected)">
            <dt>Status</dt><dd>{{ selected.status }}</dd><dt>Product</dt><dd>{{ selected.productName || 'Not assigned' }}<span *ngIf="selected.sku"> · {{ selected.sku }}</span></dd>
            <dt>Location</dt><dd>{{ selected.locationName || 'Not assigned' }}</dd><dt>Assigned</dt><dd>{{ selected.assignedAt ? (selected.assignedAt | date:'medium') : '—' }}</dd>
            <dt>Last seen</dt><dd>{{ selected.lastSeenAt ? (selected.lastSeenAt | date:'medium') : '—' }}</dd>
          </dl>
        </section>
      </div>
    </main>
  `,
  styleUrl: './barcode-rfid-page.component.css',
})
export class BarcodeRfidPageComponent implements OnInit {
  private readonly service = inject(BarcodeRfidService);
  private readonly productService = inject(ProductService);
  private readonly locationService = inject(LocationService);
  private readonly notifications = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  readonly section = signal<Section>('barcode');
  readonly barcodes = signal<Barcode[]>([]);
  readonly tags = signal<RfidTag[]>([]);
  readonly products = signal<Product[]>([]);
  readonly locations = signal<Location[]>([]);
  readonly loading = signal(false);
  readonly scanning = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly formError = signal('');
  readonly showCreate = signal(false);
  readonly detail = signal<Barcode | RfidTag | null>(null);
  readonly scanProduct = signal<Product | null>(null);
  readonly page = signal(0);
  readonly totalPages = signal(0);
  readonly totalElements = signal(0);
  private readonly size = 10;

  readonly filterForm = this.fb.nonNullable.group({ search: [''], status: [''] });
  readonly scanForm = this.fb.nonNullable.group({ barcodeNumber: ['', Validators.required] });
  readonly createForm = this.fb.group({
    barcodeNumber: ['', Validators.required],
    barcodeType: ['EAN', Validators.required],
    tagCode: [''],
  });

  ngOnInit(): void {
    this.loadChoices();
    this.loadCurrent();
  }

  switchSection(section: Section): void {
    if (this.section() === section) return;
    this.section.set(section);
    this.page.set(0);
    this.filterForm.reset({ search: '', status: '' });
    this.error.set('');
    this.loadCurrent();
  }

  loadCurrent(): void {
    this.loading.set(true);
    this.error.set('');
    const { search, status } = this.filterForm.getRawValue();
    const onError = (error: unknown): void => {
      this.error.set(this.errorMessage(error));
      this.loading.set(false);
    };
    if (this.section() === 'barcode') {
      this.service.findBarcodes(search, status, this.page(), this.size).subscribe({
        next: response => {
          this.barcodes.set(response.content);
          this.setPageInfo(response.totalPages, response.totalElements);
        },
        error: onError,
      });
    } else {
      this.service.findRfidTags(search, status, this.page(), this.size).subscribe({
        next: response => {
          this.tags.set(response.content);
          this.setPageInfo(response.totalPages, response.totalElements);
        },
        error: onError,
      });
    }
  }

  changePage(delta: number): void {
    this.page.update(value => value + delta);
    this.loadCurrent();
  }

  openCreate(): void {
    this.formError.set('');
    this.createForm.reset({ barcodeNumber: '', barcodeType: 'EAN', tagCode: '' });
    if (this.section() === 'barcode') {
      this.createForm.controls.barcodeNumber.setValidators(Validators.required);
      this.createForm.controls.tagCode.clearValidators();
    } else {
      this.createForm.controls.barcodeNumber.clearValidators();
      this.createForm.controls.tagCode.setValidators(Validators.required);
    }
    this.createForm.updateValueAndValidity();
    this.createForm.controls.barcodeNumber.updateValueAndValidity();
    this.createForm.controls.tagCode.updateValueAndValidity();
    this.showCreate.set(true);
  }

  closeCreate(): void {
    this.showCreate.set(false);
    this.formError.set('');
  }

  createRecord(): void {
    if (this.createForm.invalid || this.saving()) {
      this.createForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.formError.set('');
    const value = this.createForm.getRawValue();
    const onError = (error: unknown): void => {
      this.formError.set(this.errorMessage(error));
      this.notifications.show(this.errorMessage(error), 'error');
      this.saving.set(false);
    };
    if (this.section() === 'barcode') {
      this.service.createBarcode({
        barcodeNumber: value.barcodeNumber!.trim(),
        barcodeType: value.barcodeType as Barcode['barcodeType'],
      }).subscribe({
        next: () => this.created('Barcode created successfully.'),
        error: onError,
      });
    } else {
      this.service.registerRfid({ tagCode: value.tagCode!.trim() }).subscribe({
        next: () => this.created('RFID tag registered successfully.'),
        error: onError,
      });
    }
  }

  scanBarcode(): void {
    if (this.scanForm.invalid || this.scanning()) return;
    this.scanning.set(true);
    this.scanProduct.set(null);
    this.service.findProductByBarcode(this.scanForm.controls.barcodeNumber.value.trim()).subscribe({
      next: product => { this.scanProduct.set(product); this.scanning.set(false); },
      error: error => { this.notifications.show(this.errorMessage(error), 'error'); this.scanning.set(false); },
    });
  }

  assignBarcode(item: Barcode, event: Event): void {
    const productId = Number((event.target as HTMLSelectElement).value);
    if (!productId) return;
    this.service.assignBarcode(item.id, { productId }).subscribe({
      next: updated => { this.barcodes.update(items => items.map(row => row.id === updated.id ? updated : row)); this.notifications.show('Barcode assigned to product.', 'success'); },
      error: error => { this.notifications.show(this.errorMessage(error), 'error'); this.loadCurrent(); },
    });
  }

  toggleBarcodeStatus(item: Barcode): void {
    const status = item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.service.updateBarcodeStatus(item.id, { status }).subscribe({
      next: updated => { this.barcodes.update(items => items.map(row => row.id === updated.id ? updated : row)); this.notifications.show(`Barcode ${status.toLowerCase()}.`, 'success'); },
      error: error => this.notifications.show(this.errorMessage(error), 'error'),
    });
  }

  assignTagProduct(item: RfidTag, event: Event): void {
    const productId = Number((event.target as HTMLSelectElement).value);
    if (!productId) return;
    this.service.assignRfidProduct(item.id, { productId }).subscribe({
      next: updated => this.updateTag(updated, 'RFID tag assigned to product.'),
      error: error => { this.notifications.show(this.errorMessage(error), 'error'); this.loadCurrent(); },
    });
  }

  assignTagLocation(item: RfidTag, event: Event): void {
    const locationId = Number((event.target as HTMLSelectElement).value);
    if (!locationId) return;
    this.service.assignRfidLocation(item.id, { locationId }).subscribe({
      next: updated => this.updateTag(updated, 'RFID tag assigned to location.'),
      error: error => { this.notifications.show(this.errorMessage(error), 'error'); this.loadCurrent(); },
    });
  }

  setTagStatus(item: RfidTag, event: Event): void {
    const status = (event.target as HTMLSelectElement).value as RfidTag['status'];
    if (status === item.status) return;
    const request = status === 'LOST' ? this.service.markRfidLost(item.id) : this.service.updateRfidStatus(item.id, { status });
    request.subscribe({
      next: updated => this.updateTag(updated, `RFID tag status updated to ${status}.`),
      error: error => { this.notifications.show(this.errorMessage(error), 'error'); this.loadCurrent(); },
    });
  }

  removeTagAssignment(item: RfidTag): void {
    this.service.removeRfidAssignment(item.id).subscribe({
      next: updated => this.updateTag(updated, 'RFID tag assignment removed.'),
      error: error => this.notifications.show(this.errorMessage(error), 'error'),
    });
  }

  scanTag(item: RfidTag): void {
    this.service.scanRfid(item.tagCode).subscribe({
      next: updated => this.updateTag(updated, 'Software RFID scan recorded.'),
      error: error => this.notifications.show(this.errorMessage(error), 'error'),
    });
  }

  viewBarcode(item: Barcode): void {
    this.service.findBarcodeById(item.id).subscribe({
      next: record => this.detail.set(record),
      error: error => this.notifications.show(this.errorMessage(error), 'error'),
    });
  }

  viewTag(item: RfidTag): void {
    this.service.findRfidById(item.id).subscribe({
      next: record => this.detail.set(record),
      error: error => this.notifications.show(this.errorMessage(error), 'error'),
    });
  }

  isBarcodeDetail(record: Barcode | RfidTag): record is Barcode {
    return 'barcodeNumber' in record;
  }

  private loadChoices(): void {
    forkJoin({
      products: this.productService.findAll({ name: '', sku: '', categoryId: '', status: '', page: 0, size: 100, sort: 'name', direction: 'asc' }),
      locations: this.locationService.findAll({ search: '', type: '', status: '', page: 0, size: 100, sort: 'name', direction: 'asc' }),
    }).subscribe({
      next: result => { this.products.set(result.products.content); this.locations.set(result.locations.content); },
      error: error => this.notifications.show(`Could not load assignment choices: ${this.errorMessage(error)}`, 'error'),
    });
  }

  private updateTag(updated: RfidTag, message: string): void {
    this.tags.update(items => items.map(row => row.id === updated.id ? updated : row));
    this.notifications.show(message, 'success');
  }

  private setPageInfo(totalPages: number, totalElements: number): void {
    this.totalPages.set(totalPages);
    this.totalElements.set(totalElements);
    this.loading.set(false);
  }

  private created(message: string): void {
    this.notifications.show(message, 'success');
    this.closeCreate();
    this.page.set(0);
    this.loadCurrent();
    this.saving.set(false);
  }

  private errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error as { message?: string; detail?: string; errors?: Record<string, string> } | null;
      if (body?.message) return body.message;
      if (body?.detail) return body.detail;
      if (body?.errors) return Object.values(body.errors).join(', ');
      if (error.status === 0) return 'Could not connect to the server. Check your connection and try again.';
    }
    return 'An unexpected error occurred. Please try again.';
  }
}
