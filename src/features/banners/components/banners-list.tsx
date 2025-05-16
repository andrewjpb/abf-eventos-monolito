// /features/banners/components/banners-list.tsx
"use client"

import { useInfiniteQuery } from "@tanstack/react-query"
import { getBanners } from "../queries/get-banners"
import { Button } from "@/components/ui/button"
import { Plus, Search, LucideLoaderCircle, Filter } from "lucide-react"
import Link from "next/link"
import { bannerCreatePath, bannerEditPath, bannerPath, bannersPath } from "@/app/paths"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { BannerWithDetails } from "../types"
import { useState } from "react"
import Image from "next/image"
import { Switch } from "@/components/ui/switch"
import { updateBannerStatus } from "../actions/update-banner-status"
import { ParsedSearchParams } from "../search-params"
import { BannerSearchInput } from "./banner-search-input"
import { BannerStatusSelect } from "./banner-status-select"
import { BannerCardItemList } from "./banner-card-item-list"

type BannersListProps = {
  searchParams: ParsedSearchParams,
  showActions?: boolean
}

export function BannersList({
  searchParams,
  showActions = true
}: BannersListProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch
  } = useInfiniteQuery({
    queryKey: ["banners", searchParams.search, searchParams.active],
    queryFn: ({ pageParam }) => getBanners({
      cursor: pageParam as string,
      limit: 10,
      search: searchParams.search,
      active: searchParams.active === "ALL" ? undefined : searchParams.active
    }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.metadata?.hasNextPage ? lastPage.metadata?.cursor : undefined,
  })

  const handleToggleStatusRefetch = async (bannerId: string, currentStatus: boolean) => {
    refetch()
  }

  // Extrair a lista de banners de todas as páginas
  const banners = data?.pages.flatMap(page => page.banners) || []
  const totalCount = data?.pages[0]?.metadata?.count || 0

  // Contadores por status
  const countByStatus = data?.pages[0]?.metadata?.countByStatus || {
    ACTIVE: 0,
    INACTIVE: 0
  }

  return (
    <div className="space-y-6">
      {showActions && (
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex-1 space-y-1">
            <h1 className="text-2xl font-bold">Banners</h1>
            <p className="text-muted-foreground">
              Gerenciamento de banners e cards em destaque
            </p>
          </div>

          <Button asChild>
            <Link href={bannerCreatePath()}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Banner
            </Link>
          </Button>
        </div>
      )}

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-full sm:w-auto flex-1">
            <BannerSearchInput />
          </div>

          <div className="w-full sm:w-auto">
            <BannerStatusSelect />
          </div>

          {isLoading && (
            <div className="flex items-center">
              <LucideLoaderCircle className="w-6 h-6 animate-spin cursor-pointer" />
            </div>
          )}
        </div>
      </Card>

      {/* Contadores */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-2 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
          <CardContent className="p-2 flex justify-between items-center">
            <p className="text-sm font-medium text-green-600 dark:text-green-400">Ativos</p>
            <Badge variant="secondary" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
              {countByStatus.ACTIVE}
            </Badge>
          </CardContent>
        </Card>

        <Card className="p-2 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800">
          <CardContent className="p-2 flex justify-between items-center">
            <p className="text-sm font-medium text-red-600 dark:text-red-400">Inativos</p>
            <Badge variant="secondary" className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
              {countByStatus.INACTIVE}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Resultados da busca - header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {totalCount} banner{totalCount !== 1 ? 's' : ''} encontrado{totalCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <Separator />

      {/* Lista de banners */}
      {!isLoading && banners.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-muted-foreground opacity-40" />
          </div>
          <p className="text-muted-foreground text-center">
            Nenhum banner encontrado com os filtros selecionados
          </p>
          <Link href={bannersPath()} passHref>
            <Button variant="link">
              Limpar filtros
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6">
            {banners.map(banner => (
              <BannerCardItemList key={banner.id} banner={banner} onStatusChange={handleToggleStatusRefetch} />
            ))}
          </div>

          {hasNextPage && (
            <div className="flex justify-center mt-6">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage || isLoading}
              >
                {isFetchingNextPage ? "Carregando..." : "Carregar mais"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}