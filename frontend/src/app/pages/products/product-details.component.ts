import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { Product } from '../../models/api.models';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, DecimalPipe],
  template: `
    <div class="dialog-backdrop" (click)="close.emit()">
      <section class="dialog" role="dialog" aria-modal="true" aria-labelledby="product-details-title" (click)="$event.stopPropagation()">
        <header class="details-heading">
          <div><p class="eyebrow">PRODUCT DETAILS</p><h2 id="product-details-title">{{ product().name }}</h2><p class="details-sku">{{ product().sku }}</p></div>
          <button class="icon-button" type="button" aria-label="Close details" (click)="close.emit()">×</button>
        </header>
        <div class="details-grid">
          <div><span>Category</span><strong>{{ product().category }}</strong></div>
          <div><span>Supplier</span><strong>{{ product().supplier || '—' }}</strong></div>
          <div><span>Price</span><strong>{{ product().price | currency }}</strong></div>
          <div><span>Cost price</span><strong>{{ product().costPrice | currency }}</strong></div>
          <div><span>Reorder level</span><strong>{{ product().reorderLevel | number }}</strong></div>
          <div><span>Status</span><strong>{{ statusLabel() }}</strong></div>
          <div><span>Barcode</span><strong>{{ product().barcode || '—' }}</strong></div>
          <div><span>Created</span><strong>{{ product().createdAt | date:'mediumDate' }}</strong></div>
          <div><span>Last updated</span><strong>{{ product().updatedAt | date:'mediumDate' }}</strong></div>
          <div class="description-detail"><span>Description</span><p>{{ product().description || 'No description provided.' }}</p></div>
        </div>
        <footer class="details-actions"><button class="secondary-button" type="button" (click)="close.emit()">Close</button><button class="primary-button" type="button" (click)="edit.emit(product())">Edit product</button></footer>
      </section>
    </div>
  `,
  styles: `
    .dialog-backdrop { position:fixed; z-index:1100; inset:0; display:grid; place-items:center; overflow:auto; padding:22px; background:#10251bb0; }
    .dialog { width:min(590px,100%); max-height:90vh; overflow:auto; border:1px solid #e6ece8; border-radius:18px; background:#fff; box-shadow:0 25px 90px #07150d45; }
    .details-heading { display:flex; justify-content:space-between; gap:18px; padding:23px 25px 18px; border-bottom:1px solid #edf0ee; }
    .eyebrow { margin:0 0 8px; color:#78857d; font-size:10px; font-weight:750; letter-spacing:.13em; }
    h2 { margin:0; font:800 21px 'Manrope',sans-serif; }
    .details-sku { margin:7px 0 0; color:#849088; font-size:11px; }
    .icon-button { display:grid; width:34px; height:34px; flex:0 0 auto; place-items:center; border:0; border-radius:9px; background:#f2f5f3; color:#526158; font-size:22px; cursor:pointer; }
    .details-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:17px 20px; padding:22px 25px; }
    .details-grid > div > span { display:block; margin-bottom:5px; color:#89948d; font-size:10px; }
    .details-grid strong { color:#344239; font-size:12px; font-weight:650; }
    .description-detail { grid-column:1/-1; }
    .description-detail p { margin:0; color:#56635a; font-size:12px; line-height:1.5; }
    .details-actions { display:flex; justify-content:flex-end; gap:9px; padding:14px 25px 20px; border-top:1px solid #edf0ee; }
    .primary-button,.secondary-button { min-height:39px; padding:0 14px; border-radius:9px; font:650 12px 'DM Sans',sans-serif; cursor:pointer; }
    .primary-button { border:1px solid #238353; background:#238353; color:white; }
    .secondary-button { border:1px solid #dfe7e1; background:#fff; color:#536158; }
    @media (max-width:560px) { .dialog-backdrop { align-items:end; padding:0; } .dialog { max-height:94vh; border-radius:18px 18px 0 0; } .details-heading { padding:20px 18px 16px; } .details-grid { padding:18px; gap:14px; } .details-actions { padding:13px 18px 19px; } }
  `,
})
export class ProductDetailsComponent {
  readonly product = input.required<Product>();
  readonly close = output<void>();
  readonly edit = output<Product>();

  protected statusLabel(): string {
    const status = this.product().status;
    return status.charAt(0) + status.slice(1).toLowerCase();
  }
}
