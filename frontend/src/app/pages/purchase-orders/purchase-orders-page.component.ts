import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subscription, debounceTime } from 'rxjs';
import { LocationService } from '../../core/services/location.service';
import { NotificationService } from '../../core/services/notification.service';
import { ProductService } from '../../core/services/product.service';
import { PurchaseOrderService } from '../../core/services/purchase-order.service';
import { SupplierService } from '../../core/services/supplier.service';
import {
  CreatePurchaseOrderRequest,
  Location,
  PageResponse,
  Product,
  PurchaseOrder,
  Supplier,
} from '../../models/api.models';
import { PurchaseOrderFormComponent } from './purchase-order-form.component';

type OrderFilters = {
  orderNumber: FormControl<string>;
  supplierId: FormControl<string>;
  locationId: FormControl<string>;
  status: FormControl<string>;
};
type DateFilters = { from: FormControl<string>; to: FormControl<string> };
type OrderSort = 'orderNumber' | 'orderDate' | 'totalAmount' | 'status';

@Component({
  selector: 'app-purchase-orders-page',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe, DecimalPipe, PurchaseOrderFormComponent],
  template: `
    <section class="page-heading">
      <div><p class="eyebrow">STOCKSMART / PURCHASING</p><h1>Purchase orders</h1><p class="description">Create orders, track supplier deliveries, and receive stock into inventory.</p></div>
      <button class="primary-button" type="button" (click)="openCreate()">＋ New purchase order</button>
    </section>

    <section class="summary">
      <span class="summary-icon">↓</span><div><strong>{{totalElements()|number}}</strong><small>purchase orders</small></div>
      <span class="summary-note">Receiving an order posts the stock and purchase transactions through the backend.</span>
    </section>

    <section class="panel">
      <header class="panel-header"><div><h2>Order register</h2><p>Search and filter purchase orders from the StockSmart API.</p></div>@if(loading()){<span class="loading-label"><i class="spinner"></i> Updating</span>}</header>
      <form class="filters" [formGroup]="filters" (submit)="$event.preventDefault()">
        <label class="search-control"><span aria-hidden="true">⌕</span><input formControlName="orderNumber" placeholder="Search order number" aria-label="Search by order number"></label>
        <label class="filter-control"><span>Supplier</span><select formControlName="supplierId"><option value="">All suppliers</option>@for(supplier of suppliers();track supplier.id){<option [value]="supplier.id">{{supplier.name}}</option>}</select></label>
        <label class="filter-control"><span>Location</span><select formControlName="locationId"><option value="">All locations</option>@for(location of locations();track location.id){<option [value]="location.id">{{location.name}}</option>}</select></label>
        <label class="filter-control"><span>Status</span><select formControlName="status"><option value="">All statuses</option><option value="DRAFT">Draft</option><option value="PLACED">Placed</option><option value="RECEIVED">Received</option><option value="CANCELLED">Cancelled</option></select></label>
        <div class="date-filter-group" [formGroup]="dateFilters">
          <label class="filter-control date-filter"><span>From order date</span><input type="date" formControlName="from"></label>
          <label class="filter-control date-filter"><span>To order date</span><input type="date" formControlName="to"></label>
        </div>
        <button class="clear-button" type="button" (click)="clearFilters()" [disabled]="!hasFilters()">Clear</button>
      </form>
      <p class="filter-note">The API does not offer date parameters; date filters refine the currently loaded page only.</p>

      @if(error();as errorMessage){<div class="page-error" role="alert"><span class="error-icon">!</span><div><strong>Could not load purchase orders</strong><p>{{errorMessage}}</p></div><button class="secondary-button" type="button" (click)="loadOrders()">Retry</button></div>}
      @else if(loading()&&!hasLoaded()){<div class="state" role="status"><i class="spinner large"></i><strong>Loading purchase orders</strong><span>Connecting to StockSmart purchasing…</span></div>}
      @else if(!visibleOrders().length){<div class="state"><span class="empty-icon">↓</span><h3>{{hasFilters()?'No matching purchase orders':'No purchase orders yet'}}</h3><p>{{hasFilters()?'Try another search or clear the filters.':'Create a purchase order to start tracking incoming stock.'}}</p><button class="primary-button" type="button" (click)="hasFilters()?clearFilters():openCreate()">{{hasFilters()?'Clear filters':'Create purchase order'}}</button></div>}
      @else{
        <div class="table-scroll"><table><thead><tr>
          <th><button class="sort-button" type="button" (click)="sortBy('orderNumber')">Order number {{sortIndicator('orderNumber')}}</button></th>
          <th>Supplier</th><th>Location</th>
          <th><button class="sort-button" type="button" (click)="sortBy('orderDate')">Order date {{sortIndicator('orderDate')}}</button></th>
          <th>Expected date</th><th>Items</th>
          <th><button class="sort-button" type="button" (click)="sortBy('totalAmount')">Total {{sortIndicator('totalAmount')}}</button></th>
          <th><button class="sort-button" type="button" (click)="sortBy('status')">Status {{sortIndicator('status')}}</button></th>
          <th><span class="visually-hidden">Actions</span></th>
        </tr></thead><tbody>
          @for(order of visibleOrders();track order.id){<tr>
            <td><span class="order-number">{{order.orderNumber}}</span></td><td><strong class="supplier-name">{{order.supplierName}}</strong></td>
            <td>{{order.locationName}}</td><td>{{order.orderDate|date:'mediumDate'}}</td><td>{{order.expectedDate?(order.expectedDate|date:'mediumDate'):'—'}}</td>
            <td>{{order.items.length}}</td><td class="money">{{order.totalAmount|currency}}</td>
            <td><span class="status-badge" [class]="'status-'+order.status.toLowerCase()">{{statusLabel(order.status)}}</span></td>
            <td><div class="actions"><button type="button" (click)="view(order)">View</button>
              @if(order.status==='DRAFT'){<button type="button" (click)="place(order)">Place</button>}
              @if(order.status==='PLACED'){<button type="button" (click)="receive(order)">Receive</button>}
              @if(order.status==='DRAFT'||order.status==='PLACED'){<button class="delete" type="button" (click)="cancelOrder(order)">Cancel</button>}
            </div></td>
          </tr>}
        </tbody></table></div>
        <footer class="pagination"><span>Showing <strong>{{firstItem()|number}}–{{lastItem()|number}}</strong> of <strong>{{totalElements()|number}}</strong>@if(dateFiltered()){ <small> · {{visibleOrders().length}} on this page match dates</small> }</span><div class="pagination-controls"><label>Rows <select [value]="pageSize()" (change)="changePageSize($event)"><option value="10">10</option><option value="20">20</option><option value="50">50</option></select></label><button type="button" (click)="goToPage(page()-1)" [disabled]="page()===0">‹</button><span>Page {{page()+1}} of {{totalPages()||1}}</span><button type="button" (click)="goToPage(page()+1)" [disabled]="page()+1>=totalPages()">›</button></div></footer>
      }
    </section>

    @if(formOpen()){<app-purchase-order-form [products]="products()" [suppliers]="suppliers()" [locations]="locations()" [saving]="saving()" (save)="createOrder($event)" (cancel)="formOpen.set(false)" />}
    @if(viewing();as order){<div class="details-backdrop" (click)="viewing.set(null)"><section class="details" role="dialog" aria-modal="true" aria-labelledby="order-details-title" (click)="$event.stopPropagation()">
      <header class="details-heading"><div><p class="eyebrow">PURCHASE ORDER</p><h2 id="order-details-title">{{order.orderNumber}}</h2><span class="status-badge" [class]="'status-'+order.status.toLowerCase()">{{statusLabel(order.status)}}</span></div><button class="icon-button" type="button" aria-label="Close order details" (click)="viewing.set(null)">×</button></header>
      <div class="meta-grid"><div><span>Supplier</span><strong>{{order.supplierName}}</strong></div><div><span>Location</span><strong>{{order.locationName}}</strong></div><div><span>Order date</span><strong>{{order.orderDate|date:'medium'}}</strong></div><div><span>Expected date</span><strong>{{order.expectedDate?(order.expectedDate|date:'medium'):'—'}}</strong></div></div>
      <div class="detail-items"><h3>Items</h3><div class="detail-table-scroll"><table><thead><tr><th>Product</th><th>Quantity</th><th>Unit price</th><th>Subtotal</th></tr></thead><tbody>@for(item of order.items;track item.id){<tr><td><strong>{{item.productName}}</strong><small>{{item.sku}}</small></td><td>{{item.quantity|number:'1.0-3'}}</td><td>{{item.unitPrice|currency}}</td><td>{{item.subtotal|currency}}</td></tr>}</tbody></table></div><div class="total-row"><span>Total amount</span><strong>{{order.totalAmount|currency}}</strong></div></div>
      <footer class="details-actions"><button class="secondary-button" type="button" (click)="viewing.set(null)">Close</button>
        @if(order.status==='DRAFT'){<button class="primary-button" type="button" (click)="changeStatus(order,'PLACED')">Place order</button>}
        @if(order.status==='PLACED'){<button class="primary-button" type="button" (click)="receive(order)">Receive order</button>}
        @if(order.status==='DRAFT'||order.status==='PLACED'){<button class="danger-button" type="button" (click)="cancelOrder(order)">Cancel order</button>}
      </footer>
    </section></div>}
  `,
  styleUrls: ['./purchase-orders-page.component.css', './purchase-order-details.component.css'],
})
export class PurchaseOrdersPageComponent implements OnInit {
  private readonly service=inject(PurchaseOrderService);
  private readonly supplierService=inject(SupplierService);
  private readonly locationService=inject(LocationService);
  private readonly productService=inject(ProductService);
  private readonly notifications=inject(NotificationService);
  private readonly destroyRef=inject(DestroyRef);
  private request?:Subscription;
  protected readonly orders=signal<PurchaseOrder[]>([]);
  protected readonly suppliers=signal<Supplier[]>([]);
  protected readonly locations=signal<Location[]>([]);
  protected readonly products=signal<Product[]>([]);
  protected readonly loading=signal(false);
  protected readonly hasLoaded=signal(false);
  protected readonly error=signal<string|null>(null);
  protected readonly totalElements=signal(0);
  protected readonly totalPages=signal(0);
  protected readonly page=signal(0);
  protected readonly pageSize=signal(20);
  protected readonly sort=signal<OrderSort>('orderDate');
  protected readonly direction=signal<'asc'|'desc'>('desc');
  protected readonly formOpen=signal(false);
  protected readonly saving=signal(false);
  protected readonly viewing=signal<PurchaseOrder|null>(null);
  protected readonly filters=new FormGroup<OrderFilters>({
    orderNumber:new FormControl('',{nonNullable:true}),supplierId:new FormControl('',{nonNullable:true}),
    locationId:new FormControl('',{nonNullable:true}),status:new FormControl('',{nonNullable:true}),
  });
  protected readonly dateFilters=new FormGroup<DateFilters>({
    from:new FormControl('',{nonNullable:true}),to:new FormControl('',{nonNullable:true}),
  });

