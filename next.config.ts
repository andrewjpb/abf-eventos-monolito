import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  deploymentId: process.env.DEPLOYMENT_ID || Date.now().toString(),
  eslint: {
    ignoreDuringBuilds: true,
  },
  allowedDevOrigins: [
    'eventos.abf.com.br',
    'www.eventos.abf.com.br',
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
      allowedOrigins: [
        'eventos.abf.com.br',
        'www.eventos.abf.com.br',
        'localhost:3000',
        'localhost:3111',
        'localhost',
        '10.0.0.23',
        '10.0.0.23:3111',
      ],
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