'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { AppShell, Grid, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';

import {
    buildIfaceCommand,
    buildMemCommand,
    buildReadCommand,
    buildResetCommand,
    buildSaveCommand,
    buildWriteCommand,
} from '../_lib/protocol';
import { SerialConnection } from '../_lib/serial';
import {
    type ConnectionStatus,
    type DeviceParams,
    type LogEntry,
    PARAM_KEY_MAP,
    type ProtocolResponse,
    READABLE_PARAMS,
    WRITABLE_KEY_MAP,
    type WritableParams,
} from '../_lib/types';

import { ConfigEditor } from './ConfigEditor';
import { ConnectionPanel } from './ConnectionPanel';
import { DeviceInfo } from './DeviceInfo';
import { LogViewer } from './LogViewer';
import { MemoryInfo } from './MemoryInfo';

const MAX_LOG_ENTRIES = 1000;

type ResponseResolver = (response: ProtocolResponse) => void;

export function ConfiguratorApp() {
    const serialRef = useRef<SerialConnection | null>(null);
    const resolverRef = useRef<ResponseResolver | null>(null);

    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
    const [deviceParams, setDeviceParams] = useState<Partial<DeviceParams>>({});
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(false);

    const getSerial = useCallback(() => {
        serialRef.current ??= new SerialConnection();

        return serialRef.current;
    }, []);

    const handleResponse = useCallback(
        (response: ProtocolResponse) => {
            if (resolverRef.current) {
                resolverRef.current(response);
                resolverRef.current = null;
            }
        },
        [],
    );

    const handleLog = useCallback((entry: LogEntry) => {
        setLogs((prev) => {
            const next = [...prev, entry];
            if (next.length > MAX_LOG_ENTRIES) {
                return next.slice(next.length - MAX_LOG_ENTRIES);
            }

            return next;
        });
    }, []);

    const handleConnectionChange = useCallback(
        (status: ConnectionStatus) => {
            setConnectionStatus(status);
            if (status === 'disconnected') {
                setDeviceParams({});
            }
        },
        [],
    );

    useEffect(() => {
        const serial = getSerial();
        serial.onResponse = handleResponse;
        serial.onLog = handleLog;
        serial.onStatusChange = handleConnectionChange;

        return () => {
            serial.onResponse = null;
            serial.onLog = null;
            serial.onStatusChange = null;
        };
    }, [getSerial, handleResponse, handleLog, handleConnectionChange]);

    // Auto-connect on mount + reconnect when device is plugged in
    useEffect(() => {
        const serial = getSerial();

        const verifyIface = async (): Promise<void> => {
            try {
                const response =
                    await sendCommand(buildIfaceCommand());

                if (response.status !== 'ok') {
                    notifications.show({
                        title: 'Warning',
                        message:
                            'Device responded with error',
                        color: 'yellow',
                    });
                }
            } catch {
                // iface check failed — still connected
            }
        };

        serial.onAutoConnected = () => {
            void verifyIface();
        };

        void (async () => {
            const connected = await serial.autoConnect();
            if (connected) {
                void verifyIface();
            }
        })();

        serial.watchConnect();

        return () => {
            serial.onAutoConnected = null;
            serial.unwatchConnect();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
    }, []);

    const sendCommand = useCallback(
        async (command: string): Promise<ProtocolResponse> => {
            const serial = getSerial();

            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    resolverRef.current = null;
                    reject(new Error('Command timeout'));
                }, 5000);

                resolverRef.current = (response) => {
                    clearTimeout(timeout);
                    resolve(response);
                };

                serial.send(command).catch((sendError: unknown) => {
                    clearTimeout(timeout);
                    resolverRef.current = null;
                    if (sendError instanceof Error) {
                        reject(sendError);
                    } else {
                        reject(new Error('Send failed'));
                    }
                });
            });
        },
        [getSerial],
    );

    const handleConnect = useCallback(async () => {
        try {
            const serial = getSerial();
            await serial.connect();

            // Verify interface
            const ifaceResponse =
                await sendCommand(buildIfaceCommand());

            if (ifaceResponse.status !== 'ok') {
                notifications.show({
                    title: 'Warning',
                    message: 'Device responded with error',
                    color: 'yellow',
                });
            }
        } catch (error: unknown) {
            const message = error instanceof Error
                ? error.message
                : 'Connection failed';
            notifications.show({
                title: 'Connection Error',
                message,
                color: 'red',
            });
        }
    }, [getSerial, sendCommand]);

    const handleDisconnect = useCallback(async () => {
        const serial = getSerial();
        await serial.disconnect();
    }, [getSerial]);

    const readAllParams = useCallback(async () => {
        setLoading(true);
        const params: Partial<DeviceParams> = {};

        try {
            for (const paramName of READABLE_PARAMS) {
                const command = buildReadCommand(paramName);
                const response = await sendCommand(command);

                if (response.status === 'ok') {
                    const key = PARAM_KEY_MAP[paramName];
                    const value = response[paramName];

                    if (value !== undefined) {
                        (params as Record<string, unknown>)[key] =
                            value;
                    }
                }
            }

            setDeviceParams(params);
        } catch (error: unknown) {
            const message = error instanceof Error
                ? error.message
                : 'Failed to read parameters';
            notifications.show({
                title: 'Read Error',
                message,
                color: 'red',
            });
        } finally {
            setLoading(false);
        }
    }, [sendCommand]);

    const handleWriteParam = useCallback(
        async (
            key: keyof WritableParams,
            value: number | string,
        ) => {
            const wireName = WRITABLE_KEY_MAP[key];

            try {
                const response = await sendCommand(
                    buildWriteCommand(wireName, value),
                );

                if (response.status === 'ok') {
                    notifications.show({
                        title: 'Success',
                        message: `Parameter ${wireName} written`,
                        color: 'green',
                    });
                } else {
                    notifications.show({
                        title: 'Write Error',
                        message: `Failed to write ${wireName}`,
                        color: 'red',
                    });
                }
            } catch (error: unknown) {
                const message = error instanceof Error
                    ? error.message
                    : `Failed to write ${wireName}`;
                notifications.show({
                    title: 'Write Error',
                    message,
                    color: 'red',
                });
            }
        },
        [sendCommand],
    );

    const handleSave = useCallback(async () => {
        try {
            await sendCommand(buildSaveCommand());
            notifications.show({
                title: 'Saved',
                message: 'Parameters saved. Device is resetting...',
                color: 'green',
            });
        } catch {
            // Device resets after save — timeout is expected
            notifications.show({
                title: 'Saved',
                message: 'Device is resetting...',
                color: 'blue',
            });
        }
    }, [sendCommand]);

    const handleReset = useCallback(async () => {
        try {
            await sendCommand(buildResetCommand());
        } catch {
            // Device resets — timeout is expected
        }
        notifications.show({
            title: 'Reset',
            message: 'Device is resetting...',
            color: 'blue',
        });
    }, [sendCommand]);

    const handleClearLogs = useCallback(() => {
        setLogs([]);
    }, []);

    const fetchMemory = useCallback(
        () => sendCommand(buildMemCommand()),
        [sendCommand],
    );

    const isConnected = connectionStatus === 'connected';

    return (
        <AppShell padding="md">
            <AppShell.Main>
                <Stack gap="md">
                    <ConnectionPanel
                        status={ connectionStatus }
                        onConnect={ handleConnect }
                        onDisconnect={ handleDisconnect }
                    />
                    <Grid gutter="md">
                        <Grid.Col span={ { base: 12, md: 6 } }>
                            <Stack gap="md">
                                <DeviceInfo
                                    params={ deviceParams }
                                    loading={ loading }
                                    connected={ isConnected }
                                    onRefresh={ readAllParams }
                                />
                                <MemoryInfo
                                    connected={ isConnected }
                                    onFetch={ fetchMemory }
                                />
                                <ConfigEditor
                                    params={ deviceParams }
                                    connected={ isConnected }
                                    onWriteParam={ handleWriteParam }
                                    onSave={ handleSave }
                                    onReset={ handleReset }
                                />
                            </Stack>
                        </Grid.Col>
                        <Grid.Col span={ { base: 12, md: 6 } }>
                            <LogViewer
                                logs={ logs }
                                onClear={ handleClearLogs }
                            />
                        </Grid.Col>
                    </Grid>
                </Stack>
            </AppShell.Main>
        </AppShell>
    );
}
