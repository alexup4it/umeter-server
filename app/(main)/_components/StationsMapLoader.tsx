'use client';

import dynamic from 'next/dynamic';

import { Loader, Center } from '@mantine/core';

import type { StationSummary } from '@/lib/types/station';

// eslint-disable-next-line @typescript-eslint/naming-convention
const StationsMapLeaflet = dynamic(
    () => import('./StationsMap'),
    {
        ssr: false,
        loading: () => (
            <Center h={ 500 }>
                <Loader size="lg" />
            </Center>
        ),
    },
);

export function StationsMapLoader({
    stations,
}: {
    stations: StationSummary[];
}) {
    return <StationsMapLeaflet stations={ stations } />;
}
