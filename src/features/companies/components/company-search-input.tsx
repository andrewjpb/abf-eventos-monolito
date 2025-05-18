"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useQueryState } from "nuqs"
import { searchParse, segmentParse, activeParse } from "../search-params"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getCompanySegments } from "../queries/get-company-segments"

export function CompanySearchInput() {
  const [search, setSearch] = useQueryState("search", searchParse)
  const [segment, setSegment] = useQueryState("segment", segmentParse)
  const [active, setActive] = useQueryState("active", activeParse)
  const [inputValue, setInputValue] = useState(search || "")
  const [segments, setSegments] = useState<string[]>([])
  const [isLoadingSegments, setIsLoadingSegments] = useState(false)

  // Carregar segmentos ao montar o componente
  useEffect(() => {
    const loadSegments = async () => {
      setIsLoadingSegments(true)
      try {
        const segmentList = await getCompanySegments()
        setSegments(segmentList)
      } catch (error) {
        console.error("Erro ao carregar segmentos:", error)
      } finally {
        setIsLoadingSegments(false)
      }
    }

    loadSegments()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(inputValue)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Campo de busca */}
      <div className="md:col-span-2 space-y-2">
        <Label htmlFor="search">Pesquisar</Label>
        <form onSubmit={handleSubmit} className="flex">
          <Input
            id="search"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Nome ou CNPJ da empresa..."
            className="pr-8"
          />
          <Button
            type="submit"
            className="ml-2"
            variant="secondary"
          >
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {/* Filtro por segmento */}
      <div className="space-y-2">
        <Label htmlFor="segment">Segmento</Label>
        <Select
          value={segment || "all"}
          onValueChange={(value) => setSegment(value || null)}
        >
          <SelectTrigger id="segment" className="w-full">
            <SelectValue placeholder="Todos os segmentos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os segmentos</SelectItem>
            {segments.map((seg) => (
              <SelectItem key={seg} value={seg}>
                {seg}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Filtro por status */}
      <div className="space-y-2">
        <Label htmlFor="active">Status</Label>
        <Select
          value={active || "all"}
          onValueChange={(value) => setActive(value || null)}
        >
          <SelectTrigger id="active" className="w-full">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="true">Associadas</SelectItem>
            <SelectItem value="false">Não associadas</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}