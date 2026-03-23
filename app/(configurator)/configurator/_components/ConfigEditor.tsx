'use client';

import { useCallback, useEffect, useState } from 'react';

import {
    Button,
    Divider,
    Group,
    NumberInput,
    Paper,
    PasswordInput,
    Stack,
    TextInput,
    Title,
} from '@mantine/core';

import type { DeviceParams, WritableParams } from '../_lib/types';

interface ConfigEditorProps {
    params: Partial<DeviceParams>;
    connected: boolean;
    onWriteParam: (
        key: keyof WritableParams,
        value: number | string,
    ) => Promise<void>;
    onSave: () => Promise<void>;
    onReset: () => Promise<void>;
}

export function ConfigEditor({
    params,
    connected,
    onWriteParam,
    onSave,
    onReset,
}: ConfigEditorProps) {
    const [uid, setUid] = useState<number | string>('');
    const [apn, setApn] = useState('');
    const [urlOta, setUrlOta] = useState('');
    const [urlApp, setUrlApp] = useState('');
    const [periodUpload, setPeriodUpload] = useState<number | string>('');
    const [periodSensors, setPeriodSensors] = useState<number | string>('');
    const [periodAnemometer, setPeriodAnemometer] =
        useState<number | string>('');
    const [secret, setSecret] = useState('');
    const [saving, setSaving] = useState(false);
    const [writing, setWriting] = useState<string | null>(null);

    // Sync form fields from device params when they change
    useEffect(() => {
        if (params.uid !== undefined) {
            setUid(params.uid);
        }
        if (params.apn !== undefined) {
            setApn(params.apn);
        }
        if (params.urlOta !== undefined) {
            setUrlOta(params.urlOta);
        }
        if (params.urlApp !== undefined) {
            setUrlApp(params.urlApp);
        }
        if (params.periodUpload !== undefined) {
            setPeriodUpload(params.periodUpload);
        }
        if (params.periodSensors !== undefined) {
            setPeriodSensors(params.periodSensors);
        }
        if (params.periodAnemometer !== undefined) {
            setPeriodAnemometer(params.periodAnemometer);
        }
    }, [params]);

    const writeParam = useCallback(
        async (key: keyof WritableParams, value: number | string) => {
            setWriting(key);
            try {
                await onWriteParam(key, value);
            } finally {
                setWriting(null);
            }
        },
        [onWriteParam],
    );

    const handleWriteAll = useCallback(async () => {
        setWriting('all');
        try {
            if (uid !== '' && uid !== 0) {
                await onWriteParam('uid', Number(uid));
            }
            if (apn !== '') {
                await onWriteParam('apn', apn);
            }
            if (urlOta !== '') {
                await onWriteParam('urlOta', urlOta);
            }
            if (urlApp !== '') {
                await onWriteParam('urlApp', urlApp);
            }
            if (periodUpload !== '' && periodUpload !== 0) {
                await onWriteParam('periodUpload', Number(periodUpload));
            }
            if (periodSensors !== '' && periodSensors !== 0) {
                await onWriteParam('periodSensors', Number(periodSensors));
            }
            if (periodAnemometer !== '' && periodAnemometer !== 0) {
                await onWriteParam(
                    'periodAnemometer',
                    Number(periodAnemometer),
                );
            }
            if (secret !== '') {
                await onWriteParam('secret', secret);
            }
        } finally {
            setWriting(null);
        }
    }, [
        uid,
        apn,
        urlOta,
        urlApp,
        periodUpload,
        periodSensors,
        periodAnemometer,
        secret,
        onWriteParam,
    ]);

    const handleSave = useCallback(async () => {
        setSaving(true);
        try {
            await onSave();
        } finally {
            setSaving(false);
        }
    }, [onSave]);

    const isWriting = writing !== null;

    return (
        <Paper p="md" withBorder>
            <Stack gap="sm">
                <Title order={ 5 }>Configuration</Title>

                <NumberInput
                    label="UID"
                    description="Device ID (non-zero)"
                    value={ uid }
                    min={ 1 }
                    disabled={ !connected }
                    rightSection={
                        (
                            <WriteButton
                                disabled={ !connected || isWriting }
                                loading={ writing === 'uid' }
                                onClick={
                                    () => writeParam(
                                        'uid',
                                        Number(uid),
                                    )
                                }
                            />
                        )
                    }
                    rightSectionWidth={ 60 }
                    onChange={ setUid }
                />

                <TextInput
                    label="APN"
                    description="SIM card APN (max 31 chars)"
                    value={ apn }
                    maxLength={ 31 }
                    disabled={ !connected }
                    rightSection={
                        (
                            <WriteButton
                                disabled={ !connected || isWriting }
                                loading={ writing === 'apn' }
                                onClick={
                                    () => writeParam('apn', apn)
                                }
                            />
                        )
                    }
                    rightSectionWidth={ 60 }
                    onChange={ (event) => {
                        setApn(event.target.value);
                    } }
                />

                <TextInput
                    label="URL OTA"
                    description="OTA update URL"
                    value={ urlOta }
                    disabled={ !connected }
                    rightSection={
                        (
                            <WriteButton
                                disabled={ !connected || isWriting }
                                loading={ writing === 'urlOta' }
                                onClick={
                                    () => writeParam(
                                        'urlOta',
                                        urlOta,
                                    )
                                }
                            />
                        )
                    }
                    rightSectionWidth={ 60 }
                    onChange={
                        (event) => {
                            setUrlOta(event.target.value);
                        }
                    }
                />

                <TextInput
                    label="URL App"
                    description="Application server URL"
                    value={ urlApp }
                    disabled={ !connected }
                    rightSection={
                        (
                            <WriteButton
                                disabled={ !connected || isWriting }
                                loading={ writing === 'urlApp' }
                                onClick={
                                    () => writeParam(
                                        'urlApp',
                                        urlApp,
                                    )
                                }
                            />
                        )
                    }
                    rightSectionWidth={ 60 }
                    onChange={
                        (event) => {
                            setUrlApp(event.target.value);
                        }
                    }
                />

                <Group grow>
                    <NumberInput
                        label="Period Upload"
                        description="App period (sec, >0)"
                        value={ periodUpload }
                        min={ 1 }
                        disabled={ !connected }
                        onChange={ setPeriodUpload }
                    />
                    <NumberInput
                        label="Period Sensors"
                        description="Sensor period (sec)"
                        value={ periodSensors }
                        min={ 1 }
                        disabled={ !connected }
                        onChange={ setPeriodSensors }
                    />
                    <NumberInput
                        label="Period Anemometer"
                        description="Anemometer period (sec)"
                        value={ periodAnemometer }
                        min={ 1 }
                        disabled={ !connected }
                        onChange={ setPeriodAnemometer }
                    />
                </Group>

                <PasswordInput
                    label="Secret"
                    description="HMAC secret (64 hex chars)"
                    value={ secret }
                    placeholder="hex string"
                    disabled={ !connected }
                    rightSection={
                        (
                            <WriteButton
                                disabled={ !connected || isWriting }
                                loading={ writing === 'secret' }
                                onClick={
                                    () => writeParam('secret', secret)
                                }
                            />
                        )
                    }
                    rightSectionWidth={ 60 }
                    onChange={
                        (event) => {
                            setSecret(event.target.value);
                        }
                    }
                />

                <Divider />

                <Group justify="flex-end">
                    <Button
                        size="sm"
                        variant="light"
                        disabled={ !connected || isWriting }
                        loading={ writing === 'all' }
                        onClick={ handleWriteAll }
                    >
                        Write All
                    </Button>
                    <Button
                        size="sm"
                        color="green"
                        disabled={ !connected }
                        loading={ saving }
                        onClick={ handleSave }
                    >
                        Save & Reset
                    </Button>
                    <Button
                        size="sm"
                        color="red"
                        variant="outline"
                        disabled={ !connected }
                        onClick={ onReset }
                    >
                        Reset
                    </Button>
                </Group>
            </Stack>
        </Paper>
    );
}

interface WriteButtonProps {
    disabled: boolean;
    loading: boolean;
    onClick: () => void;
}

function WriteButton({ disabled, loading, onClick }: WriteButtonProps) {
    return (
        <Button
            size="compact-xs"
            variant="subtle"
            disabled={ disabled }
            loading={ loading }
            onClick={ onClick }
        >
            Set
        </Button>
    );
}
