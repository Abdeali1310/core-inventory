import { Suspense } from 'react';
import MoveHistoryClient from '@/components/move-history/MoveHistoryClient';
import { getStockLedger } from '@/lib/actions/ledger';
import { getLocations } from '@/lib/actions/locations';

interface PageProps {
    searchParams: Promise<{
        search?: string;
        type?: string;
        location_id?: string;
        date_from?: string;
        date_to?: string;
    }>;
}

async function MoveHistoryContent({ searchParams }: PageProps) {
    const params = await searchParams;

    const [entries, locations] = await Promise.all([
        getStockLedger({
            search: params.search,
            movement_type: params.type,
            location_id: params.location_id,
            date_from: params.date_from,
            date_to: params.date_to,
            limit: 100,
        }),
        getLocations(),
    ]);

    return (
        <MoveHistoryClient
            initialEntries={entries}
            locations={locations}
            initialFilters={{
                search: params.search ?? '',
                type: params.type ?? 'all',
                location_id: params.location_id ?? 'all',
                date_from: params.date_from ?? '',
                date_to: params.date_to ?? '',
            }}
        />
    );
}

export default async function MoveHistoryPage({ searchParams }: PageProps) {
    return (
        <div style={{ padding: '24px', maxWidth: 1300, margin: '0 auto' }}>
            <Suspense fallback={
                <div style={{ color: '#64748b', padding: 48, textAlign: 'center' }}>
                    Loading move history...
                </div>
            }>
                <MoveHistoryContent searchParams={searchParams} />
            </Suspense>
        </div>
    );
}