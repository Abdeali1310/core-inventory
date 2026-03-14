'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/operations/StatusBadge';
import { validateReceipt, updateReceiptStatus, type ReceiptDetail } from '@/lib/actions/receipts';
import { format } from 'date-fns';
import { Check, X, Package, Loader2 } from 'lucide-react';

interface ReceiptDetailClientProps {
  receipt: ReceiptDetail;
}

export function ReceiptDetailClient({ receipt: initialReceipt }: ReceiptDetailClientProps) {
  const router = useRouter();
  const [receipt, setReceipt] = useState(initialReceipt);
  const [lines, setLines] = useState(
    initialReceipt.lines.map(l => ({ ...l }))
  );
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMarkReady = async () => {
    setLoading('ready');
    setError(null);
    try {
      await updateReceiptStatus(receipt.id, 'ready');
      setReceipt(prev => ({ ...prev, status: 'ready' }));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as ready');
    } finally {
      setLoading(null);
    }
  };

  const handleValidate = async () => {
    setLoading('validate');
    setError(null);
    try {
      const linesToUpdate = lines.map(l => ({
        id: l.id,
        received_qty: l.received_qty,
      }));
      await validateReceipt(receipt.id, linesToUpdate);
      setReceipt(prev => ({ ...prev, status: 'done' }));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate receipt');
    } finally {
      setLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this receipt?')) return;
    setLoading('cancel');
    setError(null);
    try {
      await updateReceiptStatus(receipt.id, 'canceled');
      setReceipt(prev => ({ ...prev, status: 'canceled' }));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel receipt');
    } finally {
      setLoading(null);
    }
  };

  const updateLineQty = (lineId: string, qty: number) => {
    setLines(prev => prev.map(l => 
      l.id === lineId ? { ...l, received_qty: qty } : l
    ));
  };

  const canMarkReady = receipt.status === 'draft';
  const canValidate = receipt.status === 'ready';
  const canCancel = receipt.status === 'draft' || receipt.status === 'waiting' || receipt.status === 'ready';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {error && (
        <div style={{
          padding: '12px 16px', borderRadius: 8,
          background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
          color: '#fca5a5', fontSize: 13,
        }}>
          {error}
        </div>
      )}

      {/* Header Card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30,41,59,0.8), rgba(15,23,42,0.9))',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 20,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f0f4ff', margin: 0 }}>
                {receipt.reference}
              </h1>
              <StatusBadge status={receipt.status} type="receipt" />
            </div>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
              From {receipt.supplier_name}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {canMarkReady && (
              <Button
                onClick={handleMarkReady}
                disabled={loading === 'ready'}
                style={{
                  background: 'linear-gradient(135deg, #2563eb, #1e40af)',
                  border: 'none', color: 'white', fontWeight: 600,
                }}
              >
                {loading === 'ready' ? <Loader2 size={14} className="animate-spin" style={{ marginRight: 6 }} /> : <Check size={14} style={{ marginRight: 6 }} />}
                Mark as Ready
              </Button>
            )}
            {canValidate && (
              <Button
                onClick={handleValidate}
                disabled={loading === 'validate'}
                style={{
                  background: 'linear-gradient(135deg, #16a34a, #15803d)',
                  border: 'none', color: 'white', fontWeight: 600,
                }}
              >
                {loading === 'validate' ? <Loader2 size={14} className="animate-spin" style={{ marginRight: 6 }} /> : <Check size={14} style={{ marginRight: 6 }} />}
                Validate Receipt
              </Button>
            )}
            {canCancel && (
              <Button
                onClick={handleCancel}
                disabled={loading === 'cancel'}
                variant="outline"
                style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#fca5a5' }}
              >
                {loading === 'cancel' ? <Loader2 size={14} className="animate-spin" style={{ marginRight: 6 }} /> : <X size={14} style={{ marginRight: 6 }} />}
                Cancel
              </Button>
            )}
          </div>
        </div>

        {/* Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Destination</div>
            <div style={{ fontSize: 14, color: '#e2e8f0', fontWeight: 500 }}>{receipt.destination_location_name}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{receipt.destination_warehouse_name}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Scheduled</div>
            <div style={{ fontSize: 14, color: '#e2e8f0' }}>
              {receipt.scheduled_date ? format(new Date(receipt.scheduled_date), 'MMM d, yyyy') : 'Not scheduled'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Created</div>
            <div style={{ fontSize: 14, color: '#e2e8f0' }}>
              {format(new Date(receipt.created_at), 'MMM d, yyyy')}
            </div>
            {receipt.created_by_name && (
              <div style={{ fontSize: 12, color: '#64748b' }}>{receipt.created_by_name}</div>
            )}
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Validated</div>
            <div style={{ fontSize: 14, color: '#e2e8f0' }}>
              {receipt.validated_at ? format(new Date(receipt.validated_at), 'MMM d, yyyy') : '—'}
            </div>
            {receipt.validated_by_name && (
              <div style={{ fontSize: 12, color: '#64748b' }}>{receipt.validated_by_name}</div>
            )}
          </div>
        </div>

        {receipt.notes && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Notes</div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>{receipt.notes}</div>
          </div>
        )}
      </div>

      {/* Line Items */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30,41,59,0.8), rgba(15,23,42,0.9))',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Package size={16} style={{ color: '#60a5fa' }} />
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f0f4ff', margin: 0 }}>
            Line Items ({lines.length})
          </h2>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ ...thStyle }}>Product</th>
                <th style={{ ...thStyle }}>SKU</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Expected</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Received</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>UOM</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Variance</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => {
                const variance = line.received_qty - line.expected_qty;
                const isOver = variance > 0;
                const isUnder = variance < 0;
                const isEditable = canValidate;

                return (
                  <tr key={line.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={tdStyle}>{line.product_name}</td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', color: '#60a5fa' }}>{line.product_sku}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 500 }}>{line.expected_qty}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      {isEditable ? (
                        <Input
                          type="number"
                          min={0}
                          value={line.received_qty}
                          onChange={(e) => updateLineQty(line.id, Math.max(0, parseInt(e.target.value) || 0))}
                          style={{
                            width: 80, textAlign: 'right',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                          }}
                        />
                      ) : (
                        <span style={{ fontWeight: 500 }}>{line.received_qty}</span>
                      )}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center', color: '#64748b' }}>{line.product_uom}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      {variance !== 0 ? (
                        <span style={{
                          color: isOver ? '#4ade80' : isUnder ? '#fca5a5' : '#e2e8f0',
                          fontWeight: 500,
                        }}>
                          {variance > 0 ? '+' : ''}{variance}
                        </span>
                      ) : (
                        <span style={{ color: '#64748b' }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
  padding: '14px 16px',
  fontSize: 13,
  color: '#e2e8f0',
};
