import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, Truck } from 'lucide-react';
import { getDeliveryById, type DeliveryDetail } from '@/lib/actions/deliveries';
import { DeliveryDetailClient } from './DeliveryDetailClient';
import { notFound } from 'next/navigation';

interface DeliveryPageProps {
  params: Promise<{ id: string }>;
}

async function DeliveryContent({ params }: DeliveryPageProps) {
  const { id } = await params;
  const delivery = await getDeliveryById(id);

  if (!delivery) {
    notFound();
  }

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 20 }}>
        <Link
          href="/deliveries"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            color: '#64748b', fontSize: 13, textDecoration: 'none',
          }}
        >
          <ArrowLeft size={14} />
          Back to Deliveries
        </Link>
      </div>

      <DeliveryDetailClient delivery={delivery} />
    </div>
  );
}

export default async function DeliveryPage({ params }: DeliveryPageProps) {
  return (
    <Suspense fallback={
      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: 80, gap: 16, color: '#64748b',
        }}>
          <Truck size={32} style={{ opacity: 0.3 }} />
          <span>Loading delivery details...</span>
        </div>
      </div>
    }>
      <DeliveryContent params={params} />
    </Suspense>
  );
}
