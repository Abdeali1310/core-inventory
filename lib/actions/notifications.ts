'use server';

import { createClient } from '@/lib/supabase/server';

export async function notifyLowStock(productIds: string[]) {
    if (!productIds.length) return;
    const supabase = await createClient();

    // Check which products are now low stock
    const { data: lowStock } = await supabase
        .rpc('check_low_stock');

    if (!lowStock?.length) return;

    const lowIds = new Set(lowStock.map((p: any) => p.product_id));
    const affected = lowStock.filter((p: any) => productIds.includes(p.product_id));
    if (!affected.length) return;

    // Get all managers to notify
    const { data: managers } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'manager');

    if (!managers?.length) return;

    const notifications = [];
    for (const manager of managers) {
        for (const product of affected) {
            notifications.push({
                user_id: manager.id,
                title: `Low Stock: ${product.name}`,
                message: `${product.name} (${product.sku}) has ${product.total_qty} ${product.reorder_qty > 0 ? `— reorder ${product.reorder_qty} units` : 'units remaining'}`,
                type: 'low_stock',
                product_id: product.product_id,
            });
        }
    }

    await supabase.from('notifications').insert(notifications);
}