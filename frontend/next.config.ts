import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/ics-backoffice',
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/:path*',
        basePath: false,
      },
    ];
  },
};

export default nextConfig;
