'use client';

import { Paper, Skeleton, Table, Title } from '@mantine/core';
import moment from 'moment';

import type { StationDetail } from '@/lib/types/station';
import { binverToString } from '@/lib/utils/version';

function formatDate(
    dateString: string | null | undefined,
): string {
    if (!dateString) {
        return '-';
    }

    return moment(dateString).format('MM/DD/YYYY, HH:mm:ss');
}

interface DataRow {
    label: string;
    value: string | number;
    ts?: string | null;
}

const ROW_LABELS = [
    'Voltage',
    'Ticks',
    'Tamper',
    'App Git',
    'App Version',
    'BL Git',
    'BL Status',
    'MCU',
    'APN',
    'Period App',
    'Period Sensor',
    'MCC',
    'MNC',
    'LAC',
    'CID',
    'LEV',
];

function SkeletonRows() {
    return (
        <>
            { ROW_LABELS.map((label) => (
                <Table.Tr key={ label }>
                    <Table.Td>{ label }</Table.Td>
                    <Table.Td>
                        <Skeleton height={ 16 } width="60%" />
                    </Table.Td>
                    <Table.Td>
                        <Skeleton height={ 16 } width="40%" />
                    </Table.Td>
                </Table.Tr>
            )) }
        </>
    );
}

interface StationDataTableProps {
    detail?: StationDetail;
    loading?: boolean;
}

export function StationDataTable({
    detail,
    loading,
}: StationDataTableProps) {
    const rows: DataRow[] = detail
        ? [
            {
                label: 'Voltage',
                value: detail.voltage != null
                    ? `${detail.voltage.toFixed(2)} V`
                    : '-',
                ts: detail.lastSeen,
            },
            {
                label: 'Ticks',
                value: detail.ticks ?? '-',
                ts: detail.lastSeen,
            },
            {
                label: 'Tamper',
                value: detail.tamper != null
                    ? (detail.tamper ? 'Yes' : 'No')
                    : '-',
                ts: detail.lastSeen,
            },
            {
                label: 'App Git',
                value: detail.info?.appGit ?? '-',
            },
            {
                label: 'App Version',
                value: detail.info?.appVer != null
                    ? binverToString(detail.info.appVer)
                    : '-',
            },
            {
                label: 'BL Git',
                value: detail.info?.blGit ?? '-',
            },
            {
                label: 'BL Status',
                value: detail.info?.blStatus ?? '-',
            },
            {
                label: 'MCU',
                value: detail.info?.mcu ?? '-',
            },
            {
                label: 'APN',
                value: detail.config?.apn ?? '-',
            },
            {
                label: 'Period App',
                value: detail.config?.periodUpload ?? '-',
            },
            {
                label: 'Period Sensor',
                value: detail.config?.periodSensors ?? '-',
            },
            {
                label: 'MCC',
                value: detail.cnet?.mcc ?? '-',
            },
            {
                label: 'MNC',
                value: detail.cnet?.mnc ?? '-',
            },
            {
                label: 'LAC',
                value: detail.cnet?.lac ?? '-',
            },
            {
                label: 'CID',
                value: detail.cnet?.cid ?? '-',
            },
            {
                label: 'LEV',
                value: detail.cnet?.lev ?? '-',
            },
        ]
        : [];

    return (
        <Paper withBorder p="md" radius="md">
            <Title order={ 4 } mb="md">
                Station Info
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
                    { loading || !detail
                        ? <SkeletonRows />
                        : rows.map((row) => (
                            <Table.Tr key={ row.label }>
                                <Table.Td>
                                    { row.label }
                                </Table.Td>
                                <Table.Td>
                                    { row.value }
                                </Table.Td>
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
