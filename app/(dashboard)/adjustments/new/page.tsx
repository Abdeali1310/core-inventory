import AdjustmentForm from '@/components/adjustments/AdjustmentForm';
import { createClient } from '@/lib/supabase/server';

export default async function NewAdjustmentPage() {
    const supabase = await createClient();

    const { data: locationData } = await supabase
        .from('locations')
        .select('id, name, warehouses(name)')
        .order('name');

    const locations = (locationData || []).map((l: any) => ({
        id: l.id,
        name: l.name,
        warehouse_name: l.warehouses?.name ?? 'Unknown',
    }));

    const { data: productData } = await supabase
        .from('products')
        .select('id, name, sku, unit_of_measure')
        .eq('is_active', true)
        .order('name');

    const products = (productData || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        unit_of_measure: p.unit_of_measure,
    }));

    const year = new Date().getFullYear();
    const { count } = await supabase
        .from('stock_adjustments')
        .select('*', { count: 'exact', head: true });
    const reference = `ADJ/${year}/${String((count || 0) + 1).padStart(3, '0')}`;

    return (
        <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
            <AdjustmentForm
                locations={locations}
                products={products}
                reference={reference}
            />
        </div>
    );
}