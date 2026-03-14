"use client";

import { useEffect, useState } from 'react';
import { 
  Package, 
  AlertTriangle, 
  XCircle, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  ArrowLeftRight,
  TrendingUp,
  Boxes,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { getDashboardStats, DashboardStats, RecentOperation } from '@/lib/hooks/useDashboard';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to load dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();

    const supabase = createClient();
    const channel: RealtimeChannel = supabase
      .channel('stock_levels_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stock_levels',
        },
        (payload) => {
          console.log('Stock level changed:', payload);
          loadStats();
          const changeType = payload.eventType;
          const toastMessage = changeType === 'INSERT' 
            ? 'New stock added' 
            : changeType === 'UPDATE' 
              ? 'Stock updated' 
              : 'Stock removed';
          toast.success(toastMessage, {
            duration: 2000,
            position: 'bottom-right',
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <p className="text-sm text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const kpis = [
    {
      title: 'Total Products',
      value: stats?.totalProducts ?? 0,
      subtitle: 'Active SKUs in inventory',
      icon: <Package className="h-5 w-5" />,
      color: 'blue' as const,
    },
    {
      title: 'Low Stock',
      value: stats?.lowStockItems ?? 0,
      subtitle: 'Items below reorder point',
      icon: <AlertTriangle className="h-5 w-5" />,
      color: 'orange' as const,
    },
    {
      title: 'Out of Stock',
      value: stats?.outOfStockItems ?? 0,
      subtitle: 'Items with zero quantity',
      icon: <XCircle className="h-5 w-5" />,
      color: 'red' as const,
    },
    {
      title: 'Pending Receipts',
      value: stats?.pendingReceipts ?? 0,
      subtitle: 'Awaiting warehouse receive',
      icon: <ArrowDownToLine className="h-5 w-5" />,
      color: 'blue' as const,
    },
    {
      title: 'Pending Deliveries',
      value: stats?.pendingDeliveries ?? 0,
      subtitle: 'Awaiting shipment',
      icon: <ArrowUpFromLine className="h-5 w-5" />,
      color: 'green' as const,
    },
    {
      title: 'Scheduled Transfers',
      value: stats?.scheduledTransfers ?? 0,
      subtitle: 'In-progress transfers',
      icon: <ArrowLeftRight className="h-5 w-5" />,
      color: 'blue' as const,
    },
  ];

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'receipt':
        return <ArrowDownToLine className="h-4 w-4 text-green-400" />;
      case 'delivery':
        return <ArrowUpFromLine className="h-4 w-4 text-blue-400" />;
      case 'transfer':
        return <ArrowLeftRight className="h-4 w-4 text-orange-400" />;
      case 'adjustment':
        return <TrendingUp className="h-4 w-4 text-purple-400" />;
      default:
        return <Boxes className="h-4 w-4 text-slate-400" />;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard</h1>
        <p className="text-sm text-slate-400">Overview of your inventory operations</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.title} {...kpi} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card rounded-xl border border-slate-800/50 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Recent Operations</h2>
            <Clock className="h-4 w-4 text-slate-500" />
          </div>

          {stats?.recentOperations && stats.recentOperations.length > 0 ? (
            <div className="space-y-3">
              {stats.recentOperations.map((op) => (
                <div
                  key={op.id}
                  className="flex items-center justify-between rounded-lg bg-slate-900/50 p-3 transition-colors hover:bg-slate-900/70"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800">
                      {getMovementIcon(op.movement_type)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{op.product_name}</p>
                      <p className="text-xs text-slate-500">
                        {op.warehouse_name && op.location_name 
                          ? `${op.warehouse_name} → ${op.location_name}`
                          : op.warehouse_name || op.location_name || 'Unknown location'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${op.qty_change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {op.qty_change > 0 ? '+' : ''}{op.qty_change}
                    </p>
                    <p className="text-xs text-slate-500">{formatDate(op.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Boxes className="mb-2 h-8 w-8 text-slate-600" />
              <p className="text-sm text-slate-500">No recent operations</p>
            </div>
          )}
        </div>

        <div className="glass-card rounded-xl border border-slate-800/50 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Low Stock Alerts</h2>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </div>
          
          {stats && (stats.lowStockItems > 0 || stats.outOfStockItems > 0) ? (
            <div className="space-y-3">
              {stats.outOfStockItems > 0 && (
                <div className="flex items-center justify-between rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/20">
                      <XCircle className="h-4 w-4 text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Out of Stock</p>
                      <p className="text-xs text-slate-500">Immediate restocking required</p>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-red-400">{stats.outOfStockItems}</p>
                </div>
              )}
              
              {stats.lowStockItems > 0 && (
                <div className="flex items-center justify-between rounded-lg border border-orange-500/30 bg-orange-500/5 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/20">
                      <AlertTriangle className="h-4 w-4 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Low Stock</p>
                      <p className="text-xs text-slate-500">Below reorder point</p>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-orange-400">{stats.lowStockItems}</p>
                </div>
              )}
              
              <p className="pt-2 text-xs text-slate-500">
                Review your inventory levels and create purchase orders to replenish stock.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <TrendingUp className="mb-2 h-8 w-8 text-green-600" />
              <p className="text-sm text-slate-500">All stock levels are healthy</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
