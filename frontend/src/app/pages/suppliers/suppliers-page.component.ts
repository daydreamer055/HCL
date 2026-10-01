import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subscription, debounceTime } from 'rxjs';
import { NotificationService } from '../../core/services/notification.service';
import { SupplierService } from '../../core/services/supplier.service';
import { PageResponse, Supplier, SupplierRequest } from '../../models/api.models';
import { SupplierFormComponent } from './supplier-form.component';

type SupplierFilters = { name: FormControl<string>; supplierCode: FormControl<string>; status: FormControl<string> };
type SupplierSort = 'companyName' | 'supplierCode' | 'status' | 'updatedAt';

@Component({
  selector: 'app-suppliers-page',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, DecimalPipe, SupplierFormComponent],
  template: `
    <section class="page-heading"><div><p class="eyebrow">STOCKSMART / PARTNERS</p><h1>Suppliers</h1><p class="description">Manage supplier contacts and purchasing relationships.</p></div><button class="primary-button" type="button" (click)="openCreate()">＋ Add supplier</button></section>
    <section class="summary"><span class="summary-icon">⇄</span><div><strong>{{ totalElements() | number }}</strong><small>suppliers</small></div><span class="summary-note">Supplier directory connected to your purchasing workflow.</span></section>
    <section class="panel">
      <header class="panel-header"><div><h2>Supplier directory</h2><p>Search, filter, and manage your suppliers.</p></div>@if(loading()){<span class="loading-label"><i class="spinner"></i> Updating</span>}</header>
      <form class="filters" [formGroup]="filters" (submit)="$event.preventDefault()">
        <label class="search-control"><span aria-hidden="true">⌕</span><input formControlName="name" placeholder="Search supplier name" aria-label="Search by supplier name"></label>
        <label class="search-control"><span aria-hidden="true">⌕</span><input formControlName="supplierCode" placeholder="Search supplier code" aria-label="Search by supplier code"></label>
        <label class="filter-control"><span>Status</span><select formControlName="status"><option value="">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label>
        <button class="clear-button" type="button" (click)="clearFilters()" [disabled]="!hasFilters()">Clear</button>
      </form>
      @if(error(); as errorMessage){<div class="page-error" role="alert"><span class="error-icon">!</span><div><strong>Could not load suppliers</strong><p>{{errorMessage}}</p></div><button class="secondary-button" type="button" (click)="loadSuppliers()">Retry</button></div>}
      @else if(loading()&&!hasLoaded()){<div class="state" role="status"><i class="spinner large"></i><strong>Loading suppliers</strong><span>Connecting to StockSmart partners…</span></div>}
      @else if(!suppliers().length){<div class="state"><span class="empty-icon">⇄</span><h3>{{hasFilters()?'No matching suppliers':'No suppliers yet'}}</h3><p>{{hasFilters()?'Try a different search or clear your filters.':'Add a supplier to connect it with purchasing.'}}</p><button class="primary-button" type="button" (click)="hasFilters()?clearFilters():openCreate()">{{hasFilters()?'Clear filters':'Add supplier'}}</button></div>}
      @else {
        <div class="table-scroll"><table><thead><tr>
          <th><button class="sort-button" type="button" (click)="sortBy('supplierCode')">Supplier code {{sortIndicator('supplierCode')}}</button></th>
          <th><button class="sort-button" type="button" (click)="sortBy('companyName')">Company {{sortIndicator('companyName')}}</button></th>
          <th>Contact</th><th>Email / phone</th><th>Location</th>
          <th><button class="sort-button" type="button" (click)="sortBy('status')">Status {{sortIndicator('status')}}</button></th>
          <th><span class="visually-hidden">Actions</span></th>
        </tr></thead><tbody>
          @for(supplier of suppliers();track supplier.id){<tr>
            <td><span class="code">{{supplier.supplierCode}}</span></td><td><strong class="company">{{supplier.name}}</strong></td><td>{{supplier.contactPerson||'—'}}</td>
            <td>{{supplier.email||'—'}}<small>{{supplier.phone||''}}</small></td>
            <td>{{locationLabel(supplier)}}</td><td><span class="status" [class]="'status-'+supplier.status.toLowerCase()">{{supplier.status}}</span></td>
            <td><div class="actions"><button type="button" (click)="view(supplier)">View</button><button type="button" (click)="openEdit(supplier)">Edit</button><button class="delete" type="button" (click)="remove(supplier)">Delete</button></div></td>
          </tr>}
        </tbody></table></div>
        <footer class="pagination"><span>Showing <strong>{{firstItem()|number}}–{{lastItem()|number}}</strong> of <strong>{{totalElements()|number}}</strong></span><div class="pagination-controls"><label>Rows <select [value]="pageSize()" (change)="changePageSize($event)"><option value="10">10</option><option value="20">20</option><option value="50">50</option></select></label><button type="button" (click)="goToPage(page()-1)" [disabled]="page()===0">‹</button><span>Page {{page()+1}} of {{totalPages()||1}}</span><button type="button" (click)="goToPage(page()+1)" [disabled]="page()+1>=totalPages()">›</button></div></footer>
      }
    </section>
    @if(formOpen()){<app-supplier-form [supplier]="editing()" [saving]="saving()" (save)="save($event)" (cancel)="closeForm()" />}
    @if(viewing();as supplier){<div class="details-backdrop" (click)="viewing.set(null)"><section class="details" role="dialog" aria-modal="true" aria-labelledby="supplier-details-title" (click)="$event.stopPropagation()">
      <header><div><p class="eyebrow">SUPPLIER DETAILS</p><h2 id="supplier-details-title">{{supplier.name}}</h2><span class="details-code">{{supplier.supplierCode}}</span></div><button class="close" type="button" aria-label="Close details" (click)="viewing.set(null)">×</button></header>
      <div class="detail-grid"><div><span>Contact person</span><strong>{{supplier.contactPerson||'—'}}</strong></div><div><span>Status</span><strong>{{supplier.status}}</strong></div><div><span>Email</span><strong>{{supplier.email||'—'}}</strong></div><div><span>Phone</span><strong>{{supplier.phone||'—'}}</strong></div><div class="wide"><span>Address</span><strong>{{addressLabel(supplier)}}</strong></div><div><span>Created</span><strong>{{supplier.createdAt|date:'mediumDate'}}</strong></div><div><span>Last updated</span><strong>{{supplier.updatedAt|date:'mediumDate'}}</strong></div></div>
      <footer><button class="secondary-button" type="button" (click)="viewing.set(null)">Close</button><button class="primary-button" type="button" (click)="openEdit(supplier)">Edit supplier</button></footer>
    </section></div>}
  `,
  styleUrls: ['./directory-page.component.css', './directory-details.component.css'],
})
export class SuppliersPageComponent implements OnInit {
  private readonly service = inject(SupplierService);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);
  private request?: Subscription;
  protected readonly suppliers = signal<Supplier[]>([]);
  protected readonly loading = signal(false);
  protected readonly hasLoaded = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly totalElements = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly page = signal(0);
  protected readonly pageSize = signal(20);
  protected readonly sort = signal<SupplierSort>('companyName');
  protected readonly direction = signal<'asc'|'desc'>('asc');
  protected readonly formOpen = signal(false);
  protected readonly saving = signal(false);
  protected readonly editing = signal<Supplier|null>(null);
  protected readonly viewing = signal<Supplier|null>(null);
  protected readonly filters = new FormGroup<SupplierFilters>({
    name: new FormControl('',{nonNullable:true}), supplierCode: new FormControl('',{nonNullable:true}), status: new FormControl('',{nonNullable:true}),
  });

  ngOnInit(): void {
    this.loadSuppliers();
    this.filters.valueChanges.pipe(debounceTime(300),takeUntilDestroyed(this.destroyRef)).subscribe(()=>{this.page.set(0);this.loadSuppliers();});
  }

  protected loadSuppliers(): void {
    this.request?.unsubscribe(); this.loading.set(true); this.error.set(null);
    this.request=this.service.findAll({...this.filters.getRawValue(),page:this.page(),size:this.pageSize(),sort:this.sort(),direction:this.direction()}).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next:(response:PageResponse<Supplier>)=>{this.suppliers.set(response.content);this.totalElements.set(response.totalElements);this.totalPages.set(response.totalPages);this.loading.set(false);this.hasLoaded.set(true);},
      error:(error:unknown)=>{this.error.set(this.errorMessage(error));this.loading.set(false);this.hasLoaded.set(true);},
    });
  }

  protected hasFilters(): boolean { const value=this.filters.getRawValue();return Boolean(value.name||value.supplierCode||value.status); }
  protected clearFilters(): void {this.filters.reset({name:'',supplierCode:'',status:''},{emitEvent:false});this.page.set(0);this.loadSuppliers();}
  protected sortBy(field:SupplierSort):void {if(this.sort()===field)this.direction.update(value=>value==='asc'?'desc':'asc');else{this.sort.set(field);this.direction.set('asc');}this.page.set(0);this.loadSuppliers();}
  protected sortIndicator(field:SupplierSort):string{return this.sort()===field?(this.direction()==='asc'?'↑':'↓'):'↕';}
  protected goToPage(page:number):void{if(page<0||page>=this.totalPages())return;this.page.set(page);this.loadSuppliers();}
  protected changePageSize(event:Event):void{this.pageSize.set(Number((event.target as HTMLSelectElement).value));this.page.set(0);this.loadSuppliers();}
  protected firstItem():number{return this.totalElements()?this.page()*this.pageSize()+1:0;}
  protected lastItem():number{return Math.min((this.page()+1)*this.pageSize(),this.totalElements());}
  protected locationLabel(supplier:Supplier):string{return [supplier.city,supplier.state,supplier.country].filter(Boolean).join(', ')||'—';}
  protected addressLabel(supplier:Supplier):string{return [supplier.address,supplier.city,supplier.state,supplier.country].filter(Boolean).join(', ')||'—';}
  protected openCreate():void{this.viewing.set(null);this.editing.set(null);this.formOpen.set(true);}
  protected openEdit(supplier:Supplier):void{this.viewing.set(null);this.editing.set(supplier);this.formOpen.set(true);}
  protected closeForm():void{this.formOpen.set(false);this.editing.set(null);this.saving.set(false);}
  protected view(supplier:Supplier):void{this.service.findById(supplier.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({next:value=>this.viewing.set(value),error:(error:unknown)=>this.notifications.show(this.errorMessage(error),'error')});}
  protected save(request:SupplierRequest):void{if(this.saving())return;const current=this.editing();this.saving.set(true);(current?this.service.update(current.id,request):this.service.create(request)).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
    next:()=>{this.saving.set(false);this.closeForm();this.notifications.show(current?'Supplier updated successfully.':'Supplier created successfully.','success');this.loadSuppliers();},
    error:(error:unknown)=>{this.saving.set(false);this.notifications.show(this.errorMessage(error),'error');},
  });}
  protected remove(supplier:Supplier):void{if(!window.confirm(`Delete supplier "${supplier.name}"?`))return;this.service.delete(supplier.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
    next:()=>{this.notifications.show('Supplier deleted successfully.','success');if(this.suppliers().length===1&&this.page()>0)this.page.update(page=>page-1);this.loadSuppliers();},
    error:(error:unknown)=>this.notifications.show(this.errorMessage(error),'error'),
  });}
  private errorMessage(error:unknown):string{if(error instanceof HttpErrorResponse){if(typeof error.error?.message==='string')return error.error.message;if(error.status===0)return'Could not reach the StockSmart API. Check your connection and try again.';return`The request failed (HTTP ${error.status}). Please try again.`;}return'Something went wrong. Please try again.';}
}
