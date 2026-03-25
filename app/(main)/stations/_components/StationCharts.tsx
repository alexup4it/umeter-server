'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { LineChart } from '@mantine/charts';
import { Box, Paper, Stack, Title } from '@mantine/core';
import { DatePickerInput, type DatesRangeValue } from '@mantine/dates';

import type { SensorRecord } from '@/lib/types/station';

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const POLL_INTERVAL_MS = 30_000;

const SHORT_MONTHS = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
] as const;

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const month = SHORT_MONTHS[date.getMonth()];
    const day = date.getDate();
    const hours = date.getHours()
        .toString()
        .padStart(2, '0');
    const minutes = date.getMinutes()
        .toString()
        .padStart(2, '0');

    return `${month} ${day} ${hours}:${minutes}`;
}

function startOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);

    return result;
}

function endOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);

    return result;
}

/**
 * Checks whether a string is a valid `YYYY-MM-DD` date.
 */
function isValidDateString(value: string): boolean {
    const date = new Date(value);

    return !Number.isNaN(date.getTime());
}

function buildRecordsUrl(
    uid: string,
    from: Date,
    to: Date,
    after?: string,
): string {
    const url = new URL(
        `/api/stations/${uid}/records`,
        window.location.origin,
    );
    url.searchParams.set('from', from.toISOString());
    url.searchParams.set('to', to.toISOString());

    if (after) {
        url.searchParams.set('after', after);
    }

    return url.toString();
}

/**
 * Reads `from` and `to` URL search params.
 *
 * - No `from` → default to 1 week ago
 * - No `to`   → live mode (sliding window, auto-refresh)
 * - Both set  → historical mode (fixed range, no polling)
 *
 * Returns raw date-strings (`YYYY-MM-DD`) that can be fed
 * straight into Mantine's DatePickerInput.
 */
function useDateRangeParams() {
    const searchParams = useSearchParams();

    const rawFrom = searchParams.get('from');
    const rawTo = searchParams.get('to');

    const fromParam = rawFrom && isValidDateString(rawFrom)
        ? rawFrom
        : null;
    const toParam = rawTo && isValidDateString(rawTo)
        ? rawTo
        : null;

    const isLive = !toParam;

    return { fromParam, toParam, isLive };
}

/**
 * Converts the (possibly null) URL date-strings into a
 * concrete `[Date, Date]` range suitable for the API.
 *
 * `Date.now()` is called here — keep this out of render.
 */
function computeEffectiveRange(
    fromParam: string | null,
    toParam: string | null,
): [Date, Date] {
    const effectiveFrom = fromParam
        ? startOfDay(new Date(fromParam))
        : new Date(Date.now() - ONE_WEEK_MS);
    const effectiveTo = toParam
        ? endOfDay(new Date(toParam))
        : new Date();

    return [effectiveFrom, effectiveTo];
}

interface StationChartsProps {
    uid: string;
    records: SensorRecord[];
}

