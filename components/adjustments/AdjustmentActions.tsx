'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { validateAdjustment, cancelAdjustment } from '@/lib/actions/adjustments';

interface Props {
    adjustmentId: string;
}

export default function AdjustmentActions({ adjustmentId }: Props) {
    const router = useRouter();
    const [validating, setValidating] = useState(false);
    const [canceling, setCanceling] = useState(false);

    const handleValidate = async () => {
        setValidating(true);
        try {
            await validateAdjustment(adjustmentId);
            toast.success('Stock adjusted successfully');
            router.refresh();
        } catch (e: any) {
            toast.error(e.message || 'Failed to validate');
        } finally {
            setValidating(false);
        }
    };

    const handleCancel = async () => {
        setCanceling(true);
        try {
            await cancelAdjustment(adjustmentId);
            toast.success('Adjustment canceled');
            router.refresh();
        } catch (e: any) {
            toast.error(e.message || 'Failed to cancel');
        } finally {
            setCanceling(false);
        }
    };

    return (
        <div style={{ display: 'flex', gap: 10 }}>
            <button
                onClick={handleCancel}
                disabled={canceling}
                style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 18px', borderRadius: 8,
                    background: 'rgba(248,113,113,0.1)',
                    border: '1px solid rgba(248,113,113,0.2)',
                    color: '#f87171', fontSize: 13, fontWeight: 600,
                    cursor: canceling ? 'not-allowed' : 'pointer',
                    opacity: canceling ? 0.7 : 1,
                }}
            >
                {canceling ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                Cancel
            </button>
            <button
                onClick={handleValidate}
                disabled={validating}
                style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 20px', borderRadius: 8,
                    background: 'linear-gradient(135deg, #16a34a, #15803d)',
                    border: 'none', color: 'white', fontSize: 13, fontWeight: 600,
                    cursor: validating ? 'not-allowed' : 'pointer',
                    opacity: validating ? 0.7 : 1,
                    boxShadow: '0 0 20px rgba(22,163,74,0.25)',
                }}
            >
                {validating ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                Validate Adjustment
            </button>
        </div>
    );
}