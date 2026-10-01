export interface PageResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: unknown;
  };
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  number: number;
  size: number;
  numberOfElements: number;
  empty: boolean;
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  details: Record<string, string>;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType?: string;
  expiresIn: number;
  user: AuthenticatedUser;
}

export interface AuthenticatedUser {
  id: number;
  username: string;
  email: string;
  roles: string[];
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  categoryId: number;
  category: string;
  supplierId: number | null;
  supplier: string | null;
  price: number;
  costPrice: number;
  reorderLevel: number;
  barcode: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';
  createdAt: string;
  updatedAt: string;
}

export type ProductResponse = Product;

export interface ProductRequest {
  sku: string;
  name: string;
  description: string | null;
  price: number;
  costPrice: number;
  reorderLevel: number;
  categoryId: number;
  supplierId: number | null;
  barcode: string | null;
  barcodeSymbology: string | null;
  status: Product['status'];
}

export interface InventoryResponse {
  id: number;
  productId: number;
  sku: string;
  productName: string;
  locationId: number;
  locationCode: string;
  locationName: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderLevel: number;
  lastUpdated: string;
}

export interface Supplier {
  id: number;
  supplierCode: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export type SupplierResponse = Supplier;

export interface SupplierRequest {
  supplierCode: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  status: Supplier['status'];
}

export interface Location {
  id: number;
  locationCode: string;
  name: string;
  type: 'STORE' | 'WAREHOUSE';
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  phone: string | null;
  managerName: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export type LocationResponse = Location;

export interface LocationRequest {
  locationCode: string;
  name: string;
  type: Location['type'];
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  phone: string | null;
  managerName: string | null;
  status: Location['status'];
}

export interface DashboardSummary {
  totalProducts: number;
  totalCategories: number;
  totalSuppliers: number;
  totalLocations: number;
  totalInventoryItems: number;
  totalInventoryValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  pendingPurchaseOrders: number;
  pendingSalesOrders: number;
}

export interface InventoryByCategory {
  categoryId: number | null;
  categoryName: string;
  inventoryQuantity: number;
}

export interface InventoryByLocation {
  locationId: number;
  locationCode: string;
  locationName: string;
  inventoryQuantity: number;
}

export interface LowStockProduct {
  productId: number;
  sku: string;
  productName: string;
  locationId: number;
  locationName: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderLevel: number;
}

export interface DashboardDateTotal {
  date: string;
  totalAmount: number;
}

export interface InventoryTransactionResponse {
  id: number;
  productId: number;
  sku: string;
  productName: string;
  locationId: number;
  locationName: string;
  destinationLocationId: number | null;
  destinationLocationName: string | null;
  type: 'PURCHASE' | 'SALE' | 'TRANSFER' | 'RETURN' | 'ADJUSTMENT';
  quantity: number;
  transactionAt: string;
  notes: string | null;
}

export interface DashboardResponse {
  summary: DashboardSummary;
  inventoryByCategory: InventoryByCategory[];
  inventoryByLocation: InventoryByLocation[];
  salesSummary: DashboardDateTotal[];
  purchaseSummary: DashboardDateTotal[];
  recentTransactions: PageResponse<InventoryTransactionResponse>;
  lowStock: PageResponse<LowStockProduct>;
}

export interface PurchaseOrderItem {
  id: number;
  productId: number;
  sku: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export type PurchaseOrderItemResponse = PurchaseOrderItem;

export interface PurchaseOrder {
  id: number;
  orderNumber: string;
  supplierId: number;
  supplierName: string;
  locationId: number;
  locationName: string;
  orderDate: string;
  expectedDate: string | null;
  status: 'DRAFT' | 'PLACED' | 'RECEIVED' | 'CANCELLED';
  totalAmount: number;
  items: PurchaseOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export type PurchaseOrderResponse = PurchaseOrder;

export interface PurchaseOrderItemRequest {
  productId: number;
  quantity: number;
  unitPrice: number;
}

export interface CreatePurchaseOrderRequest {
  orderNumber: string;
  supplierId: number;
  locationId: number;
  orderDate: string | null;
  expectedDate: string | null;
  notes: string | null;
  items: PurchaseOrderItemRequest[];
}

export interface UpdatePurchaseOrderStatusRequest {
  status: PurchaseOrder['status'];
}

export interface SalesOrderItem {
  id: number;
  productId: number;
  sku: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export type SalesOrderItemResponse = SalesOrderItem;

export interface SalesOrder {
  id: number;
  orderNumber: string;
  locationId: number;
  locationName: string;
  orderDate: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  totalAmount: number;
  items: SalesOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export type SalesOrderResponse = SalesOrder;

export interface SalesOrderItemRequest {
  productId: number;
  quantity: number;
  unitPrice: number;
}

export interface CreateSalesOrderRequest {
  orderNumber: string;
  locationId: number;
  orderDate: string | null;
  customerName: string | null;
  items: SalesOrderItemRequest[];
}

export interface UpdateSalesOrderStatusRequest {
  status: SalesOrder['status'];
}

export interface BarcodeResponse {
  id: number;
  barcodeNumber: string;
  productId: number | null;
  sku: string | null;
  productName: string | null;
  barcodeType: 'UPC' | 'EAN' | 'CODE128' | 'OTHER';
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export type Barcode = BarcodeResponse;

export interface BarcodeRequest {
  barcodeNumber: string;
  barcodeType: Barcode['barcodeType'];
}

export interface BarcodeAssignmentRequest {
  productId: number;
}

export interface BarcodeStatusRequest {
  status: Barcode['status'];
}

export interface RfidTagResponse {
  id: number;
  tagCode: string;
  productId: number | null;
  sku: string | null;
  productName: string | null;
  locationId: number | null;
  locationCode: string | null;
  locationName: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'LOST' | 'UNASSIGNED';
  assignedAt: string | null;
  lastSeenAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type RfidTag = RfidTagResponse;

export interface RfidTagRequest {
  tagCode: string;
}

export interface RfidProductAssignmentRequest {
  productId: number;
}

export interface RfidLocationAssignmentRequest {
  locationId: number;
}

export interface RfidStatusRequest {
  status: RfidTag['status'];
}

export interface ReportDateTotal {
  date: string;
  totalAmount: number;
}
