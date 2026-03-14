'use server';

import { createClient } from '@/lib/supabase/server';

export interface LocationWithWarehouse {
  id: string;
  name: string;
  warehouse_id: string;
  warehouse_name: string;
}

export async function getLocations() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('locations')
    .select(`
      id,
      name,
      warehouse_id,
      warehouses (name)
    `)
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch locations: ${error.message}`);
  }

  const locations: LocationWithWarehouse[] = (data || []).map((loc: any) => ({
    id: loc.id,
    name: loc.name,
    warehouse_id: loc.warehouse_id,
    warehouse_name: loc.warehouses?.name || 'Unknown',
  }));

  return locations;
}