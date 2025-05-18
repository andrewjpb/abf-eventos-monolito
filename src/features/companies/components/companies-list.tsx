// /features/companies/components/companies-list.tsx
"use client"

import { useInfiniteQuery } from "@tanstack/react-query"
import { getCompanies } from "../queries/get-companies"
import { Button } from "@/components/ui/button"
import { Search, LucideLoaderCircle, Plus, Building2 } from "lucide-react"
import Link from "next/link"
import { companyCreatePath, companiesPath } from "@/app/paths"
import { Card, CardContent } from "@/components/ui/card"
import { CompanyCard } from "./company-card"
import { Separator } from "@/components/ui/separator"
import { CompanyWithRelations } from "../types"
import { ParsedSearchParams } from "../search-params"
import { useState } from "react"
import { CompanySearchInput } from "./company-search-input"
import { CompanyDashboardMetrics } from "./company-dashboard-metrics"

type CompaniesListProps = {
  searchParams: ParsedSearchParams,
  showActions?: boolean
}

export function CompaniesList({
  searchParams,
  showActions = true
}: CompaniesListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteQuery({
    queryKey: ["companies", searchParams.search, searchParams.segment, searchParams.active],
    queryFn: ({ pageParam }) => getCompanies({
      cursor: pageParam as string,
      search: searchParams.search,
      segment: searchParams.segment,
      active: searchParams.active
    }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.metadata?.hasNextPage ? lastPage.metadata?.cursor : undefined,
  })

  const handleToggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  // Extrair a lista de empresas de todas as páginas
  const companies = data?.pages.flatMap(page => page.companies) || []
  const totalCount = data?.pages[0]?.metadata.count || 0

  return (
    <div className="space-y-6">
      {showActions && (
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex-1 space-y-1">
            <h1 className="text-2xl font-bold">Empresas</h1>
            <p className="text-muted-foreground">
              Gerenciamento de empresas cadastradas no sistema
            </p>
          </div>
          <Button asChild>
            <Link href={companyCreatePath()}>
              <Plus className="mr-2 h-4 w-4" />
              Nova empresa
            </Link>
          </Button>
        </div>
      )}

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-full flex-1">
            <CompanySearchInput />
          </div>

          {isLoading && (
            <div className="flex items-center">
              <LucideLoaderCircle className="w-6 h-6 animate-spin cursor-pointer" />
            </div>
          )}
        </div>
      </Card>



      <div className="mb-6">
        <CompanyDashboardMetrics />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {totalCount} empresa(s) encontrada(s)
          </span>
        </div>
      </div>
      <Separator />

      {/* Lista de empresas */}
      {!isLoading && companies.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 text-muted-foreground opacity-40" />
          </div>
          <p className="text-muted-foreground text-center">
            Nenhuma empresa encontrada com os filtros selecionados
          </p>
          <Link href={companiesPath()} passHref>
            <Button variant="link">
              Limpar filtros
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map(company => (
              <CompanyCard
                key={company.id}
                company={company}
                expanded={expandedId === company.id}
                onToggleExpand={handleToggleExpand}
              />
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