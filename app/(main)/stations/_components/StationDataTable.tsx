'use client';

import { Paper, Table, Title } from '@mantine/core';

import type { StationDetail } from '@/lib/types/station';

function formatDate(dateString: string | null | undefined): string {
    if (!dateString) {
        return '-';
    }

    const d = new Date(dateString);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1)
        .toString()
        .padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes()
        .toString()
        .padStart(2, '0');
    const seconds = d.getSeconds()
        .toString()
        .padStart(2, '0');

    return `${month}/${day}/${year}, ${hours}:${minutes}:${seconds}`;
}

interface DataRow {
    label: string;
    value: string | number;
    ts: string | null | undefined;
}

export function StationDataTable({ detail }: {
    detail: StationDetail;
}) {
    const latest = detail.records.length > 0
        ? detail.records[detail.records.length - 1]
        : null;

    const rows: DataRow[] = [
        {
            label: 'Temperature',
            value: latest?.temperature != null
                ? `${latest.temperature.toFixed(1)} °C`
                : '-',
            ts: latest?.ts,
        },
        {
            label: 'Humidity',
            value: latest?.humidity != null
                ? `${latest.humidity.toFixed(1)} %`
                : '-',
            ts: latest?.ts,
        },
        {
            label: 'Pressure',
            value: latest?.pressure != null
                ? `${latest.pressure.toFixed(1)} hPa`
                : '-',
            ts: latest?.ts,
        },
        {
            label: 'Wind direction',
            value: latest?.windDirection != null
                ? `${latest.windDirection.toFixed(1)}°`
                : '-',
            ts: latest?.ts,
        },
        {
            label: 'Wind speed',
            value: latest?.windSpeedAvg ?? '-',
            ts: latest?.ts,
        },
        {
            label: 'Voltage',
            value: detail.voltage != null
                ? `${detail.voltage.toFixed(2)} V`
                : '-',
            ts: latest?.ts,
        },
        {
            label: 'Ticks',
            value: detail.ticks ?? '-',
            ts: detail.lastSeen,
        },
        {
            label: 'Tamper',
            value: detail.tamper !== null
                ? (detail.tamper ? 'Yes' : 'No')
                : '-',
            ts: detail.lastSeen,
        },
        {
            label: 'App Git',
            value: detail.info?.appGit ?? '-',
            ts: null,
        },
        {
            label: 'App Version',
            value: detail.info?.appVer ?? '-',
            ts: null,
        },
        {
            label: 'BL Git',
            value: detail.info?.blGit ?? '-',
            ts: null,
        },
        {
            label: 'BL Status',
            value: detail.info?.blStatus ?? '-',
            ts: null,
        },
        {
            label: 'MCU',
            value: detail.info?.mcu ?? '-',
            ts: null,
        },
        {
            label: 'APN',
            value: detail.info?.apn ?? '-',
            ts: null,
        },
        {
            label: 'Period App',
            value: detail.info?.periodUpload ?? '-',
            ts: null,
        },
        {
            label: 'Period Sensor',
            value: detail.info?.periodSensors ?? '-',
            ts: null,
        },
        {
            label: 'MCC',
            value: detail.cnet?.mcc ?? '-',
            ts: null,
        },
        {
            label: 'MNC',
            value: detail.cnet?.mnc ?? '-',
            ts: null,
        },
        {
            label: 'LAC',
            value: detail.cnet?.lac ?? '-',
            ts: null,
        },
        {
            label: 'CID',
            value: detail.cnet?.cid ?? '-',
            ts: null,
        },
        {
            label: 'LEV',
            value: detail.cnet?.lev ?? '-',
            ts: null,
        },
    ];

    return (
        <Paper
            withBorder
            p="md"
            radius="md"
            mt="xl"
        >
            <Title order={ 4 } mb="md">
                Latest Readings & Info
            </Title>
            <Table striped highlightOnHover>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>Parameter</Table.Th>
                        <Table.Th>Value</Table.Th>
                        <Table.Th>Time</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    { rows.map((row) => (
                        <Table.Tr key={ row.label }>
                            <Table.Td>{ row.label }</Table.Td>
                            <Table.Td>{ row.value }</Table.Td>
                            <Table.Td>
                                { formatDate(row.ts) }
                            </Table.Td>
                        </Table.Tr>
                    )) }
                </Table.Tbody>
            </Table>
        </Paper>
    );
}
