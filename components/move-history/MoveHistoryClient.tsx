'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow, format } from 'date-fns';
import { History, Download, Search, Filter } from 'lucide-react';
import { getStockLedger, LedgerEntry } from '@/lib/actions/ledger';
import { LocationWithWarehouse } from '@/lib/actions/locations';
import { toast } from 'sonner';

interface Props {
    initialEntries: LedgerEntry[];
    locations: LocationWithWarehouse[];
    initialFilters: {
        search: string;
        type: string;
        location_id: string;
        date_from: string;
        date_to: string;
    };
}

const movementConfig: Record<string, { label: string; bg: string; color: string; href: string }> = {
    receipt: { label: 'Receipt', bg: 'rgba(52,211,153,0.12)', color: '#34d399', href: '/receipts' },
    delivery: { label: 'Delivery', bg: 'rgba(251,146,60,0.12)', color: '#fb923c', href: '/deliveries' },
    transfer_in: { label: 'Transfer In', bg: 'rgba(139,92,246,0.12)', color: '#a78bfa', href: '/transfers' },
    transfer_out: { label: 'Transfer Out', bg: 'rgba(139,92,246,0.12)', color: '#a78bfa', href: '/transfers' },
    adjustment: { label: 'Adjustment', bg: 'rgba(148,163,184,0.12)', color: '#94a3b8', href: '/adjustments' },
};

const typeFilters = [
    { value: 'all', label: 'All' },
    { value: 'receipts', label: 'Receipts' },
    { value: 'deliveries', label: 'Deliveries' },
    { value: 'transfers', label: 'Transfers' },
    { value: 'adjustments', label: 'Adjustments' },
];

const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#e2e8f0',
    borderRadius: 8,
    padding: '7px 12px',
    fontSize: 13,
    outline: 'none',
    height: 36,
};

