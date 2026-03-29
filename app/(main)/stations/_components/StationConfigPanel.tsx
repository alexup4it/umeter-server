'use client';

import { useCallback, useState } from 'react';

import {
    Badge,
    Button,
    Group,
    NumberInput,
    Paper,
    Stack,
    TextInput,
    Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';

import type { StationConfig } from '@/lib/types/station';

interface StationConfigPanelProps {
    uid: number;
    config: StationConfig | null;
    pendingConfig: StationConfig | null;
    onUpdated: () => void;
}

export function StationConfigPanel({
    uid,
    config,
    pendingConfig,
    onUpdated,
}: StationConfigPanelProps) {
    const [apn, setApn] = useState(
        pendingConfig?.apn ?? config?.apn ?? '',
    );
    const [urlOta, setUrlOta] = useState(
        pendingConfig?.urlOta ?? config?.urlOta ?? '',
    );
    const [urlApp, setUrlApp] = useState(
        pendingConfig?.urlApp ?? config?.urlApp ?? '',
    );
    const [periodUpload, setPeriodUpload] = useState<
        number | string
    >(
        pendingConfig?.periodUpload
            ?? config?.periodUpload
            ?? '',
    );
    const [periodSensors, setPeriodSensors] = useState<
        number | string
    >(
        pendingConfig?.periodSensors
            ?? config?.periodSensors
            ?? '',
    );
    const [periodAnemometer, setPeriodAnemometer] = useState<
        number | string
    >(
        pendingConfig?.periodAnemometer
            ?? config?.periodAnemometer
            ?? '',
    );
    const [submitting, setSubmitting] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    const handleApply = useCallback(async () => {
        setSubmitting(true);
        try {
            const response = await fetch(
                `/api/stations/${uid}/config`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        apn: apn || '',
                        url_ota: urlOta,
                        url_app: urlApp,
                        period_upload: Number(periodUpload),
                        period_sensors: Number(periodSensors),
                        period_anemometer: Number(
                            periodAnemometer,
                        ),
                    }),
                },
            );

            if (!response.ok) {
                throw new Error('Failed to apply config');
            }

            notifications.show({
                title: 'Config queued',
                message:
                    'Configuration will be applied on '
                    + 'next device check-in',
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
    }, [
        uid,
        apn,
        urlOta,
        urlApp,
        periodUpload,
        periodSensors,
        periodAnemometer,
        onUpdated,
    ]);

    const handleCancel = useCallback(async () => {
        setCancelling(true);
        try {
            const response = await fetch(
                `/api/stations/${uid}/config`,
                { method: 'DELETE' },
            );

            if (!response.ok) {
                throw new Error('Failed to cancel config');
            }

            notifications.show({
                title: 'Cancelled',
                message: 'Pending config removed',
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
            setCancelling(false);
        }
    }, [uid, onUpdated]);

    return (
        <Paper withBorder p="md" radius="md">
            <Stack gap="sm">
                <Group justify="space-between">
                    <Title order={ 4 }>
                        Configuration (OTA)
                    </Title>
                    { pendingConfig && (
                        <Badge color="orange" variant="light">
                            Pending
                        </Badge>
                    ) }
                </Group>

                <TextInput
                    label="APN"
                    description="SIM card APN"
                    value={ apn }
                    maxLength={ 31 }
                    onChange={ (event) => {
                        setApn(event.target.value);
                    } }
                />

                <TextInput
                    label="URL OTA"
                    description="OTA update server URL"
                    value={ urlOta }
                    onChange={ (event) => {
                        setUrlOta(event.target.value);
                    } }
                />

                <TextInput
                    label="URL App"
                    description="Application server URL"
                    value={ urlApp }
                    onChange={ (event) => {
                        setUrlApp(event.target.value);
                    } }
                />

                <Group grow>
                    <NumberInput
                        label="Period Upload"
                        description="Upload interval (sec)"
                        value={ periodUpload }
                        min={ 1 }
                        onChange={ setPeriodUpload }
                    />
                    <NumberInput
                        label="Period Sensors"
                        description="Sensor read interval (sec)"
                        value={ periodSensors }
                        min={ 1 }
                        onChange={ setPeriodSensors }
                    />
                    <NumberInput
                        label="Period Anemometer"
                        description="Anemometer interval (sec)"
                        value={ periodAnemometer }
                        min={ 1 }
                        onChange={ setPeriodAnemometer }
                    />
                </Group>

                <Group justify="flex-end">
                    { pendingConfig && (
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
                        loading={ submitting }
                        onClick={ handleApply }
                    >
                        Apply Config
                    </Button>
                </Group>
            </Stack>
        </Paper>
    );
}
