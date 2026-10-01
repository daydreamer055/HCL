import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InventoryService } from '../../core/services/inventory.service';
import { NotificationService } from '../../core/services/notification.service';
import { CreateSalesOrderRequest, InventoryResponse, Location, Product } from '../../models/api.models';

type ItemControls = { productId: FormControl<string>; quantity: FormControl<string> };
type SalesOrderControls = {
  orderNumber: FormControl<string>;
  locationId: FormControl<string>;
  orderDate: FormControl<string>;
  customerName: FormControl<string>;
  items: FormArray<FormGroup<ItemControls>>;
};

@Component({
  selector: 'app-sales-order-form',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe, DecimalPipe],
  template: `
    <div class="dialog-backdrop" (click)="cancel.emit()">
      <section class="dialog sales-dialog" role="dialog" aria-modal="true" aria-labelledby="sales-form-title" (click)="$event.stopPropagation()">
        <header class="dialog-heading"><div><p class="eyebrow">SALES</p><h2 id="sales-form-title">Create sales order</h2><p>Available stock is shown for the selected location. The backend checks stock again when saving and completing.</p></div><button class="icon-button" type="button" aria-label="Close sales order form" (click)="cancel.emit()">×</button></header>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="form-grid">
            <label>Order number <span>*</span><input formControlName="orderNumber" maxlength="40" placeholder="e.g. SO-2026-001">@if(invalid('orderNumber')){<small class="field-error">Enter an order number (max 40 characters).</small>}</label>
            <label>Location <span>*</span><select formControlName="locationId"><option value="">Select location</option>@for(location of locations();track location.id){<option [value]="location.id">{{location.name}} · {{location.locationCode}}</option>}</select>@if(invalid('locationId')){<small class="field-error">Select a location.</small>}</label>
            <label>Order date<input type="datetime-local" formControlName="orderDate"></label>
            <label>Customer name<input formControlName="customerName" maxlength="150" placeholder="Optional"></label>
          </div>

          @if(stockLoading()){<div class="stock-notice" role="status"><i class="spinner"></i> Loading available stock for this location…</div>}
          @if(stockError();as message){<div class="stock-error" role="alert">{{message}} Stock quantities cannot be verified right now; the backend will validate the order.</div>}
          @if(form.controls.locationId.value && !stockLoading() && !stockError()){<p class="stock-note">Available quantity is on-hand stock minus reservations.</p>}

          <section class="items-section">
            <header class="items-heading"><div><h3>Order items</h3><p>Each product may be added once per order.</p></div><button class="add-item" type="button" (click)="addItem()">＋ Add item</button></header>
            <div class="items-list" formArrayName="items">
              @for(item of items.controls;track $index;let i=$index){
                <div class="item-row" [formGroupName]="i">
                  <label class="product-choice">Product <span>*</span><select formControlName="productId" (change)="productChanged(i)"><option value="">Select product</option>
                    @for(product of products();track product.id){<option [value]="product.id" [disabled]="stockReady() && (availableFor(product.id) ?? 0) <= 0">{{product.name}} · {{product.sku}}@if(stockReady()){ · available {{availableFor(product.id) ?? 0|number:'1.0-3'}}}</option>}
                  </select>@if(item.controls.productId.invalid&&(item.controls.productId.touched||item.controls.productId.dirty)){<small class="field-error">Select a product.</small>}</label>
                  <div class="availability"><span>Available</span><strong>{{selectedAvailable(i)===null?'—':(selectedAvailable(i)!|number:'1.0-3')}}</strong></div>
                  <label>Quantity <span>*</span><input type="number" min="0.001" [max]="selectedAvailable(i) ?? null" step="0.001" formControlName="quantity" (input)="validateQuantity(i)" placeholder="0.000">
                    @if(item.controls.quantity.invalid&&(item.controls.quantity.touched||item.controls.quantity.dirty)){<small class="field-error">{{quantityError(i)}}</small>}
                  </label>
                  <div class="unit-price"><span>Unit price</span><strong>{{selectedProductPrice(i)|currency}}</strong></div>
                  <div class="subtotal"><span>Subtotal</span><strong>{{itemSubtotal(i)|currency}}</strong></div>
                  <button class="remove-item" type="button" (click)="removeItem(i)" [disabled]="items.length===1" [attr.aria-label]="'Remove sales item ' + (i+1)">×</button>
                </div>
              }
            </div>
            @if(duplicateProducts()){<p class="field-error duplicate-error">Each product can appear only once per sales order.</p>}
            <div class="order-total"><span>Total amount</span><strong>{{totalAmount()|currency}}</strong></div>
          </section>
          <footer class="form-actions"><button class="secondary-button" type="button" (click)="cancel.emit()">Cancel</button><button class="primary-button" type="submit" [disabled]="saving()">{{saving()?'Creating…':'Create pending order'}}</button></footer>
        </form>
      </section>
    </div>
  `,
  styleUrl: './sales-order-form.component.css',
})
export class SalesOrderFormComponent implements OnInit {
  readonly products = input<Product[]>([]);
  readonly locations = input<Location[]>([]);
  readonly saving = input(false);
  readonly save = output<CreateSalesOrderRequest>();
  readonly cancel = output<void>();

