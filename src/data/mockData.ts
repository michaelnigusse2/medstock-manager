import { Product, Batch, Sale, SaleLine, Issue, Settings, DashboardTiles } from '@/types/pharmacy';

export const mockProducts: Product[] = [
  {
    id: '1',
    codeType: 'GTIN',
    codeValue: '99906000123456',
    name: 'Amoxicillin 500mg Capsules',
    strength: '500mg',
    form: 'Capsule',
    packSize: 21,
    uom: 'capsule',
    unitPrice: 3.50,
    unitCost: 2.50,
  },
  {
    id: '2',
    codeType: 'GTIN',
    codeValue: '99906000123457',
    name: 'Paracetamol 500mg Tablets',
    strength: '500mg',
    form: 'Tablet',
    packSize: 100,
    uom: 'tablet',
    unitPrice: 0.15,
    unitCost: 0.08,
  },
  {
    id: '3',
    codeType: 'National',
    codeValue: 'NAT-001234',
    name: 'Ibuprofen 400mg Tablets',
    strength: '400mg',
    form: 'Tablet',
    packSize: 30,
    uom: 'tablet',
    unitPrice: 0.25,
    unitCost: 0.12,
  },
  {
    id: '4',
    codeType: 'GTIN',
    codeValue: '99906000123458',
    name: 'Omeprazole 20mg Capsules',
    strength: '20mg',
    form: 'Capsule',
    packSize: 28,
    uom: 'capsule',
    unitPrice: 0.80,
    unitCost: 0.45,
  },
  {
    id: '5',
    codeType: 'InternalSku',
    codeValue: 'SKU-BANDAGE-01',
    name: 'Adhesive Bandages Assorted',
    form: 'Bandage',
    packSize: 100,
    uom: 'piece',
    unitPrice: 0.10,
    unitCost: 0.04,
  },
  {
    id: '6',
    codeType: 'GTIN',
    codeValue: '99906000123459',
    name: 'Metformin 850mg Tablets',
    strength: '850mg',
    form: 'Tablet',
    packSize: 60,
    uom: 'tablet',
    unitPrice: 0.20,
    unitCost: 0.10,
  },
  {
    id: '7',
    codeType: 'National',
    codeValue: 'NAT-005678',
    name: 'Lisinopril 10mg Tablets',
    strength: '10mg',
    form: 'Tablet',
    packSize: 30,
    uom: 'tablet',
    unitPrice: 0.35,
    unitCost: 0.18,
  },
  {
    id: '8',
    codeType: 'GTIN',
    codeValue: '99906000123460',
    name: 'Atorvastatin 20mg Tablets',
    strength: '20mg',
    form: 'Tablet',
    packSize: 30,
    uom: 'tablet',
    unitPrice: 0.50,
    unitCost: 0.28,
  },
];

const today = new Date();
const formatDate = (d: Date) => d.toISOString().split('T')[0];

export const mockBatches: Batch[] = [
  // Amoxicillin - multiple batches for FEFO testing
  {
    id: 'b1',
    productId: '1',
    lot: 'L001X',
    expiry: '2025-01-31', // Near expiry
    qtyOnHand: 100,
    unitCost: 2.50,
  },
  {
    id: 'b2',
    productId: '1',
    lot: 'L002X',
    expiry: '2025-08-15',
    qtyOnHand: 150,
    unitCost: 2.45,
  },
  // Paracetamol
  {
    id: 'b3',
    productId: '2',
    lot: 'PARA-2024-A',
    expiry: '2024-11-30', // Expired
    qtyOnHand: 50,
    unitCost: 0.08,
  },
  {
    id: 'b4',
    productId: '2',
    lot: 'PARA-2025-B',
    expiry: '2025-10-15',
    qtyOnHand: 500,
    unitCost: 0.08,
  },
  // Ibuprofen
  {
    id: 'b5',
    productId: '3',
    lot: 'IBU-LOT-001',
    expiry: '2026-03-20',
    qtyOnHand: 200,
    unitCost: 0.12,
  },
  // Omeprazole - low stock
  {
    id: 'b6',
    productId: '4',
    lot: 'OME-2025',
    expiry: '2025-06-30',
    qtyOnHand: 8,
    unitCost: 0.45,
  },
  // Bandages
  {
    id: 'b7',
    productId: '5',
    lot: 'BAND-001',
    expiry: undefined,
    qtyOnHand: 450,
    unitCost: 0.04,
  },
  // Metformin - near expiry
  {
    id: 'b8',
    productId: '6',
    lot: 'MET-2025-A',
    expiry: formatDate(new Date(today.getTime() + 25 * 24 * 60 * 60 * 1000)), // 25 days from now
    qtyOnHand: 180,
    unitCost: 0.10,
  },
  // Lisinopril
  {
    id: 'b9',
    productId: '7',
    lot: 'LIS-LOT-42',
    expiry: '2026-01-15',
    qtyOnHand: 5, // Low stock
    unitCost: 0.18,
  },
  // Atorvastatin
  {
    id: 'b10',
    productId: '8',
    lot: 'ATOR-2025',
    expiry: '2025-12-31',
    qtyOnHand: 120,
    unitCost: 0.28,
  },
];

