import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Calendar,
  Search,
  Eye,
  XCircle,
  Package,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { getSalesWithLines, mockProducts } from '@/data/mockData';
import { Sale } from '@/types/pharmacy';
import { format, parseISO, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { cn } from '@/lib/utils';

export default function SalesHistoryPage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');

  const salesWithLines = getSalesWithLines();

  const filteredSales = useMemo(() => {
    let result = salesWithLines;

    // Date filter
    if (dateFilter === 'today') {
      result = result.filter(s => isToday(parseISO(s.createdAt)));
    } else if (dateFilter === 'week') {
      result = result.filter(s => isThisWeek(parseISO(s.createdAt)));
    } else if (dateFilter === 'month') {
      result = result.filter(s => isThisMonth(parseISO(s.createdAt)));
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        s =>
          s.id.toLowerCase().includes(query) ||
          s.patient?.toLowerCase().includes(query) ||
          s.createdBy?.toLowerCase().includes(query)
      );
    }

    return result.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [salesWithLines, dateFilter, searchQuery]);

  const handleVoid = () => {
    if (!voidReason.trim()) {
      toast({
        title: 'Reason required',
        description: 'Please provide a reason for voiding this sale.',
        variant: 'destructive',
      });
      return;
    }

    // In real app, call API
    toast({
      title: 'Sale voided',
      description: `Sale #${selectedSale?.id} has been voided.`,
    });
    setVoidDialogOpen(false);
    setVoidReason('');
    setSelectedSale(null);
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sales History</h1>
          <p className="text-muted-foreground mt-1">
            View and manage past transactions
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID, patient, or cashier..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'today', 'week', 'month'] as const).map(filter => (
              <Button
                key={filter}
                variant={dateFilter === filter ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateFilter(filter)}
              >
                {filter === 'all' && 'All'}
                {filter === 'today' && 'Today'}
                {filter === 'week' && 'This Week'}
                {filter === 'month' && 'This Month'}
              </Button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="flex gap-4">
          <div className="bg-card rounded-lg border border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">Total Sales</p>
            <p className="text-lg font-bold text-card-foreground">
              {filteredSales.filter(s => s.status === 'Completed').length}
            </p>
          </div>
          <div className="bg-card rounded-lg border border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">Revenue</p>
            <p className="text-lg font-bold text-success">
              {formatCurrency(
                filteredSales
                  .filter(s => s.status === 'Completed')
                  .reduce((sum, s) => sum + s.total, 0)
              )}
            </p>
          </div>
          <div className="bg-card rounded-lg border border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">Voided</p>
            <p className="text-lg font-bold text-destructive">
              {filteredSales.filter(s => s.status === 'Voided').length}
            </p>
          </div>
        </div>

        {/* Sales list */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sale ID</th>
                  <th>Date & Time</th>
                  <th>Patient</th>
                  <th>Cashier</th>
                  <th>Items</th>
                  <th className="text-right">Total</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-muted-foreground">
                      No sales found
                    </td>
                  </tr>
                ) : (
                  filteredSales.map(sale => (
                    <tr key={sale.id}>
                      <td className="font-mono text-sm">#{sale.id}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>{format(parseISO(sale.createdAt), 'MMM d, yyyy HH:mm')}</span>
                        </div>
                      </td>
                      <td>{sale.patient || '—'}</td>
                      <td className="text-muted-foreground">{sale.createdBy}</td>
                      <td>{sale.lines?.length || 0} items</td>
                      <td className="text-right font-medium">
                        {formatCurrency(sale.total)}
                      </td>
                      <td>
                        <span
                          className={cn(
                            'status-badge',
                            sale.status === 'Completed' && 'status-badge-success',
                            sale.status === 'Voided' && 'status-badge-danger'
                          )}
                        >
                          {sale.status === 'Completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {sale.status === 'Voided' && <AlertCircle className="w-3 h-3 mr-1" />}
                          {sale.status}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedSale(sale)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {isAdmin && sale.status === 'Completed' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                setSelectedSale(sale);
                                setVoidDialogOpen(true);
                              }}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Sale Details Dialog */}
      <Dialog open={!!selectedSale && !voidDialogOpen} onOpenChange={() => setSelectedSale(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Sale #{selectedSale?.id}</DialogTitle>
            <DialogDescription>
              {selectedSale && format(parseISO(selectedSale.createdAt), 'MMMM d, yyyy at HH:mm')}
            </DialogDescription>
          </DialogHeader>

          {selectedSale && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Patient:</span>
                  <p className="font-medium">{selectedSale.patient || 'Walk-in'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Cashier:</span>
                  <p className="font-medium">{selectedSale.createdBy}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Payment:</span>
                  <p className="font-medium">{selectedSale.paymentMethod}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <p className={cn('font-medium', selectedSale.status === 'Voided' && 'text-destructive')}>
                    {selectedSale.status}
                  </p>
                </div>
              </div>

              {selectedSale.voidReason && (
                <div className="p-3 bg-destructive/10 rounded-lg">
                  <p className="text-xs text-muted-foreground">Void Reason:</p>
                  <p className="text-sm text-destructive">{selectedSale.voidReason}</p>
                </div>
              )}

              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">Items</p>
                <div className="space-y-2">
                  {selectedSale.lines?.map(line => (
                    <div key={line.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        <span>{line.product?.name}</span>
                        <span className="text-muted-foreground">×{line.qty}</span>
                      </div>
                      <span className="font-medium">{formatCurrency(line.lineTotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(selectedSale.subtotal)}</span>
                </div>
                {selectedSale.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount</span>
                    <span>-{formatCurrency(selectedSale.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base pt-2 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(selectedSale.total)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Void Confirmation Dialog */}
      <Dialog open={voidDialogOpen} onOpenChange={setVoidDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Void Sale</DialogTitle>
            <DialogDescription>
              This will void sale #{selectedSale?.id} and restore the stock. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reason for void</label>
              <Textarea
                placeholder="Enter the reason for voiding this sale..."
                value={voidReason}
                onChange={e => setVoidReason(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setVoidDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleVoid}>
              Void Sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
