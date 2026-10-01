import { Component, OnInit, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Location, LocationRequest } from '../../models/api.models';

type LocationControls = {
  locationCode: FormControl<string>;
  name: FormControl<string>;
  type: FormControl<Location['type']>;
  address: FormControl<string>;
  city: FormControl<string>;
  state: FormControl<string>;
  country: FormControl<string>;
  phone: FormControl<string>;
  managerName: FormControl<string>;
  status: FormControl<Location['status']>;
};

@Component({
  selector: 'app-location-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="dialog-backdrop" (click)="cancel.emit()">
      <section class="dialog" role="dialog" aria-modal="true" aria-labelledby="location-form-title" (click)="$event.stopPropagation()">
        <header class="dialog-heading"><div><p class="eyebrow">LOCATION DIRECTORY</p><h2 id="location-form-title">{{ location() ? 'Edit location' : 'Add location' }}</h2><p>Location code, name and type are required.</p></div><button class="icon-button" type="button" aria-label="Close location form" (click)="cancel.emit()">×</button></header>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="form-grid">
            <label>Location code <span>*</span><input formControlName="locationCode" maxlength="30" placeholder="e.g. WH-001">@if (invalid('locationCode')) { <small class="field-error">Enter a location code (max 30 characters).</small> }</label>
            <label>Location name <span>*</span><input formControlName="name" maxlength="100" placeholder="Store or warehouse name">@if (invalid('name')) { <small class="field-error">Enter a name (max 100 characters).</small> }</label>
            <label>Type <span>*</span><select formControlName="type"><option value="STORE">Store</option><option value="WAREHOUSE">Warehouse</option></select></label>
            <label>Status <span>*</span><select formControlName="status"><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label>
            <label>Manager name<input formControlName="managerName" maxlength="100"></label>
            <label>Phone<input type="tel" formControlName="phone" maxlength="30" placeholder="+1 555 0100">@if (invalid('phone')) { <small class="field-error">Use a valid phone number (7–30 characters).</small> }</label>
            <label class="full-width">Address<input formControlName="address" maxlength="500" placeholder="Street address"></label>
            <label>City<input formControlName="city" maxlength="100"></label>
            <label>State / region<input formControlName="state" maxlength="100"></label>
            <label>Country<input formControlName="country" maxlength="100"></label>
          </div>
          <footer class="form-actions"><button class="secondary-button" type="button" (click)="cancel.emit()">Cancel</button><button class="primary-button" type="submit" [disabled]="saving()">{{ saving() ? 'Saving…' : location() ? 'Save changes' : 'Add location' }}</button></footer>
        </form>
      </section>
    </div>
  `,
  styleUrl: '../inventory/inventory-dialog.component.css',
})
export class LocationFormComponent implements OnInit {
  readonly location = input<Location | null>(null);
  readonly saving = input(false);
  readonly save = output<LocationRequest>();
  readonly cancel = output<void>();

  protected readonly form = new FormGroup<LocationControls>({
    locationCode: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/\S/), Validators.maxLength(30)] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)] }),
    type: new FormControl('STORE', { nonNullable: true, validators: [Validators.required] }),
    address: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(500)] }),
    city: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(100)] }),
    state: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(100)] }),
    country: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(100)] }),
    phone: new FormControl('', { nonNullable: true, validators: [Validators.pattern(/^[+0-9() .-]{7,30}$/), Validators.maxLength(30)] }),
    managerName: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(100)] }),
    status: new FormControl('ACTIVE', { nonNullable: true, validators: [Validators.required] }),
  });

  ngOnInit(): void {
    const location = this.location();
    if (location) this.form.patchValue({
      locationCode: location.locationCode,
      name: location.name,
      type: location.type,
      address: location.address ?? '',
      city: location.city ?? '',
      state: location.state ?? '',
      country: location.country ?? '',
      phone: location.phone ?? '',
      managerName: location.managerName ?? '',
      status: location.status,
    });
  }

  protected invalid(field: keyof LocationControls): boolean {
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
      locationCode: value.locationCode.trim(),
      name: value.name.trim(),
      type: value.type,
      address: optional(value.address),
      city: optional(value.city),
      state: optional(value.state),
      country: optional(value.country),
      phone: optional(value.phone),
      managerName: optional(value.managerName),
      status: value.status,
    });
  }
}
