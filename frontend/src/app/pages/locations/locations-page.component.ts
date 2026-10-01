import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subscription, debounceTime } from 'rxjs';
import { LocationService } from '../../core/services/location.service';
import { NotificationService } from '../../core/services/notification.service';
import { Location, LocationRequest, PageResponse } from '../../models/api.models';
import { LocationFormComponent } from './location-form.component';

type LocationFilters = { search: FormControl<string>; type: FormControl<string>; status: FormControl<string> };
type LocationSort = 'name' | 'code' | 'locationType' | 'status' | 'updatedAt';

@Component({
  selector: 'app-locations-page',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, DecimalPipe, LocationFormComponent],
  template: `
    <section class="page-heading"><div><p class="eyebrow">STOCKSMART / OPERATIONS</p><h1>Locations</h1><p class="description">Manage your stores and warehouses across the business.</p></div><button class="primary-button" type="button" (click)="openCreate()">＋ Add location</button></section>
    <section class="summary"><span class="summary-icon">⌖</span><div><strong>{{totalElements()|number}}</strong><small>locations</small></div><span class="summary-note">Location directory used for inventory and stock movements.</span></section>
    <section class="panel">
      <header class="panel-header"><div><h2>Location directory</h2><p>Search by location name or code, then filter by type and status.</p></div>@if(loading()){<span class="loading-label"><i class="spinner"></i> Updating</span>}</header>
      <form class="filters" [formGroup]="filters" (submit)="$event.preventDefault()">
        <label class="search-control"><span aria-hidden="true">⌕</span><input formControlName="search" placeholder="Search location name or code" aria-label="Search locations"></label>
        <label class="filter-control"><span>Type</span><select formControlName="type"><option value="">All types</option><option value="STORE">Store</option><option value="WAREHOUSE">Warehouse</option></select></label>
        <label class="filter-control"><span>Status</span><select formControlName="status"><option value="">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label>
        <button class="clear-button" type="button" (click)="clearFilters()" [disabled]="!hasFilters()">Clear</button>
      </form>
      @if(error();as errorMessage){<div class="page-error" role="alert"><span class="error-icon">!</span><div><strong>Could not load locations</strong><p>{{errorMessage}}</p></div><button class="secondary-button" type="button" (click)="loadLocations()">Retry</button></div>}
      @else if(loading()&&!hasLoaded()){<div class="state" role="status"><i class="spinner large"></i><strong>Loading locations</strong><span>Connecting to StockSmart operations…</span></div>}
      @else if(!locations().length){<div class="state"><span class="empty-icon">⌖</span><h3>{{hasFilters()?'No matching locations':'No locations yet'}}</h3><p>{{hasFilters()?'Try another search or clear your filters.':'Add a store or warehouse to manage inventory by location.'}}</p><button class="primary-button" type="button" (click)="hasFilters()?clearFilters():openCreate()">{{hasFilters()?'Clear filters':'Add location'}}</button></div>}
      @else{
        <div class="table-scroll"><table><thead><tr>
          <th><button class="sort-button" type="button" (click)="sortBy('code')">Location code {{sortIndicator('code')}}</button></th>
          <th><button class="sort-button" type="button" (click)="sortBy('name')">Location {{sortIndicator('name')}}</button></th>
          <th><button class="sort-button" type="button" (click)="sortBy('locationType')">Type {{sortIndicator('locationType')}}</button></th>
          <th>Manager</th><th>Phone</th><th>Address</th>
          <th><button class="sort-button" type="button" (click)="sortBy('status')">Status {{sortIndicator('status')}}</button></th>
          <th><span class="visually-hidden">Actions</span></th>
        </tr></thead><tbody>
          @for(location of locations();track location.id){<tr>
            <td><span class="code">{{location.locationCode}}</span></td><td><strong class="company">{{location.name}}</strong></td>
            <td><span class="type-badge">{{location.type}}</span></td><td>{{location.managerName||'—'}}</td><td>{{location.phone||'—'}}</td>
            <td>{{locationLabel(location)}}</td><td><span class="status" [class]="'status-'+location.status.toLowerCase()">{{location.status}}</span></td>
            <td><div class="actions"><button type="button" (click)="view(location)">View</button><button type="button" (click)="openEdit(location)">Edit</button><button class="delete" type="button" (click)="remove(location)">Delete</button></div></td>
          </tr>}
        </tbody></table></div>
        <footer class="pagination"><span>Showing <strong>{{firstItem()|number}}–{{lastItem()|number}}</strong> of <strong>{{totalElements()|number}}</strong></span><div class="pagination-controls"><label>Rows <select [value]="pageSize()" (change)="changePageSize($event)"><option value="10">10</option><option value="20">20</option><option value="50">50</option></select></label><button type="button" (click)="goToPage(page()-1)" [disabled]="page()===0">‹</button><span>Page {{page()+1}} of {{totalPages()||1}}</span><button type="button" (click)="goToPage(page()+1)" [disabled]="page()+1>=totalPages()">›</button></div></footer>
      }
    </section>
    @if(formOpen()){<app-location-form [location]="editing()" [saving]="saving()" (save)="save($event)" (cancel)="closeForm()" />}
    @if(viewing();as location){<div class="details-backdrop" (click)="viewing.set(null)"><section class="details" role="dialog" aria-modal="true" aria-labelledby="location-details-title" (click)="$event.stopPropagation()">
      <header><div><p class="eyebrow">LOCATION DETAILS</p><h2 id="location-details-title">{{location.name}}</h2><span class="details-code">{{location.locationCode}}</span></div><button class="close" type="button" aria-label="Close details" (click)="viewing.set(null)">×</button></header>
      <div class="detail-grid"><div><span>Type</span><strong>{{location.type}}</strong></div><div><span>Status</span><strong>{{location.status}}</strong></div><div><span>Manager</span><strong>{{location.managerName||'—'}}</strong></div><div><span>Phone</span><strong>{{location.phone||'—'}}</strong></div><div class="wide"><span>Address</span><strong>{{addressLabel(location)}}</strong></div><div><span>Created</span><strong>{{location.createdAt|date:'mediumDate'}}</strong></div><div><span>Last updated</span><strong>{{location.updatedAt|date:'mediumDate'}}</strong></div></div>
      <footer><button class="secondary-button" type="button" (click)="viewing.set(null)">Close</button><button class="primary-button" type="button" (click)="openEdit(location)">Edit location</button></footer>
    </section></div>}
  `,
  styleUrls: ['../suppliers/directory-page.component.css', '../suppliers/directory-details.component.css'],
})
export class LocationsPageComponent implements OnInit {
  private readonly service=inject(LocationService);
  private readonly notifications=inject(NotificationService);
  private readonly destroyRef=inject(DestroyRef);
  private request?:Subscription;
  protected readonly locations=signal<Location[]>([]);
  protected readonly loading=signal(false);
  protected readonly hasLoaded=signal(false);
  protected readonly error=signal<string|null>(null);
  protected readonly totalElements=signal(0);
  protected readonly totalPages=signal(0);
  protected readonly page=signal(0);
  protected readonly pageSize=signal(20);
  protected readonly sort=signal<LocationSort>('name');
  protected readonly direction=signal<'asc'|'desc'>('asc');
  protected readonly formOpen=signal(false);
  protected readonly saving=signal(false);
  protected readonly editing=signal<Location|null>(null);
  protected readonly viewing=signal<Location|null>(null);
  protected readonly filters=new FormGroup<LocationFilters>({
    search:new FormControl('',{nonNullable:true}),type:new FormControl('',{nonNullable:true}),status:new FormControl('',{nonNullable:true}),
  });

