'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Trash2, RefreshCw, Loader2 } from 'lucide-react';
import { createAdjustment, getStockByLocation } from '@/lib/actions/adjustments';

interface Location { id: string; name: string; warehouse_name: string; }
interface Product { id: string; name: string; sku: string; unit_of_measure: string; }
interface Line {
    product_id: string;
    product_name: string;
    product_sku: string;
    product_uom: string;
    recorded_qty: number;
    counted_qty: number;
}

interface Props {
    locations: Location[];
    products: Product[];
    reference: string;
}

const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#e2e8f0',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 13,
    width: '100%',
    outline: 'none',
};

const labelStyle = {
    fontSize: 11,
    fontWeight: 600 as const,
    color: '#94a3b8',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: 6,
    display: 'block',
};

export default function AdjustmentForm({ locations, products, reference }: Props) {
    const router = useRouter();
    const [locationId, setLocationId] = useState('');
    const [notes, setNotes] = useState('');
    const [lines, setLines] = useState<Line[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingStock, setLoadingStock] = useState(false);

    const handleLoadAllProducts = async () => {
        if (!locationId) { toast.error('Select a location first'); return; }
        setLoadingStock(true);
        try {
            const stock = await getStockByLocation(locationId);
            if (stock.length === 0) { toast.info('No products at this location'); return; }
            setLines(stock.map(s => ({
                product_id: s.product_id,
                product_name: s.product_name,
                product_sku: s.product_sku,
                product_uom: s.product_uom,
                recorded_qty: s.quantity,
                counted_qty: s.quantity,
            })));
            toast.success(`Loaded ${stock.length} products`);
        } catch (e) {
            toast.error('Failed to load products');
        } finally {
            setLoadingStock(false);
        }
    };

    const handleAddLine = () => {
        setLines(prev => [...prev, {
            product_id: '',
            product_name: '',
            product_sku: '',
            product_uom: 'pcs',
            recorded_qty: 0,
            counted_qty: 0,
        }]);
    };

    const handleProductSelect = (index: number, productId: string) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;
        setLines(prev => prev.map((l, i) => i === index ? {
            ...l,
            product_id: product.id,
            product_name: product.name,
            product_sku: product.sku,
            product_uom: product.unit_of_measure,
        } : l));
    };

    const handleCountedQtyChange = (index: number, value: number) => {
        setLines(prev => prev.map((l, i) => i === index ? { ...l, counted_qty: value } : l));
    };

    const handleRemoveLine = (index: number) => {
        setLines(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!locationId) { toast.error('Select a location'); return; }
        if (lines.length === 0) { toast.error('Add at least one product'); return; }
        if (lines.some(l => !l.product_id)) { toast.error('Select a product for all lines'); return; }

        setLoading(true);
        try {
            await createAdjustment({
                location_id: locationId,
                notes: notes || undefined,
                lines: lines.map(l => ({
                    product_id: l.product_id,
                    recorded_qty: l.recorded_qty,
                    counted_qty: l.counted_qty,
                })),
            });
            toast.success('Adjustment saved as draft');
            router.push('/adjustments');
        } catch (e: any) {
            toast.error(e.message || 'Failed to save adjustment');
        } finally {
            setLoading(false);
        }
    };

    const getDiffDisplay = (line: Line) => {
        const diff = line.counted_qty - line.recorded_qty;
        if (diff === 0) return { label: 'No change', color: '#64748b', bg: 'rgba(148,163,184,0.1)' };
        if (diff > 0) return { label: `+${diff}`, color: '#34d399', bg: 'rgba(52,211,153,0.1)' };
        return { label: `${diff}`, color: '#f87171', bg: 'rgba(248,113,113,0.1)' };
    };

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f0f4ff', margin: 0 }}>
                    New Stock Adjustment
                </h1>
                <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                    Compare recorded vs physical count and correct discrepancies
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 24, alignItems: 'start' }}>

                {/* Left — Details */}
                <div style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 12, padding: 24,
                    display: 'flex', flexDirection: 'column', gap: 20,
                }}>
                    <div>
                        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#f0f4ff', margin: '0 0 4px' }}>
                            Adjustment Details
                        </h2>
                        <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Header information</p>
                    </div>

                    {/* Reference */}
                    <div>
                        <label style={labelStyle}>Reference</label>
                        <input
                            value={reference}
                            readOnly
                            style={{ ...inputStyle, color: '#60a5fa', fontFamily: 'JetBrains Mono, monospace', cursor: 'not-allowed', opacity: 0.8 }}
                        />
                    </div>

                    {/* Location */}
                    <div>
                        <label style={labelStyle}>Location *</label>
                        <select
                            value={locationId}
                            onChange={(e) => { setLocationId(e.target.value); setLines([]); }}
                            style={{ ...inputStyle, height: 38 }}
                        >
                            <option value="">Select location...</option>
                            {locations.map(l => (
                                <option key={l.id} value={l.id}>
                                    {l.name} ({l.warehouse_name})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Notes */}
                    <div>
                        <label style={labelStyle}>Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Optional notes about this adjustment..."
                            rows={4}
                            style={{ ...inputStyle, resize: 'vertical' as const, height: 'auto' }}
                        />
                    </div>
                </div>

                {/* Right — Line Items */}
                <div style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 12, padding: 24,
                    display: 'flex', flexDirection: 'column', gap: 16,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#f0f4ff', margin: '0 0 4px' }}>
                                Line Items
                            </h2>
                            <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Products to count</p>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button
                                onClick={handleLoadAllProducts}
                                disabled={!locationId || loadingStock}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                                    background: locationId ? 'rgba(37,99,235,0.15)' : 'rgba(255,255,255,0.03)',
                                    border: locationId ? '1px solid rgba(37,99,235,0.3)' : '1px solid rgba(255,255,255,0.08)',
                                    color: locationId ? '#60a5fa' : '#64748b',
                                    cursor: locationId ? 'pointer' : 'not-allowed',
                                }}
                            >
                                {loadingStock ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                                Load All Products
                            </button>
                            <button
                                onClick={handleAddLine}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: '#94a3b8', cursor: 'pointer',
                                }}
                            >
                                <Plus size={12} />
                                Add Product
                            </button>
                        </div>
                    </div>

                    {lines.length === 0 ? (
                        <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                            Select a location and click "Load All Products" or add manually
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {/* Header row */}
                            <div style={{
                                display: 'grid', gridTemplateColumns: '2fr 80px 90px 80px 32px',
                                gap: 8, padding: '0 4px',
                            }}>
                                {['Product', 'Recorded', 'Counted', 'Diff', ''].map(h => (
                                    <div key={h} style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        {h}
                                    </div>
                                ))}
                            </div>

                            {lines.map((line, index) => {
                                const diff = getDiffDisplay(line);
                                return (
                                    <div key={index} style={{
                                        display: 'grid', gridTemplateColumns: '2fr 80px 90px 80px 32px',
                                        gap: 8, alignItems: 'center',
                                        padding: '10px 8px',
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        borderRadius: 8,
                                    }}>
                                        {/* Product */}
                                        <div>
                                            {line.product_id ? (
                                                <div>
                                                    <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>{line.product_name}</div>
                                                    <div style={{ fontSize: 11, color: '#3b82f6', fontFamily: 'JetBrains Mono, monospace' }}>{line.product_sku}</div>
                                                </div>
                                            ) : (
                                                <select
                                                    value={line.product_id}
                                                    onChange={(e) => handleProductSelect(index, e.target.value)}
                                                    style={{ ...inputStyle, fontSize: 12, padding: '6px 8px' }}
                                                >
                                                    <option value="">Select product...</option>
                                                    {products.map(p => (
                                                        <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>

                                        {/* Recorded */}
                                        <input
                                            type="number"
                                            value={line.recorded_qty}
                                            readOnly
                                            style={{ ...inputStyle, padding: '6px 8px', color: '#64748b', cursor: 'not-allowed', fontSize: 13, textAlign: 'center' as const }}
                                        />

                                        {/* Counted */}
                                        <input
                                            type="number"
                                            value={line.counted_qty}
                                            min={0}
                                            onChange={(e) => handleCountedQtyChange(index, Number(e.target.value))}
                                            style={{
                                                ...inputStyle, padding: '6px 8px', fontSize: 13,
                                                textAlign: 'center' as const,
                                                border: '1px solid rgba(37,99,235,0.3)',
                                                background: 'rgba(37,99,235,0.06)',
                                            }}
                                        />

                                        {/* Diff */}
                                        <span style={{
                                            fontSize: 11, fontWeight: 600, padding: '3px 6px',
                                            borderRadius: 6, background: diff.bg, color: diff.color,
                                            textAlign: 'center' as const, whiteSpace: 'nowrap' as const,
                                        }}>
                                            {diff.label}
                                        </span>

                                        {/* Delete */}
                                        <button
                                            onClick={() => handleRemoveLine(index)}
                                            style={{
                                                background: 'none', border: 'none', cursor: 'pointer',
                                                color: '#64748b', padding: 4, borderRadius: 4,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {lines.length > 0 && (
                        <div style={{ fontSize: 12, color: '#64748b', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            {lines.length} product{lines.length > 1 ? 's' : ''} •{' '}
                            {lines.filter(l => l.counted_qty !== l.recorded_qty).length} with changes
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div style={{
                display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24,
                paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)',
            }}>
                <button
                    onClick={() => router.push('/adjustments')}
                    style={{
                        padding: '8px 20px', borderRadius: 8,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#94a3b8', cursor: 'pointer', fontSize: 13,
                    }}
                >
                    Cancel
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    style={{
                        padding: '8px 24px', borderRadius: 8,
                        background: 'linear-gradient(135deg, #2563eb, #1e40af)',
                        border: 'none', color: 'white', fontWeight: 600, fontSize: 13,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.7 : 1,
                        display: 'flex', alignItems: 'center', gap: 6,
                    }}
                >
                    {loading && <Loader2 size={14} className="animate-spin" />}
                    Save as Draft
                </button>
            </div>
        </div>
    );
}