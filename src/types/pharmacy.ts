export type UserRole = 'Admin' | 'Cashier';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  fullName: string;
  createdAt: string;
}

export interface Product {
  id: string;
  codeType: 'GTIN' | 'National' | 'InternalSku';
  codeValue: string;
  name: string;
  strength?: string;
  form?: string;
  packSize?: number;
  uom?: string;
  unitPrice?: number;
  unitCost?: number;
}

export interface Batch {
  id: string;
  productId: string;
  lot: string;
  expiry?: string;
  qtyOnHand: number;
  unitCost?: number;
  product?: Product;
}

export type SaleStatus = 'Completed' | 'Voided';

export interface Sale {
  id: string;
  createdAt: string;
  createdBy?: string;
  patient?: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod?: string;
  cashReceived?: number;
  changeDue?: number;
  notes?: string;
  status: SaleStatus;
  voidedAt?: string;
  voidReason?: string;
  lines?: SaleLine[];
}

export interface SaleLine {
  id: string;
  saleId: string;
  productId: string;
  batchId: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  product?: Product;
  batch?: Batch;
}

export interface Issue {
  id: string;
  createdAt: string;
  createdBy?: string;
  productId: string;
  batchId: string;
  qty: number;
  patient?: string;
  product?: Product;
  batch?: Batch;
}

export interface Adjustment {
  id: string;
  createdAt: string;
  createdBy?: string;
  productId: string;
  batchId?: string;
  delta: number;
  reason?: string;
}

export interface Settings {
  nearExpiryDays: number;
  lowStockThreshold: number;
}

export interface DashboardTiles {
  todaySales: number;
  distinctProducts: number;
  totalBatches: number;
  totalOnHand: number;
  expiredCount: number;
  nearExpiryCount: number;
  lowStockCount: number;
}

export interface CartItem {
  product: Product;
  batch: Batch;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}
