import { InventoryTransactionResponse, PageResponse } from './api.models';

export type ReportKey =
  | 'inventory'
  | 'low-stock'
  | 'out-of-stock'
  | 'sales'
  | 'purchases'
  | 'suppliers'
  | 'stock-movements'
  | 'inventory-valuation';

export interface ReportFilters {
  startDate: string;
  endDate: string;
  productId: string;
  categoryId: string;
  supplierId: string;
  locationId: string;
}

export interface InventoryReportRow {
  inventoryId: number;
  productId: number;
  sku: string;
  productName: string;
  categoryId: number;
  categoryName: string;
  supplierId: number | null;
  supplierName: string | null;
  locationId: number;
  locationName: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderLevel: number;
  unitCost: number;
  inventoryValue: number;
}

export interface SalesReportRow {
  date: string;
  orderCount: number;
  itemQuantity: number;
  totalAmount: number;
}

export type PurchaseReportRow = SalesReportRow;

export interface SupplierReportRow {
  supplierId: number;
  supplierCode: string;
  supplierName: string;
  email: string | null;
  phone: string | null;
  purchaseOrderCount: number;
  purchaseAmount: number;
}

export interface InventoryValuationReportRow {
  productId: number;
  sku: string;
  productName: string;
  categoryId: number;
  categoryName: string;
  locationId: number;
  locationName: string;
  quantity: number;
  unitCost: number;
  totalValue: number;
}

export type PagedInventoryReport = PageResponse<InventoryReportRow>;
export type PagedInventoryValuationReport = PageResponse<InventoryValuationReportRow>;
export type PagedStockMovementReport = PageResponse<InventoryTransactionResponse>;
