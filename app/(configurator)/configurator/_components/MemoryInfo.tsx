'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
    ActionIcon,
    Group,
    Loader,
    Paper,
    Progress,
    Stack,
    Switch,
    Text,
    Title,
    Tooltip,
} from '@mantine/core';

import type { ProtocolResponse } from '../_lib/types';

const AUTO_REFRESH_INTERVAL = 30_000;

/** Task names in display order */
const TASK_NAMES = [
    'def',
    'logging',
    'net',
    'serial_iface',
    'ota',
    'modem',
    'sensors',
    'anemometer',
    'button',
    'watchdog',
] as const;

interface MemoryData {
    heap: number | null;
    mainStack: number | null;
    tasks: Record<string, number>;
}

interface MemoryInfoProps {
    connected: boolean;
    onFetch: () => Promise<ProtocolResponse>;
}

function formatBytes(bytes: number): string {
    if (bytes >= 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${String(bytes)} B`;
}

function parseMemResponse(response: ProtocolResponse): MemoryData {
    const data: MemoryData = {
        heap: null,
        mainStack: null,
        tasks: {},
    };

    if (typeof response.heap === 'number') {
        data.heap = response.heap;
    }

    if (typeof response.main_stack === 'number') {
        data.mainStack = response.main_stack;
    }

    for (const name of TASK_NAMES) {
        const value = response[name];
        if (typeof value === 'number') {
            data.tasks[name] = value;
        }
    }

    return data;
}

export function MemoryInfo({
    connected,
    onFetch,
}: MemoryInfoProps) {
    const [data, setData] = useState<MemoryData | null>(null);
    const [loading, setLoading] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(
        null,
    );

    const fetchMemory = useCallback(async () => {
        setLoading(true);
        try {
            const response = await onFetch();
            if (response.status === 'ok') {
                setData(parseMemResponse(response));
            }
        } catch {
            // Silently fail — device may be busy
        } finally {
            setLoading(false);
        }
    }, [onFetch]);

    // Auto-refresh interval
    useEffect(() => {
        if (autoRefresh && connected) {
            void fetchMemory();
            intervalRef.current = setInterval(
                () => {
                    void fetchMemory();
                },
                AUTO_REFRESH_INTERVAL,
            );
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [autoRefresh, connected, fetchMemory]);

    // Stop auto-refresh on disconnect
    useEffect(() => {
        if (!connected) {
            setAutoRefresh(false);
            setData(null);
        }
    }, [connected]);

    const taskEntries = data
        ? Object.entries(data.tasks)
        : [];

    return (
        <Paper p="md" withBorder>
            <Stack gap="sm">
                <Group justify="space-between">
                    <Group gap="xs">
                        <Title order={ 5 }>Memory</Title>
                        { loading && <Loader size="xs" /> }
                    </Group>
                    <Group gap="sm">
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
                                        void fetchMemory();
                                    }
                                }
                            >
                                <Text size="xs">&#x21bb;</Text>
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                </Group>

                { !data ? (
                    <Text size="xs" c="dimmed">
                        { connected
                            ? 'Press refresh or enable auto-update.'
                            : 'Connect to a device first.' }
                    </Text>
                ) : (
                    <Stack gap={ 6 }>
                        { data.heap !== null && (
                            <MemoryRow
                                label="Min free heap"
                                bytes={ data.heap }
                            />
                        ) }
                        { data.mainStack !== null && (
                            <MemoryRow
                                label="Main stack HWM"
                                bytes={ data.mainStack }
                            />
                        ) }

                        { taskEntries.length > 0 && (
                            <>
                                <Text
                                    size="xs"
                                    fw={ 600 }
                                    c="blue"
                                    mt={ 4 }
                                >
                                    Task stack HWM
                                </Text>
                                { taskEntries.map(
                                    ([name, bytes]) => (
                                        <MemoryRow
                                            key={ name }
                                            label={ name }
                                            bytes={ bytes }
                                        />
                                    ),
                                ) }
                            </>
                        ) }
                    </Stack>
                ) }
            </Stack>
        </Paper>
    );
}

interface MemoryRowProps {
    label: string;
    bytes: number;
}

/** Rough max for visual bar — 8 KB typical stack */
const BAR_MAX = 8192;

function MemoryRow({ label, bytes }: MemoryRowProps) {
    const pct = Math.min((bytes / BAR_MAX) * 100, 100);
    const color = pct < 15 ? 'red' : pct < 40 ? 'yellow' : 'blue';

    return (
        <Group gap="xs" wrap="nowrap">
            <Text
                size="xs"
                c="dimmed"
                ff="monospace"
                style={ {
                    width: 100,
                    flexShrink: 0,
                } }
            >
                { label }
            </Text>
            <Progress
                value={ pct }
                color={ color }
                size="sm"
                style={ { flex: 1 } }
            />
            <Text
                size="xs"
                ff="monospace"
                fw={ 500 }
                style={ {
                    width: 65,
                    flexShrink: 0,
                    textAlign: 'right',
                } }
            >
                { formatBytes(bytes) }
            </Text>
        </Group>
    );
}
