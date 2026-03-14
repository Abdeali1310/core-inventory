'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createTransfer, updateTransferStatus } from '@/lib/actions/transfers';
import { getProductsByLocation, ProductAtLocation } from '@/lib/actions/products';
import { LocationWithWarehouse } from '@/lib/actions/locations';
import { Plus, Trash2, Package, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface TransferLine {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  product_uom: string;
  qty: number;
  available_qty: number;
}

interface TransferFormProps {
  locations: LocationWithWarehouse[];
}

export function TransferForm({ locations }: TransferFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [lines, setLines] = useState<TransferLine[]>([]);
  const [productsAtSource, setProductsAtSource] = useState<ProductAtLocation[]>([]);
  const [formData, setFormData] = useState({
    source_location_id: '',
    dest_location_id: '',
    scheduled_date: '',
    notes: '',
  });

  const reference = useMemo(() => {
    const year = new Date().getFullYear();
    const refCount = Math.floor(Math.random() * 900) + 100;
    return `INT/${year}/${String(refCount).padStart(3, '0')}`;
  }, []);

  const handleSourceChange = async (location_id: string) => {
    setFormData(prev => ({ ...prev, source_location_id: location_id }));
    setLines([]);
    setProductsAtSource([]);

    if (!location_id) return;

    setLoadingProducts(true);
    try {
      const products = await getProductsByLocation(location_id);
      setProductsAtSource(products);
    } catch {
      toast.error('Failed to load products for this location');
    } finally {
      setLoadingProducts(false);
    }
  };

  const addLine = () => {
    setLines(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      product_id: '',
      product_name: '',
      product_sku: '',
      product_uom: 'pcs',
      qty: 1,
      available_qty: 0,
    }]);
  };

  const updateLine = (id: string, field: keyof TransferLine, value: string | number) => {
    setLines(prev => prev.map(line => {
      if (line.id !== id) return line;
      if (field === 'product_id') {
        const product = productsAtSource.find(p => p.id === value);
        return {
          ...line,
          product_id: value as string,
          product_name: product?.name || '',
          product_sku: product?.sku || '',
          product_uom: product?.unit_of_measure || 'pcs',
          available_qty: product?.available_qty || 0,
          qty: 1,
        };
      }
      return { ...line, [field]: value };
    }));
  };

  const removeLine = (id: string) => {
    setLines(prev => prev.filter(line => line.id !== id));
  };

  const handleSubmit = async (markReady: boolean) => {
    if (!formData.source_location_id || !formData.dest_location_id) {
      toast.error('Please select source and destination locations');
      return;
    }
    if (formData.source_location_id === formData.dest_location_id) {
      toast.error('Source and destination locations must be different');
      return;
    }
    const validLines = lines.filter(l => l.product_id && l.qty > 0);
    if (validLines.length === 0) {
      toast.error('Please add at least one valid line item');
      return;
    }
    for (const line of validLines) {
      if (line.qty > line.available_qty) {
        toast.error(`Insufficient stock for ${line.product_name}. Available: ${line.available_qty}`);
        return;
      }
    }

    setLoading(true);
    try {
      const transfer = await createTransfer({
        source_location_id: formData.source_location_id,
        dest_location_id: formData.dest_location_id,
        scheduled_date: formData.scheduled_date || undefined,
        notes: formData.notes || undefined,
        lines: validLines.map(l => ({ product_id: l.product_id, qty: l.qty })),
      });

      if (markReady) {
        await updateTransferStatus(transfer.id, 'ready');
      }

      toast.success(markReady ? 'Transfer saved and marked as ready' : 'Transfer saved as draft');
      router.push(`/transfers/${transfer.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create transfer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Fields */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30,41,59,0.8), rgba(15,23,42,0.9))',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 20,
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>Reference</label>
            <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: 6, fontFamily: 'monospace', color: '#60a5fa' }}>{reference}</div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>Scheduled Date</label>
            <Input
              type="date"
              value={formData.scheduled_date}
              onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#e2e8f0' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>Source Location *</label>
            <select
              value={formData.source_location_id}
              onChange={(e) => handleSourceChange(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 6, color: '#e2e8f0', fontSize: 14,
              }}
            >
              <option value="">Select source location...</option>
              {locations
                .filter(l => l.id !== formData.dest_location_id)
                .map(l => (
                  <option key={l.id} value={l.id}>{l.name} ({l.warehouse_name})</option>
                ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>Destination Location *</label>
            <select
              value={formData.dest_location_id}
              onChange={(e) => setFormData(prev => ({ ...prev, dest_location_id: e.target.value }))}
              style={{
                width: '100%', padding: '8px 12px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 6, color: '#e2e8f0', fontSize: 14,
              }}
            >
              <option value="">Select destination location...</option>
              {locations
                .filter(l => l.id !== formData.source_location_id)
                .map(l => (
                  <option key={l.id} value={l.id}>{l.name} ({l.warehouse_name})</option>
                ))}
            </select>
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <label style={{ display: 'block', fontSize: 11, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>Notes</label>
          <Input
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Optional notes..."
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#e2e8f0' }}
          />
        </div>
      </div>

      {/* Line Items */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30,41,59,0.8), rgba(15,23,42,0.9))',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', margin: 0 }}>Transfer Items</h3>
          <Button
            type="button"
            onClick={addLine}
            disabled={!formData.source_location_id || loadingProducts}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 6,
              background: 'rgba(37,99,235,0.15)',
              border: '1px solid rgba(37,99,235,0.25)',
              color: '#60a5fa', fontSize: 13,
            }}
          >
            <Plus size={14} />
            Add Item
          </Button>
        </div>

        {!formData.source_location_id ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>
            <Package size={24} style={{ opacity: 0.3, marginBottom: 8 }} />
            <p>Select a source location to see available products</p>
          </div>
        ) : loadingProducts ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Loader2 size={16} className="animate-spin" />
            <span>Loading products at this location...</span>
          </div>
        ) : productsAtSource.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>
            <p>No products with stock at this location</p>
          </div>
        ) : lines.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>
            <p>Click "Add Item" to add products to transfer</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {lines.map((line, index) => (
              <div key={line.id} style={{
                display: 'grid',
                gridTemplateColumns: '40px 1fr 100px 100px 80px',
                gap: 12, alignItems: 'end', padding: 12,
                background: 'rgba(255,255,255,0.02)', borderRadius: 8,
              }}>
                <span style={{ fontSize: 12, color: '#64748b', paddingBottom: 8 }}>{index + 1}</span>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#64748b', marginBottom: 6 }}>Product *</label>
                  <select
                    value={line.product_id}
                    onChange={(e) => updateLine(line.id, 'product_id', e.target.value)}
                    style={{
                      width: '100%', padding: '8px 10px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 6, color: '#e2e8f0', fontSize: 13,
                    }}
                  >
                    <option value="">Select product...</option>
                    {productsAtSource
                      .filter(p => !lines.some(l => l.id !== line.id && l.product_id === p.id))
                      .map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku}) — {p.available_qty} {p.unit_of_measure} available
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#64748b', marginBottom: 6 }}>Available</label>
                  <div style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: 6, fontSize: 13, color: '#94a3b8' }}>
                    {line.available_qty} {line.product_uom}
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#64748b', marginBottom: 6 }}>Qty *</label>
                  <Input
                    type="number"
                    min={1}
                    max={line.available_qty}
                    value={line.qty}
                    onChange={(e) => updateLine(line.id, 'qty', parseInt(e.target.value) || 0)}
                    disabled={!line.product_id}
                    style={{
                      background: line.qty > line.available_qty ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.04)',
                      border: line.qty > line.available_qty ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.08)',
                      color: '#e2e8f0', textAlign: 'center',
                    }}
                  />
                  {line.qty > line.available_qty && (
                    <div style={{ fontSize: 10, color: '#ef4444', marginTop: 2 }}>Exceeds available</div>
                  )}
                </div>
                <Button
                  type="button"
                  onClick={() => removeLine(line.id)}
                  style={{
                    padding: 8, background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: 6, color: '#ef4444',
                  }}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={() => handleSubmit(false)}
          disabled={loading}
          style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#e2e8f0' }}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : 'Save as Draft'}
        </Button>
        <Button
          type="button"
          onClick={() => handleSubmit(true)}
          disabled={loading || !formData.source_location_id || !formData.dest_location_id || lines.length === 0}
          style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #2563eb, #1e40af)', border: 'none', color: 'white', boxShadow: '0 0 20px rgba(37,99,235,0.25)' }}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : 'Save & Ready'}
        </Button>
      </div>
    </div>
  );
}