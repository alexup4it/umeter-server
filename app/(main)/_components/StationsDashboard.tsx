'use client';

import { useEffect, useState } from 'react';

import { SimpleGrid, Text } from '@mantine/core';

import type { StationSummary } from '@/lib/types/station';

import { StationCard } from './StationCard';
import { StationsMapLoader } from './StationsMapLoader';

const POLL_INTERVAL_MS = 30_000;

interface StationsDashboardProps {
    initialStations: StationSummary[];
}

export function StationsDashboard({
    initialStations,
}: StationsDashboardProps) {
    const [stations, setStations] = useState(initialStations);

    useEffect(() => {
        const controller = new AbortController();

        const poll = async () => {
            try {
                const response = await fetch(
                    '/api/stations',
                    { signal: controller.signal },
                );
                if (response.ok) {
                    const data = await response.json() as
                        StationSummary[];
                    setStations(data);
                }
            } catch (fetchError: unknown) {
                if (fetchError instanceof DOMException
                    && fetchError.name === 'AbortError') {
                    return;
                }
                console.error(
                    'Failed to poll stations',
                    fetchError,
                );
            }
        };

        const intervalId = setInterval(
            () => void poll(),
            POLL_INTERVAL_MS,
        );

        return () => {
            controller.abort();
            clearInterval(intervalId);
        };
    }, []);

    if (stations.length === 0) {
        return (
            <Text c="dimmed">
                No stations seen in the last 7 days.
            </Text>
        );
    }

    return (
        <>
            <SimpleGrid
                cols={ { base: 1, sm: 2, lg: 3 } }
                spacing="md"
            >
                { stations.map((station) => (
                    <StationCard
                        key={ station.uid }
                        station={ station }
                    />
                )) }
            </SimpleGrid>

            <StationsMapLoader stations={ stations } />
        </>
    );
}
