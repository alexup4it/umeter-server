'use client';

import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';

import 'leaflet/dist/leaflet.css';
import Link from 'next/link';

import { Group, Text, Stack } from '@mantine/core';
import L from 'leaflet';

import type { StationSummary } from '@/lib/types/station';

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
                            <Stack gap="xs" style={ { minWidth: 150 } }>
                                <Text fw={ 600 } size="sm">
                                    <Link
                                        href={ `/stations/${station.uid}` }
                                        style={ { color: 'inherit', textDecoration: 'none' } }
                                    >
                                        { station.name ?? station.uid }
                                    </Link>
                                </Text>
                                <Group justify="space-between">
                                    <Text size="xs" c="dimmed">Temp:</Text>
                                    <Text size="xs" fw={ 500 }>
                                        { station.temperature != null ? `${(station.temperature / 100).toFixed(1)}°C` : '--' }
                                    </Text>
                                </Group>
                                <Group justify="space-between">
                                    <Text size="xs" c="dimmed">Humidity:</Text>
                                    <Text size="xs" fw={ 500 }>
                                        { station.humidity != null ? `${(station.humidity / 100).toFixed(1)}%` : '--' }
                                    </Text>
                                </Group>
                            </Stack>
                        </Popup>
                    </Marker>
                )) }
            </MapContainer>
        </div>
    );
}
