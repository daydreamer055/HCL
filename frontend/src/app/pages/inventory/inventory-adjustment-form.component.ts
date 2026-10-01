import { Component, OnInit, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LocationResponse, Product } from '../../models/api.models';
import { StockAdjustmentRequest } from '../../core/services/inventory.service';
import { InventoryResponse } from '../../models/api.models';

type AdjustmentControls = {
  productId: FormControl<string>;
  locationId: FormControl<string>;
  quantity: FormControl<string>;
  direction: FormControl<'INCREASE' | 'DECREASE'>;
  notes: FormControl<string>;
};

@Component({
  selector: 'app-inventory-adjustment-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="dialog-backdrop" (click)="cancel.emit()">
      <section class="dialog" role="dialog" aria-modal="true" aria-labelledby="adjustment-title" (click)="$event.stopPropagation()">
        <header class="dialog-heading">
          <div><p class="eyebrow">INVENTORY</p><h2 id="adjustment-title">Adjust stock</h2><p>Adjustments are validated and recorded by the backend.</p></div>
          <button class="icon-button" type="button" aria-label="Close adjustment form" (click)="cancel.emit()">×</button>
        </header>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="form-grid">
            <label>Product <span>*</span>
              <select formControlName="productId"><option value="">Select product</option>
                @for (product of products(); track product.id) { <option [value]="product.id">{{ product.name }} · {{ product.sku }}</option> }
              </select>
              @if (invalid('productId')) { <small class="field-error">Select a product.</small> }
            </label>
            <label>Location <span>*</span>
              <select formControlName="locationId"><option value="">Select location</option>
                @for (location of locations(); track location.id) { <option [value]="location.id">{{ location.name }} · {{ location.locationCode }}</option> }
              </select>
              @if (invalid('locationId')) { <small class="field-error">Select a location.</small> }
            </label>
            <label>Adjustment type <span>*</span>
              <select formControlName="direction"><option value="INCREASE">Add stock</option><option value="DECREASE">Remove stock</option></select>
            </label>
            <label>Quantity <span>*</span>
              <input type="number" min="0.001" step="0.001" formControlName="quantity" placeholder="0.000">
              @if (invalid('quantity')) { <small class="field-error">Enter a quantity greater than zero.</small> }
            </label>
            <label class="full-width">Reason / notes
              <textarea formControlName="notes" maxlength="500" rows="3" placeholder="Why is this stock being adjusted?"></textarea>
              @if (invalid('notes')) { <small class="field-error">Notes must be 500 characters or fewer.</small> }
            </label>
          </div>
          <footer class="form-actions">
            <button class="secondary-button" type="button" (click)="cancel.emit()">Cancel</button>
            <button class="primary-button" type="submit" [disabled]="saving()">{{ saving() ? 'Saving…' : 'Apply adjustment' }}</button>
          </footer>
        </form>
      </section>
    </div>
  `,
  styleUrl: './inventory-dialog.component.css',
})
export class InventoryAdjustmentFormComponent {
  readonly products = input<Product[]>([]);
  readonly locations = input<LocationResponse[]>([]);
  readonly inventoryItem = input<InventoryResponse | null>(null);
  readonly saving = input(false);
  readonly save = output<StockAdjustmentRequest>();
  readonly cancel = output<void>();

  protected readonly form = new FormGroup<AdjustmentControls>({
    productId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    locationId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    quantity: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.min(0.001)] }),
    direction: new FormControl('INCREASE', { nonNullable: true, validators: [Validators.required] }),
    notes: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(500)] }),
  });

  ngOnInit(): void {
    const item = this.inventoryItem();
    if (item) {
      this.form.patchValue({ productId: String(item.productId), locationId: String(item.locationId) });
    }
  }

  protected invalid(field: keyof AdjustmentControls): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.touched || control.dirty);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const quantity = Number(value.quantity) * (value.direction === 'DECREASE' ? -1 : 1);
    this.save.emit({
      productId: Number(value.productId),
      locationId: Number(value.locationId),
      quantityDelta: quantity,
      notes: value.notes.trim() || null,
    });
  }
}