  private readonly inventoryService = inject(InventoryService);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly inventory = signal<InventoryResponse[]>([]);
  protected readonly stockLoading = signal(false);
  protected readonly stockError = signal<string | null>(null);
  protected readonly form = new FormGroup<SalesOrderControls>({
    orderNumber: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/\S/), Validators.maxLength(40)] }),
    locationId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    orderDate: new FormControl(this.localDateTimeValue(), { nonNullable: true }),
    customerName: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(150)] }),
    items: new FormArray<FormGroup<ItemControls>>([this.createItem()]),
  });

  ngOnInit(): void {
    this.form.controls.locationId.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((locationId) => {
      this.loadStock(locationId);
    });
  }

  protected get items(): FormArray<FormGroup<ItemControls>> { return this.form.controls.items; }

  protected invalid(field: 'orderNumber' | 'locationId'): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.touched || control.dirty);
  }

  protected addItem(): void { this.items.push(this.createItem()); }
  protected removeItem(index: number): void { if (this.items.length > 1) this.items.removeAt(index); }

  protected productChanged(index: number): void {
    const item = this.items.at(index);
    item.controls.quantity.updateValueAndValidity();
    this.validateQuantity(index);
  }

  protected stockReady(): boolean {
    return Boolean(this.form.controls.locationId.value) && !this.stockLoading() && !this.stockError();
  }

  protected selectedAvailable(index: number): number | null {
    const productId = Number(this.items.at(index).controls.productId.value);
    if (!productId || !this.form.controls.locationId.value || this.stockLoading() || this.stockError()) return null;
    return this.inventory().find((row) => row.productId === productId)?.availableQuantity ?? 0;
  }

  protected availableFor(productId: number): number | null {
    if (!this.form.controls.locationId.value || this.stockLoading() || this.stockError()) return null;
    return this.inventory().find((row) => row.productId === productId)?.availableQuantity ?? 0;
  }

  protected selectedProductPrice(index: number): number {
    const productId = Number(this.items.at(index).controls.productId.value);
    return this.products().find((product) => product.id === productId)?.price ?? 0;
  }

  protected itemSubtotal(index: number): number {
    const quantity = Number(this.items.at(index).controls.quantity.value);
    return (Number.isFinite(quantity) ? quantity : 0) * this.selectedProductPrice(index);
  }

  protected totalAmount(): number {
    return this.items.controls.reduce((total, _item, index) => total + this.itemSubtotal(index), 0);
  }

  protected duplicateProducts(): boolean {
    const ids = this.items.controls.map((item) => item.controls.productId.value).filter(Boolean);
    return new Set(ids).size !== ids.length;
  }

  protected quantityError(index: number): string {
    const control = this.items.at(index).controls.quantity;
    if (control.hasError('min') || control.hasError('required')) return 'Enter a quantity greater than zero.';
    if (control.hasError('exceedsAvailable')) return `Quantity exceeds available stock (${this.selectedAvailable(index)}).`;
    return 'Enter a valid quantity.';
  }

  protected validateQuantity(index: number): void {
    const control = this.items.at(index).controls.quantity;
    const available = this.selectedAvailable(index);
    if (available !== null && Number(control.value) > available) {
      control.setErrors({ ...control.errors, exceedsAvailable: true });
    } else if (control.hasError('exceedsAvailable')) {
      const errors = { ...control.errors };
      delete errors['exceedsAvailable'];
      control.setErrors(Object.keys(errors).length ? errors : null);
    }
  }

  protected submit(): void {
    this.items.controls.forEach((_item, index) => this.validateQuantity(index));
    if (this.form.controls.locationId.value && this.stockLoading()) {
      this.notifications.show('Wait for available stock to load before creating the sales order.', 'info');
      return;
    }
    if (this.form.invalid || this.duplicateProducts()) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const selectedProducts = value.items.map((item) => this.products().find((product) => product.id === Number(item.productId)));
    if (selectedProducts.some((product) => !product)) {
      this.notifications.show('A selected product is no longer available. Refresh the page and try again.', 'error');
      return;
    }
    const localDateTime = value.orderDate ? `${value.orderDate}:00` : null;
    this.save.emit({
      orderNumber: value.orderNumber.trim(),
      locationId: Number(value.locationId),
      orderDate: localDateTime,
      customerName: value.customerName.trim() || null,
      items: value.items.map((item, index) => ({
        productId: Number(item.productId),
        quantity: Number(item.quantity),
        unitPrice: selectedProducts[index]!.price,
      })),
    });
  }

  private createItem(): FormGroup<ItemControls> {
    return new FormGroup<ItemControls>({
      productId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      quantity: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.min(0.001)] }),
    });
  }

  private loadStock(locationId: string): void {
    this.inventory.set([]);
    this.stockError.set(null);
    if (!locationId) {
      this.stockLoading.set(false);
      return;
    }
    this.stockLoading.set(true);
    this.inventoryService.findAll({
      search: '',
      locationId,
      lowStock: false,
      outOfStock: false,
      page: 0,
      size: 1000,
      sort: 'product.name',
      direction: 'asc',
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.inventory.set(response.content);
        this.stockLoading.set(false);
        this.items.controls.forEach((_item, index) => this.validateQuantity(index));
      },
      error: (error: unknown) => {
        this.stockLoading.set(false);
        this.stockError.set(this.errorMessage(error));
        this.notifications.show(this.errorMessage(error), 'error');
      },
    });
  }

  private errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error?.message === 'string') return error.error.message;
      if (error.status === 0) return 'Could not reach the StockSmart API. Check your connection and try again.';
      return `Could not load stock availability (HTTP ${error.status}).`;
    }
    return 'Could not load stock availability.';
  }

  private localDateTimeValue(): string {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }
}
