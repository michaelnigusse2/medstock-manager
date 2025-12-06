import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Download,
  Plus,
  Package,
  Barcode,
  Calendar,
  Hash,
  DollarSign,
  CheckCircle,
} from 'lucide-react';
import { mockProducts } from '@/data/mockData';

interface ReceiveFormData {
  codeType: 'GTIN' | 'National' | 'InternalSku';
  codeValue: string;
  productName: string;
  strength: string;
  form: string;
  packSize: string;
  uom: string;
  lot: string;
  expiry: string;
  qty: string;
  unitCost: string;
  unitPrice: string;
}

const initialFormData: ReceiveFormData = {
  codeType: 'GTIN',
  codeValue: '',
  productName: '',
  strength: '',
  form: '',
  packSize: '',
  uom: '',
  lot: '',
  expiry: '',
  qty: '',
  unitCost: '',
  unitPrice: '',
};

// Simple GS1 parser for GTIN, lot, and expiry
function parseGS1(gs1String: string) {
  const result: { gtin?: string; lot?: string; expiry?: string } = {};
  
  // Remove FNC1 characters and separators
  const cleaned = gs1String.replace(/[\x1d\x1e]/g, '|');
  
  // AI 01: GTIN (14 digits)
  const gtinMatch = cleaned.match(/01(\d{14})/);
  if (gtinMatch) result.gtin = gtinMatch[1];
  
  // AI 10: Lot number (variable length, up to 20 chars)
  const lotMatch = cleaned.match(/10([A-Za-z0-9]{1,20})(?:\||$|01|17)/);
  if (lotMatch) result.lot = lotMatch[1];
  
  // AI 17: Expiry date (YYMMDD)
  const expiryMatch = cleaned.match(/17(\d{6})/);
  if (expiryMatch) {
    const [_, yy, mm, dd] = expiryMatch[1].match(/(\d{2})(\d{2})(\d{2})/) || [];
    if (yy && mm && dd) {
      const year = parseInt(yy) > 50 ? `19${yy}` : `20${yy}`;
      result.expiry = `${year}-${mm}-${dd}`;
    }
  }
  
  return result;
}

