'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createDelivery } from '@/lib/actions/deliveries';
import { getLocations } from '@/lib/actions/locations';
import { getProducts, ProductWithStock } from '@/lib/actions/products';
import { format } from 'date-fns';
import { Plus, Trash2, Package, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface DeliveryLine {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  product_uom: string;
  expected_qty: number;
  available_stock: number;
}

interface DeliveryFormProps {
  locations: Awaited<ReturnType<typeof getLocations>>;
  products: ProductWithStock[];
}

export function DeliveryForm({ locations, products }: DeliveryFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [lines, setLines] = useState<DeliveryLine[]>([]);
  const [formData, setFormData] = useState({
    customer_name: '',
    source_location_id: '',
    scheduled_date: '',
    notes: '',
  });

  const year = new Date().getFullYear();
  const refCount = Math.floor(Math.random() * 900) + 100;
  const reference = `DEL/${year}/${String(refCount).padStart(3, '0')}`;

  const addLine = () => {
    const newLine: DeliveryLine = {
      id: Math.random().toString(36).substr(2, 9),
      product_id: '',
      product_name: '',
      product_sku: '',
      product_uom: 'pcs',
      expected_qty: 1,
      available_stock: 0,
    };
    setLines([...lines, newLine]);
  };

  const updateLine = (id: string, field: keyof DeliveryLine, value: string | number) => {
    setLines(prev => prev.map(line => {
      if (line.id !== id) return line;

      if (field === 'product_id') {
        const product = products.find(p => p.id === value);
        return {
          ...line,
          product_id: value as string,
          product_name: product?.name || '',
          product_sku: product?.sku || '',
          product_uom: product?.unit_of_measure || 'pcs',
          available_stock: product?.total_stock || 0,
        };
      }

      return { ...line, [field]: value };
    }));
  };

  const removeLine = (id: string) => {
    setLines(prev => prev.filter(line => line.id !== id));
  };

  const handleSubmit = async (markReady: boolean) => {
    if (!formData.customer_name || !formData.source_location_id) {
      toast.error('Please fill in required fields');
      return;
    }

    if (lines.length === 0) {
      toast.error('Please add at least one line item');
      return;
    }

    const validLines = lines.filter(l => l.product_id && l.expected_qty > 0);
    if (validLines.length === 0) {
      toast.error('Please add at least one valid line item');
      return;
    }

    setLoading(true);
    try {
      const delivery = await createDelivery({
        customer_name: formData.customer_name,
        source_location_id: formData.source_location_id,
        scheduled_date: formData.scheduled_date || undefined,
        notes: formData.notes || undefined,
        lines: validLines.map(l => ({
          product_id: l.product_id,
          requested_qty: l.expected_qty,
        })),
      });

      if (markReady) {
        const { updateDeliveryStatus } = await import('@/lib/actions/deliveries');
        await updateDeliveryStatus(delivery.id, 'ready');
      }

      toast.success(markReady ? 'Delivery saved and marked as ready' : 'Delivery saved as draft');
      router.push(`/deliveries/${delivery.id}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create delivery');
    } finally {
      setLoading(false);
    }
  };

  const selectedLocationStocks = formData.source_location_id
    ? products.map(p => ({
      id: p.id,
      stock: p.total_stock || 0,
    }))
    : [];

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
            <label style={{ display: 'block', fontSize: 11, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>Customer Name *</label>
            <Input
              value={formData.customer_name}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              placeholder="Enter customer name"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>Source Location *</label>
            <select
              value={formData.source_location_id}
              onChange={(e) => {
                setFormData({ ...formData, source_location_id: e.target.value });
                setLines(prev => prev.map(line => {
                  const product = products.find(p => p.id === line.product_id);
                  const stock = product?.total_stock || 0;
                  return { ...line, available_stock: stock };
                }));
              }}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 6,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#e2e8f0', fontSize: 14,
              }}
            >
              <option value="">Select location</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.warehouse_name})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>Scheduled Date</label>
            <Input
              type="date"
              value={formData.scheduled_date}
              onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: 11, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>Notes</label>
            <Input
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Optional notes"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30,41,59,0.8), rgba(15,23,42,0.9))',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package size={16} style={{ color: '#60a5fa' }} />
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f0f4ff', margin: 0 }}>Line Items</h2>
          </div>
          <Button type="button" onClick={addLine} variant="outline" size="sm">
            <Plus size={14} style={{ marginRight: 6 }} /> Add Product
          </Button>
        </div>

        {lines.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
            No line items. Click "Add Product" to add items.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <th style={thStyle}>Product</th>
                  <th style={thStyle}>SKU</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Available</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Requested</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>UOM</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => {
                  const exceedsStock = line.expected_qty > line.available_stock;
                  return (
                    <tr key={line.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={tdStyle}>
                        <select
                          value={line.product_id}
                          onChange={(e) => updateLine(line.id, 'product_id', e.target.value)}
                          style={{
                            padding: '6px 10px', borderRadius: 6, minWidth: 180,
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                            color: '#e2e8f0', fontSize: 13,
                          }}
                        >
                          <option value="">Select product</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ ...tdStyle, fontFamily: 'monospace', color: '#60a5fa' }}>{line.product_sku}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: line.available_stock > 0 ? '#4ade80' : '#fca5a5' }}>
                        {line.available_stock}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <Input
                          type="number"
                          min={1}
                          value={line.expected_qty}
                          onChange={(e) => updateLine(line.id, 'expected_qty', parseInt(e.target.value) || 0)}
                          style={{
                            width: 80, textAlign: 'right',
                            background: 'rgba(255,255,255,0.05)',
                            border: exceedsStock ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.1)',
                          }}
                        />
                        {exceedsStock && (
                          <div style={{ fontSize: 10, color: '#fca5a5', marginTop: 2 }}>Exceeds available</div>
                        )}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center', color: '#64748b' }}>{line.product_uom}</td>
                      <td style={tdStyle}>
                        <button
                          onClick={() => removeLine(line.id)}
                          style={{
                            padding: 6, borderRadius: 6, border: 'none',
                            background: 'rgba(239,68,68,0.1)', color: '#fca5a5', cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        <Button
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
          style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#94a3b8' }}
        >
          Cancel
        </Button>
        <Button
          onClick={() => handleSubmit(false)}
          disabled={loading}
          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#e2e8f0' }}
        >
          {loading && <Loader2 size={14} className="animate-spin" style={{ marginRight: 6 }} />}
          Save as Draft
        </Button>
        <Button
          onClick={() => handleSubmit(true)}
          disabled={loading}
          style={{ background: 'linear-gradient(135deg, #2563eb, #1e40af)', border: 'none', color: 'white' }}
        >
          {loading && <Loader2 size={14} className="animate-spin" style={{ marginRight: 6 }} />}
          Save & Mark Ready
        </Button>
      </div>
    </div>
  );
}

const thStyle = {
  padding: '12px 16px',
  textAlign: 'left' as const,
  fontSize: 11,
  fontWeight: 600,
  color: '#64748b',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
};

const tdStyle = {
  padding: '12px 16px',
  fontSize: 13,
  color: '#e2e8f0',
};
