'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import {
    ActionIcon,
    Badge,
    Box,
    Group,
    Paper,
    ScrollArea,
    Stack,
    Text,
    Title,
    Tooltip,
} from '@mantine/core';

import type { LogEntry } from '../_lib/types';

interface LogViewerProps {
    logs: LogEntry[];
    onClear: () => void;
}

function formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', { hour12: false });
}

const TAG_COLORS: Record<string, string> = {
    info: 'blue',
    warn: 'yellow',
    error: 'red',
    debug: 'gray',
};

function getTagColor(tag: string): string {
    return TAG_COLORS[tag.toLowerCase()] ?? 'gray';
}

export function LogViewer({ logs, onClear }: LogViewerProps) {
    const [autoScroll, setAutoScroll] = useState(true);
    const [excludedTags, setExcludedTags] = useState<Set<string>>(
        new Set(),
    );
    const viewportRef = useRef<HTMLDivElement>(null);

    const uniqueTags = useMemo(() => {
        const tags = new Set<string>();

        for (const entry of logs) {
            if (entry.tag) {
                tags.add(entry.tag);
            }
        }

        return [...tags].sort();
    }, [logs]);

    const filteredLogs = useMemo(
        () => excludedTags.size === 0
            ? logs
            : logs.filter(
                (entry) => !excludedTags.has(entry.tag),
            ),
        [logs, excludedTags],
    );

    function toggleTag(tag: string): void {
        setExcludedTags((prev) => {
            const next = new Set(prev);

            if (next.has(tag)) {
                next.delete(tag);
            } else {
                next.add(tag);
            }

            return next;
        });
    }

    useEffect(() => {
        if (autoScroll && viewportRef.current) {
            viewportRef.current.scrollTo({
                top: viewportRef.current.scrollHeight,
                behavior: 'smooth',
            });
        }
    }, [filteredLogs, autoScroll]);

    return (
        <Paper
            p="md"
            withBorder
            style={ { height: 'calc(100vh - 130px)' } }
        >
            <Stack gap="sm" h="100%">
                <Group justify="space-between">
                    <Group gap="xs">
                        <Title order={ 5 }>Log</Title>
                        <Badge
                            size="sm"
                            variant="light"
                            color="gray"
                        >
                            { filteredLogs.length }
                            { excludedTags.size > 0
                                && `/${logs.length}` }
                        </Badge>
                    </Group>
                    <Group gap="xs">
                        <Tooltip
                            label={
                                autoScroll
                                    ? 'Auto-scroll ON'
                                    : 'Auto-scroll OFF'
                            }
                        >
                            <ActionIcon
                                size="sm"
                                variant={
                                    autoScroll ? 'filled' : 'subtle'
                                }
                                color={
                                    autoScroll ? 'blue' : 'gray'
                                }
                                onClick={
                                    () => {
                                        setAutoScroll(
                                            (prev) => !prev,
                                        );
                                    }
                                }
                            >
                                <Text size="xs">
                                    &darr;
                                </Text>
                            </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Clear log">
                            <ActionIcon
                                size="sm"
                                variant="subtle"
                                color="red"
                                onClick={ onClear }
                            >
                                <Text size="xs">
                                    &times;
                                </Text>
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                </Group>

                { uniqueTags.length > 0 && (
                    <Group gap={ 4 }>
                        { uniqueTags.map((tag) => {
                            const isExcluded = excludedTags.has(tag);

                            return (
                                <Badge
                                    key={ tag }
                                    size="xs"
                                    variant={
                                        isExcluded
                                            ? 'outline'
                                            : 'light'
                                    }
                                    color={
                                        getTagColor(tag)
                                    }
                                    style={ {
                                        cursor: 'pointer',
                                        opacity: isExcluded
                                            ? 0.4
                                            : 1,
                                    } }
                                    onClick={
                                        () => {
                                            toggleTag(tag);
                                        }
                                    }
                                >
                                    { tag }
                                </Badge>
                            );
                        }) }
                    </Group>
                ) }

                <ScrollArea
                    viewportRef={ viewportRef }
                    style={ { flex: 1 } }
                    type="auto"
                    offsetScrollbars
                >
                    <Box>
                        { filteredLogs.length === 0 ? (
                            <Text
                                size="xs"
                                c="dimmed"
                                ta="center"
                                pt="xl"
                            >
                                { logs.length === 0
                                    ? 'No log entries yet. Connect to a device to see logs.'
                                    : 'All entries filtered out.' }
                            </Text>
                        ) : (
                            filteredLogs.map((entry) => (
                                <Group
                                    key={ entry.id }
                                    gap={ 6 }
                                    wrap="nowrap"
                                    align="flex-start"
                                    style={ {
                                        borderBottom:
                                            '1px solid var(--mantine-color-dark-5)',
                                        padding: '2px 0',
                                    } }
                                >
                                    <Text
                                        size="xs"
                                        c="dimmed"
                                        ff="monospace"
                                        style={ {
                                            whiteSpace: 'nowrap',
                                            flexShrink: 0,
                                        } }
                                    >
                                        { formatTime(
                                            entry.timestamp,
                                        ) }
                                    </Text>
                                    { entry.tag && (
                                        <Badge
                                            size="xs"
                                            variant="light"
                                            color={
                                                getTagColor(
                                                    entry.tag,
                                                )
                                            }
                                            style={ {
                                                flexShrink: 0,
                                            } }
                                        >
                                            { entry.tag }
                                        </Badge>
                                    ) }
                                    <Text
                                        size="xs"
                                        ff="monospace"
                                        style={ {
                                            wordBreak: 'break-all',
                                            lineHeight: 1.4,
                                        } }
                                    >
                                        { entry.payload || entry.raw }
                                    </Text>
                                </Group>
                            ))
                        ) }
                    </Box>
                </ScrollArea>
            </Stack>
        </Paper>
    );
}