export function StationCharts({
    uid,
    records: initRecords,
}: StationChartsProps) {
    const router = useRouter();
    const {
        fromParam,
        toParam,
        isLive,
    } = useDateRangeParams();

    const [records, setRecords] = useState(initRecords);
    const recordsRef = useRef(records);

    useEffect(() => {
        recordsRef.current = records;
    }, [records]);

    // Keep refs for polling access
    const isLiveRef = useRef(isLive);
    const fromParamRef = useRef(fromParam);

    useEffect(() => {
        isLiveRef.current = isLive;
        fromParamRef.current = fromParam;
    }, [isLive, fromParam]);

    /**
     * The date picker value: `[from, to]`.
     * Mantine v8 expects `string | null` per slot.
     * In live mode (no `to` param), the second slot is
     * `null` to indicate an open-ended range.
     */
    const pickerValue: DatesRangeValue = [
        fromParam,
        toParam,
    ];

    /**
     * Incremental poll: fetches only records newer than the
     * last known timestamp and appends them. Also trims
     * records that have fallen outside the sliding window.
     */
    const fetchNewRecords = useCallback(
        async (signal?: AbortSignal) => {
            if (!isLiveRef.current) {
                return;
            }

            const [from, to] = computeEffectiveRange(
                fromParamRef.current,
                null,
            );
            const current = recordsRef.current;
            const lastTs = current.length > 0
                ? current[current.length - 1].ts
                : undefined;

            const response = await fetch(
                buildRecordsUrl(uid, from, to, lastTs),
                { signal },
            );

            if (!response.ok) {
                return;
            }

            const data = await response.json() as
                { records: SensorRecord[] };

            if (data.records.length === 0) {
                return;
            }

            setRecords((prev) => {
                const merged = [...prev, ...data.records];
                const fromMs = from.getTime();
                const firstValidIdx = merged.findIndex(
                    (r) => new Date(r.ts).getTime() >= fromMs,
                );

                return firstValidIdx > 0
                    ? merged.slice(firstValidIdx)
                    : merged;
            });
        },
        [uid],
    );

    // Initial full load when range params change
    useEffect(() => {
        const controller = new AbortController();
        const [from, to] = computeEffectiveRange(
            fromParam,
            toParam,
        );

        const load = async () => {
            const response = await fetch(
                buildRecordsUrl(uid, from, to),
                { signal: controller.signal },
            );
            if (response.ok) {
                const data = await response.json() as
                    { records: SensorRecord[] };

                return data.records;
            }

            return null;
        };

        void load()
            .then((result) => {
                if (result) {
                    setRecords(result);
                }
            })
            .catch((fetchError: unknown) => {
                if (fetchError instanceof DOMException
                    && fetchError.name === 'AbortError') {
                    return;
                }
                console.error(
                    'Failed to fetch chart data',
                    fetchError,
                );
            });

        return () => {
            controller.abort();
        };
    }, [fromParam, toParam, uid]);

    // Polling only in live mode
    useEffect(() => {
        if (!isLive) {
            return;
        }

        const controller = new AbortController();

        const poll = async () => {
            try {
                await fetchNewRecords(controller.signal);
            } catch (fetchError: unknown) {
                if (fetchError instanceof DOMException
                    && fetchError.name === 'AbortError') {
                    return;
                }
                console.error(
                    'Failed to poll chart data',
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
    }, [isLive, fetchNewRecords]);

    /**
     * Sync the selected date range to URL search params.
     */
    const updateUrl = useCallback(
        (from: string | null, to: string | null) => {
            const params = new URLSearchParams(
                window.location.search,
            );

            if (from) {
                params.set('from', from);
            } else {
                params.delete('from');
            }

            if (to) {
                params.set('to', to);
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

    const handleDateChange = useCallback(
        (value: DatesRangeValue) => {
            const [rawFrom, rawTo] = value;
            const from = typeof rawFrom === 'string'
                ? rawFrom
                : null;
            const to = typeof rawTo === 'string'
                ? rawTo
                : null;

            if (from && to) {
                // Full range selected → historical mode
                updateUrl(from, to);
            } else if (!from && !to) {
                // Cleared → back to live mode (defaults)
                updateUrl(null, null);
            }
            // When only `from` is set (first click), do
            // nothing — wait for the second click.
        },
        [updateUrl],
    );

    const tempChartData = records.map((r) => ({
        date: formatDate(r.ts),
        temperature: r.temperature ?? 0,
    }));

    const humChartData = records.map((r) => ({
        date: formatDate(r.ts),
        humidity: r.humidity ?? 0,
    }));

    const pressureChartData = records.map((r) => ({
        date: formatDate(r.ts),
        pressure: r.pressure ?? 0,
    }));

    const windDirectionChartData = records.map((r) => ({
        date: formatDate(r.ts),
        windDirection: r.windDirection ?? 0,
    }));

    const windSpeedChartData = records.map((r) => ({
        date: formatDate(r.ts),
        windSpeedAvg: r.windSpeedAvg ?? 0,
        windSpeedMin: r.windSpeedMin ?? 0,
        windSpeedMax: r.windSpeedMax ?? 0,
    }));

    const batteryChartData = records.map((r) => ({
        date: formatDate(r.ts),
        voltage: r.voltage ?? 0,
    }));

    return (
        <Stack gap="lg" mt="lg">
            <Box maw={ 300 }>
                <DatePickerInput
                    type="range"
                    label="Date Range"
                    placeholder="Pick dates range"
                    allowSingleDateInRange
                    clearable
                    value={ pickerValue }
                    onChange={ handleDateChange }
                />
            </Box>

            <Paper withBorder p="md" radius="md">
                <Title order={ 4 } mb="md">
                    Temperature (°C)
                </Title>
                <LineChart
                    h={ 300 }
                    data={ tempChartData }
                    dataKey="date"
                    series={ [{
                        name: 'temperature',
                        color: 'red.6',
                    }] }
                    curveType="natural"
                    withLegend
                    xAxisProps={ { tickMargin: 15 } }
                />
            </Paper>

            <Paper withBorder p="md" radius="md">
                <Title order={ 4 } mb="md">
                    Humidity (%)
                </Title>
                <LineChart
                    h={ 300 }
                    data={ humChartData }
                    dataKey="date"
                    series={ [{
                        name: 'humidity',
                        color: 'blue.6',
                    }] }
                    curveType="natural"
                    withLegend
                    xAxisProps={ { tickMargin: 15 } }
                />
            </Paper>

            <Paper withBorder p="md" radius="md">
                <Title order={ 4 } mb="md">
                    Pressure (hPa)
                </Title>
                <LineChart
                    h={ 300 }
                    data={ pressureChartData }
                    dataKey="date"
                    series={ [{
                        name: 'pressure',
                        color: 'violet.6',
                    }] }
                    curveType="natural"
                    withLegend
                    xAxisProps={ { tickMargin: 15 } }
                />
            </Paper>

            <Paper withBorder p="md" radius="md">
                <Title order={ 4 } mb="md">
                    Wind Direction (°)
                </Title>
                <LineChart
                    h={ 300 }
                    data={ windDirectionChartData }
                    dataKey="date"
                    series={ [{
                        name: 'windDirection',
                        color: 'teal.6',
                    }] }
                    curveType="natural"
                    withLegend
                    xAxisProps={ { tickMargin: 15 } }
                />
            </Paper>

            <Paper withBorder p="md" radius="md">
                <Title order={ 4 } mb="md">
                    Wind Speed
                </Title>
                <LineChart
                    h={ 300 }
                    data={ windSpeedChartData }
                    dataKey="date"
                    series={ [
                        {
                            name: 'windSpeedMin',
                            label: 'Min',
                            color: 'orange.3',
                        },
                        {
                            name: 'windSpeedAvg',
                            label: 'Avg',
                            color: 'orange.6',
                        },
                        {
                            name: 'windSpeedMax',
                            label: 'Max',
                            color: 'red.6',
                        },
                    ] }
                    curveType="natural"
                    withLegend
                    xAxisProps={ { tickMargin: 15 } }
                />
            </Paper>

            <Paper withBorder p="md" radius="md">
                <Title order={ 4 } mb="md">
                    Battery
                </Title>
                <LineChart
                    h={ 300 }
                    data={ batteryChartData }
                    dataKey="voltage"
                    series={ [{
                        name: 'voltage',
                        color: 'red.6',
                    }] }
                    curveType="natural"
                    withLegend
                    xAxisProps={ { tickMargin: 15 } }
                />
            </Paper>
        </Stack>
    );
}
