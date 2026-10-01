import { Component, OnInit, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Product, ProductRequest, SupplierResponse } from '../../models/api.models';

type ProductFormControls = {
  sku: FormControl<string>;
  name: FormControl<string>;
  description: FormControl<string>;
  categoryId: FormControl<string>;
  supplierId: FormControl<string>;
  price: FormControl<string>;
  costPrice: FormControl<string>;
  reorderLevel: FormControl<string>;
  barcode: FormControl<string>;
  barcodeSymbology: FormControl<string>;
  status: FormControl<Product['status']>;
};

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="dialog-backdrop" (click)="cancel.emit()">
      <section class="dialog product-dialog" role="dialog" aria-modal="true" aria-labelledby="product-form-title" (click)="$event.stopPropagation()">
        <header class="dialog-heading">
          <div>
            <p class="eyebrow">PRODUCT CATALOG</p>
            <h2 id="product-form-title">{{ product() ? 'Edit product' : 'Add product' }}</h2>
            <p>Enter product details and inventory thresholds.</p>
          </div>
          <button class="icon-button" type="button" aria-label="Close form" (click)="cancel.emit()">×</button>
        </header>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="form-grid">
            <label>SKU <span>*</span>
              <input formControlName="sku" maxlength="50" autocomplete="off" placeholder="e.g. SKU-1001">
              @if (invalid('sku')) { <small class="field-error">Enter a non-empty SKU (max 50 characters).</small> }
            </label>
            <label>Product name <span>*</span>
              <input formControlName="name" maxlength="150" autocomplete="off" placeholder="Product name">
              @if (invalid('name')) { <small class="field-error">Enter a non-empty name (max 150 characters).</small> }
            </label>
            <label>Category ID <span>*</span>
              <input type="number" min="1" step="1" formControlName="categoryId" placeholder="Enter category ID">
              <small class="hint">Use the category ID configured in StockSmart.</small>
              @if (invalid('categoryId')) { <small class="field-error">Enter a valid category ID greater than zero.</small> }
            </label>
            <label>Supplier
              <select formControlName="supplierId">
                <option value="">No supplier</option>
                @for (supplier of suppliers(); track supplier.id) {
                  <option [value]="supplier.id">{{ supplier.name }} ({{ supplier.supplierCode }})</option>
                }
              </select>
            </label>
            <label>Price <span>*</span>
              <input type="number" min="0.01" step="0.01" formControlName="price" placeholder="0.00">
              @if (invalid('price')) { <small class="field-error">Price must be greater than zero.</small> }
            </label>
            <label>Cost price <span>*</span>
              <input type="number" min="0.01" step="0.01" formControlName="costPrice" placeholder="0.00">
              @if (invalid('costPrice')) { <small class="field-error">Cost price must be greater than zero.</small> }
            </label>
            <label>Reorder level <span>*</span>
              <input type="number" min="0" step="0.01" formControlName="reorderLevel" placeholder="0">
              @if (invalid('reorderLevel')) { <small class="field-error">Reorder level cannot be negative.</small> }
            </label>
            <label>Status <span>*</span>
              <select formControlName="status">
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="DISCONTINUED">Discontinued</option>
              </select>
            </label>
            <label>Barcode
              <input formControlName="barcode" maxlength="100" autocomplete="off" placeholder="Optional barcode">
              @if (invalid('barcode')) { <small class="field-error">Use up to 100 letters, numbers, dots, underscores or hyphens.</small> }
            </label>
            <label>Barcode type
              <select formControlName="barcodeSymbology">
                <option value="">Other / unspecified</option>
                <option value="UPC">UPC</option>
                <option value="EAN">EAN</option>
                <option value="CODE128">Code 128</option>
                <option value="OTHER">Other</option>
              </select>
            </label>
            <label class="full-width">Description
              <textarea formControlName="description" maxlength="1000" rows="3" placeholder="Optional product description"></textarea>
            </label>
          </div>
          <footer class="form-actions">
            <button class="secondary-button" type="button" (click)="cancel.emit()">Cancel</button>
            <button class="primary-button" type="submit" [disabled]="saving()">{{ saving() ? 'Saving…' : product() ? 'Save changes' : 'Add product' }}</button>
          </footer>
        </form>
      </section>
    </div>
  `,
  styleUrl: './product-form.component.css',
})
export class ProductFormComponent implements OnInit {
  readonly product = input<Product | null>(null);
  readonly suppliers = input<SupplierResponse[]>([]);
  readonly saving = input(false);
  readonly save = output<ProductRequest>();
  readonly cancel = output<void>();

  protected readonly form = new FormGroup<ProductFormControls>({
    sku: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/\S/), Validators.maxLength(50)] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/\S/), Validators.maxLength(150)] }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(1000)] }),
    categoryId: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^[1-9]\d*$/)] }),
    supplierId: new FormControl('', { nonNullable: true }),
    price: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.min(0.01)] }),
    costPrice: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.min(0.01)] }),
    reorderLevel: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    barcode: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(100), Validators.pattern(/^[A-Za-z0-9._-]*$/)],
    }),
    barcodeSymbology: new FormControl('', { nonNullable: true }),
    status: new FormControl('ACTIVE', { nonNullable: true, validators: [Validators.required] }),
  });

  ngOnInit(): void {
    this.form.reset(this.toFormValue(this.product()));
  }

  protected invalid(name: keyof ProductFormControls): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.save.emit({
      sku: value.sku.trim(),
      name: value.name.trim(),
      description: value.description.trim() || null,
      categoryId: Number(value.categoryId),
      supplierId: value.supplierId ? Number(value.supplierId) : null,
      price: Number(value.price),
      costPrice: Number(value.costPrice),
      reorderLevel: Number(value.reorderLevel),
      barcode: value.barcode.trim() || null,
      barcodeSymbology: value.barcodeSymbology || null,
      status: value.status,
    });
  }

  private toFormValue(product: Product | null): ReturnType<FormGroup<ProductFormControls>['getRawValue']> {
    return {
      sku: product?.sku ?? '',
      name: product?.name ?? '',
      description: product?.description ?? '',
      categoryId: product ? String(product.categoryId) : '',
      supplierId: product?.supplierId ? String(product.supplierId) : '',
      price: product ? String(product.price) : '',
      costPrice: product ? String(product.costPrice) : '',
      reorderLevel: product ? String(product.reorderLevel) : '',
      barcode: product?.barcode ?? '',
      barcodeSymbology: '',
      status: product?.status ?? 'ACTIVE',
    };
  }
}
