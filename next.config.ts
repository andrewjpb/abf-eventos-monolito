import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: [
      's3.abfti.com.br', // Permitir carregar imagens deste host
      'localhost'
    ],
    // Configuração opcional para otimização de imagens
    formats: ['image/avif', 'image/webp'],
    unoptimized: true, // Isso desativa a otimização para todas as imagens

  }
};

export default nextConfig;