'use client';

import { Paper, Table, Title } from '@mantine/core';

import type { StationDetail } from '@/lib/types/station';

function formatDate(dateString: string | null | undefined): string {
    if (!dateString) {
        return '-';
    }

    const d = new Date(dateString);
    const year = d.getUTCFullYear();
    const month = (d.getUTCMonth() + 1)
        .toString()
        .padStart(2, '0');
    const day = d.getUTCDate().toString().padStart(2, '0');
    const hours = d.getUTCHours().toString().padStart(2, '0');
    const minutes = d.getUTCMinutes()
        .toString()
        .padStart(2, '0');
    const seconds = d.getUTCSeconds()
        .toString()
        .padStart(2, '0');

    return `${month}/${day}/${year}, ${hours}:${minutes}:${seconds} UTC`;
}

interface DataRow {
    label: string;
    value: string | number;
    ts: string | null | undefined;
}

export function StationDataTable({ detail }: {
    detail: StationDetail;
}) {
    const latestTemp = detail.temperature.length > 0
        ? detail.temperature[detail.temperature.length - 1]
        : null;
    const latestHum = detail.humidity.length > 0
        ? detail.humidity[detail.humidity.length - 1]
        : null;
    const latestWindDirection = detail.windDirection.length > 0
        ? detail.windDirection[detail.windDirection.length - 1]
        : null;
    const latestWindSpeed = detail.windSpeed.length > 0
        ? detail.windSpeed[detail.windSpeed.length - 1]
        : null;

    const rows: DataRow[] = [
        {
            label: 'Temperature',
            value: latestTemp
                ? `${latestTemp.value.toFixed(1)} °C`
                : '-',
            ts: latestTemp?.ts,
        },
        {
            label: 'Humidity',
            value: latestHum
                ? `${latestHum.value.toFixed(1)} %`
                : '-',
            ts: latestHum?.ts,
        },
        {
            label: 'Wind direction',
            value: latestWindDirection
                ? `${latestWindDirection.value.toFixed(1)}°`
                : '-',
            ts: latestWindDirection?.ts,
        },
        {
            label: 'Wind speed',
            value: latestWindSpeed?.windSpeedAvg ?? '-',
            ts: latestWindSpeed?.ts,
        },
        {
            label: 'Voltage',
            value: detail.voltage != null
                ? `${detail.voltage.toFixed(2)} V`
                : '-',
            ts: latestWindSpeed?.ts ?? latestTemp?.ts,
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
            label: 'Sens',
            value: detail.info?.sens ?? '-',
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
