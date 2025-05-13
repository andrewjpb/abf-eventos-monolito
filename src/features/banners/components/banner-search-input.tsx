// /features/banners/components/banner-search-input.tsx
"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useQueryState } from "nuqs"
import { searchParse } from "../search-params"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function BannerSearchInput() {
  const [search, setSearch] = useQueryState("search", searchParse)
  const [inputValue, setInputValue] = useState(search || "")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(inputValue)
  }

  return (
    <div className="space-y-2 w-full">
      <Label htmlFor="search">Pesquisar</Label>
      <form onSubmit={handleSubmit} className="flex">
        <Input
          id="search"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Título do banner..."
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
  )
}