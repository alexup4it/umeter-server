'use client';

import { Container, Stack, Title } from '@mantine/core';

import { StationsDashboard } from './_components/StationsDashboard';

export default function WeatherStationsPage() {
    return (
        <Container size="xl" py="xl">
            <Stack gap="xl">
                <Title order={ 1 }>Weather Stations</Title>

                <StationsDashboard />
            </Stack>
        </Container>
    );
}
