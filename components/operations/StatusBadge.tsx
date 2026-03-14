'use client';

import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: string;
  type?: 'receipt' | 'delivery' | 'transfer' | 'adjustment';
}

const statusConfig = {
  receipt: {
    draft: { label: 'Draft', variant: 'secondary' as const },
    waiting: { label: 'Waiting', variant: 'outline' as const },
    ready: { label: 'Ready', variant: 'default' as const },
    done: { label: 'Done', variant: 'secondary' as const },
    canceled: { label: 'Canceled', variant: 'destructive' as const },
  },
  delivery: {
    draft: { label: 'Draft', variant: 'secondary' as const },
    waiting: { label: 'Waiting', variant: 'outline' as const },
    ready: { label: 'Ready', variant: 'default' as const },
    done: { label: 'Done', variant: 'secondary' as const },
    canceled: { label: 'Canceled', variant: 'destructive' as const },
  },
  transfer: {
    draft: { label: 'Draft', variant: 'secondary' as const },
    waiting: { label: 'Waiting', variant: 'outline' as const },
    in_transit: { label: 'In Transit', variant: 'default' as const },
    done: { label: 'Done', variant: 'secondary' as const },
    canceled: { label: 'Canceled', variant: 'destructive' as const },
  },
  adjustment: {
    draft: { label: 'Draft', variant: 'secondary' as const },
    pending: { label: 'Pending', variant: 'outline' as const },
    approved: { label: 'Approved', variant: 'default' as const },
    done: { label: 'Done', variant: 'secondary' as const },
    rejected: { label: 'Rejected', variant: 'destructive' as const },
  },
};

export function StatusBadge({ status, type = 'receipt' }: StatusBadgeProps) {
  const config = statusConfig[type];
  const statusInfo = config[status as keyof typeof config];

  if (!statusInfo) {
    return <Badge variant="secondary">{status}</Badge>;
  }

  return (
    <Badge variant={statusInfo.variant}>
      {statusInfo.label}
    </Badge>
  );
}
