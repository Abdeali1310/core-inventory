'use server';

import { createClient } from '@/lib/supabase/server';
import { getLocations } from '@/lib/actions/locations';
import { getProducts } from '@/lib/actions/products';
import { TransferForm } from './TransferForm';

export default async function NewTransferPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ color: '#64748b' }}>Please sign in to create transfers.</p>
      </div>
    );
  }

  const locations = await getLocations();

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: '#f0f4ff', margin: 0 }}>New Transfer</h1>
        <p style={{ color: '#64748b', marginTop: 4 }}>Create a new internal transfer</p>
      </div>

      <TransferForm locations={locations} />
    </div>
  );
}
