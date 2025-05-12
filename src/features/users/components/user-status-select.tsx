// /features/users/components/user-status-select.tsx
"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useQueryState } from "nuqs"
import { statusParse } from "../search-params"

export function UserStatusSelect() {
  const [status, setStatus] = useQueryState("status", statusParse)

  return (
    <div className="space-y-2 w-full">
      <Label htmlFor="filter">Status</Label>
      <Select
        value={status || "ALL"}
        onValueChange={setStatus}
      >
        <SelectTrigger id="filter" className="min-w-[180px]">
          <SelectValue placeholder="Filtrar por status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todos</SelectItem>
          <SelectItem value="active">Ativos</SelectItem>
          <SelectItem value="inactive">Inativos</SelectItem>
          <SelectItem value="admin">Administradores</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}