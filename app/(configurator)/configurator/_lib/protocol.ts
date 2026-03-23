import {
    type LogEntry,
    type LogLevel,
    type ProtocolResponse,
    type ReadableParamName,
    RESPONSE_PREFIX,
    type WritableParamName,
} from './types';

let logIdCounter = 0;

const VALID_LEVELS = new Set<string>(['I', 'W', 'E']);

export function buildIfaceCommand(): string {
    return JSON.stringify({ cmd: 'iface' });
}

export function buildReadCommand(param: ReadableParamName): string {
    return JSON.stringify({ cmd: 'rd_param', param });
}

export function buildWriteCommand(
    param: WritableParamName,
    value: number | string,
): string {
    return JSON.stringify({ cmd: 'wr_param', param, value });
}

export function buildSaveCommand(): string {
    return JSON.stringify({ cmd: 'save' });
}

export function buildResetCommand(): string {
    return JSON.stringify({ cmd: 'reset' });
}

/**
 * Parse the level/tag prefix from a log line.
 * New format: "L/TAG,..." where L is I, W, or E.
 * Legacy format: "TAG,..." (no level prefix).
 */
function parseLevelTag(raw: string): { level: LogLevel | null; tag: string } {
    if (
        raw.length >= 2
        && raw[1] === '/'
        && VALID_LEVELS.has(raw[0])
    ) {
        return {
            level: raw[0] as LogLevel,
            tag: raw.slice(2),
        };
    }

    return { level: null, tag: raw };
}

export function parseLine(
    raw: string,
): { type: 'response'; data: ProtocolResponse } | { type: 'log'; data: LogEntry } | null {
    const trimmed = raw.trim();
    if (trimmed.length === 0) {
        return null;
    }

    if (trimmed.startsWith(RESPONSE_PREFIX)) {
        const jsonStr = trimmed.slice(RESPONSE_PREFIX.length);
        try {
            const parsed = JSON.parse(jsonStr) as ProtocolResponse;

            return { type: 'response', data: parsed };
        } catch {
            return null;
        }
    }

    // Parse log line: [L/]TAG,TICKS,PAYLOAD
    const firstComma = trimmed.indexOf(',');
    if (firstComma === -1) {
        logIdCounter += 1;

        const { level, tag } = parseLevelTag(trimmed);

        return {
            type: 'log',
            data: {
                id: logIdCounter,
                timestamp: new Date(),
                level,
                tag: tag || trimmed,
                ticks: '',
                payload: trimmed,
                raw: trimmed,
            },
        };
    }

    const rawTag = trimmed.slice(0, firstComma);
    const { level, tag } = parseLevelTag(rawTag);
    const rest = trimmed.slice(firstComma + 1);
    const secondComma = rest.indexOf(',');

    let ticks: string;
    let payload: string;

    if (secondComma === -1) {
        ticks = rest;
        payload = '';
    } else {
        ticks = rest.slice(0, secondComma);
        payload = rest.slice(secondComma + 1);
    }

    logIdCounter += 1;

    return {
        type: 'log',
        data: {
            id: logIdCounter,
            timestamp: new Date(),
            level,
            tag,
            ticks,
            payload,
            raw: trimmed,
        },
    };
}
