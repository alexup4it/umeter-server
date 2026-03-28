'use client';

import {
    Button,
    Group,
    Loader,
    Paper,
    SimpleGrid,
    Stack,
    Text,
    Title,
} from '@mantine/core';

import { binverToString } from '@/lib/utils/version';

import type { DeviceParams } from '../_lib/types';

interface DeviceInfoProps {
    params: Partial<DeviceParams>;
    loading: boolean;
    connected: boolean;
    onRefresh: () => void;
}

interface InfoRowProps {
    label: string;
    value: number | string | undefined;
    suffix?: string;
}

function InfoRow({ label, value, suffix = '' }: InfoRowProps) {
    const displayValue = value !== undefined
        ? `${String(value)}${suffix}`
        : '—';

    return (
        <Group justify="space-between" gap="xs">
            <Text size="xs" c="dimmed">
                { label }
            </Text>
            <Text size="xs" ff="monospace" fw={ 500 }>
                { displayValue }
            </Text>
        </Group>
    );
}

export function DeviceInfo({
    params,
    loading,
    connected,
    onRefresh,
}: DeviceInfoProps) {
    return (
        <Paper p="md" withBorder>
            <Stack gap="sm">
                <Group justify="space-between">
                    <Title order={ 5 }>Device Info</Title>
                    <Group gap="xs">
                        { loading && <Loader size="xs" /> }
                        <Button
                            size="xs"
                            variant="light"
                            disabled={ !connected || loading }
                            onClick={ onRefresh }
                        >
                            Refresh
                        </Button>
                    </Group>
                </Group>

                <SimpleGrid cols={ 2 } spacing="xs">
                    <Stack gap={ 4 }>
                        <Text size="xs" fw={ 600 } c="blue">
                            Identity
                        </Text>
                        <InfoRow label="UID" value={ params.uid } />
                        <InfoRow
                            label="Name"
                            value={ params.name }
                        />
                        <InfoRow label="MCU" value={ params.mcu } />
                    </Stack>

                    <Stack gap={ 4 }>
                        <Text size="xs" fw={ 600 } c="blue">
                            Firmware
                        </Text>
                        <InfoRow
                            label="Version"
                            value={ params.appVer !== undefined
                                ? binverToString(params.appVer)
                                : undefined }
                        />
                        <InfoRow
                            label="App Git"
                            value={ params.appGit }
                        />
                        <InfoRow
                            label="BL Git"
                            value={ params.blGit }
                        />
                        <InfoRow
                            label="BL Status"
                            value={ params.blStatus }
                        />
                    </Stack>

                    <Stack gap={ 4 }>
                        <Text size="xs" fw={ 600 } c="blue">
                            System
                        </Text>
                        <InfoRow
                            label="Ticks"
                            value={ params.ticks }
                        />
                        <InfoRow
                            label="Timestamp"
                            value={ params.ts }
                        />
                    </Stack>
                </SimpleGrid>
            </Stack>
        </Paper>
    );
}
