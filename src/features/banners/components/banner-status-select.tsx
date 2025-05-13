// /features/banners/components/banner-status-select.tsx
"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useQueryState } from "nuqs"
import { activeParse } from "../search-params"

export function BannerStatusSelect() {
  const [active, setActive] = useQueryState("active", activeParse)

  return (
    <div className="space-y-2 w-full">
      <Label htmlFor="filter">Status</Label>
      <Select
        value={active || "ALL"}
        onValueChange={(value) => setActive(value)}
      >
        <SelectTrigger id="filter" className="min-w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todos</SelectItem>
          <SelectItem value="ACTIVE">Ativos</SelectItem>
          <SelectItem value="INACTIVE">Inativos</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}