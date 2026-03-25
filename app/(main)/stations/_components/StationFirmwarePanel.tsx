'use client';

import { useCallback, useEffect, useState } from 'react';

import {
    Badge,
    Button,
    Group,
    Paper,
    Select,
    Stack,
    Text,
    Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';

import type { PendingFirmware } from '@/lib/types/station';

interface FirmwareItem {
    filename: string;
    size: number;
    dev: string;
    rev: string;
    name: string;
    ver: string;
    binver: number;
}

interface StationFirmwarePanelProps {
    uid: number;
    pendingFirmware: PendingFirmware | null;
    onUpdated: () => void;
}

function formatSize(bytes: number) {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    return `${(bytes / 1024).toFixed(1)} KB`;
}

export function StationFirmwarePanel({
    uid,
    pendingFirmware,
    onUpdated,
}: StationFirmwarePanelProps) {
    const [firmwares, setFirmwares] = useState<FirmwareItem[]>([]);
    const [selected, setSelected] = useState<string | null>(
        pendingFirmware?.filename ?? null,
    );
    const [submitting, setSubmitting] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        void fetch('/api/ota/upload')
            .then((r) => r.json() as Promise<FirmwareItem[]>)
            .then(setFirmwares)
            .catch(console.error);
    }, []);

    const handleAssign = useCallback(async () => {
        if (!selected) {
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch(
                `/api/stations/${uid}/firmware`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ filename: selected }),
                },
            );

            if (!response.ok) {
                throw new Error('Failed to assign firmware');
            }

            notifications.show({
                title: 'Firmware assigned',
                message:
                    'Firmware will be applied on next device check-in',
                color: 'green',
            });

            onUpdated();
        } catch (error) {
            notifications.show({
                title: 'Error',
                message:
                    error instanceof Error
                        ? error.message
                        : 'Unknown error',
                color: 'red',
            });
        } finally {
            setSubmitting(false);
        }
    }, [uid, selected, onUpdated]);

    const handleCancel = useCallback(async () => {
        setCancelling(true);
        try {
            const response = await fetch(
                `/api/stations/${uid}/firmware`,
                { method: 'DELETE' },
            );

            if (!response.ok) {
                throw new Error('Failed to cancel firmware');
            }

            notifications.show({
                title: 'Cancelled',
                message: 'Pending firmware assignment removed',
                color: 'green',
            });

            setSelected(null);
            onUpdated();
        } catch (error) {
            notifications.show({
                title: 'Error',
                message:
                    error instanceof Error
                        ? error.message
                        : 'Unknown error',
                color: 'red',
            });
        } finally {
            setCancelling(false);
        }
    }, [uid, onUpdated]);

    const selectData = firmwares.map((fw) => ({
        value: fw.filename,
        label: `${fw.name} v${fw.ver} (${formatSize(fw.size)})`,
    }));

    return (
        <Paper withBorder p="md" radius="md">
            <Stack gap="sm">
                <Group justify="space-between">
                    <Title order={ 4 }>Firmware</Title>
                    { pendingFirmware && (
                        <Badge color="orange" variant="light">
                            Pending
                        </Badge>
                    ) }
                </Group>

                { pendingFirmware && (
                    <Text size="sm" c="dimmed">
                        Assigned:
                        { ' ' }
                        <Text
                            span
                            ff="monospace"
                            fw={ 500 }
                        >
                            { pendingFirmware.filename }
                        </Text>
                    </Text>
                ) }

                <Select
                    label="Firmware file"
                    placeholder="Select firmware to assign"
                    data={ selectData }
                    value={ selected }
                    searchable
                    clearable
                    onChange={ setSelected }
                />

                <Group justify="flex-end">
                    { pendingFirmware && (
                        <Button
                            variant="subtle"
                            color="red"
                            size="sm"
                            loading={ cancelling }
                            onClick={ handleCancel }
                        >
                            Cancel Pending
                        </Button>
                    ) }
                    <Button
                        size="sm"
                        disabled={ !selected }
                        loading={ submitting }
                        onClick={ handleAssign }
                    >
                        Assign Firmware
                    </Button>
                </Group>
            </Stack>
        </Paper>
    );
}
