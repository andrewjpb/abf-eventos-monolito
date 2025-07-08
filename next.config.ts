import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's3.abfti.com.br',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      }
    ],
    // Configuração opcional para otimização de imagens
    formats: ['image/avif', 'image/webp'],
    unoptimized: true, // Isso desativa a otimização para todas as imagens
  }
};

export default nextConfig;