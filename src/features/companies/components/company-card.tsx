// /features/companies/components/company-card.tsx
"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Building2,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Users,
  Tag
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { CompanyCardProps } from "../types"
import Link from "next/link"
import { companyPath } from "@/app/paths"

// Função para formatar CNPJ com máscara
const formatarCNPJ = (cnpj: string) => {
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

export function CompanyCard({ company, expanded, onToggleExpand }: CompanyCardProps) {
  const hasUsers = company.users && company.users.length > 0

  return (
    <Collapsible
      open={expanded}
      onOpenChange={() => onToggleExpand(company.id)}
      className="col-span-1"
    >
      <Card className="overflow-hidden transition-all duration-200 hover:shadow-md p-0">
        <CardContent className="p-0">
          {/* Cabeçalho */}
          <div className="p-4 flex items-center justify-between border-b border-border/50">
            <div className="flex items-center gap-2">
              <Building2 className={`h-5 w-5 ${company.active ? 'text-primary' : 'text-muted-foreground'}`} />
              <h4 className="font-medium truncate">{company.name}</h4>

              {!company.active ? (
                <Badge variant="outline" className="bg-muted text-muted-foreground text-xs">
                  Não associada
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-primary text-primary-foreground text-xs">
                  Associada
                </Badge>
              )}
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
              <Tag className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="truncate">{company.segment}</span>
            </div>
            {hasUsers && (
              <div className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{`${company.users?.length} usuário(s)`}</span>
              </div>
            )}
          </div>

          {/* Detalhes expandidos */}
          <CollapsibleContent>
            <div className="p-4 space-y-4 bg-gradient-to-b from-muted/10 to-transparent">
              <div>
                <p className="text-xs text-muted-foreground">CNPJ</p>
                <p className="text-sm font-medium">{formatarCNPJ(company.cnpj)}</p>
              </div>

              {hasUsers && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Usuários</p>
                  <div className="space-y-2">
                    {company.users?.slice(0, 3).map(user => (
                      <div key={user.id} className="border rounded-md p-2 text-sm">
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    ))}
                    {company.users?.length && company.users.length > 3 && (
                      <Badge variant="outline">
                        +{company.users.length - 3} mais
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <Link href={companyPath(company.id)} className="pt-2 flex justify-end">
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