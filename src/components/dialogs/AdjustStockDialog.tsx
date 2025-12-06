import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import { InventoryProduct } from '@/types/pharmacy';

interface AdjustStockDialogProps {
  batch: InventoryProduct['batches'][0];
  productName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdjustStockDialog({ batch, productName, open, onOpenChange }: AdjustStockDialogProps) {
  const [newQty, setNewQty] = useState(batch.qty_on_hand.toString());
  const [reason, setReason] = useState('');

  const api = useApi();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const adjustmentMutation = useMutation({
    mutationFn: () => api.post('/adjustments', {
      batch_id: batch.id,
      new_qty: parseInt(newQty, 10),
      reason,
    }),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Stock quantity has been updated.' });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update stock.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = () => {
    if (!reason.trim() || !newQty.trim()) {
      toast({ title: 'Error', description: 'Please provide a new quantity and a reason.', variant: 'destructive' });
      return;
    }
    adjustmentMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust Stock for {productName}</DialogTitle>
          <DialogDescription>
            Lot: <span className="font-mono">{batch.lot}</span> | Current Qty: {batch.qty_on_hand}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="new-qty">New Quantity on Hand</Label>
            <Input
              id="new-qty"
              type="number"
              value={newQty}
              onChange={e => setNewQty(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Adjustment</Label>
            <Textarea
              id="reason"
              placeholder="e.g., Stock count correction, damaged goods..."
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={adjustmentMutation.isLoading}>
            {adjustmentMutation.isLoading ? 'Saving...' : 'Save Adjustment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
