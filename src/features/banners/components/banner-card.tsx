// /features/banners/components/banner-card.tsx
"use client"

import Image from "next/image"
import { BannerWithDetails } from "../types"

interface BannerCardProps {
  banner: BannerWithDetails
}

export function BannerCard({ banner }: BannerCardProps) {
  return (
    <div className="w-full h-full overflow-hidden rounded-lg shadow-md border border-border bg-card hover:shadow-lg transition-shadow">
      <a
        href={banner.external_link}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full"
      >
        {/* Imagem do banner - Adaptada para altura reduzida */}
        <div className="relative w-full h-full bg-muted items-start justify-start">
          {banner.image_url ? (
            <Image
              src={banner.image_url}
              alt={banner.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              priority
              className="object-contain"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Image
                src="/placeholder-image.svg"
                alt="Imagem não disponível"
                width={60}
                height={60}
                className="opacity-30"
              />
            </div>
          )}

          {/* Sobreposição sutil para tornar os indicadores mais visíveis */}
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/30 to-transparent" />

          {/* Título do banner apenas em dispositivos pequenos */}
          <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 text-white sm:hidden">
            <p className="text-xs sm:text-sm font-medium truncate">{banner.title}</p>
          </div>
        </div>
      </a>
    </div>
  )
}