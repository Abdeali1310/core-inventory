import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, Package } from 'lucide-react';
import { getReceiptById, type ReceiptDetail } from '@/lib/actions/receipts';
import { ReceiptDetailClient } from './ReceiptDetailClient';
import { notFound } from 'next/navigation';

interface ReceiptPageProps {
  params: Promise<{ id: string }>;
}

async function ReceiptContent({ params }: ReceiptPageProps) {
  const { id } = await params;
  const receipt = await getReceiptById(id);

  if (!receipt) {
    notFound();
  }

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 20 }}>
        <Link
          href="/receipts"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            color: '#64748b', fontSize: 13, textDecoration: 'none',
          }}
        >
          <ArrowLeft size={14} />
          Back to Receipts
        </Link>
      </div>

      <ReceiptDetailClient receipt={receipt} />
    </div>
  );
}

export default async function ReceiptPage({ params }: ReceiptPageProps) {
  return (
    <Suspense fallback={
      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: 80, gap: 16, color: '#64748b',
        }}>
          <Package size={32} style={{ opacity: 0.3 }} />
          <span>Loading receipt details...</span>
        </div>
      </div>
    }>
      <ReceiptContent params={params} />
    </Suspense>
  );
}
