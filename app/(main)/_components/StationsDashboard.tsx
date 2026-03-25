'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { SimpleGrid, Text } from '@mantine/core';

import type { StationSummary } from '@/lib/types/station';

import { BulkActions } from './BulkActions';
import { StationCard } from './StationCard';
import { StationsMapLoader } from './StationsMapLoader';

const POLL_INTERVAL_MS = 30_000;

export function StationsDashboard() {
    const [stations, setStations] = useState<StationSummary[]>([]);
    const [selectedUids, setSelectedUids] = useState<number[]>([]);
    const flyToRef = useRef<((uid: number) => void) | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);

    const fetchStations = useCallback(async (signal?: AbortSignal) => {
        try {
            const response = await fetch(
                '/api/stations',
                { signal },
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
                'Failed to fetch stations',
                fetchError,
            );
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        const { signal } = controller;

        const poll = () => void fetchStations(signal);

        const timeoutId = setTimeout(poll, 0);
        const intervalId = setInterval(poll, POLL_INTERVAL_MS);

        return () => {
            controller.abort();
            clearTimeout(timeoutId);
            clearInterval(intervalId);
        };
    }, [fetchStations]);

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

    const handleToggleSelect = useCallback((uid: number) => {
        setSelectedUids((prev) =>
            prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]);
    }, []);

    const handleClearSelection = useCallback(() => {
        setSelectedUids([]);
    }, []);

    const handleSelectAll = useCallback(() => {
        setSelectedUids(stations.map((station) => station.uid));
    }, [stations]);

    const handleRefresh = useCallback(() => {
        void fetchStations();
    }, [fetchStations]);

    if (stations.length === 0) {
        return (
            <Text c="dimmed">
                No stations seen in the last 7 days.
            </Text>
        );
    }

    return (
        <>
            <BulkActions
                selectedUids={ selectedUids }
                totalStations={ stations.length }
                onClearSelection={ handleClearSelection }
                onSelectAll={ handleSelectAll }
                onRefresh={ handleRefresh }
            />

            <SimpleGrid
                cols={ { base: 1, sm: 2, lg: 3 } }
                spacing="md"
            >
                { stations.map((station) => (
                    <StationCard
                        key={ station.uid }
                        station={ station }
                        selected={ selectedUids.includes(station.uid) }
                        onLocate={
                            station.lat != null && station.lng != null
                                ? handleLocate
                                : undefined
                        }
                        onToggleSelect={ handleToggleSelect }
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
