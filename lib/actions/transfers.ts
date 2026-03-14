'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface TransferFilters {
  status?: string;
  source_location_id?: string;
  dest_location_id?: string;
  search?: string;
}

export interface TransferWithDetails {
  id: string;
  reference: string;
  source_location_id: string;
  dest_location_id: string;
  source_location_name?: string;
  dest_location_name?: string;
  source_warehouse_name?: string;
  dest_warehouse_name?: string;
  status: string;
  scheduled_date: string | null;
  validated_at: string | null;
  validated_by_name?: string;
  notes: string | null;
  created_by_name?: string;
  created_at: string;
  items_count: number;
}

export async function getTransfers(filters?: TransferFilters) {
  const supabase = await createClient();

  let query = supabase
    .from('internal_transfers')
    .select(`
      id,
      reference,
      source_location_id,
      dest_location_id,
      status,
      scheduled_date,
      validated_at,
      notes,
      created_at,
      source:locations!internal_transfers_source_location_id_fkey(name, warehouses(name)),
dest:locations!internal_transfers_dest_location_id_fkey(name, warehouses(name)),
      validator:profiles!internal_transfers_validated_by_fkey(full_name),
      creator:profiles!internal_transfers_created_by_fkey(full_name),
      transfer_lines(count)
    `)
    .order('created_at', { ascending: false });

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters?.source_location_id) {
    query = query.eq('source_location_id', filters.source_location_id);
  }

  if (filters?.dest_location_id) {
    query = query.eq('dest_location_id', filters.dest_location_id);
  }

  if (filters?.search) {
    query = query.or(`reference.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching transfers:', JSON.stringify(error, null, 2));
    throw new Error(error.message || 'Failed to fetch transfers');
  }

  return (data || []).map(r => ({
    id: r.id,
    reference: r.reference,
    source_location_id: r.source_location_id,
    dest_location_id: r.dest_location_id,
    source_location_name: (r.source as unknown as { name: string })?.name || 'Unknown',
    dest_location_name: (r.dest as unknown as { name: string })?.name || 'Unknown',
    source_warehouse_name: (r.source as unknown as { warehouses: { name: string } })?.warehouses?.name || 'Unknown',
    dest_warehouse_name: (r.dest as unknown as { warehouses: { name: string } })?.warehouses?.name || 'Unknown', status: r.status,
    scheduled_date: r.scheduled_date,
    validated_at: r.validated_at,
    validated_by_name: (r.validator as unknown as { full_name: string })?.full_name,
    created_by_name: (r.creator as unknown as { full_name: string })?.full_name,
    notes: r.notes,
    created_at: r.created_at,
    items_count: (r.transfer_lines as unknown as { count: number }[])?.[0]?.count || 0,
  }));
}

export interface TransferLineWithProduct {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  product_uom: string;
  qty: number;
}

export interface TransferDetail extends TransferWithDetails {
  lines: TransferLineWithProduct[];
}

export async function getTransferById(id: string): Promise<TransferDetail | null> {
  const supabase = await createClient();

  const { data: transfer, error } = await supabase
    .from('internal_transfers')
    .select(`
      id,
      reference,
      source_location_id,
      dest_location_id,
      status,
      scheduled_date,
      validated_at,
      notes,
      created_at,
      source:locations!internal_transfers_source_location_id_fkey(name, warehouses(name)),
      dest:locations!internal_transfers_dest_location_id_fkey(name, warehouses(name)),
      validator:profiles!internal_transfers_validated_by_fkey(full_name),
      creator:profiles!internal_transfers_created_by_fkey(full_name)
    `)
    .eq('id', id)
    .single();

  if (error || !transfer) {
    console.error('Error fetching transfer:', error);
    return null;
  }

  const { data: lines, error: linesError } = await supabase
    .from('transfer_lines')
    .select(`
      id,
      product_id,
      qty,
      products!inner(name, sku, unit_of_measure)
    `)
    .eq('transfer_id', id);

  if (linesError) {
    console.error('Error fetching transfer lines:', linesError);
  }

  return {
    id: transfer.id,
    reference: transfer.reference,
    source_location_id: transfer.source_location_id,
    dest_location_id: transfer.dest_location_id,
    source_location_name: (transfer.source as unknown as { name: string })?.name || 'Unknown',
    dest_location_name: (transfer.dest as unknown as { name: string })?.name || 'Unknown',
    source_warehouse_name: (transfer.source as unknown as { warehouses: { name: string } })?.warehouses?.name || 'Unknown',
    dest_warehouse_name: (transfer.dest as unknown as { warehouses: { name: string } })?.warehouses?.name || 'Unknown',
    status: transfer.status,
    scheduled_date: transfer.scheduled_date,
    validated_at: transfer.validated_at,
    notes: transfer.notes,
    validated_by_name: (transfer.validator as unknown as { full_name: string })?.full_name,
    created_by_name: (transfer.creator as unknown as { full_name: string })?.full_name,
    created_at: transfer.created_at,
    items_count: (lines || []).length,
    lines: (lines || []).map(l => ({
      id: l.id,
      product_id: l.product_id,
      product_name: (l.products as unknown as { name: string }[])?.[0]?.name || 'Unknown',
      product_sku: (l.products as unknown as { sku: string }[])?.[0]?.sku || 'Unknown',
      product_uom: (l.products as unknown as { unit_of_measure: string }[])?.[0]?.unit_of_measure || 'pcs',
      qty: Number(l.qty),
    })),
  };
}

export interface CreateTransferInput {
  source_location_id: string;
  dest_location_id: string;
  scheduled_date?: string;
  notes?: string;
  lines: { product_id: string; qty: number }[]
}

function generateReference(count: number): string {
  const year = new Date().getFullYear();
  return `INT/${year}/${String(count + 1).padStart(3, '0')}`;
}

export async function createTransfer(data: CreateTransferInput) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  if (data.source_location_id === data.dest_location_id) {
    throw new Error('Source and destination locations must be different');
  }

  const { count } = await supabase
    .from('internal_transfers')
    .select('*', { count: 'exact', head: true });

  const reference = generateReference(count || 0);

  const { data: transfer, error } = await supabase
    .from('internal_transfers')
    .insert({
      reference,
      source_location_id: data.source_location_id,
      dest_location_id: data.dest_location_id,
      scheduled_date: data.scheduled_date || null,
      notes: data.notes || null,
      status: 'draft',
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating transfer:', error);
    throw new Error('Failed to create transfer');
  }

  if (data.lines.length > 0) {
    const lines = data.lines.map(line => ({
      transfer_id: transfer.id,
      product_id: line.product_id,
      qty: line.qty,
    }));

    const { error: linesError } = await supabase
      .from('transfer_lines')
      .insert(lines);

    if (linesError) {
      console.error('Error creating transfer lines:', linesError);
      await supabase.from('internal_transfers').delete().eq('id', transfer.id);
      throw new Error('Failed to create transfer lines');
    }
  }

  revalidatePath('/transfers');
  return transfer;
}

export async function updateTransferStatus(id: string, status: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  if (status === 'ready') {
    const { data: transfer } = await supabase
      .from('internal_transfers')
      .select('status')
      .eq('id', id)
      .single();

    if (!transfer || transfer.status !== 'draft') {
      throw new Error('Only draft transfers can be marked as ready');
    }
  }

  const { error } = await supabase
    .from('internal_transfers')
    .update({ status })
    .eq('id', id);

  if (error) {
    console.error('Error updating transfer status:', error);
    throw new Error('Failed to update transfer status');
  }

  revalidatePath('/transfers');
  revalidatePath(`/transfers/${id}`);
  return { success: true };
}

export async function validateTransfer(id: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  const { data: transfer, error: transferError } = await supabase
    .from('internal_transfers')
    .select('*')
    .eq('id', id)
    .single();

  if (transferError || !transfer) {
    throw new Error('Transfer not found');
  }

  if (transfer.status !== 'ready') {
    throw new Error('Only ready transfers can be validated');
  }

  const { data: transferLines, error: linesError } = await supabase
    .from('transfer_lines')
    .select('id, product_id, qty')
    .eq('transfer_id', id);

  if (linesError) {
    throw new Error('Failed to fetch transfer lines');
  }

  for (const line of transferLines || []) {
    const { data: sourceStock } = await supabase
      .from('stock_levels')
      .select('quantity')
      .eq('product_id', line.product_id)
      .eq('location_id', transfer.source_location_id)
      .single();

    const sourceQty = sourceStock?.quantity || 0;

    if (sourceQty < line.qty) {
      const { data: product } = await supabase
        .from('products')
        .select('name')
        .eq('id', line.product_id)
        .single();

      throw new Error(`Insufficient stock for ${product?.name || 'product'}. Available: ${sourceQty}, Requested: ${line.qty}`);
    }

    const newSourceQty = sourceQty - line.qty;

    await supabase
      .from('stock_levels')
      .upsert({
        product_id: line.product_id,
        location_id: transfer.source_location_id,
        quantity: newSourceQty,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'product_id,location_id' });

    await supabase.from('stock_ledger').insert({
      product_id: line.product_id,
      location_id: transfer.source_location_id,
      movement_type: 'transfer_out',
      reference_id: id,
      reference_type: 'transfer',
      qty_change: -line.qty,
      qty_after: newSourceQty,
      performed_by: user.id,
    });

    const { data: destStock } = await supabase
      .from('stock_levels')
      .select('quantity')
      .eq('product_id', line.product_id)
      .eq('location_id', transfer.dest_location_id)
      .single();

    const destQty = (destStock?.quantity || 0) + line.qty;

    await supabase
      .from('stock_levels')
      .upsert({
        product_id: line.product_id,
        location_id: transfer.dest_location_id,
        quantity: destQty,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'product_id,location_id' });

    await supabase.from('stock_ledger').insert({
      product_id: line.product_id,
      location_id: transfer.dest_location_id,
      movement_type: 'transfer_in',
      reference_id: id,
      reference_type: 'transfer',
      qty_change: line.qty,
      qty_after: destQty,
      performed_by: user.id,
    });
  }

  await supabase
    .from('internal_transfers')
    .update({
      status: 'done',
      validated_at: new Date().toISOString(),
      validated_by: user.id,
    })
    .eq('id', id);

  revalidatePath('/transfers');
  revalidatePath(`/transfers/${id}`);
  revalidatePath('/products');
  return { success: true };
}
