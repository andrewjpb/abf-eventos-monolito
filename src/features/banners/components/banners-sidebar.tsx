// /features/banners/components/banners-sidebar.tsx
import { getBanners } from "../queries/get-banners"
import { BannersCarousel } from "./banners-carousel"
import { BannersMobileModal } from "./banners-mobile-modal"

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
    <>
      {/* Mobile/Tablet: modal popup */}
      <BannersMobileModal banners={banners} interval={interval} />

      {/* Desktop: sidebar normal */}
      <div className="hidden lg:block w-full relative rounded-lg overflow-hidden h-full">
        <div className="w-full h-full">
          <BannersCarousel
            banners={banners}
            interval={interval}
          />
        </div>
      </div>
    </>
  )
}
