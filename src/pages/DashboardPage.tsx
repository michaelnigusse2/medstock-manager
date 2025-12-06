import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { KpiTile } from '@/components/dashboard/KpiTile';
import {
  DollarSign,
  Package,
  Layers,
  Archive,
  AlertTriangle,
  Clock,
  TrendingDown,
  ArrowRight,
  Pill,
} from 'lucide-react';
import {
  calculateDashboardTiles,
  getIssuesWithDetails,
  getBatchesWithProducts,
  mockSettings,
} from '@/data/mockData';
import { formatDistanceToNow } from 'date-fns';

export default function DashboardPage() {
  const navigate = useNavigate();
  const tiles = calculateDashboardTiles();
  const recentIssues = getIssuesWithDetails().slice(0, 5);
  const batchesWithProducts = getBatchesWithProducts();

  const today = new Date();
  const nearExpiryDate = new Date(
    today.getTime() + mockSettings.nearExpiryDays * 24 * 60 * 60 * 1000
  );

  const nearExpiryBatches = batchesWithProducts
    .filter(b => {
      if (!b.expiry) return false;
      const expiry = new Date(b.expiry);
      return expiry >= today && expiry <= nearExpiryDate;
    })
    .slice(0, 5);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your pharmacy operations
          </p>
        </div>

        {/* KPI Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiTile
            title="Today's Sales"
            value={formatCurrency(tiles.todaySales)}
            icon={DollarSign}
            variant="success"
            subtitle="Completed transactions"
            onClick={() => navigate('/sales')}
          />
          <KpiTile
            title="Products"
            value={tiles.distinctProducts}
            icon={Package}
            subtitle="Distinct items"
            onClick={() => navigate('/inventory')}
          />
          <KpiTile
            title="Total Batches"
            value={tiles.totalBatches}
            icon={Layers}
            subtitle={`${tiles.totalOnHand.toLocaleString()} units on hand`}
            onClick={() => navigate('/inventory')}
          />
          <KpiTile
            title="Low Stock"
            value={tiles.lowStockCount}
            icon={TrendingDown}
            variant={tiles.lowStockCount > 0 ? 'warning' : 'default'}
            subtitle={`≤${mockSettings.lowStockThreshold} units`}
            onClick={() => navigate('/inventory?filter=lowstock')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KpiTile
            title="Expired Batches"
            value={tiles.expiredCount}
            icon={AlertTriangle}
            variant={tiles.expiredCount > 0 ? 'danger' : 'default'}
            subtitle="Requires attention"
            onClick={() => navigate('/inventory?filter=expired')}
          />
          <KpiTile
            title="Near Expiry"
            value={tiles.nearExpiryCount}
            icon={Clock}
            variant={tiles.nearExpiryCount > 0 ? 'warning' : 'default'}
            subtitle={`Within ${mockSettings.nearExpiryDays} days`}
            onClick={() => navigate('/inventory?filter=nearexpiry')}
          />
          <KpiTile
            title="Stock Value"
            value={formatCurrency(tiles.totalOnHand * 1.5)}
            icon={Archive}
            subtitle="Estimated retail value"
          />
        </div>

        {/* Two column layout for lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Near Expiry List */}
          <div className="bg-card rounded-xl border border-border shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-warning" />
                <h2 className="font-semibold text-card-foreground">
                  Near Expiry Items
                </h2>
              </div>
              <button
                onClick={() => navigate('/inventory?filter=nearexpiry')}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="divide-y divide-border">
              {nearExpiryBatches.length === 0 ? (
                <div className="p-5 text-center text-muted-foreground">
                  No items expiring soon
                </div>
              ) : (
                nearExpiryBatches.map(batch => (
                  <div
                    key={batch.id}
                    className="px-5 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                        <Pill className="w-4 h-4 text-warning" />
                      </div>
                      <div>
                        <p className="font-medium text-card-foreground text-sm">
                          {batch.product?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Lot: {batch.lot} • Qty: {batch.qtyOnHand}
                        </p>
                      </div>
                    </div>
                    <span className="status-badge status-badge-warning">
                      {batch.expiry}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Issues */}
          <div className="bg-card rounded-xl border border-border shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-card-foreground">
                  Recent Dispenses
                </h2>
              </div>
              <button
                onClick={() => navigate('/sales')}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="divide-y divide-border">
              {recentIssues.length === 0 ? (
                <div className="p-5 text-center text-muted-foreground">
                  No recent dispenses
                </div>
              ) : (
                recentIssues.map(issue => (
                  <div
                    key={issue.id}
                    className="px-5 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Pill className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-card-foreground text-sm">
                          {issue.product?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Qty: {issue.qty} • {issue.patient || 'Walk-in'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(issue.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
