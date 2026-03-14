import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowLeftRight } from 'lucide-react';
import { getTransferById } from '@/lib/actions/transfers';
import { createClient } from '@/lib/supabase/server';
import { format } from 'date-fns';
import TransferActions from '@/components/transfers/TransferActions';

interface PageProps { params: Promise<{ id: string }>; }

const statusColors: Record<string, { bg: string; color: string }> = {
    draft: { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8' },
    waiting: { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24' },
    ready: { bg: 'rgba(37,99,235,0.12)', color: '#60a5fa' },
    done: { bg: 'rgba(52,211,153,0.12)', color: '#34d399' },
    canceled: { bg: 'rgba(248,113,113,0.12)', color: '#f87171' },
};

export default async function TransferDetailPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user?.id).single();

    const transfer = await getTransferById(id);
    if (!transfer) notFound();

    const sc = statusColors[transfer.status] ?? statusColors.draft;
    const isManager = profile?.role === 'manager';

    return (
        <div style={{ padding: '24px', maxWidth: 1100, margin: '0 auto' }}>

            {/* Back */}
            <Link href="/transfers" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 13, color: '#64748b', textDecoration: 'none', marginBottom: 20,
            }}>
                <ArrowLeft size={14} /> Back to Transfers
            </Link>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 10,
                        background: 'rgba(37,99,235,0.1)',
                        border: '1px solid rgba(37,99,235,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <ArrowLeftRight size={20} color="#3b82f6" />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <h1 style={{
                                fontSize: 20, fontWeight: 700, color: '#f0f4ff', margin: 0,
                                fontFamily: 'JetBrains Mono, monospace',
                            }}>
                                {transfer.reference}
                            </h1>
                            <span style={{
                                fontSize: 11, fontWeight: 600, padding: '2px 10px',
                                borderRadius: 20, background: sc.bg, color: sc.color,
                            }}>
                                {transfer.status.charAt(0).toUpperCase() + transfer.status.slice(1)}
                            </span>
                        </div>
                        <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                            {transfer.source_location_name} → {transfer.dest_location_name}
                        </p>
                    </div>
                </div>
                {(transfer.status === 'draft' || transfer.status === 'ready') && isManager && (
                    <TransferActions
                        transferId={transfer.id}
                        currentStatus={transfer.status}
                    />
                )}
            </div>

            {/* Info Card */}
            <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12, padding: 20, marginBottom: 24,
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 20,
            }}>
                {[
                    { label: 'From', value: transfer.source_location_name },
                    { label: 'From Warehouse', value: transfer.source_warehouse_name },
                    { label: 'To', value: transfer.dest_location_name },
                    { label: 'To Warehouse', value: transfer.dest_warehouse_name },
                    { label: 'Created By', value: transfer.created_by_name ?? '—' },
                    { label: 'Created At', value: format(new Date(transfer.created_at), 'MMM d, yyyy HH:mm') },
                    {
                        label: 'Scheduled', value: transfer.scheduled_date
                            ? format(new Date(transfer.scheduled_date), 'MMM d, yyyy') : '—'
                    },
                    {
                        label: 'Validated At', value: transfer.validated_at
                            ? format(new Date(transfer.validated_at), 'MMM d, yyyy HH:mm') : '—'
                    },
                ].map(({ label, value }) => (
                    <div key={label}>
                        <div style={{
                            fontSize: 10, fontWeight: 600, color: '#64748b',
                            textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4,
                        }}>
                            {label}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: '#e2e8f0' }}>{value}</div>
                    </div>
                ))}
            </div>

            {/* Lines Table */}
            <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12, overflow: 'hidden',
            }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <h2 style={{ fontSize: 14, fontWeight: 700, color: '#f0f4ff', margin: 0 }}>
                        Transfer Items ({transfer.lines.length})
                    </h2>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                            {['Product', 'SKU', 'Quantity', 'Unit'].map(h => (
                                <th key={h} style={{
                                    padding: '10px 16px', textAlign: 'left' as const,
                                    fontSize: 11, fontWeight: 600, color: '#64748b',
                                    textTransform: 'uppercase' as const, letterSpacing: '0.5px',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                }}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {transfer.lines.map((line) => (
                            <tr key={line.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                <td style={{ padding: '12px 16px', color: '#e2e8f0', fontSize: 14, fontWeight: 500 }}>
                                    {line.product_name}
                                </td>
                                <td style={{
                                    padding: '12px 16px',
                                    fontFamily: 'JetBrains Mono, monospace',
                                    fontSize: 12, color: '#3b82f6',
                                }}>
                                    {line.product_sku}
                                </td>
                                <td style={{ padding: '12px 16px', color: '#34d399', fontSize: 14, fontWeight: 600 }}>
                                    {line.qty}
                                </td>
                                <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 13 }}>
                                    {line.product_uom}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}