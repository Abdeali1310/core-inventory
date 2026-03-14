import { notFound } from 'next/navigation';
import { getLocations } from '@/lib/actions/locations';
import { getProducts } from '@/lib/actions/products';
import { createClient } from '@/lib/supabase/server';
import ReceiptForm from './ReceiptForm';

export default async function ReceiptNewPage() {
  const supabase = await createClient();

  const { data: locationData } = await supabase
    .from('locations')
    .select('id, name, warehouse_id, warehouses (name)')
    .order('name', { ascending: true });

  const locations = (locationData || []).map((loc: any) => ({
    id: loc.id,
    name: loc.name,
    warehouse_id: loc.warehouse_id,
    warehouse_name: loc.warehouses?.name || 'Unknown',
    is_active: loc.is_active,
  }));

  if (locations.length === 0) {
    notFound();
  }

  const { data: productData } = await supabase
    .from('products')
    .select('id, name, sku, category_id, unit_of_measure, reorder_point, reorder_qty, is_active, created_at, updated_at, categories (name)')
    .eq('is_active', true)
    .order('name', { ascending: true });

  const products = (productData || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    category_id: p.category_id,
    category_name: p.categories?.name || 'Uncategorized',
    unit_of_measure: p.unit_of_measure,
    reorder_point: p.reorder_point,
    reorder_qty: p.reorder_qty,
    is_active: p.is_active,
    created_at: p.created_at,
    updated_at: p.updated_at,
    total_stock: 0,
  }));

  const { data: lastReceipt } = await supabase
    .from('receipts')
    .select('reference')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const lastSeq = lastReceipt?.reference ? parseInt(lastReceipt.reference.replace(/^RCPT-/, ''), 10) : 0;
  const nextSeq = lastSeq + 1;
  const reference = `RCPT-${String(nextSeq).padStart(5, '0')}`;

  return (
    <ReceiptForm
      locations={locations}
      products={products}
      reference={reference}
    />
  );
}