export default function ReceivePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState<ReceiveFormData>(initialFormData);
  const [gs1Input, setGs1Input] = useState('');
  const [existingProduct, setExistingProduct] = useState<boolean>(false);

  const handleGS1Parse = () => {
    if (!gs1Input.trim()) return;
    
    const parsed = parseGS1(gs1Input);
    
    if (parsed.gtin) {
      // Check if product exists
      const existing = mockProducts.find(p => p.codeValue === parsed.gtin);
      if (existing) {
        setExistingProduct(true);
        setFormData({
          ...formData,
          codeType: existing.codeType,
          codeValue: existing.codeValue,
          productName: existing.name,
          strength: existing.strength || '',
          form: existing.form || '',
          packSize: existing.packSize?.toString() || '',
          uom: existing.uom || '',
          unitCost: existing.unitCost?.toString() || '',
          unitPrice: existing.unitPrice?.toString() || '',
          lot: parsed.lot || '',
          expiry: parsed.expiry || '',
        });
      } else {
        setExistingProduct(false);
        setFormData({
          ...formData,
          codeValue: parsed.gtin,
          lot: parsed.lot || '',
          expiry: parsed.expiry || '',
        });
      }
      
      toast({
        title: 'GS1 parsed',
        description: existing 
          ? 'Product found. Fill in batch details.'
          : 'New product. Fill in product details.',
      });
    } else {
      toast({
        title: 'Parse failed',
        description: 'Could not extract GTIN from the barcode.',
        variant: 'destructive',
      });
    }
    
    setGs1Input('');
  };

  const handleChange = (field: keyof ReceiveFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleCodeLookup = () => {
    if (!formData.codeValue.trim()) return;
    
    const existing = mockProducts.find(
      p => p.codeValue.toLowerCase() === formData.codeValue.toLowerCase()
    );
    
    if (existing) {
      setExistingProduct(true);
      setFormData({
        ...formData,
        codeType: existing.codeType,
        productName: existing.name,
        strength: existing.strength || '',
        form: existing.form || '',
        packSize: existing.packSize?.toString() || '',
        uom: existing.uom || '',
        unitCost: existing.unitCost?.toString() || '',
        unitPrice: existing.unitPrice?.toString() || '',
      });
      toast({
        title: 'Product found',
        description: 'Product details loaded. Enter batch information.',
      });
    } else {
      setExistingProduct(false);
      toast({
        title: 'New product',
        description: 'Product not found. Please enter product details.',
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.codeValue || !formData.productName || !formData.lot || !formData.qty) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in code, name, lot, and quantity.',
        variant: 'destructive',
      });
      return;
    }
    
    // In real app, call API
    toast({
      title: 'Stock received!',
      description: `${formData.qty} units of ${formData.productName} added to inventory.`,
    });
    
    setFormData(initialFormData);
    setExistingProduct(false);
  };

  const clearForm = () => {
    setFormData(initialFormData);
    setExistingProduct(false);
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Receive Stock</h1>
          <p className="text-muted-foreground mt-1">
            Add new products or receive batch stock
          </p>
        </div>

        {/* GS1 Scanner */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Barcode className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-card-foreground">GS1 Barcode Scanner</h2>
          </div>
          <div className="flex gap-3">
            <Input
              placeholder="Paste or scan GS1 barcode string (e.g., 01999060001234561720251231...)"
              value={gs1Input}
              onChange={e => setGs1Input(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGS1Parse()}
              className="flex-1 font-mono"
            />
            <Button onClick={handleGS1Parse}>
              Parse GS1
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Supports AI 01 (GTIN), AI 10 (Lot), AI 17 (Expiry)
          </p>
        </div>

        {/* Manual Entry Form */}
        <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Package className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-card-foreground">
              {existingProduct ? 'Receive Existing Product' : 'Add New Product & Batch'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Identification */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Product Identification
              </h3>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <Label>Code Type</Label>
                  <Select
                    value={formData.codeType}
                    onValueChange={v => handleChange('codeType', v)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GTIN">GTIN</SelectItem>
                      <SelectItem value="National">National</SelectItem>
                      <SelectItem value="InternalSku">Internal SKU</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Code Value</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      placeholder="Enter product code"
                      value={formData.codeValue}
                      onChange={e => handleChange('codeValue', e.target.value)}
                      className="font-mono"
                    />
                    <Button type="button" variant="outline" onClick={handleCodeLookup}>
                      Lookup
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <Label>Product Name *</Label>
                <Input
                  placeholder="e.g., Amoxicillin 500mg Capsules"
                  value={formData.productName}
                  onChange={e => handleChange('productName', e.target.value)}
                  className="mt-1"
                  disabled={existingProduct}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Strength</Label>
                  <Input
                    placeholder="e.g., 500mg"
                    value={formData.strength}
                    onChange={e => handleChange('strength', e.target.value)}
                    className="mt-1"
                    disabled={existingProduct}
                  />
                </div>
                <div>
                  <Label>Form</Label>
                  <Input
                    placeholder="e.g., Tablet"
                    value={formData.form}
                    onChange={e => handleChange('form', e.target.value)}
                    className="mt-1"
                    disabled={existingProduct}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Pack Size</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 30"
                    value={formData.packSize}
                    onChange={e => handleChange('packSize', e.target.value)}
                    className="mt-1"
                    disabled={existingProduct}
                  />
                </div>
                <div>
                  <Label>UOM</Label>
                  <Input
                    placeholder="e.g., tablet"
                    value={formData.uom}
                    onChange={e => handleChange('uom', e.target.value)}
                    className="mt-1"
                    disabled={existingProduct}
                  />
                </div>
              </div>
            </div>

            {/* Batch Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Batch Information
              </h3>

              <div>
                <Label>Lot Number *</Label>
                <div className="relative mt-1">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="e.g., LOT-2025-001"
                    value={formData.lot}
                    onChange={e => handleChange('lot', e.target.value)}
                    className="pl-10 font-mono"
                  />
                </div>
              </div>

              <div>
                <Label>Expiry Date</Label>
                <div className="relative mt-1">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={formData.expiry}
                    onChange={e => handleChange('expiry', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label>Quantity *</Label>
                <div className="relative mt-1">
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="e.g., 100"
                    value={formData.qty}
                    onChange={e => handleChange('qty', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Unit Cost</Label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.unitCost}
                      onChange={e => handleChange('unitCost', e.target.value)}
                      className="pl-10"
                      disabled={existingProduct}
                    />
                  </div>
                </div>
                <div>
                  <Label>Unit Price</Label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.unitPrice}
                      onChange={e => handleChange('unitPrice', e.target.value)}
                      className="pl-10"
                      disabled={existingProduct}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-border">
            <Button type="button" variant="outline" onClick={clearForm}>
              Clear Form
            </Button>
            <Button type="submit">
              <CheckCircle className="w-4 h-4 mr-2" />
              Receive Stock
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
