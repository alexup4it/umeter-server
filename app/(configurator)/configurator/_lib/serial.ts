import { parseLine } from './protocol';
import type { ConnectionStatus, LogEntry, ProtocolResponse } from './types';

export type ResponseHandler = (response: ProtocolResponse) => void;
export type LogHandler = (entry: LogEntry) => void;
export type StatusHandler = (status: ConnectionStatus) => void;

export class SerialConnection {
    private _port: SerialPort | null = null;
    private _reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    private _writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
    private _readLoopActive = false;
    private _buffer = '';
    private _status: ConnectionStatus = 'disconnected';

    private _onResponse: ResponseHandler | null = null;
    private _onLog: LogHandler | null = null;
    private _onStatusChange: StatusHandler | null = null;

    private _encoder = new TextEncoder();
    private _decoder = new TextDecoder();

    get status(): ConnectionStatus {
        return this._status;
    }

    set onResponse(handler: ResponseHandler | null) {
        this._onResponse = handler;
    }

    set onLog(handler: LogHandler | null) {
        this._onLog = handler;
    }

    set onStatusChange(handler: StatusHandler | null) {
        this._onStatusChange = handler;
    }

    /**
     * Connect by requesting a port from the user (requires gesture).
     */
    async connect(): Promise<void> {
        if (this._port) {
            return;
        }

        this._setStatus('connecting');

        try {
            const port = await navigator.serial.requestPort();
            await this._openPort(port);
        } catch {
            this._setStatus('disconnected');

            throw new Error('Failed to connect to serial port');
        }
    }

    /**
     * Auto-connect to the last used port without user gesture.
     * Uses navigator.serial.getPorts() which returns previously
     * granted ports. Returns true if connected, false otherwise.
     */
    async autoConnect(): Promise<boolean> {
        if (this._port) {
            return true;
        }

        try {
            const ports = await navigator.serial.getPorts();
            if (ports.length === 0) {
                return false;
            }

            // Use the last port (most recently granted)
            const port = ports[ports.length - 1];

            this._setStatus('connecting');
            await this._openPort(port);

            return true;
        } catch {
            this._setStatus('disconnected');

            return false;
        }
    }

    async disconnect(): Promise<void> {
        this._readLoopActive = false;

        try {
            if (this._reader) {
                await this._reader.cancel();
                this._reader.releaseLock();
                this._reader = null;
            }

            if (this._writer) {
                this._writer.releaseLock();
                this._writer = null;
            }

            if (this._port) {
                await this._port.close();
                this._port = null;
            }
        } catch {
            // Port may already be closed (device reset)
        } finally {
            this._port = null;
            this._reader = null;
            this._writer = null;
            this._buffer = '';
            this._setStatus('disconnected');
        }
    }

    async send(data: string): Promise<void> {
        if (!this._writer) {
            throw new Error('Not connected');
        }

        const encoded = this._encoder.encode(data);
        await this._writer.write(encoded);
    }

    private async _openPort(port: SerialPort): Promise<void> {
        await port.open({ baudRate: 115200 });

        this._port = port;

        if (port.writable) {
            this._writer = port.writable.getWriter();
        }

        this._setStatus('connected');
        this._startReadLoop();
    }

    private _setStatus(status: ConnectionStatus): void {
        this._status = status;
        this._onStatusChange?.(status);
    }

    private _startReadLoop(): void {
        if (!this._port?.readable) {
            return;
        }

        this._reader = this._port.readable.getReader();
        this._readLoopActive = true;

        void this._readLoop();
    }

    private async _readLoop(): Promise<void> {
        if (!this._reader) {
            return;
        }

        try {
            while (this._readLoopActive) {
                const { value, done } = await this._reader.read();

                if (done) {
                    break;
                }

                this._buffer += this._decoder.decode(
                    value,
                    { stream: true },
                );
                this._processBuffer();
            }
        } catch {
            // Read error — port may have been disconnected
        } finally {
            await this.disconnect();
        }
    }

    private _processBuffer(): void {
        const lines = this._buffer.split('\n');

        // Keep the last incomplete chunk in the buffer
        this._buffer = lines.pop() ?? '';

        for (const line of lines) {
            const cleaned = line.replace(/\r$/, '');
            const parsed = parseLine(cleaned);

            if (!parsed) {
                continue;
            }

            if (parsed.type === 'response') {
                this._onResponse?.(parsed.data);
            } else {
                this._onLog?.(parsed.data);
            }
        }
    }
}
