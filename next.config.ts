import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Aumentar limite para 10MB
    },
  },
  // Redirects para compatibilidade com URLs antigas
  async redirects() {
    return [
      {
        source: '/app/event/:id',
        destination: '/eventos/:id',
        permanent: true, // 301 redirect
      },
      {
        source: '/app/event',
        destination: '/eventos',
        permanent: true,
      },
      {
        source: '/app',
        destination: '/',
        permanent: true,
      },
    ]
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