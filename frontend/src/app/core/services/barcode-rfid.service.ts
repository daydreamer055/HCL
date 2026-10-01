import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Barcode,
  BarcodeAssignmentRequest,
  BarcodeRequest,
  BarcodeStatusRequest,
  PageResponse,
  Product,
  RfidLocationAssignmentRequest,
  RfidProductAssignmentRequest,
  RfidStatusRequest,
  RfidTag,
  RfidTagRequest,
} from '../../models/api.models';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class BarcodeRfidService {
  private readonly api = inject(ApiService);

  findBarcodes(barcodeNumber: string, status: string, page: number, size: number): Observable<PageResponse<Barcode>> {
    let params = new HttpParams().set('page', page).set('size', size).set('sort', 'barcodeNumber,asc');
    if (barcodeNumber.trim()) params = params.set('barcodeNumber', barcodeNumber.trim());
    if (status) params = params.set('status', status);
    return this.api.get<PageResponse<Barcode>>('barcodes', params);
  }

  findBarcodeById(id: number): Observable<Barcode> {
    return this.api.get<Barcode>(`barcodes/${id}`);
  }

  findProductByBarcode(barcodeNumber: string): Observable<Product> {
    return this.api.get<Product>(`barcodes/scan/${encodeURIComponent(barcodeNumber)}`);
  }

  createBarcode(request: BarcodeRequest): Observable<Barcode> {
    return this.api.post<Barcode, BarcodeRequest>('barcodes', request);
  }

  assignBarcode(id: number, request: BarcodeAssignmentRequest): Observable<Barcode> {
    return this.api.patch<Barcode, BarcodeAssignmentRequest>(`barcodes/${id}/product`, request);
  }

  updateBarcodeStatus(id: number, request: BarcodeStatusRequest): Observable<Barcode> {
    return this.api.patch<Barcode, BarcodeStatusRequest>(`barcodes/${id}/status`, request);
  }

  findRfidTags(tagCode: string, status: string, page: number, size: number): Observable<PageResponse<RfidTag>> {
    let params = new HttpParams().set('page', page).set('size', size).set('sort', 'tagCode,asc');
    if (tagCode.trim()) params = params.set('tagCode', tagCode.trim());
    if (status) params = params.set('status', status);
    return this.api.get<PageResponse<RfidTag>>('rfid/tags', params);
  }

  findRfidById(id: number): Observable<RfidTag> {
    return this.api.get<RfidTag>(`rfid/tags/${id}`);
  }

  findRfidByCode(tagCode: string): Observable<RfidTag> {
    return this.api.get<RfidTag>(`rfid/tag-code/${encodeURIComponent(tagCode)}`);
  }

  scanRfid(tagCode: string): Observable<RfidTag> {
    return this.api.post<RfidTag, Record<string, never>>(`rfid/scan/${encodeURIComponent(tagCode)}`, {});
  }

  registerRfid(request: RfidTagRequest): Observable<RfidTag> {
    return this.api.post<RfidTag, RfidTagRequest>('rfid/tags', request);
  }

  assignRfidProduct(id: number, request: RfidProductAssignmentRequest): Observable<RfidTag> {
    return this.api.patch<RfidTag, RfidProductAssignmentRequest>(`rfid/tags/${id}/product`, request);
  }

  assignRfidLocation(id: number, request: RfidLocationAssignmentRequest): Observable<RfidTag> {
    return this.api.patch<RfidTag, RfidLocationAssignmentRequest>(`rfid/tags/${id}/location`, request);
  }

  updateRfidStatus(id: number, request: RfidStatusRequest): Observable<RfidTag> {
    return this.api.patch<RfidTag, RfidStatusRequest>(`rfid/tags/${id}/status`, request);
  }

  markRfidLost(id: number): Observable<RfidTag> {
    return this.api.post<RfidTag, Record<string, never>>(`rfid/tags/${id}/lost`, {});
  }

  removeRfidAssignment(id: number): Observable<RfidTag> {
    return this.api.post<RfidTag, Record<string, never>>(`rfid/tags/${id}/remove-assignment`, {});
  }
}
