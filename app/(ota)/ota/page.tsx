'use client';

import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';

import {
    ActionIcon,
    Box,
    Button,
    Container,
    Stack,
    Table,
    Text,
    Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';

interface FirmwareItem {
    filename: string;
    size: number;
    dev: string;
    rev: string;
    name: string;
    ver: string;
    binver: number;
}

export default function OtaPage() {
    const [firmwares, setFirmwares] = useState<FirmwareItem[]>([]);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchFirmwares = useCallback(async () => {
        const response = await fetch('/api/ota/upload');
        const data = await response.json() as FirmwareItem[];
        setFirmwares(data);
    }, []);

    useEffect(() => {
        void fetchFirmwares();
    }, [fetchFirmwares]);

    const acceptFile = useCallback((candidate: File) => {
        if (!candidate.name.endsWith('.bin')) {
            notifications.show({
                title: 'Invalid file',
                message: 'Only .bin files are allowed',
                color: 'red',
            });

            return;
        }
        setFile(candidate);
    }, []);

    // Global paste handler
    useEffect(() => {
        const handlePaste = (event: ClipboardEvent) => {
            const items = event.clipboardData?.items;
            if (!items) {
                return;
            }
            for (const item of items) {
                if (item.kind === 'file') {
                    const pasted = item.getAsFile();
                    if (pasted) {
                        acceptFile(pasted);
                    }

                    return;
                }
            }
        };

        window.addEventListener('paste', handlePaste);

        return () => {
            window.removeEventListener('paste', handlePaste);
        };
    }, [acceptFile]);

    const handleDragOver = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();
            setDragOver(true);
        },
        [],
    );

    const handleDragLeave = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();
            setDragOver(false);
        },
        [],
    );

    const handleDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();
            setDragOver(false);
            const dropped = event.dataTransfer.files[0];
            acceptFile(dropped);
        },
        [acceptFile],
    );

    const handleUpload = async () => {
        if (!file) {
            return;
        }

        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/ota/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const data = await response.json() as {
                    error: string;
                };

                throw new Error(data.error);
            }

            notifications.show({
                title: 'Success',
                message: `Firmware ${file.name} uploaded`,
                color: 'green',
            });

            setFile(null);
            await fetchFirmwares();
        } catch (error) {
            notifications.show({
                title: 'Upload failed',
                message: error instanceof Error
                    ? error.message
                    : 'Unknown error',
                color: 'red',
            });
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (filename: string) => {
        try {
            const response = await fetch('/api/ota/upload', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename }),
            });

            if (!response.ok) {
                throw new Error('Delete failed');
            }

            notifications.show({
                title: 'Deleted',
                message: `Firmware ${filename} deleted`,
                color: 'green',
            });

            await fetchFirmwares();
        } catch (error) {
            notifications.show({
                title: 'Delete failed',
                message: error instanceof Error
                    ? error.message
                    : 'Unknown error',
                color: 'red',
            });
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) {
            return `${bytes} B`;
        }

        return `${(bytes / 1024).toFixed(1)} KB`;
    };

    return (
        <Container size="md" py="xl">
            <Stack gap="lg">
                <Title order={ 2 }>
                    UMeter OTA — Firmware Management
                </Title>

                <Box
                    style={ {
                        border: `2px dashed var(--mantine-color-${dragOver ? 'blue-5' : 'dark-4'})`,
                        borderRadius: 'var(--mantine-radius-sm)',
                        padding: 'var(--mantine-spacing-xl)',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'border-color 150ms, background 150ms',
                        background: dragOver
                            ? 'var(--mantine-color-dark-6)'
                            : 'transparent',
                    } }
                    onDragOver={ handleDragOver }
                    onDragLeave={ handleDragLeave }
                    onDrop={ handleDrop }
                    onClick={ () => fileInputRef.current?.click() }
                >
                    <input
                        ref={ fileInputRef }
                        type="file"
                        accept=".bin"
                        style={ { display: 'none' } }
                        onChange={ (event) => {
                            const selected = event.target.files?.[0];
                            if (selected) {
                                acceptFile(selected);
                            }
                            event.target.value = '';
                        } }
                    />

                    { file ? (
                        <Text size="sm">
                            { file.name }
                            { ' ' }
                            (
                            { formatSize(file.size) }
                            )
                        </Text>
                    ) : (
                        <Stack gap={ 4 } align="center">
                            <Text size="sm" c="dimmed">
                                Drag & drop a .bin file here,
                                click to select, or paste from
                                clipboard
                            </Text>
                        </Stack>
                    ) }
                </Box>

                <Button
                    fullWidth
                    loading={ uploading }
                    disabled={ !file }
                    onClick={ handleUpload }
                >
                    Upload
                </Button>

                { firmwares.length === 0 ? (
                    <Text c="dimmed">
                        No firmware files found.
                    </Text>
                ) : (
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Filename</Table.Th>
                                <Table.Th>Device</Table.Th>
                                <Table.Th>Version</Table.Th>
                                <Table.Th>Size</Table.Th>
                                <Table.Th />
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            { firmwares.map((fw) => (
                                <Table.Tr key={ fw.filename }>
                                    <Table.Td>
                                        <Text
                                            size="sm"
                                            ff="monospace"
                                        >
                                            { fw.filename }
                                        </Text>
                                    </Table.Td>
                                    <Table.Td>
                                        { fw.name }
                                    </Table.Td>
                                    <Table.Td>
                                        { fw.ver }
                                    </Table.Td>
                                    <Table.Td>
                                        { formatSize(fw.size) }
                                    </Table.Td>
                                    <Table.Td>
                                        <ActionIcon
                                            variant="subtle"
                                            color="red"
                                            size="sm"
                                            onClick={
                                                () => handleDelete(
                                                    fw.filename,
                                                )
                                            }
                                        >
                                            ✕
                                        </ActionIcon>
                                    </Table.Td>
                                </Table.Tr>
                            )) }
                        </Table.Tbody>
                    </Table>
                ) }
            </Stack>
        </Container>
    );
}
