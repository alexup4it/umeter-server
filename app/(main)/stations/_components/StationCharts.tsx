'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { LineChart } from '@mantine/charts';
import { Box, Paper, Stack, Title } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';

import type { WindSpeedPoint, SensorPoint } from '@/lib/types/station';

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const POLL_INTERVAL_MS = 30_000;

function computeDefaultRange(): [Date, Date] {
    const now = Date.now();

    return [new Date(now - ONE_WEEK_MS), new Date(now)];
}

const INITIAL_RANGE: [null, null] = [null, null];

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
    const month = SHORT_MONTHS[date.getUTCMonth()];
    const day = date.getUTCDate();
    const hours = date.getUTCHours()
        .toString()
        .padStart(2, '0');
    const minutes = date.getUTCMinutes()
        .toString()
        .padStart(2, '0');

    return `${month} ${day} ${hours}:${minutes}`;
}

interface ChartData {
    temperature: SensorPoint[];
    humidity: SensorPoint[];
    windDirection: SensorPoint[];
    windSpeed: WindSpeedPoint[];
}

interface StationChartsProps {
    uid: string;
    temperature: SensorPoint[];
    humidity: SensorPoint[];
    windDirection: SensorPoint[];
    windSpeed: WindSpeedPoint[];
}

export function StationCharts({
    uid,
    temperature: initTemp,
    humidity: initHum,
    windDirection: initWindDirection,
    windSpeed: initWindSpeed,
}: StationChartsProps) {
    const [dateRange, setDateRange] = useState<
        [Date | null, Date | null]
    >(INITIAL_RANGE);

    const [temperature, setTemperature] = useState(initTemp);
    const [humidity, setHumidity] = useState(initHum);
    const [windDirection, setWindDirection] = useState(initWindDirection);
    const [windSpeed, setWindSpeed] = useState(initWindSpeed);

    const dateRangeRef = useRef(dateRange);

    useEffect(() => {
        dateRangeRef.current = dateRange;
    }, [dateRange]);

    // Set default date range on client only to avoid hydration mismatch
    useEffect(() => {
        const id = requestAnimationFrame(() => {
            setDateRange(computeDefaultRange());
        });

        return () => {
            cancelAnimationFrame(id);
        };
    }, []);

    const fetchData = useCallback(
        async (
            from: Date,
            to: Date,
            signal?: AbortSignal,
        ) => {
            const url = new URL(
                `/api/stations/${uid}`,
                window.location.origin,
            );
            url.searchParams.set('from', from.toISOString());
            url.searchParams.set('to', to.toISOString());

            const response = await fetch(
                url.toString(),
                { signal },
            );
            if (response.ok) {
                const data = await response.json() as
                    ChartData;
                setTemperature(data.temperature);
                setHumidity(data.humidity);
                setWindDirection(data.windDirection);
                setWindSpeed(data.windSpeed);
            }
        },
        [uid],
    );

    const handleDateChange = async (
        val: [Date | null, Date | null],
    ) => {
        setDateRange(val);
        const [from, to] = val;

        if (from && to) {
            try {
                await fetchData(from, to);
            } catch (fetchError: unknown) {
                console.error(
                    'Failed to fetch data',
                    fetchError,
                );
            }
        }
    };

    useEffect(() => {
        const controller = new AbortController();

        const poll = async () => {
            const [from, to] = dateRangeRef.current;
            if (!from || !to) {
                return;
            }

            try {
                await fetchData(
                    from,
                    to,
                    controller.signal,
                );
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
    }, [fetchData]);

    const tempChartData = temperature.map((pt) => ({
        date: formatDate(pt.ts),
        temperature: pt.value,
    }));

    const humChartData = humidity.map((pt) => ({
        date: formatDate(pt.ts),
        humidity: pt.value,
    }));

    const windDirectionChartData = windDirection.map((pt) => ({
        date: formatDate(pt.ts),
        windDirection: pt.value,
    }));

    const windSpeedChartData = windSpeed.map((pt) => ({
        date: formatDate(pt.ts),
        windSpeedAvg: pt.windSpeedAvg ?? 0,
        windSpeedMin: pt.windSpeedMin ?? 0,
        windSpeedMax: pt.windSpeedMax ?? 0,
    }));

    return (
        <Stack gap="lg" mt="lg">
            <Box maw={ 300 }>
                <DatePickerInput
                    type="range"
                    label="Date Range"
                    placeholder="Pick dates range"
                    value={ dateRange }
                    clearable
                    onChange={ (val) => {
                        void handleDateChange(
                            val as [Date | null, Date | null],
                        );
                    } }
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
                    series={ [{
                        name: 'windSpeedAvg',
                        color: 'orange.6',
                    }] }
                    curveType="natural"
                    withLegend
                    xAxisProps={ { tickMargin: 15 } }
                />
            </Paper>
        </Stack>
    );
}
