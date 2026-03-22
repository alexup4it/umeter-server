'use client';

import { Badge, Button, Group, Paper, Text } from '@mantine/core';

import type { ConnectionStatus } from '../_lib/types';

const STATUS_COLORS: Record<ConnectionStatus, string> = {
    disconnected: 'red',
    connecting: 'yellow',
    connected: 'green',
};

const STATUS_LABELS: Record<ConnectionStatus, string> = {
    disconnected: 'Disconnected',
    connecting: 'Connecting...',
    connected: 'Connected',
};

interface ConnectionPanelProps {
    status: ConnectionStatus;
    onConnect: () => void;
    onDisconnect: () => void;
}

export function ConnectionPanel({
    status,
    onConnect,
    onDisconnect,
}: ConnectionPanelProps) {
    const isConnected = status === 'connected';
    const isConnecting = status === 'connecting';

    return (
        <Paper p="sm" withBorder>
            <Group justify="space-between">
                <Group gap="sm">
                    <Text size="sm" fw={ 600 }>
                        UMeter Configurator
                    </Text>
                    <Badge
                        color={ STATUS_COLORS[status] }
                        variant="dot"
                        size="lg"
                    >
                        { STATUS_LABELS[status] }
                    </Badge>
                </Group>
                <Group gap="sm">
                    { !isConnected ? (
                        <Button
                            size="xs"
                            loading={ isConnecting }
                            onClick={ onConnect }
                        >
                            Connect
                        </Button>
                    ) : (
                        <Button
                            size="xs"
                            color="red"
                            variant="outline"
                            onClick={ onDisconnect }
                        >
                            Disconnect
                        </Button>
                    ) }
                </Group>
            </Group>
        </Paper>
    );
}
