import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';

import { createTheme, MantineProvider } from '@mantine/core';

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/charts/styles.css';

const jetbrainsMono = JetBrains_Mono({
    subsets: ['latin', 'cyrillic'],
    variable: '--font-jetbrains-mono',
});

const theme = createTheme({
    fontFamily: 'var(--font-jetbrains-mono), monospace',
    fontFamilyMonospace: 'var(--font-jetbrains-mono), monospace',
    defaultRadius: 'sm',
});

export const metadata: Metadata = {
    title: 'UMeter — Weather Stations',
    description: 'Weather station monitoring dashboard',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            className={ jetbrainsMono.variable }
            lang="en"
            data-mantine-color-scheme="dark"
        >
            <head />
            <body>
                <MantineProvider
                    theme={ theme }
                    forceColorScheme="dark"
                    defaultColorScheme="dark"
                >
                    { children }
                </MantineProvider>
            </body>
        </html>
    );
}
