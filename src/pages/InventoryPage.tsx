import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Download,
  Package,
  AlertTriangle,
  Clock,
  TrendingDown,
  Filter,
  X,
} from 'lucide-react';
import { getBatchesWithProducts, mockSettings } from '@/data/mockData';
import { cn } from '@/lib/utils';

type FilterType = 'all' | 'lowstock' | 'nearexpiry' | 'expired';

export default function InventoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>(
    (searchParams.get('filter') as FilterType) || 'all'
  );

  const batchesWithProducts = getBatchesWithProducts();
  const today = new Date();
  const nearExpiryDate = new Date(
    today.getTime() + mockSettings.nearExpiryDays * 24 * 60 * 60 * 1000
  );

  const filteredBatches = useMemo(() => {
    let result = batchesWithProducts;

    // Apply filter
    if (filter === 'expired') {
      result = result.filter(b => b.expiry && new Date(b.expiry) < today);
    } else if (filter === 'nearexpiry') {
      result = result.filter(b => {
        if (!b.expiry) return false;
        const expiry = new Date(b.expiry);
        return expiry >= today && expiry <= nearExpiryDate;
      });
    } else if (filter === 'lowstock') {
      result = result.filter(
        b => b.qtyOnHand > 0 && b.qtyOnHand <= mockSettings.lowStockThreshold
      );
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        b =>
          b.product?.name.toLowerCase().includes(query) ||
          b.product?.codeValue.toLowerCase().includes(query) ||
          b.lot.toLowerCase().includes(query)
      );
    }

    return result;
  }, [batchesWithProducts, filter, searchQuery]);

  const getBatchStatus = (batch: (typeof batchesWithProducts)[0]) => {
    if (batch.qtyOnHand <= 0) {
      return { label: 'Out of Stock', variant: 'danger' as const };
    }
    if (batch.qtyOnHand <= mockSettings.lowStockThreshold) {
      return { label: 'Low Stock', variant: 'warning' as const };
    }
    if (batch.expiry && new Date(batch.expiry) < today) {
      return { label: 'Expired', variant: 'danger' as const };
    }
    if (batch.expiry && new Date(batch.expiry) <= nearExpiryDate) {
      return { label: 'Near Expiry', variant: 'warning' as const };
    }
    return { label: 'In Stock', variant: 'success' as const };
  };

  const exportToCSV = () => {
    const headers = ['Product', 'Code', 'Lot', 'Expiry', 'Qty On Hand', 'Status'];
    const rows = filteredBatches.map(b => {
      const status = getBatchStatus(b);
      return [
        b.product?.name || '',
        b.product?.codeValue || '',
        b.lot,
        b.expiry || 'N/A',
        b.qtyOnHand.toString(),
        status.label,
      ];
    });

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilter = () => {
    setFilter('all');
    setSearchParams({});
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
            <p className="text-muted-foreground mt-1">
              Manage your stock and batches
            </p>
          </div>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by product name, code, or lot..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={filter}
            onValueChange={(v: FilterType) => setFilter(v)}
          >
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Batches</SelectItem>
              <SelectItem value="lowstock">Low Stock</SelectItem>
              <SelectItem value="nearexpiry">Near Expiry</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
          {filter !== 'all' && (
            <Button variant="ghost" size="icon" onClick={clearFilter}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Summary pills */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
            <Package className="w-3.5 h-3.5" />
            {filteredBatches.length} batches
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-warning/10 text-warning">
            <TrendingDown className="w-3.5 h-3.5" />
            {filteredBatches.filter(b => b.qtyOnHand <= mockSettings.lowStockThreshold && b.qtyOnHand > 0).length} low stock
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-warning/10 text-warning">
            <Clock className="w-3.5 h-3.5" />
            {filteredBatches.filter(b => b.expiry && new Date(b.expiry) >= today && new Date(b.expiry) <= nearExpiryDate).length} near expiry
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
            <AlertTriangle className="w-3.5 h-3.5" />
            {filteredBatches.filter(b => b.expiry && new Date(b.expiry) < today).length} expired
          </span>
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Code</th>
                  <th>Lot</th>
                  <th>Expiry</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Unit Cost</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredBatches.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      No batches found matching your criteria
                    </td>
                  </tr>
                ) : (
                  filteredBatches.map(batch => {
                    const status = getBatchStatus(batch);
                    return (
                      <tr key={batch.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <Package className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-card-foreground">
                                {batch.product?.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {batch.product?.form} • {batch.product?.strength}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="font-mono text-sm text-muted-foreground">
                          {batch.product?.codeValue}
                        </td>
                        <td className="font-mono text-sm">{batch.lot}</td>
                        <td className={cn(
                          batch.expiry && new Date(batch.expiry) < today && 'text-destructive font-medium',
                          batch.expiry && new Date(batch.expiry) >= today && new Date(batch.expiry) <= nearExpiryDate && 'text-warning font-medium'
                        )}>
                          {batch.expiry || '—'}
                        </td>
                        <td className="text-right font-medium">{batch.qtyOnHand}</td>
                        <td className="text-right text-muted-foreground">
                          ${batch.unitCost?.toFixed(2) || '—'}
                        </td>
                        <td>
                          <span
                            className={cn(
                              'status-badge',
                              status.variant === 'success' && 'status-badge-success',
                              status.variant === 'warning' && 'status-badge-warning',
                              status.variant === 'danger' && 'status-badge-danger'
                            )}
                          >
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
