import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { mockSettings } from '@/data/mockData';
import {
  Settings,
  Clock,
  AlertTriangle,
  Database,
  Upload,
  Download,
  Save,
} from 'lucide-react';

export default function SettingsPage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    nearExpiryDays: mockSettings.nearExpiryDays.toString(),
    lowStockThreshold: mockSettings.lowStockThreshold.toString(),
  });

  // Redirect non-admins
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleSave = () => {
    const nearExpiryDays = parseInt(settings.nearExpiryDays);
    const lowStockThreshold = parseInt(settings.lowStockThreshold);

    if (isNaN(nearExpiryDays) || nearExpiryDays < 1) {
      toast({
        title: 'Invalid value',
        description: 'Near expiry days must be at least 1.',
        variant: 'destructive',
      });
      return;
    }

    if (isNaN(lowStockThreshold) || lowStockThreshold < 1) {
      toast({
        title: 'Invalid value',
        description: 'Low stock threshold must be at least 1.',
        variant: 'destructive',
      });
      return;
    }

    // In real app, save to API/DB
    toast({
      title: 'Settings saved',
      description: 'Your settings have been updated successfully.',
    });
  };

  const handleBackup = () => {
    // In real app, trigger download of DB
    const data = JSON.stringify({
      exportDate: new Date().toISOString(),
      settings: mockSettings,
      // Would include full DB export
    }, null, 2);

    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pharmasys-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Backup created',
      description: 'Database backup has been downloaded.',
    });
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        toast({
          title: 'Restore initiated',
          description: 'Database restore would process here.',
        });
      } catch (err) {
        toast({
          title: 'Invalid file',
          description: 'The selected file is not a valid backup.',
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure system parameters and manage backups
          </p>
        </div>

        {/* Inventory Settings */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Settings className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-card-foreground">Inventory Thresholds</h2>
          </div>

          <div className="space-y-5">
            <div>
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-warning" />
                Near Expiry Warning (days)
              </Label>
              <p className="text-xs text-muted-foreground mt-1 mb-2">
                Products expiring within this many days will be flagged as "Near Expiry"
              </p>
              <Input
                type="number"
                min="1"
                value={settings.nearExpiryDays}
                onChange={e => setSettings({ ...settings, nearExpiryDays: e.target.value })}
                className="max-w-xs"
              />
            </div>

            <div>
              <Label className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                Low Stock Threshold (units)
              </Label>
              <p className="text-xs text-muted-foreground mt-1 mb-2">
                Products with stock at or below this level will be flagged as "Low Stock"
              </p>
              <Input
                type="number"
                min="1"
                value={settings.lowStockThreshold}
                onChange={e => setSettings({ ...settings, lowStockThreshold: e.target.value })}
                className="max-w-xs"
              />
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border flex justify-end">
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </div>

        {/* Backup & Restore */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Database className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-card-foreground">Backup & Restore</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border border-border bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Download className="w-5 h-5 text-success" />
                <h3 className="font-medium">Backup Database</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Download a complete copy of your database for safekeeping.
              </p>
              <Button variant="outline" onClick={handleBackup}>
                <Download className="w-4 h-4 mr-2" />
                Create Backup
              </Button>
            </div>

            <div className="p-4 rounded-lg border border-border bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Upload className="w-5 h-5 text-warning" />
                <h3 className="font-medium">Restore Database</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Upload a backup file to restore your database.
              </p>
              <div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestore}
                  className="hidden"
                  id="restore-input"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('restore-input')?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Restore Backup
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                <strong>Warning:</strong> Restoring a backup will replace all current data. 
                Make sure to create a backup before restoring.
              </span>
            </p>
          </div>
        </div>

        {/* System Info */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <h2 className="font-semibold text-card-foreground mb-4">System Information</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Version:</span>
              <p className="font-medium">1.0.0</p>
            </div>
            <div>
              <span className="text-muted-foreground">Environment:</span>
              <p className="font-medium">Development</p>
            </div>
            <div>
              <span className="text-muted-foreground">Database:</span>
              <p className="font-medium">Local (Demo Mode)</p>
            </div>
            <div>
              <span className="text-muted-foreground">Last Backup:</span>
              <p className="font-medium">Never</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
