'use client';

import Link from 'next/link';

import { Badge, Group, Paper, SimpleGrid, Text } from '@mantine/core';

import type { StationSummary } from '@/lib/types/station';

interface StationCardProps {
    station: StationSummary;
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

export function StationCard({ station }: StationCardProps) {
    const status = getStatusInfo(station.lastSeen);
    const lastSeenStr = getRelativeTime(station.lastSeen);

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
                <Badge color={ status.color } variant="dot">
                    { status.label }
                </Badge>
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
                        { station.temperature != null ? `${(station.temperature / 100).toFixed(1)}°C` : '--' }
                    </Text>
                </Paper>

                <Paper withBorder p="xs">
                    <Text size="xs" c="dimmed">Humidity</Text>
                    <Text fw={ 500 }>
                        { station.humidity != null ? `${(station.humidity / 100).toFixed(1)}%` : '--' }
                    </Text>
                </Paper>

                <Paper withBorder p="xs">
                    <Text size="xs" c="dimmed">Angle</Text>
                    <Text fw={ 500 }>
                        { station.angle != null ? `${station.angle}°` : '--' }
                    </Text>
                </Paper>

                <Paper withBorder p="xs">
                    <Text size="xs" c="dimmed">Count</Text>
                    <Text fw={ 500 }>
                        { station.count ?? '--' }
                    </Text>
                </Paper>

                <Paper withBorder p="xs" style={ { gridColumn: 'span 2' } }>
                    <Group justify="space-between">
                        <Text size="xs" c="dimmed">Battery</Text>
                        <Text fw={ 500 }>
                            { station.bat != null ? `${station.bat} mV` : '--' }
                        </Text>
                    </Group>
                </Paper>
            </SimpleGrid>
        </Paper>
    );
}
