'use client';

import { useState, useEffect } from 'react';

import {
    Button,
    Group,
    Modal,
    Paper,
    Text,
    TextInput,
    NumberInput,
    Select,
    Stack,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';

interface FirmwareItem {
    filename: string;
    size: number;
    dev: string;
    rev: string;
    name: string;
    ver: number;
    binver: number;
}

interface BulkActionsProps {
    selectedUids: number[];
    onClearSelection: () => void;
    onSelectAll: () => void;
    totalStations: number;
    onRefresh: () => void;
}

export function BulkActions({
    selectedUids,
    onClearSelection,
    onSelectAll,
    totalStations,
    onRefresh,
}: BulkActionsProps) {
    const [configOpened, setConfigOpened] = useState(false);
    const [firmwareOpened, setFirmwareOpened] = useState(false);
    const [loading, setLoading] = useState(false);

    // Config form state
    const [apn, setApn] = useState('');
    const [urlOta, setUrlOta] = useState('');
    const [urlApp, setUrlApp] = useState('');
    const [periodUpload, setPeriodUpload] = useState<number | ''>('');
    const [periodSensors, setPeriodSensors] = useState<number | ''>('');
    const [periodAnemometer, setPeriodAnemometer] = useState<number | ''>('');

    // Firmware form state
    const [firmwareList, setFirmwareList] = useState<FirmwareItem[]>([]);
    const [selectedFirmware, setSelectedFirmware] = useState<string | null>(null);

    useEffect(() => {
        if (firmwareOpened) {
            fetch('/api/ota/upload')
                .then((res) => res.json())
                .then((data: FirmwareItem[]) => {
                    setFirmwareList(data);
                })
                .catch(() => {
                    notifications.show({
                        title: 'Error',
                        message: 'Failed to fetch firmware list',
                        color: 'red',
                    });
                });
        }
    }, [firmwareOpened]);

    const handleBulkConfig = async () => {
        setLoading(true);
        try {
            const config: Record<string, string | number> = {};
            if (apn) {
                config.apn = apn;
            }
            if (urlOta) {
                config.url_ota = urlOta;
            }
            if (urlApp) {
                config.url_app = urlApp;
            }
            if (periodUpload !== '') {
                config.period_upload = periodUpload;
            }
            if (periodSensors !== '') {
                config.period_sensors = periodSensors;
            }
            if (periodAnemometer !== '') {
                config.period_anemometer = periodAnemometer;
            }

            if (Object.keys(config).length === 0) {
                notifications.show({
                    title: 'Warning',
                    message: 'No configuration fields filled out',
                    color: 'yellow',
                });
                setLoading(false);

                return;
            }

            const response = await fetch('/api/stations/bulk/config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uids: selectedUids,
                    config,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to update config');
            }

            notifications.show({
                title: 'Success',
                message: `Applied configuration to ${selectedUids.length} stations`,
                color: 'green',
            });
            setConfigOpened(false);
            onClearSelection();
            onRefresh();
        } catch {
            notifications.show({
                title: 'Error',
                message: 'Failed to apply bulk configuration',
                color: 'red',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleBulkFirmware = async () => {
        if (!selectedFirmware) {
            notifications.show({
                title: 'Warning',
                message: 'Please select a firmware',
                color: 'yellow',
            });

            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/stations/bulk/firmware', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uids: selectedUids,
                    filename: selectedFirmware,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to assign firmware');
            }

            notifications.show({
                title: 'Success',
                message: `Assigned firmware to ${selectedUids.length} stations`,
                color: 'green',
            });
            setFirmwareOpened(false);
            onClearSelection();
            onRefresh();
        } catch {
            notifications.show({
                title: 'Error',
                message: 'Failed to assign bulk firmware',
                color: 'red',
            });
        } finally {
            setLoading(false);
        }
    };

    if (selectedUids.length === 0) {
        return null;
    }

    const allSelected = selectedUids.length === totalStations;

    return (
        <>
            <Paper
                p="md"
                mb="md"
                withBorder
                bg="dark.7"
            >
                <Group justify="space-between">
                    <Group>
                        <Text fw={ 600 }>
                            { selectedUids.length }
                            { ' ' }
                            station
                            { selectedUids.length !== 1 && 's' }
                            { ' ' }
                            selected
                        </Text>
                        <Button
                            variant="subtle"
                            size="sm"
                            onClick={ allSelected ? onClearSelection : onSelectAll }
                        >
                            { allSelected ? 'Deselect All' : 'Select All' }
                        </Button>
                    </Group>
                    <Group>
                        <Button
                            variant="light"
                            onClick={ () => {
                                setConfigOpened(true);
                            } }
                        >
                            Bulk Config
                        </Button>
                        <Button
                            variant="light"
                            onClick={ () => {
                                setFirmwareOpened(true);
                            } }
                        >
                            Bulk Firmware
                        </Button>
                    </Group>
                </Group>
            </Paper>

            <Modal
                opened={ configOpened }
                title="Bulk Configuration"
                onClose={ () => {
                    setConfigOpened(false);
                } }
            >
                <Stack gap="md">
                    <Text size="sm" c="dimmed">
                        Leave fields empty to keep existing values.
                    </Text>
                    <TextInput
                        label="APN"
                        placeholder="internet"
                        value={ apn }
                        onChange={ (event) => {
                            setApn(event.currentTarget.value);
                        } }
                    />
                    <TextInput
                        label="OTA URL"
                        placeholder="myserver.com"
                        value={ urlOta }
                        onChange={ (event) => {
                            setUrlOta(event.currentTarget.value);
                        } }
                    />
                    <TextInput
                        label="App URL"
                        placeholder="myserver.com"
                        value={ urlApp }
                        onChange={ (event) => {
                            setUrlApp(event.currentTarget.value);
                        } }
                    />
                    <NumberInput
                        label="Upload Period (s)"
                        placeholder="60"
                        value={ periodUpload }
                        min={ 0 }
                        onChange={ (val) => {
                            setPeriodUpload(typeof val === 'number' ? val : '');
                        } }
                    />
                    <NumberInput
                        label="Sensors Period (s)"
                        placeholder="10"
                        value={ periodSensors }
                        min={ 0 }
                        onChange={ (val) => {
                            setPeriodSensors(typeof val === 'number' ? val : '');
                        } }
                    />
                    <NumberInput
                        label="Anemometer Period (s)"
                        placeholder="100"
                        value={ periodAnemometer }
                        min={ 0 }
                        onChange={ (val) => {
                            setPeriodAnemometer(typeof val === 'number' ? val : '');
                        } }
                    />
                    <Group justify="flex-end" mt="md">
                        <Button
                            variant="subtle"
                            onClick={ () => {
                                setConfigOpened(false);
                            } }
                        >
                            Cancel
                        </Button>
                        <Button loading={ loading } onClick={ handleBulkConfig }>
                            Apply
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            <Modal
                opened={ firmwareOpened }
                title="Bulk Firmware Update"
                onClose={ () => {
                    setFirmwareOpened(false);
                } }
            >
                <Stack gap="md">
                    <Select
                        label="Select Firmware"
                        placeholder="Choose firmware"
                        data={ firmwareList.map((fw) => ({
                            value: fw.filename,
                            label: `${fw.name} (v${fw.ver}) - ${fw.filename}`,
                        })) }
                        value={ selectedFirmware }
                        searchable
                        onChange={ setSelectedFirmware }
                    />
                    <Group justify="flex-end" mt="md">
                        <Button
                            variant="subtle"
                            onClick={ () => {
                                setFirmwareOpened(false);
                            } }
                        >
                            Cancel
                        </Button>
                        <Button loading={ loading } onClick={ handleBulkFirmware }>
                            Assign
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </>
    );
}
