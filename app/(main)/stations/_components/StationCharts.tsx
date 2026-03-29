'use client';

import { LineChart } from '@mantine/charts';
import { Paper, Skeleton, Stack, Title } from '@mantine/core';

import type { ChartDataPoint } from '../_lib/charts';

interface ChartConfig {
    title: string;
    dataKey: string;
    series: { name: string; label?: string; color: string }[];
}

const CHART_CONFIGS: ChartConfig[] = [
    {
        title: 'Temperature (°C)',
        dataKey: 'date',
        series: [{ name: 'temperature', color: 'red.6' }],
    },
    {
        title: 'Humidity (%)',
        dataKey: 'date',
        series: [{ name: 'humidity', color: 'blue.6' }],
    },
    {
        title: 'Pressure (hPa)',
        dataKey: 'date',
        series: [{ name: 'pressure', color: 'violet.6' }],
    },
    {
        title: 'Wind Direction (°)',
        dataKey: 'date',
        series: [{
            name: 'windDirection',
            color: 'teal.6',
        }],
    },
    {
        title: 'Wind Speed',
        dataKey: 'date',
        series: [
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
        ],
    },
    {
        title: 'Battery (V)',
        dataKey: 'date',
        series: [{ name: 'voltage', color: 'red.6' }],
    },
];

interface StationChartsProps {
    data: ChartDataPoint[];
    loading: boolean;
}

export function StationCharts({
    data,
    loading,
}: StationChartsProps) {
    return (
        <Stack gap="lg">
            { CHART_CONFIGS.map((config) => (
                <Paper
                    key={ config.title }
                    withBorder
                    p="md"
                    radius="md"
                >
                    <Title order={ 4 } mb="md">
                        { config.title }
                    </Title>
                    { loading
                        ? <Skeleton height={ 300 } radius="md" />
                        : (
                            <LineChart
                                h={ 300 }
                                data={ data }
                                dataKey={ config.dataKey }
                                series={ config.series }
                                curveType="natural"
                                withLegend
                                xAxisProps={ { tickMargin: 15 } }
                            />
                        ) }
                </Paper>
            )) }
        </Stack>
    );
}
