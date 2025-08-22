/** @type {import('next').NextConfig} */
const nextConfig = {
    assetPrefix: process.env.NODE_ENV === 'production' ? 'https://cdn.nav.no/medlemskap' : undefined,

}

export default nextConfig;