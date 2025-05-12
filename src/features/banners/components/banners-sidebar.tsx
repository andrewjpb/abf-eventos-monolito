// /features/banners/components/banners-sidebar.tsx
import { getBanners } from "../queries/get-banners"
import { BannersCarousel } from "./banners-carousel"

interface BannersSidebarProps {
  limit?: number;
  title?: string;
  interval?: number; // Intervalo em milissegundos
}

export async function BannersSidebar({
  limit = 3,
  title,
  interval = 2000
}: BannersSidebarProps) {
  // Buscar banners ativos
  const { banners } = await getBanners({
    limit,
    onlyActive: true
  })

  // Se não houver banners, não exibir nada
  if (banners.length === 0) {
    return null
  }

  return (
    <div className="h-full w-full relative rounded-lg overflow-hidden">
      {/* Adaptação responsiva da proporção */}
      <div className="h-full w-full 
        aspect-[16/9] sm:aspect-[3/4] md:aspect-[3/4] lg:aspect-[4/5] xl:aspect-auto 
        max-h-[200px] sm:max-h-none">
        <BannersCarousel
          banners={banners}
          interval={interval}
        />
      </div>
    </div>
  )
}