'use client';

import { useCallback, useEffect, useState } from 'react';

import { Stack } from '@mantine/core';

import type { StationDetail } from '@/lib/types/station';

import { StationCharts } from './StationCharts';
import { StationConfigPanel } from './StationConfigPanel';
import { StationDataTable } from './StationDataTable';
import { StationFirmwarePanel } from './StationFirmwarePanel';

const POLL_INTERVAL_MS = 30_000;

interface StationDetailViewProps {
    uid: string;
    initialDetail: StationDetail;
}

export function StationDetailView({
    uid,
    initialDetail,
}: StationDetailViewProps) {
    const [detail, setDetail] = useState(initialDetail);

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

        const intervalId = setInterval(
            () => void fetchDetail(controller.signal),
            POLL_INTERVAL_MS,
        );

        return () => {
            controller.abort();
            clearInterval(intervalId);
        };
    }, [fetchDetail]);

    const handleUpdated = useCallback(() => {
        void fetchDetail();
    }, [fetchDetail]);

    return (
        <Stack gap="xl">
            <StationCharts
                uid={ uid }
                records={ detail.records }
            />

            <StationConfigPanel
                uid={ Number(uid) }
                info={ detail.info }
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
