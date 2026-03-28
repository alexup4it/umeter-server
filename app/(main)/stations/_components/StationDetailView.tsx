'use client';

import { useCallback, useEffect, useState } from 'react';

import { Loader, Center, Stack } from '@mantine/core';

import type { StationDetail } from '@/lib/types/station';

import { StationCharts } from './StationCharts';
import { StationConfigPanel } from './StationConfigPanel';
import { StationDataTable } from './StationDataTable';
import { StationFirmwarePanel } from './StationFirmwarePanel';

const POLL_INTERVAL_MS = 30_000;

interface StationDetailViewProps {
    uid: string;
}

export function StationDetailView({
    uid,
}: StationDetailViewProps) {
    const [detail, setDetail] = useState<StationDetail | null>(null);

    const fetchDetail = useCallback(
        async (signal?: AbortSignal) => {
            try {
                const response = await fetch(
                    `/api/stations/${uid}`,
                    { signal },
                );
                if (response.ok) {
                    const data = await response.json() as
                        StationDetail;
                    setDetail(data);
                }
            } catch (fetchError: unknown) {
                if (fetchError instanceof DOMException
                    && fetchError.name === 'AbortError') {
                    return;
                }
                console.error(
                    'Failed to poll station detail',
                    fetchError,
                );
            }
        },
        [uid],
    );

    useEffect(() => {
        const controller = new AbortController();
        const { signal } = controller;

        const poll = () => void fetchDetail(signal);

        const timeoutId = setTimeout(poll, 0);
        const intervalId = setInterval(poll, POLL_INTERVAL_MS);

        return () => {
            controller.abort();
            clearTimeout(timeoutId);
            clearInterval(intervalId);
        };
    }, [fetchDetail]);

    const handleUpdated = useCallback(() => {
        void fetchDetail();
    }, [fetchDetail]);

    if (!detail) {
        return (
            <Center py="xl">
                <Loader />
            </Center>
        );
    }

    return (
        <Stack gap="xl">
            <StationCharts
                uid={ uid }
                records={ detail.records }
            />

            <StationConfigPanel
                uid={ Number(uid) }
                config={ detail.config }
                pendingConfig={ detail.pendingConfig }
                onUpdated={ handleUpdated }
            />

            <StationFirmwarePanel
                uid={ Number(uid) }
                pendingFirmware={ detail.pendingFirmware }
                onUpdated={ handleUpdated }
            />

            <StationDataTable detail={ detail } />
        </Stack>
    );
}
