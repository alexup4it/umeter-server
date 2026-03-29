'use client';

import { useCallback, useMemo } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { Skeleton, Stack } from '@mantine/core';
import type { DatesRangeValue } from '@mantine/dates';
import moment from 'moment';
import useSWR from 'swr';

import type { SensorRecord, StationDetail } from '@/lib/types/station';

import { toChartData } from '../_lib/charts';
import {
    buildRecordsUrl,
    computeEffectiveRange,
    recordsFetcher,
} from '../_lib/records';

import { RangePicker } from './RangePicker';
import { StationCharts } from './StationCharts';
import { StationConfigPanel } from './StationConfigPanel';
import { StationDataTable } from './StationDataTable';
import { StationFirmwarePanel } from './StationFirmwarePanel';

const POLL_INTERVAL_MS = 30_000;

async function detailFetcher(url: string): Promise<StationDetail> {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error('Failed to fetch station detail');
    }

    return await response.json() as Promise<StationDetail>;
}

interface StationDetailViewProps {
    uid: string;
}

export function StationDetailView({
    uid,
}: StationDetailViewProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Read date range from URL search params
    const rawFrom = searchParams.get('from');
    const rawTo = searchParams.get('to');

    const fromParam = rawFrom && moment(rawFrom).isValid()
        ? rawFrom
        : null;
    const toParam = rawTo && moment(rawTo).isValid()
        ? rawTo
        : null;

    const isLive = !toParam;

    // Picker value derived from URL params
    const pickerValue: DatesRangeValue = [
        fromParam ? moment(fromParam).toDate() : null,
        toParam ? moment(toParam).toDate() : null,
    ];

    // Station detail (no records) — polls in live mode
    const {
        data: detail,
        isLoading: detailLoading,
        mutate: mutateDetail,
    } = useSWR(
        `/api/stations/${uid}`,
        detailFetcher,
        { refreshInterval: isLive ? POLL_INTERVAL_MS : 0 },
    );

    // Records — separate endpoint with date range
    const [effectiveFrom, effectiveTo] = useMemo(
        () => computeEffectiveRange(fromParam, toParam),
        [fromParam, toParam],
    );

    const recordsUrl = useMemo(
        () => buildRecordsUrl(uid, effectiveFrom, effectiveTo),
        [uid, effectiveFrom, effectiveTo],
    );

    const {
        data: records,
        isLoading: recordsLoading,
    } = useSWR<SensorRecord[]>(
        recordsUrl,
        recordsFetcher,
        { refreshInterval: isLive ? POLL_INTERVAL_MS : 0 },
    );

    const chartData = useMemo(
        () => toChartData(records ?? []),
        [records],
    );

    // Date range change handler
    const handleRangeChange = useCallback(
        (value: DatesRangeValue) => {
            const [rawFromDate, rawToDate] = value;

            const params = new URLSearchParams(
                window.location.search,
            );

            if (rawFromDate) {
                params.set(
                    'from',
                    moment(rawFromDate).format('YYYY-MM-DD'),
                );
            } else {
                params.delete('from');
            }

            if (rawToDate) {
                params.set(
                    'to',
                    moment(rawToDate).format('YYYY-MM-DD'),
                );
            } else {
                params.delete('to');
            }

            const query = params.toString();
            const path = query
                ? `${window.location.pathname}?${query}`
                : window.location.pathname;

            router.replace(path, { scroll: false });
        },
        [router],
    );

    const handleUpdated = useCallback(() => {
        void mutateDetail();
    }, [mutateDetail]);

    return (
        <Stack gap="xl">
            <RangePicker
                value={ pickerValue }
                onRangeChange={ handleRangeChange }
            />

            <StationCharts
                data={ chartData }
                loading={ recordsLoading }
            />

            { detailLoading
                ? (
                    <>
                        <Skeleton height={ 320 } radius="md" />
                        <Skeleton height={ 200 } radius="md" />
                    </>
                )
                : detail && (
                    <>
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
                    </>
                ) }

            <StationDataTable
                detail={ detail }
                loading={ detailLoading }
            />
        </Stack>
    );
}
