'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface DeliveryFilters {
  status?: string;
  location_id?: string;
  search?: string;
}

export interface DeliveryWithDetails {
  id: string;
  reference: string;
  customer_name: string;
  source_location_id: string;
  source_location_name?: string;
  source_warehouse_name?: string;
  status: string;
  scheduled_date: string | null;
  validated_at: string | null;
  validated_by_name?: string;
  notes: string | null;
  created_by_name?: string;
  created_at: string;
  items_count: number;
}

export async function getDeliveries(filters?: DeliveryFilters) {
  const supabase = await createClient();

  let query = supabase
    .from('delivery_orders')
    .select(`
      id,
      reference,
      customer_name,
      source_location_id,
      status,
      scheduled_date,
      validated_at,
      notes,
      created_at,
      locations!inner(name, warehouses!inner(name)),
      validator:profiles!delivery_orders_validated_by_fkey(full_name),
      creator:profiles!delivery_orders_created_by_fkey(full_name),
      delivery_lines(count)
    `)
    .order('created_at', { ascending: false });

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters?.location_id) {
    query = query.eq('source_location_id', filters.location_id);
  }

  if (filters?.search) {
    query = query.or(`reference.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching deliveries:', JSON.stringify(error, null, 2));
    throw new Error(error.message || 'Failed to fetch deliveries');
  }

  return (data || []).map(r => ({
    id: r.id,
    reference: r.reference,
    customer_name: r.customer_name,
    source_location_id: r.source_location_id,
    source_location_name: (r.locations as unknown as { name: string }[])?.[0]?.name || 'Unknown',
    source_warehouse_name: (r.locations as unknown as { warehouses: { name: string }[] }[])?.[0]?.warehouses?.[0]?.name || 'Unknown',
    status: r.status,
    scheduled_date: r.scheduled_date,
    validated_at: r.validated_at,
    validated_by_name: (r.validator as unknown as { full_name: string })?.full_name,
    created_by_name: (r.creator as unknown as { full_name: string })?.full_name,
    notes: r.notes,
    created_at: r.created_at,
    items_count: (r.delivery_lines as unknown as { count: number }[])?.[0]?.count || 0,
  }));
}

export interface DeliveryLineWithProduct {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  product_uom: string;
  expected_qty: number;
  delivered_qty: number;
}

export interface DeliveryDetail extends DeliveryWithDetails {
  lines: DeliveryLineWithProduct[];
}

export async function getDeliveryById(id: string): Promise<DeliveryDetail | null> {
  const supabase = await createClient();

  const { data: delivery, error } = await supabase
    .from('delivery_orders')
    .select(`
      id,
      reference,
      customer_name,
      source_location_id,
      status,
      scheduled_date,
      validated_at,
      notes,
      created_at,
      locations!inner(name, warehouses!inner(name)),
      validator:profiles!delivery_orders_validated_by_fkey(full_name),
      creator:profiles!delivery_orders_created_by_fkey(full_name)
    `)
    .eq('id', id)
    .single();

  if (error || !delivery) {
    console.error('Error fetching delivery:', error);
    return null;
  }

  const { data: lines, error: linesError } = await supabase
    .from('delivery_lines')
    .select(`
      id,
      product_id,
      expected_qty,
      delivered_qty,
      products!inner(name, sku, unit_of_measure)
    `)
    .eq('delivery_id', id);

  if (linesError) {
    console.error('Error fetching delivery lines:', linesError);
  }

  return {
    id: delivery.id,
    reference: delivery.reference,
    customer_name: delivery.customer_name,
    source_location_id: delivery.source_location_id,
    source_location_name: (delivery.locations as unknown as { name: string }[])?.[0]?.name || 'Unknown',
    source_warehouse_name: (delivery.locations as unknown as { warehouses: { name: string }[] }[])?.[0]?.warehouses?.[0]?.name || 'Unknown',
    status: delivery.status,
    scheduled_date: delivery.scheduled_date,
    validated_at: delivery.validated_at,
    notes: delivery.notes,
    validated_by_name: (delivery.validator as unknown as { full_name: string })?.full_name,
    created_by_name: (delivery.creator as unknown as { full_name: string })?.full_name,
    created_at: delivery.created_at,
    items_count: (lines || []).length,
    lines: (lines || []).map(l => ({
      id: l.id,
      product_id: l.product_id,
      product_name: (l.products as unknown as { name: string }[])?.[0]?.name || 'Unknown',
      product_sku: (l.products as unknown as { sku: string }[])?.[0]?.sku || 'Unknown',
      product_uom: (l.products as unknown as { unit_of_measure: string }[])?.[0]?.unit_of_measure || 'pcs',
      expected_qty: Number(l.expected_qty),
      delivered_qty: Number(l.delivered_qty),
    })),
  };
}

export interface CreateDeliveryInput {
  customer_name: string;
  source_location_id: string;
  scheduled_date?: string;
  notes?: string;
  lines: { product_id: string; expected_qty: number }[];
}

function generateReference(count: number): string {
  const year = new Date().getFullYear();
  return `DEL/${year}/${String(count + 1).padStart(3, '0')}`;
}

export async function createDelivery(data: CreateDeliveryInput) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  const { count } = await supabase
    .from('delivery_orders')
    .select('*', { count: 'exact', head: true });

  const reference = generateReference(count || 0);

  const { data: delivery, error } = await supabase
    .from('delivery_orders')
    .insert({
      reference,
      customer_name: data.customer_name,
      source_location_id: data.source_location_id,
      scheduled_date: data.scheduled_date || null,
      notes: data.notes || null,
      status: 'draft',
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating delivery:', error);
    throw new Error('Failed to create delivery');
  }

  if (data.lines.length > 0) {
    const lines = data.lines.map(line => ({
      delivery_id: delivery.id,
      product_id: line.product_id,
      expected_qty: line.expected_qty,
      delivered_qty: 0,
    }));

    const { error: linesError } = await supabase
      .from('delivery_lines')
      .insert(lines);

    if (linesError) {
      console.error('Error creating delivery lines:', linesError);
      await supabase.from('delivery_orders').delete().eq('id', delivery.id);
      throw new Error('Failed to create delivery lines');
    }
  }

  revalidatePath('/deliveries');
  return delivery;
}

export async function updateDeliveryStatus(id: string, status: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  if (status === 'ready') {
    const { data: delivery } = await supabase
      .from('delivery_orders')
      .select('status')
      .eq('id', id)
      .single();

    if (!delivery || delivery.status !== 'draft') {
      throw new Error('Only draft deliveries can be marked as ready');
    }
  }

  const { error } = await supabase
    .from('delivery_orders')
    .update({ status })
    .eq('id', id);

  if (error) {
    console.error('Error updating delivery status:', error);
    throw new Error('Failed to update delivery status');
  }

  revalidatePath('/deliveries');
  revalidatePath(`/deliveries/${id}`);
  return { success: true };
}

export async function validateDelivery(
  id: string,
  lines: { id: string; delivered_qty: number }[]
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  const { data: delivery, error: deliveryError } = await supabase
    .from('delivery_orders')
    .select('*, locations!inner(id, name)')
    .eq('id', id)
    .single();

  if (deliveryError || !delivery) {
    throw new Error('Delivery not found');
  }

  if (delivery.status !== 'ready') {
    throw new Error('Only ready deliveries can be validated');
  }

  const { data: deliveryLines, error: linesError } = await supabase
    .from('delivery_lines')
    .select('id, product_id')
    .eq('delivery_id', id);

  if (linesError) {
    throw new Error('Failed to fetch delivery lines');
  }

  const lineMap = new Map(deliveryLines.map(l => [l.id, l.product_id]));

  for (const line of lines) {
    await supabase
      .from('delivery_lines')
      .update({ delivered_qty: line.delivered_qty })
      .eq('id', line.id);
  }

  for (const line of lines) {
    const productId = lineMap.get(line.id);
    if (!productId) continue;

    const { data: existingStock } = await supabase
      .from('stock_levels')
      .select('quantity')
      .eq('product_id', productId)
      .eq('location_id', delivery.source_location_id)
      .single();

    const currentQty = existingStock?.quantity || 0;
    const newQty = currentQty - line.delivered_qty;

    await supabase
      .from('stock_levels')
      .upsert({
        product_id: productId,
        location_id: delivery.source_location_id,
        quantity: newQty,
        updated_at: new Date().toISOString(),
      });

    await supabase.from('stock_ledger').insert({
      product_id: productId,
      location_id: delivery.source_location_id,
      movement_type: 'delivery',
      reference_id: id,
      reference_type: 'delivery',
      qty_change: -line.delivered_qty,
      qty_after: newQty,
      performed_by: user.id,
    });
  }

  await supabase
    .from('delivery_orders')
    .update({
      status: 'done',
      validated_at: new Date().toISOString(),
      validated_by: user.id,
    })
    .eq('id', id);

  revalidatePath('/deliveries');
  revalidatePath(`/deliveries/${id}`);
  revalidatePath('/products');
  return { success: true };
}
