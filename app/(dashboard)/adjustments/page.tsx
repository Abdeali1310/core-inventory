import Link from 'next/link';
import { Suspense } from 'react';
import { Plus, Eye, SlidersHorizontal } from 'lucide-react';
import { getAdjustments, AdjustmentWithDetails } from '@/lib/actions/adjustments';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/server';
interface PageProps {
    searchParams: Promise<{ status?: string }>;
}

const statusTabs = [
    { value: 'all', label: 'All' },
    { value: 'draft', label: 'Draft' },
    { value: 'done', label: 'Done' },
    { value: 'canceled', label: 'Canceled' },
];

const statusColors: Record<string, { bg: string; color: string }> = {
    draft: { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8' },
    done: { bg: 'rgba(52,211,153,0.12)', color: '#34d399' },
    canceled: { bg: 'rgba(248,113,113,0.12)', color: '#f87171' },
};

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

async function AdjustmentsContent({ searchParams }: PageProps) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user?.id).single();
    const isManager = profile?.role === 'manager';
    const params = await searchParams;
    const activeStatus = params.status || 'all';
    const adjustments = await getAdjustments({ status: activeStatus });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f0f4ff', margin: 0 }}>
                            Stock Adjustments
                        </h1>
                        <span style={{
                            fontSize: 12, fontWeight: 600, color: '#60a5fa',
                            background: 'rgba(37,99,235,0.15)',
                            border: '1px solid rgba(37,99,235,0.25)',
                            padding: '2px 10px', borderRadius: 20,
                        }}>
                            {adjustments.length}
                        </span>
                    </div>
                    <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                        Fix stock discrepancies with physical counts
                    </p>
                </div>
                {isManager && (
                    <Link href="/adjustments/new" style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '8px 18px', borderRadius: 8,
                        background: 'linear-gradient(135deg, #2563eb, #1e40af)',
                        color: 'white', fontWeight: 600, fontSize: 13,
                        textDecoration: 'none',
                        boxShadow: '0 0 20px rgba(37,99,235,0.25)',
                    }}>
                        <Plus size={15} />
                        New Adjustment
                    </Link>
                )}
            </div>

            {/* Status Tabs */}
            <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {statusTabs.map((tab) => (
                    <Link key={tab.value} href={`/adjustments?status=${tab.value}`} style={{
                        padding: '8px 16px', fontSize: 13,
                        fontWeight: activeStatus === tab.value ? 600 : 400,
                        color: activeStatus === tab.value ? '#60a5fa' : '#64748b',
                        borderBottom: activeStatus === tab.value ? '2px solid #2563eb' : '2px solid transparent',
                        textDecoration: 'none', transition: 'all 0.15s', marginBottom: -1,
                    }}>
                        {tab.label}
                    </Link>
                ))}
            </div>

            {/* Table */}
            <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
                <style>{`.adj-row:hover { background: rgba(37,99,235,0.05); }`}</style>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={thStyle}>Reference</th>
                            <th style={thStyle}>Location</th>
                            <th style={{ ...thStyle, textAlign: 'center' }}>Items</th>
                            <th style={thStyle}>Status</th>
                            <th style={thStyle}>Created</th>
                            <th style={thStyle}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {adjustments.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                                        <SlidersHorizontal size={32} style={{ opacity: 0.3 }} />
                                        <span>No adjustments found.</span>
                                    </div>
                                </td>
                            </tr>
                        ) : adjustments.map((adj) => {
                            const sc = statusColors[adj.status] ?? statusColors.draft;
                            return (
                                <tr key={adj.id} className="adj-row">
                                    <td style={{ ...tdStyle, fontFamily: 'JetBrains Mono, monospace', color: '#60a5fa', fontSize: 12 }}>
                                        {adj.reference}
                                    </td>
                                    <td style={tdStyle}>
                                        <div style={{ color: '#e2e8f0' }}>{adj.location_name}</div>
                                        <div style={{ fontSize: 11, color: '#64748b' }}>{adj.warehouse_name}</div>
                                    </td>
                                    <td style={{ ...tdStyle, textAlign: 'center' as const, color: '#94a3b8' }}>
                                        {adj.items_count}
                                    </td>
                                    <td style={tdStyle}>
                                        <span style={{
                                            fontSize: 11, fontWeight: 600, padding: '2px 10px',
                                            borderRadius: 20, background: sc.bg, color: sc.color,
                                        }}>
                                            {adj.status.charAt(0).toUpperCase() + adj.status.slice(1)}
                                        </span>
                                    </td>
                                    <td style={{ ...tdStyle, color: '#64748b', fontSize: 12 }}>
                                        {format(new Date(adj.created_at), 'MMM d, yyyy')}
                                    </td>
                                    <td style={tdStyle}>
                                        <Link href={`/adjustments/${adj.id}`} style={{
                                            padding: '5px 8px', borderRadius: 6,
                                            background: 'rgba(37,99,235,0.12)',
                                            border: '1px solid rgba(37,99,235,0.2)',
                                            color: '#60a5fa', display: 'inline-flex', alignItems: 'center',
                                        }}>
                                            <Eye size={13} />
                                        </Link>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default async function AdjustmentsPage({ searchParams }: PageProps) {
    return (
        <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
            <Suspense fallback={
                <div style={{ color: '#64748b', padding: 48, textAlign: 'center' }}>Loading...</div>
            }>
                <AdjustmentsContent searchParams={searchParams} />
            </Suspense>
        </div>
    );
}