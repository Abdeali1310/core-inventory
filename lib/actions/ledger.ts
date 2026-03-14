'use server';

import { createClient } from '@/lib/supabase/server';

export interface LedgerFilters {
    search?: string;
    movement_type?: string;
    location_id?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    page?: number;
}

export interface LedgerEntry {
    id: string;
    created_at: string;
    movement_type: string;
    reference_id: string;
    reference_type: string;
    product_id: string;
    product_name: string;
    product_sku: string;
    location_id: string;
    location_name: string;
    warehouse_name: string;
    qty_change: number;
    qty_after: number;
    performed_by_name: string;
}

export async function getStockLedger(filters?: LedgerFilters): Promise<LedgerEntry[]> {
    const supabase = await createClient();

    let query = supabase
        .from('stock_ledger')
        .select(`
      id, created_at, movement_type, reference_id, reference_type,
      product_id, qty_change, qty_after,
      products(name, sku),
      locations(name, warehouses(name)),
      performer:profiles!stock_ledger_performed_by_fkey(full_name)
    `)
        .order('created_at', { ascending: false })
        .limit(filters?.limit ?? 50);

    if (filters?.movement_type && filters.movement_type !== 'all') {
        if (filters.movement_type === 'receipts') {
            query = query.eq('movement_type', 'receipt');
        } else if (filters.movement_type === 'deliveries') {
            query = query.eq('movement_type', 'delivery');
        } else if (filters.movement_type === 'transfers') {
            query = query.in('movement_type', ['transfer_in', 'transfer_out']);
        } else if (filters.movement_type === 'adjustments') {
            query = query.eq('movement_type', 'adjustment');
        }
    }

    if (filters?.location_id) {
        query = query.eq('location_id', filters.location_id);
    }

    if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
    }

    if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to + 'T23:59:59');
    }

    const { data, error } = await query;

    if (error) throw new Error(`Failed to fetch ledger: ${error.message}`);

    let entries = (data || []).map((e: any) => ({
        id: e.id,
        created_at: e.created_at,
        movement_type: e.movement_type,
        reference_id: e.reference_id,
        reference_type: e.reference_type,
        product_id: e.product_id,
        product_name: e.products?.name ?? 'Unknown',
        product_sku: e.products?.sku ?? '—',
        location_id: e.location_id,
        location_name: e.locations?.name ?? 'Unknown',
        warehouse_name: e.locations?.warehouses?.name ?? 'Unknown',
        qty_change: Number(e.qty_change),
        qty_after: Number(e.qty_after),
        performed_by_name: e.performer?.full_name ?? '—',
    }));

    // Client-side search filter
    if (filters?.search) {
        const s = filters.search.toLowerCase();
        entries = entries.filter(e =>
            e.product_name.toLowerCase().includes(s) ||
            e.product_sku.toLowerCase().includes(s)
        );
    }

    return entries;
}