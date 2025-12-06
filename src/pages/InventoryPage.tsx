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
import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/hooks/useApi';
import { InventoryProduct } from '@/types/pharmacy';
import {
  Search,
  Download,
  Package,
  AlertTriangle,
  Clock,
  TrendingDown,
  Filter,
  X,
  ChevronDown,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type FilterType = 'all' | 'low_stock' | 'near_expiry' | 'expired';

export default function InventoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>(
    (searchParams.get('filter') as FilterType) || 'all'
  );
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(new Set());

  const api = useApi();

  const { data: inventory = [], isLoading } = useQuery<InventoryProduct[]>({
    queryKey: ['inventory'],
    queryFn: () => api.get('/inventory'),
  });

  const filteredInventory = useMemo(() => {
    let result = inventory;

    if (filter === 'expired') {
        result = result.filter(p => p.batches.some(b => b.is_expired));
    } else if (filter === 'near_expiry') {
        result = result.filter(p => p.batches.some(b => b.is_near_expiry));
    } else if (filter === 'low_stock') {
        result = result.filter(p => p.is_low_stock);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        p =>
          p.name.toLowerCase().includes(query) ||
          p.code_value.toLowerCase().includes(query) ||
          p.batches.some(b => b.lot.toLowerCase().includes(query))
      );
    }

    return result;
  }, [inventory, filter, searchQuery]);

  const toggleProductExpansion = (productId: number) => {
    setExpandedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const getProductStatus = (product: InventoryProduct) => {
    if (product.is_low_stock) return { label: 'Low Stock', variant: 'warning' as const };
    if (product.batches.some(b => b.is_expired)) return { label: 'Expired Stock', variant: 'danger' as const };
    if (product.batches.some(b => b.is_near_expiry)) return { label: 'Near Expiry', variant: 'warning' as const };
    return { label: 'In Stock', variant: 'success' as const };
  };

  const getBatchStatus = (batch: InventoryProduct['batches'][0]) => {
    if (batch.is_expired) return { label: 'Expired', variant: 'danger' as const };
    if (batch.is_near_expiry) return { label: 'Near Expiry', variant: 'warning' as const };
    return { label: 'OK', variant: 'success' as const };
  }

  const exportToCSV = () => {
    const headers = ['Product Name', 'Code', 'Total Quantity', 'Status', 'Lot', 'Batch Expiry', 'Batch Quantity'];
    const rows = filteredInventory.flatMap(p =>
      p.batches.map(b => [
        p.name, p.code_value, p.total_qty_on_hand, getProductStatus(p).label,
        b.lot, b.expiry ? new Date(b.expiry).toLocaleDateString() : 'N/A', b.qty_on_hand
      ])
    );

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
            <p className="text-muted-foreground mt-1">Manage your stock and batches</p>
          </div>
          <Button onClick={exportToCSV} variant="outline" disabled={isLoading || filteredInventory.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

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
          <Select value={filter} onValueChange={(v: FilterType) => setFilter(v)}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" /><SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              <SelectItem value="low_stock">Low Stock</SelectItem>
              <SelectItem value="near_expiry">Near Expiry</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead className="text-right">Total Qty</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="mx-auto w-6 h-6 animate-spin" /></TableCell></TableRow>
                ) : filteredInventory.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No products found.</TableCell></TableRow>
                ) : (
                  filteredInventory.map(product => (
                    <>
                      <TableRow key={product.id} onClick={() => toggleProductExpansion(product.id)} className="cursor-pointer">
                        <TableCell>
                          {expandedProducts.has(product.id) ? <ChevronDown /> : <ChevronRight />}
                        </TableCell>
                        <TableCell>
                            <p className="font-medium text-card-foreground">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{product.form} • {product.strength}</p>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{product.code_value}</TableCell>
                        <TableCell className="text-right font-medium">{product.total_qty_on_hand}</TableCell>
                        <TableCell>
                          <Badge variant={getProductStatus(product).variant}>{getProductStatus(product).label}</Badge>
                        </TableCell>
                      </TableRow>
                      {expandedProducts.has(product.id) && (
                        <TableRow>
                          <TableCell colSpan={5} className="p-0">
                            <div className="bg-muted/50 p-4">
                              <h4 className="font-semibold mb-2">Batches</h4>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Lot</TableHead>
                                    <TableHead>Expiry</TableHead>
                                    <TableHead className="text-right">Qty</TableHead>
                                    <TableHead>Status</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {product.batches.map(batch => (
                                    <TableRow key={batch.id}>
                                      <TableCell className="font-mono">{batch.lot}</TableCell>
                                      <TableCell className={cn(batch.is_expired && 'text-destructive', batch.is_near_expiry && 'text-warning')}>
                                        {batch.expiry ? new Date(batch.expiry).toLocaleDateString() : '—'}
                                      </TableCell>
                                      <TableCell className="text-right">{batch.qty_on_hand}</TableCell>
                                      <TableCell>
                                         <Badge variant={getBatchStatus(batch).variant} className="capitalize">{getBatchStatus(batch).label}</Badge>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))
                )}
              </TableBody>
            </Table>
        </div>
      </div>
    </AppLayout>
  );
}
