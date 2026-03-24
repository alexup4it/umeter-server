'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

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
    const flyToRef = useRef<((uid: number) => void) | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);

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

    const handleRegisterFlyTo = useCallback(
        (fn: (uid: number) => void) => {
            flyToRef.current = fn;
        },
        [],
    );

    const handleLocate = useCallback((uid: number) => {
        mapContainerRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
        });
        // Small delay to allow scroll to finish before flying
        setTimeout(() => {
            flyToRef.current?.(uid);
        }, 300);
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
                        onLocate={
                            station.lat != null && station.lng != null
                                ? handleLocate
                                : undefined
                        }
                    />
                )) }
            </SimpleGrid>

            <div ref={ mapContainerRef }>
                <StationsMapLoader
                    stations={ stations }
                    onRegisterFlyTo={ handleRegisterFlyTo }
                />
            </div>
        </>
    );
}
