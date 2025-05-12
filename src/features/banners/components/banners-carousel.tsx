// /features/banners/components/banners-carousel.tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { BannerWithDetails } from "../types"
import { BannerCard } from "./banner-card"

interface BannersCarouselProps {
  banners: BannerWithDetails[];
  interval?: number; // Intervalo em milissegundos
}

export function BannersCarousel({
  banners,
  interval = 2000 // 2 segundos padrão
}: BannersCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Não fazer nada se não houver banners
  if (banners.length === 0) return null;

  // Se houver apenas um banner, retornar apenas ele sem animação
  if (banners.length === 1) {
    return <BannerCard banner={banners[0]} />;
  }

  // Função para passar para o próximo banner
  const goToNext = () => {
    if (isTransitioning || isPaused) return;

    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(prevIndex =>
        prevIndex === banners.length - 1 ? 0 : prevIndex + 1
      );
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300); // Fim da transição
    }, 200); // Início da transição após o fade-out
  };

  // Alternar para um banner específico
  const goToIndex = (index: number) => {
    if (isTransitioning || index === currentIndex) return;

    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    }, 200);
  };

  // Gerenciar o intervalo de rotação
  useEffect(() => {
    // Limpar qualquer timer existente
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Criar novo timer apenas se não estiver pausado
    if (!isPaused) {
      timerRef.current = setInterval(goToNext, interval);
    }

    // Limpar o timer quando o componente for desmontado
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [interval, isTransitioning, isPaused]);

  // Funções para gerenciar o mouseenter/mouseleave
  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  return (
    <div
      className="h-full relative overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={`h-full transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'
          }`}
      >
        <BannerCard banner={banners[currentIndex]} />
      </div>

      {/* Indicadores de posição menores e mais compactos */}
      <div className="absolute bottom-1.5 sm:bottom-2 left-0 right-0 flex justify-center gap-2 z-10">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => goToIndex(index)}
            className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-colors ${index === currentIndex
              ? "bg-primary shadow-sm"
              : "bg-white/70 hover:bg-white"
              }`}
            aria-label={`Ver banner ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}