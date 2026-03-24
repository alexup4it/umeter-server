import { Container, Stack, Title } from '@mantine/core';

import { fetchStationSummaries } from '@/lib/data/stations';

import { StationsDashboard } from './_components/StationsDashboard';

export const revalidate = 0;

export default async function WeatherStationsPage() {
    const stations = await fetchStationSummaries();

    return (
        <Container size="xl" py="xl">
            <Stack gap="xl">
                <Title order={ 1 }>Weather Stations</Title>

                <StationsDashboard initialStations={ stations } />
            </Stack>
        </Container>
    );
}
