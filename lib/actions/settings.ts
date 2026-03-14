'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// ============ WAREHOUSES ============

export async function getWarehouses() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
}

export async function createWarehouse(data: { name: string; code: string; address?: string }) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('warehouses')
        .insert({
            name: data.name,
            code: data.code.toUpperCase(),
            address: data.address || null,
            is_active: true,
        });
    if (error) throw new Error(error.message);
    revalidatePath('/settings');
}

export async function updateWarehouse(id: string, data: { name: string; code: string; address?: string }) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('warehouses')
        .update({
            name: data.name,
            code: data.code.toUpperCase(),
            address: data.address || null,
        })
        .eq('id', id);
    if (error) throw new Error(error.message);
    revalidatePath('/settings');
}

export async function toggleWarehouseActive(id: string) {
    const supabase = await createClient();
    const { data: wh } = await supabase
        .from('warehouses')
        .select('is_active')
        .eq('id', id)
        .single();
    const { error } = await supabase
        .from('warehouses')
        .update({ is_active: !wh?.is_active })
        .eq('id', id);
    if (error) throw new Error(error.message);
    revalidatePath('/settings');
}

// ============ LOCATIONS ============

export async function getLocationsWithWarehouse() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('locations')
        .select('*, warehouses(name, is_active)')
        .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []).map((l: any) => ({
        id: l.id,
        name: l.name,
        code: l.code,
        warehouse_id: l.warehouse_id,
        warehouse_name: l.warehouses?.name ?? 'Unknown',
        warehouse_active: l.warehouses?.is_active ?? true,
        created_at: l.created_at,
    }));
}

export async function createLocation(data: { warehouse_id: string; name: string; code?: string }) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('locations')
        .insert({
            warehouse_id: data.warehouse_id,
            name: data.name,
            code: data.code?.toUpperCase() || null,
        });
    if (error) throw new Error(error.message);
    revalidatePath('/settings');
}

export async function updateLocation(id: string, data: { warehouse_id: string; name: string; code?: string }) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('locations')
        .update({
            warehouse_id: data.warehouse_id,
            name: data.name,
            code: data.code?.toUpperCase() || null,
        })
        .eq('id', id);
    if (error) throw new Error(error.message);
    revalidatePath('/settings');
}

export async function deleteLocation(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', id);
    if (error) throw new Error(error.message);
    revalidatePath('/settings');
}

// ============ CATEGORIES ============

export async function getCategories() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
}

export async function createCategory(name: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('categories')
        .insert({ name });
    if (error) throw new Error(error.message);
    revalidatePath('/settings');
}

export async function updateCategory(id: string, name: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('categories')
        .update({ name })
        .eq('id', id);
    if (error) throw new Error(error.message);
    revalidatePath('/settings');
}

export async function deleteCategory(id: string) {
    const supabase = await createClient();
    // Check if any products use this category
    const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', id);
    if (count && count > 0) {
        throw new Error(`Cannot delete — ${count} product(s) use this category`);
    }
    const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
    if (error) throw new Error(error.message);
    revalidatePath('/settings');
}