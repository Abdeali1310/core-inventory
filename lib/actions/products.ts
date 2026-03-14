'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface ProductFilters {
  is_in_stock?: boolean;
  search?: string;
  category_id?: string;
  is_active?: boolean;
  is_low_stock?: boolean;
  is_out_of_stock?: boolean;
}

export interface ProductWithStock {
  id: string;
  name: string;
  sku: string;
  category_id: string | null;
  category_name?: string;
  unit_of_measure: string;
  reorder_point: number;
  reorder_qty: number;
  is_active: boolean;
  total_stock: number;
  created_at: string;
  updated_at: string;
}

export async function getProducts(filters?: ProductFilters) {
  const supabase = await createClient();

  let query = supabase
    .from('products')
    .select(`
      id,
      name,
      sku,
      category_id,
      unit_of_measure,
      reorder_point,
      reorder_qty,
      is_active,
      created_at,
      updated_at,
      categories (name)
    `)
    .order('name', { ascending: true });

  if (filters?.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active);
  }

  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`);
  }

  if (filters?.category_id) {
    query = query.eq('category_id', filters.category_id);
  }

  const { data: products, error } = await query;

  if (error) {
    console.error('Error fetching products:', error);
    throw new Error('Failed to fetch products');
  }

  if (!products) return [];

  const productIds = products.map(p => p.id);

  const { data: stockLevels, error: stockError } = await supabase
    .from('stock_levels')
    .select('product_id, quantity')
    .in('product_id', productIds);

  if (stockError) {
    console.error('Error fetching stock levels:', stockError);
  }

  const stockMap = new Map<string, number>();
  stockLevels?.forEach(sl => {
    const current = stockMap.get(sl.product_id) || 0;
    stockMap.set(sl.product_id, current + Number(sl.quantity));
  });

  const productsWithStock: ProductWithStock[] = products.map(p => {
    const totalStock = stockMap.get(p.id) || 0;
    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      category_id: p.category_id,
      category_name: (p.categories as unknown as { name: string })?.name || 'Uncategorized',
      unit_of_measure: p.unit_of_measure,
      reorder_point: p.reorder_point,
      reorder_qty: p.reorder_qty,
      is_active: p.is_active,
      total_stock: totalStock,
      created_at: p.created_at,
      updated_at: p.updated_at,
    };
  });

  let filtered = productsWithStock;

  if (filters?.is_low_stock) {
    filtered = filtered.filter(p => p.total_stock > 0 && p.total_stock <= p.reorder_point);
  }

  if (filters?.is_out_of_stock) {
    filtered = filtered.filter(p => p.total_stock === 0);
  }

  return filtered;
}

export interface ProductDetail {
  id: string;
  name: string;
  sku: string;
  category_id: string | null;
  category_name: string;
  unit_of_measure: string;
  reorder_point: number;
  reorder_qty: number;
  is_active: boolean;
  total_stock: number;
  created_at: string;
  updated_at: string;
  stockByLocation: {
    location_id: string;
    location_name: string;
    warehouse_name: string;
    quantity: number;
  }[];
  recentMovements: {
    id: string;
    type: 'in' | 'out' | 'adjustment';
    quantity: number;
    location_name: string;
    notes: string | null;
    created_at: string;
    created_by: string;
  }[];
}

export async function getProductById(id: string): Promise<ProductDetail | null> {
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      sku,
      category_id,
      unit_of_measure,
      reorder_point,
      reorder_qty,
      is_active,
      created_at,
      updated_at,
      categories (name)
    `)
    .eq('id', id)
    .single();

  if (error || !product) {
    console.error('Error fetching product:', error);
    return null;
  }

  const { data: stockLevels, error: stockError } = await supabase
    .from('stock_levels')
    .select(`
      id,
      quantity,
      location_id,
      locations!inner(name, warehouses!inner(name))
    `)
    .eq('product_id', id);

  if (stockError) {
    console.error('Error fetching stock levels:', stockError);
  }

  const stockByLocation = (stockLevels || []).map(sl => ({
    location_id: sl.location_id,
    location_name: (sl.locations as unknown as { name: string })?.name || 'Unknown',
    warehouse_name: (sl.locations as unknown as { warehouses: { name: string } })?.warehouses?.name || 'Unknown',
    quantity: Number(sl.quantity),
  }));

  const totalStock = stockByLocation.reduce((sum, sl) => sum + sl.quantity, 0);

  const { data: movements, error: movementsError } = await supabase
    .from('stock_movements')
    .select(`
      id,
      type,
      quantity,
      notes,
      created_at,
      location_id,
      locations!inner(name),
      profiles!inner(full_name)
    `)
    .eq('product_id', id)
    .order('created_at', { ascending: false })
    .limit(10);

  if (movementsError) {
    console.error('Error fetching movements:', movementsError);
  }

  const recentMovements = (movements || []).map(m => ({
    id: m.id,
    type: m.type as 'in' | 'out' | 'adjustment',
    quantity: Number(m.quantity),
    location_name: (m.locations as unknown as { name: string })?.name || 'Unknown',
    notes: m.notes,
    created_at: m.created_at,
    created_by: (m.profiles as unknown as { full_name: string })?.full_name || 'Unknown',
  }));

  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    category_id: product.category_id,
    category_name: (product.categories as unknown as { name: string })?.name || 'Uncategorized',
    unit_of_measure: product.unit_of_measure,
    reorder_point: product.reorder_point,
    reorder_qty: product.reorder_qty,
    is_active: product.is_active,
    total_stock: totalStock,
    created_at: product.created_at,
    updated_at: product.updated_at,
    stockByLocation,
    recentMovements,
  };
}

