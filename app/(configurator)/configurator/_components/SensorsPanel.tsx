'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
    ActionIcon,
    Group,
    Loader,
    NumberInput,
    Paper,
    Stack,
    Switch,
    Text,
    Title,
    Tooltip,
} from '@mantine/core';

import {
    type ProtocolResponse,
    type SensorParamName,
    PARAM_KEY_MAP,
    SENSOR_PARAMS,
} from '../_lib/types';

const DEFAULT_INTERVAL = 10;

interface SensorData {
    bat: number | null;
    temp: number | null;
    hum: number | null;
    pressure: number | null;
    windDirection: number | null;
    windSpeed: number | null;
}

interface SensorsPanelProps {
    connected: boolean;
    onFetchParam: (param: SensorParamName) => Promise<ProtocolResponse>;
}

function formatMilliValue(
    raw: number | null,
    decimals: number,
): string | null {
    if (raw === null) {
        return null;
    }

    return (raw / 1000).toFixed(decimals);
}

function formatVoltage(raw: number | null): string | null {
    if (raw === null) {
        return null;
    }

    return `${(raw / 1000).toFixed(2)} V`;
}

interface SensorRowProps {
    label: string;
    value: string | null;
    suffix?: string;
}

function SensorRow({ label, value, suffix = '' }: SensorRowProps) {
    return (
        <Group justify="space-between" gap="xs">
            <Text size="xs" c="dimmed">
                { label }
            </Text>
            <Text size="xs" ff="monospace" fw={ 500 }>
                { value !== null
                    ? `${value}${suffix}`
                    : '\u2014' }
            </Text>
        </Group>
    );
}

export function SensorsPanel({
    connected,
    onFetchParam,
}: SensorsPanelProps) {
    const [data, setData] = useState<SensorData>({
        bat: null,
        temp: null,
        hum: null,
        pressure: null,
        windDirection: null,
        windSpeed: null,
    });
    const [loading, setLoading] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [interval, setPollingInterval] = useState(DEFAULT_INTERVAL);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(
        null,
    );

    const fetchAll = useCallback(async () => {
        setLoading(true);

        try {
            const result: Partial<SensorData> = {};

            for (const param of SENSOR_PARAMS) {
                const response = await onFetchParam(param);
                if (response.status === 'ok') {
                    const key = PARAM_KEY_MAP[param];
                    const value = response[param];

                    if (typeof value === 'number') {
                        (result as Record<string, number>)[key] =
                            value;
                    }
                }
            }

            setData((prev) => ({ ...prev, ...result }));
        } catch {
            // Silently fail
        } finally {
            setLoading(false);
        }
    }, [onFetchParam]);

    // Auto-refresh interval
    useEffect(() => {
        if (autoRefresh && connected) {
            void fetchAll();
            intervalRef.current = setInterval(
                () => {
                    void fetchAll();
                },
                interval * 1000,
            );
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [autoRefresh, connected, interval, fetchAll]);

    // Stop auto-refresh on disconnect
    useEffect(() => {
        if (!connected) {
            setAutoRefresh(false);
            setData({
                bat: null,
                temp: null,
                hum: null,
                pressure: null,
                windDirection: null,
                windSpeed: null,
            });
        }
    }, [connected]);

    return (
        <Paper p="md" withBorder>
            <Stack gap="sm">
                <Group justify="space-between">
                    <Group gap="xs">
                        <Title order={ 5 }>Sensors</Title>
                        { loading && <Loader size="xs" /> }
                    </Group>
                    <Group gap="sm">
                        <NumberInput
                            size="xs"
                            min={ 1 }
                            max={ 3600 }
                            step={ 1 }
                            suffix="s"
                            value={ interval }
                            disabled={ !connected }
                            style={ { width: 80 } }
                            onChange={
                                (value) => {
                                    if (typeof value === 'number') {
                                        setPollingInterval(value);
                                    }
                                }
                            }
                        />
                        <Switch
                            size="xs"
                            label="Auto"
                            disabled={ !connected }
                            checked={ autoRefresh }
                            onChange={
                                (event) => {
                                    setAutoRefresh(
                                        event.currentTarget.checked,
                                    );
                                }
                            }
                        />
                        <Tooltip label="Refresh now">
                            <ActionIcon
                                size="sm"
                                variant="light"
                                disabled={
                                    !connected || loading
                                }
                                onClick={
                                    () => {
                                        void fetchAll();
                                    }
                                }
                            >
                                <Text size="xs">&#x21bb;</Text>
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                </Group>

                <SensorRow
                    label="Temperature"
                    value={ formatMilliValue(data.temp, 1) }
                    suffix=" °C"
                />
                <SensorRow
                    label="Humidity"
                    value={ formatMilliValue(data.hum, 1) }
                    suffix=" %"
                />
                <SensorRow
                    label="Pressure"
                    value={
                        data.pressure !== null
                            ? (data.pressure / 100).toFixed(1)
                            : null
                    }
                    suffix=" hPa"
                />
                <SensorRow
                    label="Wind direction"
                    value={ formatMilliValue(data.windDirection, 1) }
                    suffix="°"
                />
                <SensorRow
                    label="Wind speed"
                    value={
                        data.windSpeed !== null
                            ? String(data.windSpeed)
                            : null
                    }
                />
                <SensorRow
                    label="Voltage"
                    value={ formatVoltage(data.bat) }
                />
            </Stack>
        </Paper>
    );
}
