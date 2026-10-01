import { CurrencyPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreatePurchaseOrderRequest, Product, Supplier, Location } from '../../models/api.models';

type ItemControls = {
  productId: FormControl<string>;
  quantity: FormControl<string>;
  unitPrice: FormControl<string>;
};
type PurchaseOrderControls = {
  orderNumber: FormControl<string>;
  supplierId: FormControl<string>;
  locationId: FormControl<string>;
  orderDate: FormControl<string>;
  expectedDate: FormControl<string>;
  notes: FormControl<string>;
  items: FormArray<FormGroup<ItemControls>>;
};

@Component({
  selector: 'app-purchase-order-form',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe],
  template: `
    <div class="dialog-backdrop" (click)="cancel.emit()">
      <section class="dialog purchase-dialog" role="dialog" aria-modal="true" aria-labelledby="purchase-form-title" (click)="$event.stopPropagation()">
        <header class="dialog-heading">
          <div><p class="eyebrow">PURCHASING</p><h2 id="purchase-form-title">Create purchase order</h2><p>New orders are created as drafts. Inventory is updated only when received.</p></div>
          <button class="icon-button" type="button" aria-label="Close purchase order form" (click)="cancel.emit()">×</button>
        </header>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="form-grid">
            <label>Order number <span>*</span><input formControlName="orderNumber" maxlength="40" placeholder="e.g. PO-2026-001">@if(invalid('orderNumber')){<small class="field-error">Enter an order number (max 40 characters).</small>}</label>
            <label>Supplier <span>*</span><select formControlName="supplierId"><option value="">Select supplier</option>@for(supplier of suppliers();track supplier.id){<option [value]="supplier.id">{{supplier.name}} · {{supplier.supplierCode}}</option>}</select>@if(invalid('supplierId')){<small class="field-error">Select a supplier.</small>}</label>
            <label>Location <span>*</span><select formControlName="locationId"><option value="">Select location</option>@for(location of locations();track location.id){<option [value]="location.id">{{location.name}} · {{location.locationCode}}</option>}</select>@if(invalid('locationId')){<small class="field-error">Select a location.</small>}</label>
            <label>Order date<input type="datetime-local" formControlName="orderDate"></label>
            <label>Expected date<input type="datetime-local" formControlName="expectedDate"></label>
            <label class="full-width">Notes<textarea formControlName="notes" maxlength="500" rows="2" placeholder="Optional notes"></textarea>@if(invalid('notes')){<small class="field-error">Notes must be 500 characters or fewer.</small>}</label>
          </div>

          <section class="items-section">
            <header class="items-heading"><div><h3>Order items</h3><p>Add each product once; quantities and prices are validated by the backend.</p></div><button class="add-item" type="button" (click)="addItem()">＋ Add item</button></header>
            <div class="items-list" formArrayName="items">
              @for(item of items.controls;track $index;let i=$index){
                <div class="item-row" [formGroupName]="i">
                  <label class="product-choice">Product <span>*</span><select formControlName="productId"><option value="">Select product</option>@for(product of products();track product.id){<option [value]="product.id">{{product.name}} · {{product.sku}}</option>}</select>@if(item.controls.productId.invalid&&(item.controls.productId.touched||item.controls.productId.dirty)){<small class="field-error">Select a product.</small>}</label>
                  <label>Quantity <span>*</span><input type="number" min="0.001" step="0.001" formControlName="quantity" placeholder="0.000">@if(item.controls.quantity.invalid&&(item.controls.quantity.touched||item.controls.quantity.dirty)){<small class="field-error">Enter a quantity greater than zero.</small>}</label>
                  <label>Unit price <span>*</span><input type="number" min="0" step="0.01" formControlName="unitPrice" placeholder="0.00">@if(item.controls.unitPrice.invalid&&(item.controls.unitPrice.touched||item.controls.unitPrice.dirty)){<small class="field-error">Enter a non-negative unit price.</small>}</label>
                  <div class="subtotal"><span>Subtotal</span><strong>{{itemSubtotal(i)|currency}}</strong></div>
                  <button class="remove-item" type="button" (click)="removeItem(i)" [disabled]="items.length===1" [attr.aria-label]="'Remove order item ' + (i+1)">×</button>
                </div>
              }
            </div>
            @if(duplicateProducts()){<p class="field-error duplicate-error">Each product can appear only once per purchase order.</p>}
            <div class="order-total"><span>Total amount</span><strong>{{totalAmount()|currency}}</strong></div>
          </section>
          <footer class="form-actions"><button class="secondary-button" type="button" (click)="cancel.emit()">Cancel</button><button class="primary-button" type="submit" [disabled]="saving()">{{saving()?'Creating…':'Create draft order'}}</button></footer>
        </form>
      </section>
    </div>
  `,
  styleUrl: './purchase-order-form.component.css',
})
export class PurchaseOrderFormComponent {
  readonly products = input<Product[]>([]);
  readonly suppliers = input<Supplier[]>([]);
  readonly locations = input<Location[]>([]);
  readonly saving = input(false);
  readonly save = output<CreatePurchaseOrderRequest>();
  readonly cancel = output<void>();

  protected readonly form = new FormGroup<PurchaseOrderControls>({
    orderNumber: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/\S/), Validators.maxLength(40)] }),
    supplierId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    locationId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    orderDate: new FormControl(this.localDateTimeValue(), { nonNullable: true }),
    expectedDate: new FormControl('', { nonNullable: true }),
    notes: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(500)] }),
    items: new FormArray<FormGroup<ItemControls>>([this.createItem()]),
  });

  protected get items(): FormArray<FormGroup<ItemControls>> { return this.form.controls.items; }

  protected invalid(field: 'orderNumber' | 'supplierId' | 'locationId' | 'notes'): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.touched || control.dirty);
  }

  protected addItem(): void { this.items.push(this.createItem()); }

  protected removeItem(index: number): void {
    if (this.items.length > 1) this.items.removeAt(index);
  }

  protected itemSubtotal(index: number): number {
    const item = this.items.at(index).getRawValue();
    return this.numeric(item.quantity) * this.numeric(item.unitPrice);
  }

  protected totalAmount(): number {
    return this.items.controls.reduce((total, item) => {
      const value = item.getRawValue();
      return total + this.numeric(value.quantity) * this.numeric(value.unitPrice);
    }, 0);
  }

  protected duplicateProducts(): boolean {
    const selected = this.items.controls.map((item) => item.controls.productId.value).filter(Boolean);
    return new Set(selected).size !== selected.length;
  }

  protected submit(): void {
    if (this.form.invalid || this.duplicateProducts()) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const dateValue = (date: string): string | null => date ? `${date}:00` : null;
    this.save.emit({
      orderNumber: value.orderNumber.trim(),
      supplierId: Number(value.supplierId),
      locationId: Number(value.locationId),
      orderDate: dateValue(value.orderDate),
      expectedDate: dateValue(value.expectedDate),
      notes: value.notes.trim() || null,
      items: value.items.map((item) => ({
        productId: Number(item.productId),
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
      })),
    });
  }

  private createItem(): FormGroup<ItemControls> {
    return new FormGroup<ItemControls>({
      productId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      quantity: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.min(0.001)] }),
      unitPrice: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    });
  }

  private numeric(value: string): number {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  private localDateTimeValue(): string {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  }
}