  ngOnInit():void{this.loadLocations();this.filters.valueChanges.pipe(debounceTime(300),takeUntilDestroyed(this.destroyRef)).subscribe(()=>{this.page.set(0);this.loadLocations();});}
  protected loadLocations():void{this.request?.unsubscribe();this.loading.set(true);this.error.set(null);this.request=this.service.findAll({...this.filters.getRawValue(),page:this.page(),size:this.pageSize(),sort:this.sort(),direction:this.direction()}).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
    next:(response:PageResponse<Location>)=>{this.locations.set(response.content);this.totalElements.set(response.totalElements);this.totalPages.set(response.totalPages);this.loading.set(false);this.hasLoaded.set(true);},
    error:(error:unknown)=>{this.error.set(this.errorMessage(error));this.loading.set(false);this.hasLoaded.set(true);},
  });}
  protected hasFilters():boolean{const v=this.filters.getRawValue();return Boolean(v.search||v.type||v.status);}
  protected clearFilters():void{this.filters.reset({search:'',type:'',status:''},{emitEvent:false});this.page.set(0);this.loadLocations();}
  protected sortBy(field:LocationSort):void{if(this.sort()===field)this.direction.update(v=>v==='asc'?'desc':'asc');else{this.sort.set(field);this.direction.set('asc');}this.page.set(0);this.loadLocations();}
  protected sortIndicator(field:LocationSort):string{return this.sort()===field?(this.direction()==='asc'?'↑':'↓'):'↕';}
  protected goToPage(page:number):void{if(page<0||page>=this.totalPages())return;this.page.set(page);this.loadLocations();}
  protected changePageSize(event:Event):void{this.pageSize.set(Number((event.target as HTMLSelectElement).value));this.page.set(0);this.loadLocations();}
  protected firstItem():number{return this.totalElements()?this.page()*this.pageSize()+1:0;}
  protected lastItem():number{return Math.min((this.page()+1)*this.pageSize(),this.totalElements());}
  protected locationLabel(location:Location):string{return[location.city,location.state,location.country].filter(Boolean).join(', ')||'—';}
  protected addressLabel(location:Location):string{return[location.address,location.city,location.state,location.country].filter(Boolean).join(', ')||'—';}
  protected openCreate():void{this.viewing.set(null);this.editing.set(null);this.formOpen.set(true);}
  protected openEdit(location:Location):void{this.viewing.set(null);this.editing.set(location);this.formOpen.set(true);}
  protected closeForm():void{this.formOpen.set(false);this.editing.set(null);this.saving.set(false);}
  protected view(location:Location):void{this.service.findById(location.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({next:value=>this.viewing.set(value),error:(error:unknown)=>this.notifications.show(this.errorMessage(error),'error')});}
  protected save(request:LocationRequest):void{if(this.saving())return;const current=this.editing();this.saving.set(true);(current?this.service.update(current.id,request):this.service.create(request)).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
    next:()=>{this.saving.set(false);this.closeForm();this.notifications.show(current?'Location updated successfully.':'Location created successfully.','success');this.loadLocations();},
    error:(error:unknown)=>{this.saving.set(false);this.notifications.show(this.errorMessage(error),'error');},
  });}
  protected remove(location:Location):void{if(!window.confirm(`Delete location "${location.name}"?`))return;this.service.delete(location.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
    next:()=>{this.notifications.show('Location deleted successfully.','success');if(this.locations().length===1&&this.page()>0)this.page.update(p=>p-1);this.loadLocations();},
    error:(error:unknown)=>this.notifications.show(this.errorMessage(error),'error'),
  });}
  private errorMessage(error:unknown):string{if(error instanceof HttpErrorResponse){if(typeof error.error?.message==='string')return error.error.message;if(error.status===0)return'Could not reach the StockSmart API. Check your connection and try again.';return`The request failed (HTTP ${error.status}). Please try again.`;}return'Something went wrong. Please try again.';}
}
