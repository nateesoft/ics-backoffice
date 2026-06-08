import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['findigrealtime.dyndns.biz'],
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
