'use client';

import { useCallback, useEffect, useState } from 'react';

import type { StationDetail } from '@/lib/types/station';

import { StationCharts } from './StationCharts';
import { StationDataTable } from './StationDataTable';

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

    return (
        <>
            <StationCharts
                uid={ uid }
                records={ detail.records }
            />

            <StationDataTable detail={ detail } />
        </>
    );
}
