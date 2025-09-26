// Rewrites para apuntar /api/* al backend.
const API_HOST = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const nextConfig = {
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${API_HOST}/api/:path*` },
    ];
  },
};

export default nextConfig;
