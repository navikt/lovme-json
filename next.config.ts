import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: 'standalone',
    assetPrefix: process.env.NODE_ENV === 'production' ? 'https://cdn.nav.no/medlemskap' : undefined,
    /* config options here */
};

export default nextConfig;