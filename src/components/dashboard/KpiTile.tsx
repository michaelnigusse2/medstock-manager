import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface KpiTileProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  subtitle?: string;
  onClick?: () => void;
  className?: string;
}

export function KpiTile({
  title,
  value,
  icon: Icon,
  variant = 'default',
  subtitle,
  onClick,
  className,
}: KpiTileProps) {
  const variantClasses = {
    default: 'kpi-tile',
    success: 'kpi-tile kpi-tile-success',
    warning: 'kpi-tile kpi-tile-warning',
    danger: 'kpi-tile kpi-tile-danger',
  };

  const iconColors = {
    default: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-destructive',
  };

  return (
    <div
      className={cn(variantClasses[variant], className)}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-card-foreground mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className={cn('p-2 rounded-lg bg-muted/50', iconColors[variant])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
