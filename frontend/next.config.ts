import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/ics-backoffice',
  output: 'standalone',
  allowedDevOrigins: ['findigrealtime.dyndns.biz', '183.88.210.11'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/:path*',
      },
    ];
  },
};

export default nextConfig;
