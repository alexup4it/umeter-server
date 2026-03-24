'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';

import { ActionIcon, Badge, Group, Paper, SimpleGrid, Text, Tooltip } from '@mantine/core';

import type { StationSummary } from '@/lib/types/station';

interface StationCardProps {
    station: StationSummary;
    onLocate?: (uid: number) => void;
}

function getStatusInfo(lastSeen: string | null): { color: string; label: string } {
    if (!lastSeen) {
        return { color: 'gray', label: 'Unknown' };
    }

    const diff = Date.now() - new Date(lastSeen).getTime();
    const mins = diff / 1000 / 60;

    if (mins < 30) {
        return { color: 'green', label: 'Online' };
    }
    if (mins < 120) {
        return { color: 'yellow', label: 'Warning' };
    }

    return { color: 'red', label: 'Offline' };
}

function getRelativeTime(lastSeen: string | null): string {
    if (!lastSeen) {
        return 'Never';
    }

    const diff = Date.now() - new Date(lastSeen).getTime();
    const mins = Math.floor(diff / 1000 / 60);

    if (mins < 1) {
        return 'Just now';
    }
    if (mins < 60) {
        return `${mins} min ago`;
    }
    const hours = Math.floor(mins / 60);
    if (hours < 24) {
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    const days = Math.floor(hours / 24);

    return `${days} day${days > 1 ? 's' : ''} ago`;
}

/** SSR-safe defaults (stable across server & client first render). */
const SSR_STATUS: { color: string; label: string } = { color: 'gray', label: 'Unknown' };
const SSR_RELATIVE_TIME = '--';

function MapPinIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
        </svg>
    );
}

const LIVE_UPDATE_INTERVAL_MS = 30_000;

export function StationCard({ station, onLocate }: StationCardProps) {
    const [status, setStatus] = useState(SSR_STATUS);
    const [lastSeenStr, setLastSeenStr] = useState(SSR_RELATIVE_TIME);

    useEffect(() => {
        const update = () => {
            setStatus(getStatusInfo(station.lastSeen));
            setLastSeenStr(getRelativeTime(station.lastSeen));
        };

        update();
        const id = setInterval(update, LIVE_UPDATE_INTERVAL_MS);

        return () => {
            clearInterval(id);
        };
    }, [station.lastSeen]);

    return (
        <Paper
            component={ Link }
            href={ `/stations/${station.uid}` }
            p="md"
            withBorder
            style={ { textDecoration: 'none', color: 'inherit', display: 'block' } }
        >
            <Group justify="space-between" mb="xs">
                <Text fw={ 600 } size="lg" truncate>
                    { station.name ?? station.uid }
                </Text>
                <Group gap="xs">
                    { onLocate && (
                        <Tooltip label="Show on map" withArrow>
                            <ActionIcon
                                variant="subtle"
                                size="sm"
                                onClick={ (event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    onLocate(station.uid);
                                } }
                            >
                                <MapPinIcon />
                            </ActionIcon>
                        </Tooltip>
                    ) }
                    <Badge color={ status.color } variant="dot">
                        { status.label }
                    </Badge>
                </Group>
            </Group>

            <Group justify="space-between" mb="sm">
                <Text size="sm" c="dimmed">
                    Last seen
                </Text>
                <Text size="sm" c="dimmed">
                    { lastSeenStr }
                </Text>
            </Group>

            <SimpleGrid cols={ 2 } spacing="xs">
                <Paper withBorder p="xs">
                    <Text size="xs" c="dimmed">Temp</Text>
                    <Text fw={ 500 }>
                        { station.temperature != null ? `${station.temperature.toFixed(1)}°C` : '--' }
                    </Text>
                </Paper>

                <Paper withBorder p="xs">
                    <Text size="xs" c="dimmed">Humidity</Text>
                    <Text fw={ 500 }>
                        { station.humidity != null ? `${station.humidity.toFixed(1)}%` : '--' }
                    </Text>
                </Paper>

                <Paper withBorder p="xs">
                    <Text size="xs" c="dimmed">Wind direction</Text>
                    <Text fw={ 500 }>
                        { station.windDirection != null ? `${station.windDirection.toFixed(1)}°` : '--' }
                    </Text>
                </Paper>

                <Paper withBorder p="xs">
                    <Text size="xs" c="dimmed">Wind speed</Text>
                    <Text fw={ 500 }>
                        { station.windSpeed ?? '--' }
                    </Text>
                </Paper>

                <Paper withBorder p="xs" style={ { gridColumn: 'span 2' } }>
                    <Group justify="space-between">
                        <Text size="xs" c="dimmed">Voltage</Text>
                        <Text fw={ 500 }>
                            { station.voltage != null ? `${station.voltage.toFixed(2)} V` : '--' }
                        </Text>
                    </Group>
                </Paper>
            </SimpleGrid>
        </Paper>
    );
}
