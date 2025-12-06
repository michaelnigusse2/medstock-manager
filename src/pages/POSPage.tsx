import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CreditCard,
  Banknote,
  Package,
  User,
} from 'lucide-react';
import { mockProducts, getBatchesWithProducts, mockSettings } from '@/data/mockData';
import { CartItem, Product, Batch } from '@/types/pharmacy';
import { cn } from '@/lib/utils';

export default function POSPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [patientName, setPatientName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card'>('Cash');
  const [cashReceived, setCashReceived] = useState('');

  const batchesWithProducts = getBatchesWithProducts();
  const today = new Date();

  // Filter available batches (not expired, has stock)
  const availableBatches = useMemo(() => {
    return batchesWithProducts
      .filter(b => {
        if (b.qtyOnHand <= 0) return false;
        if (b.expiry && new Date(b.expiry) < today) return false;
        return true;
      })
      .filter(b => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
          b.product?.name.toLowerCase().includes(query) ||
          b.product?.codeValue.toLowerCase().includes(query)
        );
      });
  }, [batchesWithProducts, searchQuery]);

  // Get best batch for a product (FEFO - First Expiry First Out)
  const getBestBatch = (productId: string): Batch | undefined => {
    const productBatches = batchesWithProducts
      .filter(b => b.productId === productId && b.qtyOnHand > 0)
      .filter(b => !b.expiry || new Date(b.expiry) >= today)
      .sort((a, b) => {
        if (!a.expiry) return 1;
        if (!b.expiry) return -1;
        return new Date(a.expiry).getTime() - new Date(b.expiry).getTime();
      });
    return productBatches[0];
  };

  const addToCart = (product: Product) => {
    const batch = getBestBatch(product.id);
    if (!batch) {
      toast({
        title: 'No stock available',
        description: 'This product has no available batches.',
        variant: 'destructive',
      });
      return;
    }

    const existingIndex = cart.findIndex(
      item => item.product.id === product.id && item.batch.id === batch.id
    );

    if (existingIndex >= 0) {
      const existing = cart[existingIndex];
      if (existing.qty >= batch.qtyOnHand) {
        toast({
          title: 'Insufficient stock',
          description: `Only ${batch.qtyOnHand} units available in this batch.`,
          variant: 'destructive',
        });
        return;
      }
      const newCart = [...cart];
      newCart[existingIndex] = {
        ...existing,
        qty: existing.qty + 1,
        lineTotal: (existing.qty + 1) * existing.unitPrice,
      };
      setCart(newCart);
    } else {
      const unitPrice = product.unitPrice || 0;
      setCart([
        ...cart,
        {
          product,
          batch,
          qty: 1,
          unitPrice,
          lineTotal: unitPrice,
        },
      ]);
    }
  };

  const updateQty = (index: number, delta: number) => {
    const item = cart[index];
    const newQty = item.qty + delta;
    
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }

    if (newQty > item.batch.qtyOnHand) {
      toast({
        title: 'Insufficient stock',
        description: `Only ${item.batch.qtyOnHand} units available.`,
        variant: 'destructive',
      });
      return;
    }

    const newCart = [...cart];
    newCart[index] = {
      ...item,
      qty: newQty,
      lineTotal: newQty * item.unitPrice,
    };
    setCart(newCart);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);
  const tax = 0; // Could add tax calculation
  const total = subtotal + tax;
  const changeDue = paymentMethod === 'Cash' && cashReceived 
    ? parseFloat(cashReceived) - total 
    : 0;

  const completeSale = () => {
    if (cart.length === 0) {
      toast({
        title: 'Cart is empty',
        description: 'Add items to the cart before completing the sale.',
        variant: 'destructive',
      });
      return;
    }

    if (paymentMethod === 'Cash' && (!cashReceived || parseFloat(cashReceived) < total)) {
      toast({
        title: 'Insufficient payment',
        description: 'Cash received must be at least the total amount.',
        variant: 'destructive',
      });
      return;
    }

    // In a real app, this would call the API
    toast({
      title: 'Sale completed!',
      description: `Total: $${total.toFixed(2)}${changeDue > 0 ? ` | Change: $${changeDue.toFixed(2)}` : ''}`,
    });

    // Reset
    setCart([]);
    setPatientName('');
    setCashReceived('');
    setSearchQuery('');
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  return (
    <AppLayout>
      <div className="h-[calc(100vh-3rem)] flex gap-6">
        {/* Product Selection */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-foreground">Point of Sale</h1>
            <p className="text-muted-foreground">
              Scan or search products to add to cart
            </p>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Scan barcode or search product..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-lg"
              autoFocus
            />
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {availableBatches.slice(0, 12).map(batch => (
                <button
                  key={batch.id}
                  onClick={() => batch.product && addToCart(batch.product)}
                  className="bg-card border border-border rounded-xl p-4 text-left hover:border-primary/50 hover:shadow-md transition-all duration-200 group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Package className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-card-foreground truncate">
                        {batch.product?.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {batch.product?.form} • {batch.product?.strength}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-bold text-primary">
                          {formatCurrency(batch.product?.unitPrice || 0)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Stock: {batch.qtyOnHand}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cart */}
        <div className="w-96 flex flex-col bg-card rounded-xl border border-border shadow-sm">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-card-foreground">
              Cart ({cart.length})
            </h2>
          </div>

          {/* Patient name */}
          <div className="px-4 py-3 border-b border-border">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Patient name (optional)"
                value={patientName}
                onChange={e => setPatientName(e.target.value)}
                className="pl-10 h-9 text-sm"
              />
            </div>
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <ShoppingCart className="w-12 h-12 mb-2 opacity-30" />
                <p className="text-sm">Cart is empty</p>
              </div>
            ) : (
              cart.map((item, index) => (
                <div key={`${item.product.id}-${item.batch.id}`} className="cart-item">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-card-foreground truncate">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(item.unitPrice)} × {item.qty}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => updateQty(index, -1)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">
                        {item.qty}
                      </span>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => updateQty(index, 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeFromCart(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Totals & Payment */}
          <div className="border-t border-border p-4 space-y-4">
            {/* Totals */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-card-foreground pt-2 border-t border-border">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Payment method */}
            <div className="flex gap-2">
              <Button
                variant={paymentMethod === 'Cash' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setPaymentMethod('Cash')}
              >
                <Banknote className="w-4 h-4 mr-1" />
                Cash
              </Button>
              <Button
                variant={paymentMethod === 'Card' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setPaymentMethod('Card')}
              >
                <CreditCard className="w-4 h-4 mr-1" />
                Card
              </Button>
            </div>

            {/* Cash received */}
            {paymentMethod === 'Cash' && (
              <div className="space-y-2">
                <Input
                  type="number"
                  placeholder="Cash received"
                  value={cashReceived}
                  onChange={e => setCashReceived(e.target.value)}
                  className="h-11 text-lg text-center"
                />
                {changeDue > 0 && (
                  <div className="text-center py-2 bg-success/10 rounded-lg">
                    <span className="text-sm text-muted-foreground">Change: </span>
                    <span className="font-bold text-success">
                      {formatCurrency(changeDue)}
                    </span>
                  </div>
                )}
              </div>
            )}

            <Button
              className="w-full h-12 text-base"
              onClick={completeSale}
              disabled={cart.length === 0}
            >
              Complete Sale
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
