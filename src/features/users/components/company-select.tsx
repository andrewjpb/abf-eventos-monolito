// /features/users/components/company-select.tsx
"use client"

import { useState, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { searchCompanies } from "@/features/company/queries/search-companies"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { LucideLoaderCircle, SearchIcon, X } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"

type Company = {
  id: string;
  name: string;
  cnpj: string;
  segment?: string;
}

type CompanySelectProps = {
  selectedCnpj: string;
  onChange: (cnpj: string) => void;
  error?: string;
  readOnly?: boolean;
  label?: string;
}

export function CompanySelect({
  selectedCnpj,
  onChange,
  error,
  readOnly = false,
  label = "Empresa"
}: CompanySelectProps) {
  // Estados para controle local
  const [isLoading, setIsLoading] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [totalResults, setTotalResults] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)

  // Usar debounce para evitar muitas requisições durante a digitação
  const debouncedSearch = useDebounce(searchTerm, 300)

  // QueryClient para cache otimizado
  const queryClient = useQueryClient()

  // Quando o select é aberto, carregar opções iniciais (se a lista estiver vazia)
  useEffect(() => {
    if (isOpen && companies.length === 0 && !isLoading) {
      loadCompanies(searchTerm)
    }
  }, [isOpen])

  // Efeito quando o termo de pesquisa muda (com debounce)
  useEffect(() => {
    if (isOpen) {
      loadCompanies(debouncedSearch)
    }
  }, [debouncedSearch, isOpen])

  // Efeito para carregar a empresa atual quando o CNPJ muda
  useEffect(() => {
    if (selectedCnpj && !selectedCompany) {
      loadSelectedCompany()
    } else if (!selectedCnpj) {
      setSelectedCompany(null)
    }
  }, [selectedCnpj])

  // Função para carregar a empresa atual
  const loadSelectedCompany = async () => {
    if (!selectedCnpj) return

    // Verifica se a empresa já está na lista carregada
    const foundCompany = companies.find(c => c.cnpj === selectedCnpj)
    if (foundCompany) {
      setSelectedCompany(foundCompany)
      return
    }

    try {
      // Busca especificamente a empresa pelo CNPJ
      const result = await searchCompanies({ search: selectedCnpj })
      const companyFromSearch = result.companies.find(c => c.cnpj === selectedCnpj)

      if (companyFromSearch) {
        setSelectedCompany(companyFromSearch)
      }
    } catch (error) {
      console.error("Erro ao carregar empresa selecionada:", error)
    }
  }

  // Função para carregar empresas com base no termo de pesquisa
  const loadCompanies = async (search: string = "") => {
    setIsLoading(true)

    try {
      const result = await searchCompanies({
        search,
        take: 20
      })

      setCompanies(result.companies)
      setTotalResults(result.metadata.total)
    } catch (error) {
      console.error("Erro ao buscar empresas:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Limpar a seleção
  const handleClear = () => {
    onChange("")
    setSelectedCompany(null)
  }

  // Manipular seleção de nova empresa
  const handleSelectCompany = (cnpj: string) => {
    onChange(cnpj)
    const selected = companies.find(c => c.cnpj === cnpj)
    if (selected) {
      setSelectedCompany(selected)
    }
    setIsOpen(false)
  }

  if (readOnly && !selectedCompany) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="border rounded-md p-3 text-muted-foreground">
          Nenhuma empresa selecionada
        </div>
      </div>
    )
  }

  // Se tiver empresa selecionada, mostrar cartão dela
  if (selectedCompany && !isOpen) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="border rounded-md p-3 flex justify-between items-center">
          <div className="flex flex-col">
            <div className="font-medium">{selectedCompany.name}</div>
            <div className="text-sm text-muted-foreground flex flex-wrap gap-2">
              {selectedCompany.segment && (
                <span>{selectedCompany.segment}</span>
              )}
              <span>CNPJ: {selectedCompany.cnpj}</span>
            </div>
          </div>
          {!readOnly && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Remover empresa</span>
            </Button>
          )}
        </div>
        {error && (
          <p className="text-sm font-medium text-destructive">{error}</p>
        )}
      </div>
    )
  }

  // Select para escolher empresa
  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      <Select
        open={isOpen}
        onOpenChange={setIsOpen}
        value={selectedCnpj}
        onValueChange={handleSelectCompany}
      >
        <SelectTrigger
          onClick={() => setIsOpen(true)}
          className={error ? "border-destructive" : ""}
        >
          <SelectValue placeholder="Selecione uma empresa" />
        </SelectTrigger>

        <SelectContent>
          {/* Campo de busca */}
          <div className="px-3 py-2 mb-2 sticky top-0 bg-background z-10 border-b">
            <div className="relative">
              <Input
                placeholder="Buscar empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-8"
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchTerm('');
                  }}
                  className="absolute right-8 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                {isLoading ? (
                  <LucideLoaderCircle className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <SearchIcon className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>

          <SelectGroup>
            {companies.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                {isLoading
                  ? "Buscando empresas..."
                  : "Nenhuma empresa encontrada"}
              </div>
            ) : (
              companies.map((company) => (
                <SelectItem key={company.id} value={company.cnpj}>
                  <div className="flex flex-col">
                    <span>{company.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {company.segment && `${company.segment} • `}CNPJ: {company.cnpj}
                    </span>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectGroup>

          {/* Contador de resultados */}
          {totalResults > companies.length && (
            <div className="px-3 py-2 text-xs text-muted-foreground text-center border-t">
              Mostrando {companies.length} de {totalResults} empresas
            </div>
          )}
        </SelectContent>
      </Select>

      {error && (
        <p className="text-sm font-medium text-destructive">{error}</p>
      )}
    </div>
  )
}