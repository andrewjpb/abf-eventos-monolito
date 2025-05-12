// /components/layouts/two-column-layout.tsx
import React from "react"
import { BannersSidebar } from "@/features/banners/components/banners-sidebar"
import { Suspense } from "react"
import { Spinner } from "@/components/spinner"

interface TwoColumnLayoutProps {
  children: React.ReactNode
  showSidebar?: boolean
  sidebarTitle?: string
}

export function TwoColumnLayout({
  children,
  showSidebar = true,
  sidebarTitle = "Destaques"
}: TwoColumnLayoutProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna principal (2/3) */}
        <div className="lg:col-span-2">
          {children}
        </div>

        {/* Coluna lateral (1/3) */}
        {showSidebar && (
          <div className="lg:col-span-1">
            <Suspense fallback={<div className="flex justify-center py-8"><Spinner /></div>}>
              <BannersSidebar title={sidebarTitle} />
            </Suspense>
          </div>
        )}
      </div>
    </div>
  )
}