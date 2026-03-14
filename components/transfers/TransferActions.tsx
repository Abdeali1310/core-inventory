'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Loader2, Clock } from 'lucide-react';
import { validateTransfer, updateTransferStatus } from '@/lib/actions/transfers';

interface Props {
    transferId: string;
    currentStatus: string;
}

export default function TransferActions({ transferId, currentStatus }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState<string | null>(null);

    const handleMarkReady = async () => {
        setLoading('ready');
        try {
            await updateTransferStatus(transferId, 'ready');
            toast.success('Transfer marked as ready');
            // router.refresh();
        } catch (e: any) {
            toast.error(e.message || 'Failed');
        } finally {
            setLoading(null);
        }
    };

    const handleValidate = async () => {
        setLoading('validate');
        try {
            await validateTransfer(transferId);
            toast.success('Transfer validated — stock moved!');
            // router.refresh();
        } catch (e: any) {
            toast.error(e.message || 'Failed to validate');
        } finally {
            setLoading(null);
        }
    };

    const handleCancel = async () => {
        setLoading('cancel');
        try {
            await updateTransferStatus(transferId, 'canceled');
            toast.success('Transfer canceled');
            // router.refresh();
        } catch (e: any) {
            toast.error(e.message || 'Failed');
        } finally {
            setLoading(null);
        }
    };

    return (
        <div style={{ display: 'flex', gap: 10 }}>
            <button
                onClick={handleCancel}
                disabled={!!loading}
                style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 8,
                    background: 'rgba(248,113,113,0.1)',
                    border: '1px solid rgba(248,113,113,0.2)',
                    color: '#f87171', fontSize: 13, fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                }}
            >
                {loading === 'cancel'
                    ? <Loader2 size={14} className="animate-spin" />
                    : <XCircle size={14} />}
                Cancel
            </button>

            {currentStatus === 'draft' && (
                <button
                    onClick={handleMarkReady}
                    disabled={!!loading}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 16px', borderRadius: 8,
                        background: 'rgba(37,99,235,0.12)',
                        border: '1px solid rgba(37,99,235,0.25)',
                        color: '#60a5fa', fontSize: 13, fontWeight: 600,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.7 : 1,
                    }}
                >
                    {loading === 'ready'
                        ? <Loader2 size={14} className="animate-spin" />
                        : <Clock size={14} />}
                    Mark Ready
                </button>
            )}

            {currentStatus === 'ready' && (
                <button
                    onClick={handleValidate}
                    disabled={!!loading}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 18px', borderRadius: 8,
                        background: 'linear-gradient(135deg, #16a34a, #15803d)',
                        border: 'none', color: 'white', fontSize: 13, fontWeight: 600,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.7 : 1,
                        boxShadow: '0 0 20px rgba(22,163,74,0.25)',
                    }}
                >
                    {loading === 'validate'
                        ? <Loader2 size={14} className="animate-spin" />
                        : <CheckCircle size={14} />}
                    Validate Transfer
                </button>
            )}
        </div>
    );
}