export default function MoveHistoryClient({ initialEntries, locations, initialFilters }: Props) {
    const router = useRouter();
    const [entries, setEntries] = useState<LedgerEntry[]>(initialEntries);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState(initialFilters.search);
    const [typeFilter, setTypeFilter] = useState(initialFilters.type);
    const [locationFilter, setLocationFilter] = useState(initialFilters.location_id);
    const [dateFrom, setDateFrom] = useState(initialFilters.date_from);
    const [dateTo, setDateTo] = useState(initialFilters.date_to);

    const fetchEntries = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getStockLedger({
                search: search || undefined,
                movement_type: typeFilter !== 'all' ? typeFilter : undefined,
                location_id: locationFilter !== 'all' ? locationFilter : undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
                limit: 100,
            });
            setEntries(data);
        } catch {
            toast.error('Failed to fetch ledger');
        } finally {
            setLoading(false);
        }
    }, [search, typeFilter, locationFilter, dateFrom, dateTo]);

    useEffect(() => {
        const t = setTimeout(fetchEntries, 300);
        return () => clearTimeout(t);
    }, [fetchEntries]);

    const handleExportCSV = () => {
        const headers = ['Date', 'Type', 'Reference', 'Product', 'SKU', 'Location', 'Warehouse', 'Qty Change', 'Qty After', 'Performed By'];
        const rows = entries.map(e => [
            format(new Date(e.created_at), 'yyyy-MM-dd HH:mm:ss'),
            e.movement_type,
            e.reference_type + '/' + e.reference_id.slice(0, 8),
            e.product_name,
            e.product_sku,
            e.location_name,
            e.warehouse_name,
            e.qty_change,
            e.qty_after,
            e.performed_by_name,
        ]);

        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `move-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('CSV exported!');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f0f4ff', margin: 0 }}>
                            Move History
                        </h1>
                        <span style={{
                            fontSize: 12, fontWeight: 600, color: '#60a5fa',
                            background: 'rgba(37,99,235,0.15)',
                            border: '1px solid rgba(37,99,235,0.25)',
                            padding: '2px 10px', borderRadius: 20,
                        }}>
                            {entries.length}
                        </span>
                    </div>
                    <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                        Complete audit trail of all stock movements
                    </p>
                </div>
                <button
                    onClick={handleExportCSV}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 16px', borderRadius: 8,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#94a3b8', fontSize: 13, fontWeight: 600,
                        cursor: 'pointer',
                    }}
                >
                    <Download size={14} />
                    Export CSV
                </button>
            </div>

            {/* Type Tabs */}
            <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {typeFilters.map(tab => (
                    <button
                        key={tab.value}
                        onClick={() => setTypeFilter(tab.value)}
                        style={{
                            padding: '8px 16px', fontSize: 13, background: 'none', border: 'none',
                            fontWeight: typeFilter === tab.value ? 600 : 400,
                            color: typeFilter === tab.value ? '#60a5fa' : '#64748b',
                            borderBottom: typeFilter === tab.value ? '2px solid #2563eb' : '2px solid transparent',
                            cursor: 'pointer', transition: 'all 0.15s', marginBottom: -1,
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Filters */}
            <div style={{
                display: 'flex', gap: 10, flexWrap: 'wrap',
                padding: 16,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10,
            }}>
                {/* Search */}
                <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                    <Search size={13} style={{
                        position: 'absolute', left: 10, top: '50%',
                        transform: 'translateY(-50%)', color: '#64748b',
                    }} />
                    <input
                        placeholder="Search product or SKU..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ ...inputStyle, paddingLeft: 30, width: '100%' }}
                    />
                </div>

                {/* Location */}
                <select
                    value={locationFilter}
                    onChange={e => setLocationFilter(e.target.value)}
                    style={{ ...inputStyle, minWidth: 180 }}
                >
                    <option value="all">All Locations</option>
                    {locations.map(l => (
                        <option key={l.id} value={l.id}>
                            {l.name} ({l.warehouse_name})
                        </option>
                    ))}
                </select>

                {/* Date From */}
                <input
                    type="date"
                    value={dateFrom}
                    onChange={e => setDateFrom(e.target.value)}
                    style={{ ...inputStyle, minWidth: 140, colorScheme: 'dark' }}
                />

                {/* Date To */}
                <input
                    type="date"
                    value={dateTo}
                    onChange={e => setDateTo(e.target.value)}
                    style={{ ...inputStyle, minWidth: 140, colorScheme: 'dark' }}
                />

                {/* Clear */}
                {(search || locationFilter !== 'all' || dateFrom || dateTo) && (
                    <button
                        onClick={() => {
                            setSearch('');
                            setLocationFilter('all');
                            setDateFrom('');
                            setDateTo('');
                        }}
                        style={{
                            ...inputStyle, cursor: 'pointer',
                            color: '#f87171', background: 'rgba(248,113,113,0.08)',
                            border: '1px solid rgba(248,113,113,0.15)',
                            padding: '7px 14px',
                        }}
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* Table */}
            <div style={{
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12, overflow: 'hidden',
            }}>
                <style>{`
          .ledger-row:hover { background: rgba(37,99,235,0.05) !important; }
          @media (max-width: 768px) {
            .ledger-table { display: none; }
            .ledger-cards { display: flex !important; }
          }
        `}</style>

                {/* Desktop Table */}
                <table className="ledger-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                            {['Date', 'Type', 'Product', 'Location', 'Qty Change', 'Qty After', 'By'].map(h => (
                                <th key={h} style={{
                                    padding: '10px 14px', textAlign: 'left' as const,
                                    fontSize: 11, fontWeight: 600, color: '#64748b',
                                    textTransform: 'uppercase' as const, letterSpacing: '0.5px',
                                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                                }}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                    {Array.from({ length: 7 }).map((_, j) => (
                                        <td key={j} style={{ padding: '12px 14px' }}>
                                            <div style={{
                                                height: 12, borderRadius: 4,
                                                background: 'rgba(255,255,255,0.06)',
                                                animation: 'pulse 1.5s infinite',
                                            }} />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : entries.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                                        <History size={32} style={{ opacity: 0.3 }} />
                                        <span>No movements found.</span>
                                    </div>
                                </td>
                            </tr>
                        ) : entries.map(entry => {
                            const mv = movementConfig[entry.movement_type] ?? movementConfig.adjustment;
                            const isPositive = entry.qty_change >= 0;
                            const isRecent = new Date(entry.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000);
                            return (
                                <tr key={entry.id} className="ledger-row"
                                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                    <td style={{ padding: '11px 14px' }}>
                                        <div style={{ fontSize: 12, color: '#e2e8f0' }}>
                                            {isRecent
                                                ? formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })
                                                : format(new Date(entry.created_at), 'MMM d, yyyy')}
                                        </div>
                                        <div style={{ fontSize: 10, color: '#64748b' }}>
                                            {format(new Date(entry.created_at), 'HH:mm')}
                                        </div>
                                    </td>
                                    <td style={{ padding: '11px 14px' }}>
                                        <span style={{
                                            fontSize: 11, fontWeight: 600, padding: '2px 8px',
                                            borderRadius: 4, background: mv.bg, color: mv.color,
                                            whiteSpace: 'nowrap' as const,
                                        }}>
                                            {mv.label}
                                        </span>
                                    </td>
                                    <td style={{ padding: '11px 14px' }}>
                                        <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>
                                            {entry.product_name}
                                        </div>
                                        <div style={{ fontSize: 11, color: '#3b82f6', fontFamily: 'JetBrains Mono, monospace' }}>
                                            {entry.product_sku}
                                        </div>
                                    </td>
                                    <td style={{ padding: '11px 14px' }}>
                                        <div style={{ fontSize: 13, color: '#94a3b8' }}>{entry.location_name}</div>
                                        <div style={{ fontSize: 11, color: '#64748b' }}>{entry.warehouse_name}</div>
                                    </td>
                                    <td style={{ padding: '11px 14px' }}>
                                        <span style={{
                                            fontSize: 14, fontWeight: 700,
                                            color: isPositive ? '#34d399' : '#f87171',
                                        }}>
                                            {isPositive ? '+' : ''}{entry.qty_change}
                                        </span>
                                    </td>
                                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>
                                        {entry.qty_after}
                                    </td>
                                    <td style={{ padding: '11px 14px', fontSize: 12, color: '#64748b' }}>
                                        {entry.performed_by_name}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* Mobile Cards */}
                <div className="ledger-cards" style={{ display: 'none', flexDirection: 'column', gap: 1 }}>
                    {entries.map(entry => {
                        const mv = movementConfig[entry.movement_type] ?? movementConfig.adjustment;
                        const isPositive = entry.qty_change >= 0;
                        return (
                            <div key={entry.id} style={{
                                padding: '14px 16px',
                                borderBottom: '1px solid rgba(255,255,255,0.04)',
                                display: 'flex', flexDirection: 'column', gap: 8,
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{
                                        fontSize: 11, fontWeight: 600, padding: '2px 8px',
                                        borderRadius: 4, background: mv.bg, color: mv.color,
                                    }}>
                                        {mv.label}
                                    </span>
                                    <span style={{ fontSize: 14, fontWeight: 700, color: isPositive ? '#34d399' : '#f87171' }}>
                                        {isPositive ? '+' : ''}{entry.qty_change}
                                    </span>
                                </div>
                                <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>{entry.product_name}</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: 12, color: '#64748b' }}>{entry.location_name}</span>
                                    <span style={{ fontSize: 12, color: '#64748b' }}>
                                        {format(new Date(entry.created_at), 'MMM d, HH:mm')}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>

            {entries.length > 0 && (
                <div style={{ fontSize: 12, color: '#64748b', textAlign: 'center' as const }}>
                    Showing {entries.length} movements
                </div>
            )}
        </div>
    );
}