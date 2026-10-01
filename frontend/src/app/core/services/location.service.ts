import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Location, LocationRequest, PageResponse } from '../../models/api.models';
import { ApiService } from './api.service';

export interface LocationQuery {
  search: string;
  type: string;
  status: string;
  page: number;
  size: number;
  sort: string;
  direction: 'asc' | 'desc';
}

@Injectable({ providedIn: 'root' })
export class LocationService {
  private readonly api = inject(ApiService);

  findAll(query: LocationQuery): Observable<PageResponse<Location>> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('size', query.size)
      .set('sort', `${query.sort},${query.direction}`);
    if (query.search.trim()) params = params.set('search', query.search.trim());
    if (query.type) params = params.set('type', query.type);
    if (query.status) params = params.set('status', query.status);
    return this.api.get<PageResponse<Location>>('locations', params);
  }

  findById(id: number): Observable<Location> {
    return this.api.get<Location>(`locations/${id}`);
  }

  create(request: LocationRequest): Observable<Location> {
    return this.api.post<Location, LocationRequest>('locations', request);
  }

  update(id: number, request: LocationRequest): Observable<Location> {
    return this.api.put<Location, LocationRequest>(`locations/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`locations/${id}`);
  }
}
