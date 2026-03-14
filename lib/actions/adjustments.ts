'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface AdjustmentFilters {
    status?: string;
    location_id?: string;
}

export interface AdjustmentWithDetails {
    id: string;
    reference: string;
    location_id: string;
    location_name: string;
    warehouse_name: string;
    status: string;
    notes: string | null;
    created_by_name: string;
    created_at: string;
    adjusted_at: string | null;
    items_count: number;
}

export interface AdjustmentLine {
    id: string;
    product_id: string;
    product_name: string;
    product_sku: string;
    product_uom: string;
    recorded_qty: number;
    counted_qty: number;
    difference: number;
}

export interface AdjustmentDetail extends AdjustmentWithDetails {
    lines: AdjustmentLine[];
}

export async function getAdjustments(filters?: AdjustmentFilters) {
    const supabase = await createClient();

    let query = supabase
        .from('stock_adjustments')
        .select(`
      id, reference, location_id, status, notes, created_at, adjusted_at,
      locations(name, warehouses(name)),
      creator:profiles!stock_adjustments_created_by_fkey(full_name),
      adjustment_lines(count)
    `)
        .order('created_at', { ascending: false });

    if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
    }
    if (filters?.location_id) {
        query = query.eq('location_id', filters.location_id);
    }

    const { data, error } = await query;

    if (error) {
        throw new Error(`Failed to fetch adjustments: ${error.message}`);
    }

    return (data || []).map((a: any) => ({
        id: a.id,
        reference: a.reference,
        location_id: a.location_id,
        location_name: a.locations?.name ?? 'Unknown',
        warehouse_name: (a.locations?.warehouses as any)?.name ?? 'Unknown',
        status: a.status,
        notes: a.notes,
        created_by_name: (a.creator as any)?.full_name ?? '—',
        created_at: a.created_at,
        adjusted_at: a.adjusted_at,
        items_count: a.adjustment_lines?.[0]?.count ?? 0,
    }));
}

export async function getAdjustmentById(id: string): Promise<AdjustmentDetail | null> {
    const supabase = await createClient();

    const { data: adj, error } = await supabase
        .from('stock_adjustments')
        .select(`
      id, reference, location_id, status, notes, created_at, adjusted_at,
      locations(name, warehouses(name)),
      creator:profiles!stock_adjustments_created_by_fkey(full_name)
    `)
        .eq('id', id)
        .single();

    if (error || !adj) return null;

    const { data: lines } = await supabase
        .from('adjustment_lines')
        .select(`
      id, product_id, recorded_qty, counted_qty, difference,
      products(name, sku, unit_of_measure)
    `)
        .eq('adjustment_id', id);

    return {
        id: adj.id,
        reference: adj.reference,
        location_id: adj.location_id,
        location_name: (adj.locations as any)?.name ?? 'Unknown',
        warehouse_name: (adj.locations as any)?.warehouses?.name ?? 'Unknown',
        status: adj.status,
        notes: adj.notes,
        created_by_name: (adj.creator as any)?.full_name ?? '—',
        created_at: adj.created_at,
        adjusted_at: adj.adjusted_at,
        items_count: (lines || []).length,
        lines: (lines || []).map((l: any) => ({
            id: l.id,
            product_id: l.product_id,
            product_name: l.products?.name ?? 'Unknown',
            product_sku: l.products?.sku ?? '—',
            product_uom: l.products?.unit_of_measure ?? 'pcs',
            recorded_qty: Number(l.recorded_qty),
            counted_qty: Number(l.counted_qty),
            difference: Number(l.difference),
        })),
    };
}

export async function getStockByLocation(location_id: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('stock_levels')
        .select(`
      product_id, quantity,
      products(name, sku, unit_of_measure)
    `)
        .eq('location_id', location_id);

    if (error) throw new Error(error.message);

    return (data || []).map((s: any) => ({
        product_id: s.product_id,
        product_name: s.products?.name ?? 'Unknown',
        product_sku: s.products?.sku ?? '—',
        product_uom: s.products?.unit_of_measure ?? 'pcs',
        quantity: Number(s.quantity),
    }));
}

export async function createAdjustment(data: {
    location_id: string;
    notes?: string;
    lines: { product_id: string; recorded_qty: number; counted_qty: number }[];
}) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { count } = await supabase
        .from('stock_adjustments')
        .select('*', { count: 'exact', head: true });

    const year = new Date().getFullYear();
    const reference = `ADJ/${year}/${String((count || 0) + 1).padStart(3, '0')}`;

    const { data: adj, error } = await supabase
        .from('stock_adjustments')
        .insert({
            reference,
            location_id: data.location_id,
            notes: data.notes || null,
            status: 'draft',
            created_by: user.id,
        })
        .select()
        .single();

    if (error) throw new Error(`Failed to create adjustment: ${error.message}`);

    if (data.lines.length > 0) {
        const { error: linesError } = await supabase
            .from('adjustment_lines')
            .insert(data.lines.map(l => ({
                adjustment_id: adj.id,
                product_id: l.product_id,
                recorded_qty: l.recorded_qty,
                counted_qty: l.counted_qty,
            })));

        if (linesError) throw new Error(`Failed to create lines: ${linesError.message}`);
    }

    revalidatePath('/adjustments');
    return adj;
}

export async function validateAdjustment(id: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'manager') throw new Error('Only managers can validate adjustments');

    const { data: adj, error: adjError } = await supabase
        .from('stock_adjustments')
        .select('*')
        .eq('id', id)
        .single();

    if (adjError || !adj) throw new Error('Adjustment not found');
    if (adj.status !== 'draft') throw new Error('Only draft adjustments can be validated');

    const { data: lines } = await supabase
        .from('adjustment_lines')
        .select('*')
        .eq('adjustment_id', id);

    for (const line of lines || []) {
        await supabase
            .from('stock_levels')
            .upsert({
                product_id: line.product_id,
                location_id: adj.location_id,
                quantity: Number(line.counted_qty),
                updated_at: new Date().toISOString(),
            }, { onConflict: 'product_id,location_id' });

        await supabase
            .from('stock_ledger')
            .insert({
                product_id: line.product_id,
                location_id: adj.location_id,
                movement_type: 'adjustment',
                reference_id: id,
                reference_type: 'adjustment',
                qty_change: Number(line.counted_qty) - Number(line.recorded_qty),
                qty_after: Number(line.counted_qty),
                performed_by: user.id,
            });
    }

    await supabase
        .from('stock_adjustments')
        .update({
            status: 'done',
            adjusted_at: new Date().toISOString(),
            adjusted_by: user.id,
        })
        .eq('id', id);

    revalidatePath('/adjustments');
    revalidatePath('/products');
    revalidatePath('/dashboard');
    return { success: true };
}

export async function cancelAdjustment(id: string) {
    const supabase = await createClient();
    await supabase
        .from('stock_adjustments')
        .update({ status: 'canceled' })
        .eq('id', id);
    revalidatePath('/adjustments');

    return { success: true };
}