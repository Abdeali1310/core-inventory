import { cn } from '@/lib/utils';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: 'blue' | 'green' | 'orange' | 'red';
}

export function KpiCard({ title, value, subtitle, icon, trend, color }: KpiCardProps) {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/30',
    green: 'from-green-500/20 to-green-600/5 border-green-500/30',
    orange: 'from-orange-500/20 to-orange-600/5 border-orange-500/30',
    red: 'from-red-500/20 to-red-600/5 border-red-500/30',
  };

  const iconColorClasses = {
    blue: 'text-blue-400 bg-blue-500/20',
    green: 'text-green-400 bg-green-500/20',
    orange: 'text-orange-400 bg-orange-500/20',
    red: 'text-red-400 bg-red-500/20',
  };

  return (
    <div
      className={cn(
        'glass-card relative overflow-hidden rounded-xl border p-6 transition-all duration-300 hover:scale-[1.02]',
        colorClasses[color]
      )}
    >
      <div className="gradient-border pointer-events-none absolute inset-x-0 top-0 h-0.5" />

      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className="text-3xl font-bold tracking-tight text-white">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-500">{subtitle}</p>
          )}
          {trend && (
            <div
              className={cn(
                'flex items-center gap-1 text-xs font-medium',
                trend.isPositive ? 'text-green-400' : 'text-red-400'
              )}
            >
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-slate-500">vs last week</span>
            </div>
          )}
        </div>

        <div className={cn('rounded-lg p-3', iconColorClasses[color])}>
          {icon}
        </div>
      </div>
    </div>
  );
}
