'use client';

import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';

import 'leaflet/dist/leaflet.css';
import Link from 'next/link';

import { Group, SimpleGrid, Text } from '@mantine/core';
import L from 'leaflet';

import type { StationSummary } from '@/lib/types/station';

const COMPASS = [
    'N',
    'NNE',
    'NE',
    'ENE',
    'E',
    'ESE',
    'SE',
    'SSE',
    'S',
    'SSW',
    'SW',
    'WSW',
    'W',
    'WNW',
    'NW',
    'NNW',
] as const;

function degToCompass(deg: number): string {
    return COMPASS[Math.round(deg / 22.5) % 16];
}

// Fix Leaflet default icon paths in Next.js
// using unpkg CDN since Leaflet looks for images relative to CSS path by default
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

const DEFAULT_ICON = L.icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DEFAULT_ICON;

interface StationsMapProps {
    stations: StationSummary[];
}

export default function StationsMap({ stations }: StationsMapProps) {
    const validStations = stations.filter(
        (item) => item.lat != null && item.lng != null && !isNaN(item.lat) && !isNaN(item.lng),
    );

    let initialCenter: [number, number] = [50, 30];
    let initialZoom = 3;

    if (validStations.length > 0) {
        let sumLat = 0;
        let sumLng = 0;
        validStations.forEach((item) => {
            sumLat += item.lat ?? 0;
            sumLng += item.lng ?? 0;
        });
        initialCenter = [sumLat / validStations.length, sumLng / validStations.length];
        initialZoom = validStations.length === 1 ? 10 : 5;
    }

    return (
        <div style={ { height: '500px', width: '100%', borderRadius: '8px', overflow: 'hidden' } }>
            <MapContainer
                center={ initialCenter }
                zoom={ initialZoom }
                style={ { height: '100%', width: '100%' } }
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                { validStations.map((station) => (
                    <Marker
                        key={ station.uid }
                        position={ [station.lat ?? 0, station.lng ?? 0] }
                    >
                        <Popup>
                            <div style={ { minWidth: 160 } }>
                                <Group justify="space-between" gap={ 4 } mb={ 4 }>
                                    <Text fw={ 600 } size="sm" style={ { lineHeight: 1.2 } }>
                                        <Link
                                            href={ `/stations/${station.uid}` }
                                            style={ { color: 'inherit', textDecoration: 'none' } }
                                        >
                                            { station.name ?? station.uid }
                                        </Link>
                                    </Text>
                                    <Text size="xs" c="dimmed" style={ { lineHeight: 1.2 } }>
                                        { station.voltage != null ? `${station.voltage.toFixed(2)}v` : '' }
                                    </Text>
                                </Group>
                                <SimpleGrid cols={ 2 } spacing={ 4 } verticalSpacing={ 2 }>
                                    <div>
                                        <Text size="xs" c="dimmed" lh={ 1.2 }>Temp</Text>
                                        <Text size="xs" fw={ 500 } lh={ 1.3 }>
                                            { station.temperature != null ? `${station.temperature.toFixed(1)}°C` : '--' }
                                        </Text>
                                    </div>
                                    <div>
                                        <Text size="xs" c="dimmed" lh={ 1.2 }>Humidity</Text>
                                        <Text size="xs" fw={ 500 } lh={ 1.3 }>
                                            { station.humidity != null ? `${station.humidity.toFixed(1)}%` : '--' }
                                        </Text>
                                    </div>
                                    <div>
                                        <Text size="xs" c="dimmed" lh={ 1.2 }>Wind</Text>
                                        <Text size="xs" fw={ 500 } lh={ 1.3 }>
                                            { station.count != null ? `${station.count}` : '--' }
                                        </Text>
                                    </div>
                                    <div>
                                        <Text size="xs" c="dimmed" lh={ 1.2 }>Direction</Text>
                                        <Text size="xs" fw={ 500 } lh={ 1.3 }>
                                            { station.angle != null
                                                ? (
                                                    <span title={ `${station.angle.toFixed(1)}°` }>
                                                        { degToCompass(station.angle) }
                                                        { ' ' }
                                                        <span
                                                            style={ {
                                                                display: 'inline-block',
                                                                transform: `rotate(${station.angle}deg)`,
                                                            } }
                                                        >
                                                            ↑
                                                        </span>
                                                    </span>
                                                )
                                                : '--' }
                                        </Text>
                                    </div>
                                </SimpleGrid>
                            </div>
                        </Popup>
                    </Marker>
                )) }
            </MapContainer>
        </div>
    );
}
