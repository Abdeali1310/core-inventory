import { createClient } from '@/lib/supabase/client';

export interface DashboardStats {
  totalProducts: number;
  lowStockItems: number;
  outOfStockItems: number;
  pendingReceipts: number;
  pendingDeliveries: number;
  scheduledTransfers: number;
  recentOperations: RecentOperation[];
}

export interface RecentOperation {
  id: string;
  movement_type: string;
  reference_id: string;
  reference_type: string;
  qty_change: number;
  product_name: string;
  product_sku: string;
  location_name: string;
  warehouse_name: string;
  performed_by_name: string;
  created_at: string;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = createClient();

  const [
    { count: totalProducts },
    { count: pendingReceipts },
    { count: pendingDeliveries },
    { count: scheduledTransfers },
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('receipts').select('*', { count: 'exact', head: true }).in('status', ['draft', 'waiting', 'ready']),
    supabase.from('delivery_orders').select('*', { count: 'exact', head: true }).in('status', ['draft', 'waiting', 'ready']),
    supabase.from('internal_transfers').select('*', { count: 'exact', head: true }).in('status', ['draft', 'waiting', 'ready']),
  ]);

  const recentOpsResponse = await supabase
    .from('stock_ledger')
    .select(`
      id,
      movement_type,
      reference_id,
      reference_type,
      qty_change,
      created_at,
      products:product_id(name, sku),
      locations:location_id(name, warehouses:warehouse_id(name))
    `)
    .order('created_at', { ascending: false })
    .limit(5);

  const recentOpsData = recentOpsResponse.data || [];

  const { data: stockWithReorder } = await supabase
    .from('products')
    .select(`
      id,
      name,
      sku,
      reorder_point,
      stock_levels(quantity)
    `)
    .eq('is_active', true);

  let lowStockItems = 0;
  let outOfStockItems = 0;

  stockWithReorder?.forEach((product: any) => {
    const totalQty = product.stock_levels?.reduce((sum: number, sl: any) => sum + (sl.quantity || 0), 0) || 0;
    if (totalQty === 0) {
      outOfStockItems++;
    } else if (totalQty <= (product.reorder_point || 0)) {
      lowStockItems++;
    }
  });

  const recentOperations: RecentOperation[] = recentOpsData.map((op: any) => ({
    id: op.id,
    movement_type: op.movement_type,
    reference_id: op.reference_id,
    reference_type: op.reference_type,
    qty_change: op.qty_change,
    product_name: op.products?.name || 'Unknown',
    product_sku: op.products?.sku || 'N/A',
    location_name: op.locations?.name || 'Unknown',
    warehouse_name: op.locations?.warehouses?.name || '',
    performed_by_name: 'User',
    created_at: op.created_at,
  }));

  return {
    totalProducts: totalProducts || 0,
    lowStockItems,
    outOfStockItems,
    pendingReceipts: pendingReceipts || 0,
    pendingDeliveries: pendingDeliveries || 0,
    scheduledTransfers: scheduledTransfers || 0,
    recentOperations,
  };
}
