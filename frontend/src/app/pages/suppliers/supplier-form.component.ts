import { Component, OnInit, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Supplier, SupplierRequest } from '../../models/api.models';

type SupplierControls = {
  supplierCode: FormControl<string>;
  name: FormControl<string>;
  contactPerson: FormControl<string>;
  email: FormControl<string>;
  phone: FormControl<string>;
  address: FormControl<string>;
  city: FormControl<string>;
  state: FormControl<string>;
  country: FormControl<string>;
  status: FormControl<Supplier['status']>;
};

@Component({
  selector: 'app-supplier-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="dialog-backdrop" (click)="cancel.emit()">
      <section class="dialog" role="dialog" aria-modal="true" aria-labelledby="supplier-form-title" (click)="$event.stopPropagation()">
        <header class="dialog-heading"><div><p class="eyebrow">SUPPLIER DIRECTORY</p><h2 id="supplier-form-title">{{ supplier() ? 'Edit supplier' : 'Add supplier' }}</h2><p>Supplier code and name are required.</p></div><button class="icon-button" type="button" aria-label="Close supplier form" (click)="cancel.emit()">×</button></header>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="form-grid">
            <label>Supplier code <span>*</span><input formControlName="supplierCode" maxlength="30" placeholder="e.g. SUP-001">@if (invalid('supplierCode')) { <small class="field-error">Enter a supplier code (max 30 characters).</small> }</label>
            <label>Company name <span>*</span><input formControlName="name" maxlength="150" placeholder="Company name">@if (invalid('name')) { <small class="field-error">Enter a name (max 150 characters).</small> }</label>
            <label>Contact person<input formControlName="contactPerson" maxlength="100" placeholder="Contact name"></label>
            <label>Email<input type="email" formControlName="email" maxlength="254" placeholder="name@example.com">@if (invalid('email')) { <small class="field-error">Enter a valid email address.</small> }</label>
            <label>Phone<input type="tel" formControlName="phone" maxlength="30" placeholder="+1 555 0100">@if (invalid('phone')) { <small class="field-error">Use a valid phone number (7–30 characters).</small> }</label>
            <label>Status <span>*</span><select formControlName="status"><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label>
            <label class="full-width">Address<input formControlName="address" maxlength="500" placeholder="Street address"></label>
            <label>City<input formControlName="city" maxlength="100"></label>
            <label>State / region<input formControlName="state" maxlength="100"></label>
            <label>Country<input formControlName="country" maxlength="100"></label>
          </div>
          <footer class="form-actions"><button class="secondary-button" type="button" (click)="cancel.emit()">Cancel</button><button class="primary-button" type="submit" [disabled]="saving()">{{ saving() ? 'Saving…' : supplier() ? 'Save changes' : 'Add supplier' }}</button></footer>
        </form>
      </section>
    </div>
  `,
  styleUrl: '../inventory/inventory-dialog.component.css',
})
export class SupplierFormComponent implements OnInit {
  readonly supplier = input<Supplier | null>(null);
  readonly saving = input(false);
  readonly save = output<SupplierRequest>();
  readonly cancel = output<void>();

  protected readonly form = new FormGroup<SupplierControls>({
    supplierCode: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/\S/), Validators.maxLength(30)] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/\S/), Validators.maxLength(150)] }),
    contactPerson: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(100)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.email, Validators.maxLength(254)] }),
    phone: new FormControl('', { nonNullable: true, validators: [Validators.pattern(/^[+0-9() .-]{7,30}$/), Validators.maxLength(30)] }),
    address: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(500)] }),
    city: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(100)] }),
    state: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(100)] }),
    country: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(100)] }),
    status: new FormControl('ACTIVE', { nonNullable: true, validators: [Validators.required] }),
  });

  ngOnInit(): void {
    const supplier = this.supplier();
    if (supplier) this.form.patchValue({
      supplierCode: supplier.supplierCode,
      name: supplier.name,
      contactPerson: supplier.contactPerson ?? '',
      email: supplier.email ?? '',
      phone: supplier.phone ?? '',
      address: supplier.address ?? '',
      city: supplier.city ?? '',
      state: supplier.state ?? '',
      country: supplier.country ?? '',
      status: supplier.status,
    });
  }

  protected invalid(field: keyof SupplierControls): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.touched || control.dirty);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const optional = (text: string): string | null => text.trim() || null;
    this.save.emit({
      supplierCode: value.supplierCode.trim(),
      name: value.name.trim(),
      contactPerson: optional(value.contactPerson),
      email: optional(value.email),
      phone: optional(value.phone),
      address: optional(value.address),
      city: optional(value.city),
      state: optional(value.state),
      country: optional(value.country),
      status: value.status,
    });
  }
}