export const mockSales: Sale[] = [
  {
    id: 's1',
    createdAt: new Date().toISOString(),
    createdBy: 'cashier1',
    patient: 'John Doe',
    subtotal: 10.50,
    discount: 0,
    tax: 0,
    total: 10.50,
    paymentMethod: 'Cash',
    cashReceived: 20.00,
    changeDue: 9.50,
    status: 'Completed',
  },
  {
    id: 's2',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    createdBy: 'cashier1',
    patient: 'Jane Smith',
    subtotal: 25.00,
    discount: 2.50,
    tax: 0,
    total: 22.50,
    paymentMethod: 'Card',
    status: 'Completed',
  },
  {
    id: 's3',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'admin',
    patient: 'Bob Wilson',
    subtotal: 15.00,
    discount: 0,
    tax: 0,
    total: 15.00,
    paymentMethod: 'Cash',
    status: 'Voided',
    voidedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    voidReason: 'Customer returned - wrong medication',
  },
];

export const mockSaleLines: SaleLine[] = [
  {
    id: 'sl1',
    saleId: 's1',
    productId: '1',
    batchId: 'b1',
    qty: 3,
    unitPrice: 3.50,
    lineTotal: 10.50,
  },
  {
    id: 'sl2',
    saleId: 's2',
    productId: '2',
    batchId: 'b4',
    qty: 100,
    unitPrice: 0.15,
    lineTotal: 15.00,
  },
  {
    id: 'sl3',
    saleId: 's2',
    productId: '3',
    batchId: 'b5',
    qty: 40,
    unitPrice: 0.25,
    lineTotal: 10.00,
  },
];

export const mockIssues: Issue[] = [
  {
    id: 'i1',
    createdAt: new Date().toISOString(),
    createdBy: 'cashier1',
    productId: '1',
    batchId: 'b1',
    qty: 3,
    patient: 'John Doe',
  },
  {
    id: 'i2',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    createdBy: 'cashier1',
    productId: '2',
    batchId: 'b4',
    qty: 100,
    patient: 'Jane Smith',
  },
  {
    id: 'i3',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    createdBy: 'cashier1',
    productId: '3',
    batchId: 'b5',
    qty: 40,
    patient: 'Jane Smith',
  },
];

export const mockSettings: Settings = {
  nearExpiryDays: 30,
  lowStockThreshold: 10,
};

export function calculateDashboardTiles(): DashboardTiles {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todaysSales = mockSales
    .filter(s => {
      const saleDate = new Date(s.createdAt);
      saleDate.setHours(0, 0, 0, 0);
      return saleDate.getTime() === today.getTime() && s.status === 'Completed';
    })
    .reduce((sum, s) => sum + s.total, 0);

  const totalOnHand = mockBatches.reduce((sum, b) => sum + b.qtyOnHand, 0);
  
  const nearExpiryDate = new Date(today.getTime() + mockSettings.nearExpiryDays * 24 * 60 * 60 * 1000);
  
  const expiredCount = mockBatches.filter(b => {
    if (!b.expiry) return false;
    return new Date(b.expiry) < today;
  }).length;

  const nearExpiryCount = mockBatches.filter(b => {
    if (!b.expiry) return false;
    const expiry = new Date(b.expiry);
    return expiry >= today && expiry <= nearExpiryDate;
  }).length;

  const productStock = new Map<string, number>();
  mockBatches.forEach(b => {
    const current = productStock.get(b.productId) || 0;
    productStock.set(b.productId, current + b.qtyOnHand);
  });
  
  const lowStockCount = Array.from(productStock.values()).filter(
    qty => qty > 0 && qty <= mockSettings.lowStockThreshold
  ).length;

  return {
    todaySales: todaysSales,
    distinctProducts: mockProducts.length,
    totalBatches: mockBatches.length,
    totalOnHand,
    expiredCount,
    nearExpiryCount,
    lowStockCount,
  };
}

export function getProductWithBatches(productId: string) {
  const product = mockProducts.find(p => p.id === productId);
  const batches = mockBatches.filter(b => b.productId === productId);
  return { product, batches };
}

export function getBatchesWithProducts() {
  return mockBatches.map(batch => ({
    ...batch,
    product: mockProducts.find(p => p.id === batch.productId),
  }));
}

export function getSalesWithLines() {
  return mockSales.map(sale => ({
    ...sale,
    lines: mockSaleLines
      .filter(line => line.saleId === sale.id)
      .map(line => ({
        ...line,
        product: mockProducts.find(p => p.id === line.productId),
        batch: mockBatches.find(b => b.id === line.batchId),
      })),
  }));
}

export function getIssuesWithDetails() {
  return mockIssues.map(issue => ({
    ...issue,
    product: mockProducts.find(p => p.id === issue.productId),
    batch: mockBatches.find(b => b.id === issue.batchId),
  }));
}
