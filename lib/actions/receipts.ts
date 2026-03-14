'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface ReceiptFilters {
  status?: string;
  location_id?: string;
  search?: string;
}

export interface ReceiptWithDetails {
  id: string;
  reference: string;
  supplier_name: string;
  destination_location_id: string;
  destination_location_name?: string;
  destination_warehouse_name?: string;
  status: string;
  scheduled_date: string | null;
  validated_at: string | null;
  validated_by_name?: string;
  notes: string | null;
  created_by_name?: string;
  created_at: string;
  items_count: number;
}

export async function getReceipts(filters?: ReceiptFilters) {
  const supabase = await createClient();

  let query = supabase
    .from('receipts')
    .select(`
      id,
      reference,
      supplier_name,
      destination_location_id,
      status,
      scheduled_date,
      validated_at,
      notes,
      created_at,
      locations!inner(name, warehouses!inner(name)),
      profiles!receipts_validated_by_fkey(full_name),
      profiles!receipts_created_by_fkey(full_name),
      receipt_lines(count)
    `)
    .order('created_at', { ascending: false });

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters?.location_id) {
    query = query.eq('destination_location_id', filters.location_id);
  }

  if (filters?.search) {
    query = query.or(`reference.ilike.%${filters.search}%,supplier_name.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching receipts:', error);
    throw new Error('Failed to fetch receipts');
  }

  return (data || []).map(r => ({
    id: r.id,
    reference: r.reference,
    supplier_name: r.supplier_name,
    destination_location_id: r.destination_location_id,
    destination_location_name: (r.locations as unknown as { name: string })?.name || 'Unknown',
    destination_warehouse_name: (r.locations as unknown as { warehouses: { name: string } })?.warehouses?.name || 'Unknown',
    status: r.status,
    scheduled_date: r.scheduled_date,
    validated_at: r.validated_at,
    validated_by_name: (r.profiles_receipts_validated_by_fkey as unknown as { full_name: string })?.full_name,
    notes: r.notes,
    created_by_name: (r.profiles_receipts_created_by_fkey as unknown as { full_name: string })?.full_name,
    created_at: r.created_at,
    items_count: (r.receipt_lines as unknown as { count: number }[])?.[0]?.count || 0,
  }));
}

export interface ReceiptLineWithProduct {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  product_uom: string;
  expected_qty: number;
  received_qty: number;
}

export interface ReceiptDetail extends ReceiptWithDetails {
  lines: ReceiptLineWithProduct[];
}

export async function getReceiptById(id: string): Promise<ReceiptDetail | null> {
  const supabase = await createClient();

  const { data: receipt, error } = await supabase
    .from('receipts')
    .select(`
      id,
      reference,
      supplier_name,
      destination_location_id,
      status,
      scheduled_date,
      validated_at,
      notes,
      created_at,
      locations!inner(name, warehouses!inner(name)),
      profiles!receipts_validated_by_fkey(full_name),
      profiles!receipts_created_by_fkey(full_name)
    `)
    .eq('id', id)
    .single();

  if (error || !receipt) {
    console.error('Error fetching receipt:', error);
    return null;
  }

  const { data: lines, error: linesError } = await supabase
    .from('receipt_lines')
    .select(`
      id,
      product_id,
      expected_qty,
      received_qty,
      products!inner(name, sku, unit_of_measure)
    `)
    .eq('receipt_id', id);

  if (linesError) {
    console.error('Error fetching receipt lines:', linesError);
  }

  return {
    id: receipt.id,
    reference: receipt.reference,
    supplier_name: receipt.supplier_name,
    destination_location_id: receipt.destination_location_id,
    destination_location_name: (receipt.locations as unknown as { name: string })?.name || 'Unknown',
    destination_warehouse_name: (receipt.locations as unknown as { warehouses: { name: string } })?.warehouses?.name || 'Unknown',
    status: receipt.status,
    scheduled_date: receipt.scheduled_date,
    validated_at: receipt.validated_at,
    validated_by_name: (receipt.profiles_receipts_validated_by_fkey as unknown as { full_name: string })?.full_name,
    notes: receipt.notes,
    created_by_name: (receipt.profiles_receipts_created_by_fkey as unknown as { full_name: string })?.full_name,
    created_at: receipt.created_at,
    items_count: (lines || []).length,
    lines: (lines || []).map(l => ({
      id: l.id,
      product_id: l.product_id,
      product_name: (l.products as unknown as { name: string })?.name || 'Unknown',
      product_sku: (l.products as unknown as { sku: string })?.sku || 'Unknown',
      product_uom: (l.products as unknown as { unit_of_measure: string })?.unit_of_measure || 'pcs',
      expected_qty: Number(l.expected_qty),
      received_qty: Number(l.received_qty),
    })),
  };
}

export interface CreateReceiptInput {
  supplier_name: string;
  destination_location_id: string;
  scheduled_date?: string;
  notes?: string;
  lines: { product_id: string; expected_qty: number }[];
}

function generateReference(count: number): string {
  const year = new Date().getFullYear();
  return `REC/${year}/${String(count + 1).padStart(3, '0')}`;
}

export async function createReceipt(data: CreateReceiptInput) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  const { count } = await supabase
    .from('receipts')
    .select('*', { count: 'exact', head: true });

  const reference = generateReference(count || 0);

  const { data: receipt, error } = await supabase
    .from('receipts')
    .insert({
      reference,
      supplier_name: data.supplier_name,
      destination_location_id: data.destination_location_id,
      scheduled_date: data.scheduled_date || null,
      notes: data.notes || null,
      status: 'draft',
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating receipt:', error);
    throw new Error('Failed to create receipt');
  }

  if (data.lines.length > 0) {
    const lines = data.lines.map(line => ({
      receipt_id: receipt.id,
      product_id: line.product_id,
      expected_qty: line.expected_qty,
      received_qty: 0,
    }));

    const { error: linesError } = await supabase
      .from('receipt_lines')
      .insert(lines);

    if (linesError) {
      console.error('Error creating receipt lines:', linesError);
      await supabase.from('receipts').delete().eq('id', receipt.id);
      throw new Error('Failed to create receipt lines');
    }
  }

  revalidatePath('/receipts');
  return receipt;
}

export async function updateReceiptStatus(id: string, status: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  const updateData: Record<string, unknown> = { status };

  if (status === 'ready') {
    const { data: receipt } = await supabase
      .from('receipts')
      .select('status')
      .eq('id', id)
      .single();

    if (!receipt || receipt.status !== 'draft') {
      throw new Error('Only draft receipts can be marked as ready');
    }
  }

  const { error } = await supabase
    .from('receipts')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error('Error updating receipt status:', error);
    throw new Error('Failed to update receipt status');
  }

  revalidatePath('/receipts');
  revalidatePath(`/receipts/${id}`);
  return { success: true };
}

export async function validateReceipt(
  id: string,
  lines: { id: string; received_qty: number }[]
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  const { data: receipt, error: receiptError } = await supabase
    .from('receipts')
    .select('*, locations!inner(id, name)')
    .eq('id', id)
    .single();

  if (receiptError || !receipt) {
    throw new Error('Receipt not found');
  }

  if (receipt.status !== 'ready') {
    throw new Error('Only ready receipts can be validated');
  }

  for (const line of lines) {
    await supabase
      .from('receipt_lines')
      .update({ received_qty: line.received_qty })
      .eq('id', line.id);
  }

  for (const line of lines) {
    const { data: existingStock } = await supabase
      .from('stock_levels')
      .select('quantity')
      .eq('product_id', line.product_id)
      .eq('location_id', receipt.destination_location_id)
      .single();

    const currentQty = existingStock?.quantity || 0;
    const newQty = currentQty + line.received_qty;

    await supabase
      .from('stock_levels')
      .upsert({
        product_id: line.product_id,
        location_id: receipt.destination_location_id,
        quantity: newQty,
        updated_at: new Date().toISOString(),
      });

    await supabase.from('stock_ledger').insert({
      product_id: line.product_id,
      location_id: receipt.destination_location_id,
      movement_type: 'receipt',
      reference_id: id,
      reference_type: 'receipt',
      qty_change: line.received_qty,
      qty_after: newQty,
      performed_by: user.id,
    });
  }

  await supabase
    .from('receipts')
    .update({
      status: 'done',
      validated_at: new Date().toISOString(),
      validated_by: user.id,
    })
    .eq('id', id);

  revalidatePath('/receipts');
  revalidatePath(`/receipts/${id}`);
  revalidatePath('/products');
  return { success: true };
}
