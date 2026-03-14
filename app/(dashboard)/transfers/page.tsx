
import Link from 'next/link';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Eye, ArrowRightLeft } from 'lucide-react';
import { getTransfers, TransferWithDetails } from '@/lib/actions/transfers';
import { StatusBadge } from '@/components/operations/StatusBadge';
import { format } from 'date-fns';

interface TransfersPageProps {
  searchParams: Promise<{ status?: string; location?: string; q?: string }>;
}

const statusTabs = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'ready', label: 'Ready' },
  { value: 'done', label: 'Done' },
  { value: 'canceled', label: 'Canceled' },
];

const thStyle = {
  padding: '10px 16px',
  textAlign: 'left' as const,
  fontSize: 11,
  fontWeight: 600,
  color: '#64748b',
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

function TransfersTable({ transfers }: { transfers: TransferWithDetails[] }) {
  if (transfers.length === 0) {
    return (
      <tr>
        <td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <ArrowRightLeft size={32} style={{ opacity: 0.3 }} />
            <span>No transfers found. Create one to start moving stock between locations.</span>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <>
      {transfers.map((transfer) => (
        <tr key={transfer.id} style={{ cursor: 'pointer' }} className="transfer-row">
          <td style={{ ...tdStyle, fontFamily: 'JetBrains Mono, monospace', color: '#60a5fa', fontSize: 12 }}>
            {transfer.reference}
          </td>
          <td style={tdStyle}>
            <div style={{ color: '#e2e8f0' }}>{transfer.source_location_name}</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>{transfer.source_warehouse_name}</div>
          </td>
          <td style={tdStyle}>
            <div style={{ color: '#e2e8f0' }}>{transfer.dest_location_name}</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>{transfer.dest_warehouse_name}</div>
          </td>
          <td style={{ ...tdStyle, color: '#94a3b8', textAlign: 'center' as const }}>
            {transfer.items_count}
          </td>
          <td style={tdStyle}>
            <StatusBadge status={transfer.status} type="transfer" />
          </td>
          <td style={{ ...tdStyle, color: '#94a3b8' }}>
            {transfer.scheduled_date
              ? format(new Date(transfer.scheduled_date), 'MMM d, yyyy')
              : '—'}
          </td>
          <td style={{ ...tdStyle, color: '#64748b', fontSize: 12 }}>
            {format(new Date(transfer.created_at), 'MMM d, yyyy')}
          </td>
          <td style={{ ...tdStyle }}>
            <Link href={`/transfers/${transfer.id}`} style={{
              padding: '5px 8px', borderRadius: 6,
              background: 'rgba(37,99,235,0.12)',
              border: '1px solid rgba(37,99,235,0.2)',
              color: '#60a5fa', display: 'flex', alignItems: 'center',
            }}>
              <Eye size={13} />
            </Link>
          </td>
        </tr>
      ))}
    </>
  );
}

async function TransfersContent({ searchParams }: TransfersPageProps) {
  const params = await searchParams;
  const activeStatus = params.status || 'all';
  const filters = {
    status: activeStatus,
    source_location_id: params.location,
    search: params.q,
  };

  const transfers = await getTransfers(filters);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f0f4ff', margin: 0 }}>Internal Transfers</h1>
            <span style={{
              fontSize: 12, fontWeight: 600, color: '#60a5fa',
              background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.25)',
              padding: '2px 10px', borderRadius: 20,
            }}>
              {transfers.length}
            </span>
          </div>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
            Move stock between warehouse locations
          </p>
        </div>
        <Link href="/transfers/new" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '8px 18px', borderRadius: 8,
          background: 'linear-gradient(135deg, #2563eb, #1e40af)',
          color: 'white', fontWeight: 600, fontSize: 13,
          textDecoration: 'none',
          boxShadow: '0 0 20px rgba(37,99,235,0.25)',
        }}>
          <Plus size={15} />
          New Transfer
        </Link>
      </div>

      {/* Status Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 0 }}>
        {statusTabs.map((tab) => (
          <Link
            key={tab.value}
            href={`/transfers?status=${tab.value}`}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: activeStatus === tab.value ? 600 : 400,
              color: activeStatus === tab.value ? '#60a5fa' : '#64748b',
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
      <form style={{ display: 'flex', gap: 10 }} method="GET" action="/transfers">
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <Search size={14} style={{
            position: 'absolute', left: 10, top: '50%',
            transform: 'translateY(-50%)', color: '#64748b',
          }} />
          <Input
            name="q"
            placeholder="Search by reference..."
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
          color: '#94a3b8', borderRadius: 8,
        }}>
          Search
        </Button>
      </form>

      {/* Table */}
      <div style={{
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12, overflow: 'hidden',
      }}>
        <style>{`.transfer-row:hover { background: rgba(37,99,235,0.05); }`}</style>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>Reference</th>
              <th style={thStyle}>From</th>
              <th style={thStyle}>To</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Items</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Scheduled</th>
              <th style={thStyle}>Created</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            <TransfersTable transfers={transfers} />
          </tbody>
        </table>
      </div>

    </div>
  );
}

export default async function TransfersPage({ searchParams }: TransfersPageProps) {
  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      <Suspense fallback={
        <div style={{ color: '#64748b', padding: 48, textAlign: 'center' }}>Loading transfers...</div>
      }>
        <TransfersContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
