const nextConfig = {
  async rewrites() {
    return [
      { source: "/api/:path*", destination: "http://localhost:4000/api/:path*" },
      { source: "/uploads/:path*", destination: "http://localhost:4000/uploads/:path*" },
    ];
  },
};
export default nextConfig;
