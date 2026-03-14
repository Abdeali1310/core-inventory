import Link from 'next/link';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Eye, Pencil, PackagePlus } from 'lucide-react';
import { getReceipts, ReceiptWithDetails } from '@/lib/actions/receipts';
import { StatusBadge } from '@/components/operations/StatusBadge';
import { format } from 'date-fns';

interface ReceiptsPageProps {
  searchParams: Promise<{ status?: string; location?: string; q?: string }>;
}

const statusTabs = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'ready', label: 'Ready' },
  { value: 'done', label: 'Done' },
  { value: 'canceled', label: 'Canceled' },
];

const thStyle = {
  padding: '10px 16px',
  textAlign: 'left' as const,
  fontSize: 11,
  fontWeight: 600,
  color: '#fff',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
  background: 'rgba(255,255,255,0.02)',
};

const tdStyle = {
  padding: '12px 16px',
  fontSize: 13,
  color: '#e2e8f0',
  borderBottom: '1px solid rgba(255,255,255,0.04)',
};

function ReceiptsTable({ receipts, activeStatus }: { receipts: ReceiptWithDetails[], activeStatus: string }) {
  if (receipts.length === 0) {
    return (
      <tr>
        <td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: '#fff' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <PackagePlus size={32} style={{ opacity: 0.3 }} />
            <span>No receipts found. Create one to start tracking incoming stock.</span>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <>
      {receipts.map((receipt) => (
        <tr key={receipt.id} style={{ cursor: 'pointer' }}
          className="receipt-row">
          <td style={{ ...tdStyle, fontFamily: 'JetBrains Mono, monospace', color: '#60a5fa', fontSize: 12 }}>
            {receipt.reference}
          </td>
          <td style={{ ...tdStyle, fontWeight: 500 }}>{receipt.supplier_name}</td>
          <td style={tdStyle}>
            <div style={{ color: '#e2e8f0' }}>{receipt.destination_location_name}</div>
            <div style={{ fontSize: 11, color: '#fff' }}>{receipt.destination_warehouse_name}</div>
          </td>
          <td style={{ ...tdStyle, color: '#fff' }}>
            {receipt.scheduled_date
              ? format(new Date(receipt.scheduled_date), 'MMM d, yyyy')
              : '—'}
          </td>
          <td style={{ ...tdStyle, color: '#fff', textAlign: 'center' as const }}>
            {receipt.items_count}
          </td>
          <td style={tdStyle}>
            <StatusBadge status={receipt.status} type="receipt" />
          </td>
          <td style={{ ...tdStyle, color: '#fff', fontSize: 12 }}>
            {format(new Date(receipt.created_at), 'MMM d, yyyy')}
          </td>
          <td style={{ ...tdStyle }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <Link href={`/receipts/${receipt.id}`} style={{
                padding: '5px 8px', borderRadius: 6,
                background: 'rgba(37,99,235,0.12)',
                border: '1px solid rgba(37,99,235,0.2)',
                color: '#60a5fa', display: 'flex', alignItems: 'center',
              }}>
                <Eye size={13} />
              </Link>
              {receipt.status === 'draft' && (
                <Link href={`/receipts/${receipt.id}/edit`} style={{
                  padding: '5px 8px', borderRadius: 6,
                  background: 'rgba(148,163,184,0.08)',
                  border: '1px solid rgba(148,163,184,0.15)',
                  color: '#fff', display: 'flex', alignItems: 'center',
                }}>
                  <Pencil size={13} />
                </Link>
              )}
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

async function ReceiptsContent({ searchParams }: ReceiptsPageProps) {
  const params = await searchParams;
  const activeStatus = params.status || 'all';
  const filters = {
    status: activeStatus,
    location_id: params.location,
    search: params.q,
  };

  const receipts = await getReceipts(filters);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, color: "white" }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f0f4ff', margin: 0 }}>Receipts</h1>
            <span style={{
              fontSize: 12, fontWeight: 600, color: '#60a5fa',
              background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.25)',
              padding: '2px 10px', borderRadius: 20,
            }}>
              {receipts.length}
            </span>
          </div>
          <p style={{ fontSize: 13, color: '#fff', marginTop: 2 }}>
            Track incoming stock from suppliers
          </p>
        </div>
        <Link href="/receipts/new" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '8px 18px', borderRadius: 8,
          background: 'linear-gradient(135deg, #2563eb, #1e40af)',
          color: 'white', fontWeight: 600, fontSize: 13,
          textDecoration: 'none',
          boxShadow: '0 0 20px rgba(37,99,235,0.25)',
        }}>
          <Plus size={15} />
          New Receipt
        </Link>
      </div>

      {/* Status Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 0 }}>
        {statusTabs.map((tab) => (
          <Link
            key={tab.value}
            href={`/receipts?status=${tab.value}`}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: activeStatus === tab.value ? 600 : 400,
              color: activeStatus === tab.value ? '#60a5fa' : '#fff',
              borderBottom: activeStatus === tab.value ? '2px solid #2563eb' : '2px solid transparent',
              textDecoration: 'none',
              transition: 'all 0.15s',
              marginBottom: -1,
            }}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Search */}
      <form style={{ display: 'flex', gap: 10 }} method="GET" action="/receipts">
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <Search size={14} style={{
            position: 'absolute', left: 10, top: '50%',
            transform: 'translateY(-50%)', color: '#fff',
          }} />
          <Input
            name="q"
            placeholder="Search by reference or supplier..."
            defaultValue={params.q}
            style={{
              paddingLeft: 32, height: 36,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#e2e8f0',
            }}
          />
        </div>
        <input type="hidden" name="status" value={activeStatus} />
        <Button type="submit" style={{
          height: 36, background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#fff', borderRadius: 8,
        }}>
          Search
        </Button>
      </form>

      {/* Table */}
      <div style={{
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12, overflow: 'hidden',
      }}>
        <style>{`.receipt-row:hover { background: rgba(37,99,235,0.05); }`}</style>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>Reference</th>
              <th style={thStyle}>Supplier</th>
              <th style={thStyle}>Destination</th>
              <th style={thStyle}>Scheduled</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Items</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Created</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            <ReceiptsTable receipts={receipts} activeStatus={activeStatus} />
          </tbody>
        </table>
      </div>

    </div>
  );
}

export default async function ReceiptsPage({ searchParams }: ReceiptsPageProps) {
  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      <Suspense fallback={
        <div style={{ color: '#fff', padding: 48, textAlign: 'center' }}>Loading receipts...</div>
      }>
        <ReceiptsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}