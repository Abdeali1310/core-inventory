'use server';

import { createClient } from '@/lib/supabase/server';
import { getLocations } from '@/lib/actions/locations';
import { getProducts } from '@/lib/actions/products';
import { DeliveryForm } from './DeliveryForm';

export default async function NewDeliveryPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ color: '#64748b' }}>Please sign in to create deliveries.</p>
      </div>
    );
  }

  const locations = await getLocations();
  const products = await getProducts({ is_active: true });

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: '#f0f4ff', margin: 0 }}>New Delivery</h1>
        <p style={{ color: '#64748b', marginTop: 4 }}>Create a new delivery order</p>
      </div>
      
      <DeliveryForm locations={locations} products={products} />
    </div>
  );
}
