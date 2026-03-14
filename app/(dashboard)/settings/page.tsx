import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getWarehouses, getLocationsWithWarehouse, getCategories } from '@/lib/actions/settings';
import SettingsClient from '@/components/settings/SettingsClient';
export const dynamic = 'force-dynamic';
export default async function SettingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single();

    if (profile?.role !== 'manager') {
        redirect('/dashboard');
    }

    const [warehouses, locations, categories] = await Promise.all([
        getWarehouses(),
        getLocationsWithWarehouse(),
        getCategories(),
    ]);

    return (
        <div style={{ padding: '24px', maxWidth: 1100, margin: '0 auto' }}>
            <SettingsClient
                warehouses={warehouses}
                locations={locations}
                categories={categories}
            />
        </div>
    );
}