  ngOnInit():void{
    this.loadOrders();
    this.filters.valueChanges.pipe(debounceTime(300),takeUntilDestroyed(this.destroyRef)).subscribe(()=>{this.page.set(0);this.loadOrders();});
    this.supplierService.findAll({name:'',supplierCode:'',status:'',page:0,size:1000,sort:'companyName',direction:'asc'}).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next:response=>this.suppliers.set(response.content),error:(error:unknown)=>this.notifications.show(this.errorMessage(error),'error'),
    });
    this.locationService.findAll({search:'',type:'',status:'',page:0,size:1000,sort:'name',direction:'asc'}).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next:response=>this.locations.set(response.content),error:(error:unknown)=>this.notifications.show(this.errorMessage(error),'error'),
    });
    this.productService.findAll({name:'',sku:'',categoryId:'',status:'',page:0,size:1000,sort:'name',direction:'asc'}).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next:response=>this.products.set(response.content),error:(error:unknown)=>this.notifications.show(this.errorMessage(error),'error'),
    });
  }

  protected loadOrders():void{
    this.request?.unsubscribe();this.loading.set(true);this.error.set(null);
    this.service.findAll({...this.filters.getRawValue(),page:this.page(),size:this.pageSize(),sort:this.sort(),direction:this.direction()}).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next:(response:PageResponse<PurchaseOrder>)=>{this.orders.set(response.content);this.totalElements.set(response.totalElements);this.totalPages.set(response.totalPages);this.loading.set(false);this.hasLoaded.set(true);},
      error:(error:unknown)=>{this.error.set(this.errorMessage(error));this.loading.set(false);this.hasLoaded.set(true);},
    });
  }

  protected visibleOrders():PurchaseOrder[]{
    const {from,to}=this.dateFilters.getRawValue();
    return this.orders().filter(order=>{
      const date=order.orderDate.slice(0,10);
      return (!from||date>=from)&&(!to||date<=to);
    });
  }
  protected dateFiltered():boolean{const value=this.dateFilters.getRawValue();return Boolean(value.from||value.to);}
  protected hasFilters():boolean{const v=this.filters.getRawValue();return Boolean(v.orderNumber||v.supplierId||v.locationId||v.status||this.dateFiltered());}
  protected clearFilters():void{this.filters.reset({orderNumber:'',supplierId:'',locationId:'',status:''},{emitEvent:false});this.dateFilters.reset({from:'',to:''},{emitEvent:false});this.page.set(0);this.loadOrders();}
  protected sortBy(field:OrderSort):void{if(this.sort()===field)this.direction.update(v=>v==='asc'?'desc':'asc');else{this.sort.set(field);this.direction.set(field==='orderDate'?'desc':'asc');}this.page.set(0);this.loadOrders();}
  protected sortIndicator(field:OrderSort):string{return this.sort()===field?(this.direction()==='asc'?'↑':'↓'):'↕';}
  protected goToPage(page:number):void{if(page<0||page>=this.totalPages())return;this.page.set(page);this.loadOrders();}
  protected changePageSize(event:Event):void{this.pageSize.set(Number((event.target as HTMLSelectElement).value));this.page.set(0);this.loadOrders();}
  protected firstItem():number{return this.totalElements()?this.page()*this.pageSize()+1:0;}
  protected lastItem():number{return Math.min((this.page()+1)*this.pageSize(),this.totalElements());}
  protected statusLabel(status:PurchaseOrder['status']):string{return status.charAt(0)+status.slice(1).toLowerCase();}
  protected openCreate():void{this.formOpen.set(true);}

  protected createOrder(request:CreatePurchaseOrderRequest):void{
    if(this.saving())return;this.saving.set(true);
    this.service.create(request).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next:()=>{this.saving.set(false);this.formOpen.set(false);this.notifications.show('Purchase order created as a draft.','success');this.page.set(0);this.loadOrders();},
      error:(error:unknown)=>{this.saving.set(false);this.notifications.show(this.errorMessage(error),'error');},
    });
  }

  protected view(order:PurchaseOrder):void{
    this.service.findById(order.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next:details=>this.viewing.set(details),error:(error:unknown)=>this.notifications.show(this.errorMessage(error),'error'),
    });
  }

  protected place(order:PurchaseOrder):void{this.changeStatus(order,'PLACED');}

  protected changeStatus(order:PurchaseOrder,status:PurchaseOrder['status']):void{
    this.service.updateStatus(order.id,{status}).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next:updated=>{this.notifications.show(`Order ${updated.orderNumber} marked ${this.statusLabel(updated.status).toLowerCase()}.`,'success');this.viewing.set(updated);this.loadOrders();},
      error:(error:unknown)=>this.notifications.show(this.errorMessage(error),'error'),
    });
  }

  protected cancelOrder(order:PurchaseOrder):void{
    if(!window.confirm(`Cancel purchase order "${order.orderNumber}"?`))return;
    this.service.cancel(order.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next:updated=>{this.notifications.show(`Order ${updated.orderNumber} cancelled.`,'success');this.viewing.set(updated);this.loadOrders();},
      error:(error:unknown)=>this.notifications.show(this.errorMessage(error),'error'),
    });
  }

  protected receive(order:PurchaseOrder):void{
    if(!window.confirm(`Receive purchase order "${order.orderNumber}"? The backend will update inventory for its items.`))return;
    this.service.receive(order.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next:updated=>{this.notifications.show(`Order ${updated.orderNumber} received and inventory updated.`,'success');this.viewing.set(updated);this.loadOrders();},
      error:(error:unknown)=>this.notifications.show(this.errorMessage(error),'error'),
    });
  }

  private errorMessage(error:unknown):string{
    if(error instanceof HttpErrorResponse){
      if(typeof error.error?.message==='string')return error.error.message;
      if(error.status===0)return'Could not reach the StockSmart API. Check your connection and try again.';
      return`The request failed (HTTP ${error.status}). Please try again.`;
    }
    return'Something went wrong. Please try again.';
  }
}
