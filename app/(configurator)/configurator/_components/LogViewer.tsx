'use client';

import {
    type ReactNode,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

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

import type { LogEntry, LogLevel } from '../_lib/types';

interface LogViewerProps {
    logs: LogEntry[];
    onClear: () => void;
}

function formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', { hour12: false });
}

const LEVEL_COLORS: Record<LogLevel, string> = {
    I: 'blue',
    W: 'yellow',
    E: 'red',
};

const LEVEL_LABELS: Record<LogLevel, string> = {
    I: 'Info',
    W: 'Warn',
    E: 'Error',
};

const ALL_LEVELS: LogLevel[] = ['I', 'W', 'E'];

const TAG_COLORS: Record<string, string> = {
    info: 'blue',
    warn: 'yellow',
    error: 'red',
    debug: 'gray',
};

function getTagColor(tag: string, level: LogLevel | null): string {
    if (level) {
        return LEVEL_COLORS[level];
    }

    return TAG_COLORS[tag.toLowerCase()] ?? 'gray';
}

/**
 * Render payload text with special characters highlighted.
 * - `\\` → plain `\`
 * - `\r` → highlighted `\r`
 * - `\n` → highlighted `\n`
 */
function renderPayload(text: string): ReactNode[] {
    const parts: ReactNode[] = [];
    let index = 0;
    let buffer = '';

    function flushBuffer(): void {
        if (buffer.length > 0) {
            parts.push(buffer);
            buffer = '';
        }
    }

    while (index < text.length) {
        if (text[index] === '\\' && index + 1 < text.length) {
            const next = text[index + 1];

            if (next === 'r' || next === 'n') {
                flushBuffer();
                parts.push(
                    <Text
                        key={ `esc-${String(index)}` }
                        component="span"
                        size="xs"
                        ff="monospace"
                        c="violet"
                        style={ { opacity: 0.7 } }
                    >
                        { `\\${next}` }
                    </Text>,
                );
                index += 2;
                continue;
            }

            if (next === '\\') {
                buffer += '\\';
                index += 2;
                continue;
            }
        }

        buffer += text[index];
        index += 1;
    }

    flushBuffer();

    return parts;
}

const ROW_HEIGHT = 26;
const OVERSCAN = 20;
const SCROLL_BOTTOM_THRESHOLD = 30;

