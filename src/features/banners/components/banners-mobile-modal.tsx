// /features/banners/components/banners-mobile-modal.tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { X } from "lucide-react"
import Image from "next/image"
import { BannerWithDetails } from "../types"

interface BannersMobileModalProps {
  banners: BannerWithDetails[]
  interval?: number
}

export function BannersMobileModal({ banners, interval = 2000 }: BannersMobileModalProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const banner = banners[currentIndex]

  // Rotação automática dos banners
  useEffect(() => {
    if (banners.length <= 1 || !isOpen) return

    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    timerRef.current = setInterval(() => {
      if (isTransitioning) return
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentIndex(prev => prev === banners.length - 1 ? 0 : prev + 1)
        setTimeout(() => setIsTransitioning(false), 300)
      }, 200)
    }, interval)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [banners.length, interval, isOpen, isTransitioning])

  if (!isOpen || banners.length === 0) return null

  return (
    <div className="lg:hidden fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm">
        {/* Botão fechar */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute -top-3 -right-3 z-20 bg-background border border-border rounded-full p-1.5 shadow-lg hover:bg-accent transition-colors"
          aria-label="Fechar banner"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Banner */}
        <a
          href={banner?.external_link}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <div
            className={`rounded-lg overflow-hidden shadow-2xl border border-border bg-card transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
          >
            {banner?.image_url ? (
              <Image
                src={banner.image_url}
                alt={banner.title}
                width={400}
                height={600}
                sizes="(max-width: 640px) 90vw, 400px"
                priority
                className="w-full h-auto"
              />
            ) : (
              <div className="flex h-48 items-center justify-center bg-muted">
                <Image
                  src="/placeholder-image.svg"
                  alt="Imagem não disponível"
                  width={60}
                  height={60}
                  className="opacity-30"
                />
              </div>
            )}
          </div>
        </a>

        {/* Indicadores */}
        {banners.length > 1 && (
          <div className="flex justify-center gap-2 mt-3">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  if (isTransitioning || index === currentIndex) return
                  setIsTransitioning(true)
                  setTimeout(() => {
                    setCurrentIndex(index)
                    setTimeout(() => setIsTransitioning(false), 300)
                  }, 200)
                }}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  index === currentIndex
                    ? "bg-white shadow-sm"
                    : "bg-white/40 hover:bg-white/70"
                }`}
                aria-label={`Ver banner ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
