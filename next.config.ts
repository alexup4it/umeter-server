import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    output: 'standalone',
    serverExternalPackages: ['pg', '@prisma/adapter-pg'],
    allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean),
};

export default nextConfig;