export function LogViewer({ logs, onClear }: LogViewerProps) {
    const [autoScroll, setAutoScroll] = useState(true);
    const [excludedTags, setExcludedTags] = useState<Set<string>>(
        new Set(),
    );
    const [excludedLevels, setExcludedLevels] = useState<Set<LogLevel>>(
        new Set(),
    );
    const viewportRef = useRef<HTMLDivElement>(null);
    const isUserScrollRef = useRef(true);
    const [scrollTop, setScrollTop] = useState(0);
    const [viewportHeight, setViewportHeight] = useState(0);

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
        () => {
            const hasTagFilter = excludedTags.size > 0;
            const hasLevelFilter = excludedLevels.size > 0;

            if (!hasTagFilter && !hasLevelFilter) {
                return logs;
            }

            return logs.filter((entry) => {
                if (hasTagFilter && excludedTags.has(entry.tag)) {
                    return false;
                }
                if (
                    hasLevelFilter
                    && entry.level
                    && excludedLevels.has(entry.level)
                ) {
                    return false;
                }

                return true;
            });
        },
        [logs, excludedTags, excludedLevels],
    );

    const isFiltered = excludedTags.size > 0
        || excludedLevels.size > 0;

    // Virtualization: only render visible rows + overscan
    const totalHeight = filteredLogs.length * ROW_HEIGHT;

    const { startIndex, endIndex } = useMemo(() => {
        const start = Math.max(
            0,
            Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN,
        );
        const visibleCount = Math.ceil(viewportHeight / ROW_HEIGHT);
        const end = Math.min(
            filteredLogs.length,
            start + visibleCount + OVERSCAN * 2,
        );

        return { startIndex: start, endIndex: end };
    }, [scrollTop, viewportHeight, filteredLogs.length]);

    const visibleLogs = useMemo(
        () => filteredLogs.slice(startIndex, endIndex),
        [filteredLogs, startIndex, endIndex],
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

    function toggleLevel(level: LogLevel): void {
        setExcludedLevels((prev) => {
            const next = new Set(prev);

            if (next.has(level)) {
                next.delete(level);
            } else {
                next.add(level);
            }

            return next;
        });
    }

    // Track scroll position for auto-scroll and virtualization
    const handleScrollPositionChange = useCallback(
        ({ y }: { x: number; y: number }) => {
            setScrollTop(y);

            if (!isUserScrollRef.current) {
                isUserScrollRef.current = true;

                return;
            }

            const viewport = viewportRef.current;

            if (!viewport) {
                return;
            }

            const distanceFromBottom = viewport.scrollHeight
                - viewport.clientHeight
                - y;
            const isAtBottom = distanceFromBottom
                <= SCROLL_BOTTOM_THRESHOLD;

            setAutoScroll(isAtBottom);
        },
        [],
    );

    // Measure viewport height for virtualization
    useEffect(() => {
        const viewport = viewportRef.current;

        if (!viewport) {
            return;
        }

        const observer = new ResizeObserver(([entry]) => {
            setViewportHeight(entry.contentRect.height);
        });

        observer.observe(viewport);
        setViewportHeight(viewport.clientHeight);

        return () => {
            observer.disconnect();
        };
    }, []);

    // Auto-scroll to bottom when new logs arrive
    useEffect(() => {
        if (autoScroll && viewportRef.current) {
            isUserScrollRef.current = false;
            viewportRef.current.scrollTo({
                top: viewportRef.current.scrollHeight,
                behavior: 'smooth',
            });
        }
    }, [filteredLogs.length, autoScroll]);

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
                            { isFiltered
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

                <Group gap={ 8 }>
                    { ALL_LEVELS.map((level) => {
                        const isExcluded = excludedLevels.has(level);

                        return (
                            <Badge
                                key={ level }
                                size="xs"
                                variant={
                                    isExcluded
                                        ? 'outline'
                                        : 'filled'
                                }
                                color={
                                    LEVEL_COLORS[level]
                                }
                                style={ {
                                    cursor: 'pointer',
                                    opacity: isExcluded
                                        ? 0.4
                                        : 1,
                                } }
                                onClick={
                                    () => {
                                        toggleLevel(level);
                                    }
                                }
                            >
                                { LEVEL_LABELS[level] }
                            </Badge>
                        );
                    }) }

                    { uniqueTags.length > 0 && (
                        <>
                            <Text
                                size="xs"
                                c="dimmed"
                                style={ { userSelect: 'none' } }
                            >
                                |
                            </Text>
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
                                        color="gray"
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
                        </>
                    ) }
                </Group>

                <ScrollArea
                    viewportRef={ viewportRef }
                    style={ { flex: 1 } }
                    type="auto"
                    offsetScrollbars
                    onScrollPositionChange={
                        handleScrollPositionChange
                    }
                >
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
                        <Box
                            style={ {
                                height: totalHeight,
                                position: 'relative',
                            } }
                        >
                            { visibleLogs.map((entry, i) => (
                                <Group
                                    key={ entry.id }
                                    gap={ 6 }
                                    wrap="nowrap"
                                    align="flex-start"
                                    style={ {
                                        borderBottom:
                                            '1px solid var(--mantine-color-dark-5)',
                                        height: ROW_HEIGHT,
                                        position: 'absolute',
                                        top:
                                            (startIndex + i)
                                            * ROW_HEIGHT,
                                        left: 0,
                                        right: 0,
                                        padding: '2px 0',
                                        overflow: 'hidden',
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
                                    { entry.level && (
                                        <Badge
                                            size="xs"
                                            variant="filled"
                                            color={
                                                LEVEL_COLORS[
                                                    entry.level
                                                ]
                                            }
                                            style={ {
                                                flexShrink: 0,
                                                minWidth: 14,
                                            } }
                                        >
                                            { entry.level }
                                        </Badge>
                                    ) }
                                    { entry.tag && (
                                        <Badge
                                            size="xs"
                                            variant="light"
                                            color={
                                                getTagColor(
                                                    entry.tag,
                                                    entry.level,
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
                                        component="span"
                                        style={ {
                                            wordBreak: 'break-all',
                                            lineHeight: 1.4,
                                            overflow: 'hidden',
                                            textOverflow:
                                                'ellipsis',
                                            whiteSpace: 'nowrap',
                                        } }
                                    >
                                        { renderPayload(
                                            entry.payload
                                            || entry.raw,
                                        ) }
                                    </Text>
                                </Group>
                            )) }
                        </Box>
                    ) }
                </ScrollArea>
            </Stack>
        </Paper>
    );
}
