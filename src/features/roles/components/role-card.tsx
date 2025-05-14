// /features/roles/components/role-card.tsx
"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Shield
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { RoleCardProps } from "../types"
import Link from "next/link"
import { rolePath } from "@/app/paths"

export function RoleCard({ role, expanded, onToggleExpand }: RoleCardProps) {
  const hasPermissions = role.permissions && role.permissions.length > 0
  const hasUsers = role.users ? role.users.length > 0 : false

  return (
    <Collapsible
      open={expanded}
      onOpenChange={() => onToggleExpand(role.id)}
      className="col-span-1"
    >
      <Card className="overflow-hidden transition-all duration-200 hover:shadow-md p-0">
        <CardContent className="p-0">
          {/* Cabeçalho */}
          <div className="p-4 flex items-center justify-between border-b border-border/50">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h4 className="font-medium truncate">{role.name}</h4>
            </div>

            <div className="flex items-center gap-2">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  {expanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>

          {/* Resumo - sempre visível */}
          <div className="px-4 py-3 bg-muted/20 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <div className="flex items-center gap-1">
              <Shield className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{hasPermissions ? `${role.permissions.length} permissão(ões)` : 'Nenhuma permissão'}</span>
            </div>
            {hasUsers && (
              <div className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{`${role.users?.length} usuário(s)`}</span>
              </div>
            )}
          </div>

          {/* Detalhes expandidos */}
          <CollapsibleContent>
            <div className="p-4 space-y-4 bg-gradient-to-b from-muted/10 to-transparent">
              {role.description && (
                <div>
                  <p className="text-xs text-muted-foreground">Descrição</p>
                  <p className="text-sm">{role.description}</p>
                </div>
              )}

              {hasPermissions && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Permissões</p>
                  <div className="flex flex-wrap gap-2">
                    {role.permissions.slice(0, 3).map(permission => (
                      <Badge key={permission.id} variant="outline" className="bg-primary/5">
                        {permission.name}
                      </Badge>
                    ))}
                    {role.permissions.length > 3 && (
                      <Badge variant="outline">
                        +{role.permissions.length - 3} mais
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <Link href={rolePath(role.id)} className="pt-2 flex justify-end">
                <Button variant="outline" size="sm" className="h-8">
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  Detalhes
                </Button>
              </Link>
            </div>
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  )
}