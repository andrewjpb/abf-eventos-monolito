// /features/permissions/components/permission-card.tsx
"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Shield
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import Link from "next/link"
import { permissionPath } from "@/app/paths"
import { Permission } from "@/features/roles/types"

export interface PermissionCardProps {
  permission: Permission & { roles?: { id: string; name: string }[] }
  expanded: boolean
  onToggleExpand: (id: string) => void
}

export function PermissionCard({ permission, expanded, onToggleExpand }: PermissionCardProps) {
  const hasRoles = permission.roles && permission.roles.length > 0

  return (
    <Collapsible
      open={expanded}
      onOpenChange={() => onToggleExpand(permission.id)}
      className="col-span-1"
    >
      <Card className="overflow-hidden transition-all duration-200 hover:shadow-md p-0">
        <CardContent className="p-0">
          {/* Cabeçalho */}
          <div className="p-4 flex items-center justify-between border-b border-border/50">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h4 className="font-medium truncate">{permission.name}</h4>
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
          <div className="px-4 py-3 bg-muted/20">
            <p className="text-sm text-muted-foreground">{permission.description}</p>
          </div>

          {/* Detalhes expandidos */}
          <CollapsibleContent>
            <div className="p-4 space-y-4 bg-gradient-to-b from-muted/10 to-transparent">
              {hasRoles && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Funções com esta permissão ({permission.roles?.length || 0})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {permission.roles?.slice(0, 5).map(role => (
                      <Badge key={role.id} variant="outline" className="bg-primary/5">
                        {role.name}
                      </Badge>
                    ))}
                    {permission.roles && permission.roles.length > 5 && (
                      <Badge variant="outline">
                        +{permission.roles.length - 5} mais
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {!hasRoles && (
                <div>
                  <p className="text-xs text-muted-foreground">
                    Esta permissão não está associada a nenhuma função
                  </p>
                </div>
              )}

              <Link href={permissionPath(permission.id)} className="pt-2 flex justify-end">
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