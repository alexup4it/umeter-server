import moment from 'moment';

import type { SensorRecord } from '@/lib/types/station';

export interface ChartDataPoint {
    date: string;
    temperature: number;
    humidity: number;
    pressure: number;
    windDirection: number;
    windSpeedAvg: number;
    windSpeedMin: number;
    windSpeedMax: number;
    voltage: number;
}

/**
 * Transform raw sensor records into a single array of chart data points.
 * All charts share this one dataset and pick their fields via `series`.
 */
export function toChartData(records: SensorRecord[]): ChartDataPoint[] {
    return records.map((record) => ({
        ...record,
        date: moment(record.ts).format('MMM D, HH:mm'),
    }));
}
