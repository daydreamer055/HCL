import { Component, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LocationResponse, Product } from '../../models/api.models';
import { StockTransferRequest } from '../../core/services/inventory.service';

type TransferControls = {
  productId: FormControl<string>;
  sourceLocationId: FormControl<string>;
  destinationLocationId: FormControl<string>;
  quantity: FormControl<string>;
  notes: FormControl<string>;
};

@Component({
  selector: 'app-stock-transfer-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="dialog-backdrop" (click)="cancel.emit()">
      <section class="dialog" role="dialog" aria-modal="true" aria-labelledby="transfer-title" (click)="$event.stopPropagation()">
        <header class="dialog-heading">
          <div><p class="eyebrow">INVENTORY</p><h2 id="transfer-title">Transfer stock</h2><p>Stock availability and both location balances are checked by the backend.</p></div>
          <button class="icon-button" type="button" aria-label="Close transfer form" (click)="cancel.emit()">×</button>
        </header>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="form-grid">
            <label class="full-width">Product <span>*</span>
              <select formControlName="productId"><option value="">Select product</option>
                @for (product of products(); track product.id) { <option [value]="product.id">{{ product.name }} · {{ product.sku }}</option> }
              </select>
              @if (invalid('productId')) { <small class="field-error">Select a product.</small> }
            </label>
            <label>Source location <span>*</span>
              <select formControlName="sourceLocationId"><option value="">Select source</option>
                @for (location of locations(); track location.id) { <option [value]="location.id">{{ location.name }} · {{ location.locationCode }}</option> }
              </select>
              @if (invalid('sourceLocationId')) { <small class="field-error">Select a source location.</small> }
            </label>
            <label>Destination location <span>*</span>
              <select formControlName="destinationLocationId"><option value="">Select destination</option>
                @for (location of locations(); track location.id) { <option [value]="location.id">{{ location.name }} · {{ location.locationCode }}</option> }
              </select>
              @if (invalid('destinationLocationId')) { <small class="field-error">Choose a different destination.</small> }
            </label>
            <label>Quantity <span>*</span>
              <input type="number" min="0.001" step="0.001" formControlName="quantity" placeholder="0.000">
              @if (invalid('quantity')) { <small class="field-error">Enter a quantity greater than zero.</small> }
            </label>
            <label class="full-width">Notes
              <textarea formControlName="notes" maxlength="500" rows="2" placeholder="Optional transfer notes"></textarea>
              @if (invalid('notes')) { <small class="field-error">Notes must be 500 characters or fewer.</small> }
            </label>
          </div>
          <footer class="form-actions">
            <button class="secondary-button" type="button" (click)="cancel.emit()">Cancel</button>
            <button class="primary-button" type="submit" [disabled]="saving()">{{ saving() ? 'Transferring…' : 'Transfer stock' }}</button>
          </footer>
        </form>
      </section>
    </div>
  `,
  styleUrl: './inventory-dialog.component.css',
})
export class StockTransferFormComponent {
  readonly products = input<Product[]>([]);
  readonly locations = input<LocationResponse[]>([]);
  readonly saving = input(false);
  readonly save = output<StockTransferRequest>();
  readonly cancel = output<void>();

  protected readonly form = new FormGroup<TransferControls>({
    productId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    sourceLocationId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    destinationLocationId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    quantity: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.min(0.001)] }),
    notes: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(500)] }),
  });

  protected invalid(field: keyof TransferControls): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.touched || control.dirty);
  }

  protected submit(): void {
    if (this.form.invalid || this.form.controls.sourceLocationId.value === this.form.controls.destinationLocationId.value) {
      this.form.markAllAsTouched();
      this.form.controls.destinationLocationId.setErrors({ sameLocation: true });
      return;
    }
    const value = this.form.getRawValue();
    this.save.emit({
      productId: Number(value.productId),
      sourceLocationId: Number(value.sourceLocationId),
      destinationLocationId: Number(value.destinationLocationId),
      quantity: Number(value.quantity),
      notes: value.notes.trim() || null,
    });
  }
}