export async function getCategories() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('categories')
    .select('id, name')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    throw new Error('Failed to fetch categories');
  }

  return data || [];
}
export interface ProductAtLocation {
  id: string;
  name: string;
  sku: string;
  unit_of_measure: string;
  available_qty: number;
}

export async function getProductsByLocation(location_id: string): Promise<ProductAtLocation[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('stock_levels')
    .select(`
      quantity,
      product_id,
      products!inner(id, name, sku, unit_of_measure, is_active)
    `)
    .eq('location_id', location_id)
    .gt('quantity', 0);

  if (error) {
    console.error('Error fetching products by location:', error);
    return [];
  }

  return (data || [])
    .filter(sl => (sl.products as unknown as { is_active: boolean })?.is_active)
    .map(sl => ({
      id: (sl.products as unknown as { id: string }).id,
      name: (sl.products as unknown as { name: string }).name,
      sku: (sl.products as unknown as { sku: string }).sku,
      unit_of_measure: (sl.products as unknown as { unit_of_measure: string }).unit_of_measure,
      available_qty: Number(sl.quantity),
    }));
}
export async function getLocations() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('locations')
    .select('id, name, code, warehouse_id, warehouses!inner(name)')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching locations:', error);
    throw new Error('Failed to fetch locations');
  }

  return data?.map(l => ({
    id: l.id,
    name: l.name,
    code: l.code,
    warehouse_id: l.warehouse_id,
    warehouse_name: (l.warehouses as unknown as { name: string })?.name || 'Unknown',
  })) || [];
}

export interface CreateProductInput {
  name: string;
  sku: string;
  category_id?: string;
  unit_of_measure: string;
  reorder_point: number;
  reorder_qty: number;
  initial_stock?: number;
  location_id?: string;
}

export async function createProduct(data: CreateProductInput) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  const { data: product, error } = await supabase
    .from('products')
    .insert({
      name: data.name,
      sku: data.sku.toUpperCase(),
      category_id: data.category_id || null,
      unit_of_measure: data.unit_of_measure,
      reorder_point: data.reorder_point,
      reorder_qty: data.reorder_qty,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating product:', error);
    if (error.code === '23505') {
      throw new Error('A product with this SKU already exists');
    }
    throw new Error('Failed to create product');
  }

  if (data.initial_stock && data.initial_stock > 0 && data.location_id) {
    const { error: stockError } = await supabase
      .from('stock_levels')
      .upsert({
        product_id: product.id,
        location_id: data.location_id,
        quantity: data.initial_stock,
      }, {
        onConflict: 'product_id,location_id',
      });

    if (stockError) {
      console.error('Error creating initial stock:', stockError);
    }

    const { data: locationStock } = await supabase
      .from('stock_levels')
      .select('quantity')
      .eq('product_id', product.id)
      .eq('location_id', data.location_id)
      .single();

    await supabase.from('stock_ledger').insert({
      product_id: product.id,
      location_id: data.location_id,
      movement_type: 'adjustment',
      reference_id: product.id,
      reference_type: 'product',
      qty_change: data.initial_stock,
      qty_after: locationStock?.quantity || data.initial_stock,
      performed_by: user.id,
    });
  }

  revalidatePath('/products');
  revalidatePath('/dashboard');

  return product;
}

export interface UpdateProductInput {
  name: string;
  sku: string;
  category_id?: string;
  unit_of_measure: string;
  reorder_point: number;
  reorder_qty: number;
}

export async function updateProduct(id: string, data: UpdateProductInput) {
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from('products')
    .update({
      name: data.name,
      sku: data.sku.toUpperCase(),
      category_id: data.category_id || null,
      unit_of_measure: data.unit_of_measure,
      reorder_point: data.reorder_point,
      reorder_qty: data.reorder_qty,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating product:', error);
    if (error.code === '23505') {
      throw new Error('A product with this SKU already exists');
    }
    throw new Error('Failed to update product');
  }

  revalidatePath('/products');
  revalidatePath('/products/' + id);
  revalidatePath('/dashboard');

  return product;
}

export async function toggleProductActive(id: string) {
  const supabase = await createClient();

  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('is_active')
    .eq('id', id)
    .single();

  if (fetchError || !product) {
    throw new Error('Product not found');
  }

  const { error } = await supabase
    .from('products')
    .update({ is_active: !product.is_active })
    .eq('id', id);

  if (error) {
    console.error('Error toggling product:', error);
    throw new Error('Failed to update product');
  }

  revalidatePath('/products');
  revalidatePath('/dashboard');

  return { success: true };
}
