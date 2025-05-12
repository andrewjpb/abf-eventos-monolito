// /features/users/components/user-search-input.tsx
"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useQueryState } from "nuqs"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useRef } from "react"
import { searchParse } from "../search-params"

export function UserSearchInput() {
  // Referência ao formulário para evitar manipulação direta do DOM
  const formRef = useRef<HTMLFormElement>(null)
  const [search, setSearch] = useQueryState("search", searchParse)
  const [inputValue, setInputValue] = useState(search || "")

  // Simplificar ao máximo - só atualiza no submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (search !== inputValue) {
      setSearch(inputValue)
    }
  }

  // Limpar campo e atualizar busca
  const handleClear = () => {
    setInputValue("")
    // Só atualiza a busca se já tinha algo antes
    if (search) {
      setSearch("")
    }
  }

  return (
    <div className="space-y-2 w-full">
      <Label htmlFor="search">Pesquisar</Label>
      <form ref={formRef} onSubmit={handleSubmit} className="flex">
        <div className="relative flex-1">
          <Input
            id="search"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Nome, email, usuário..."
            className="pr-8"
          />
          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
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